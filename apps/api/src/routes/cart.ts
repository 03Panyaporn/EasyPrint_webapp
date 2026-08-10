import { Elysia } from "elysia";
import { and, count, eq, inArray } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import {
  addCartItemSchema,
  updateCartItemSchema,
  setCartDeliveryOptionSchema,
  checkoutCartSchema,
  calculateLineItem,
  type ScopedAmount,
} from "@easyprint/shared";
import { db } from "../db";
import {
  carts,
  cartItems,
  cartItemAddOns,
  cartItemOptionSelections,
  mainServices,
  serviceOptions,
  serviceOptionValues,
  serviceColorTiers,
  serviceQuantityTiers,
  mainServiceAddOns,
  addOnServices,
  deliveryOptions,
  shops,
  orders,
  orderItems,
  users,
} from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";
import { supabaseAdmin } from "../storage";
import { generateOrderCode, generateOrderRef, serializeOrder } from "./orders";
import { notifyOrderCreated } from "../notifications";

// นับจำนวนหน้าจริงจากไฟล์ PDF ที่อัปโหลดไว้ใน Storage — ใช้เสมอตอนเพิ่ม/แก้ไขรายการ pricingModel = per_page
// ⚠️ ห้ามรับ pageCount จาก client มาใช้คำนวณราคาโดยตรงเด็ดขาด (กัน customer แก้ตัวเลขใน request เพื่อกดราคาถูกลง)
async function countPdfPages(path: string) {
  const { data, error } = await supabaseAdmin.storage.from("order-files").download(path);
  if (error || !data) {
    throw new Error("ไม่พบไฟล์ที่อัปโหลด กรุณาอัปโหลดไฟล์ใหม่อีกครั้ง");
  }
  try {
    const pdf = await PDFDocument.load(await data.arrayBuffer());
    return pdf.getPageCount();
  } catch {
    throw new Error("ไม่สามารถอ่านไฟล์ PDF ได้ กรุณาตรวจสอบว่าไฟล์ไม่เสียหายและเป็นไฟล์ PDF จริง");
  }
}

// เช็คว่า request มี JWT ที่ login เป็น customer จริง — ใช้ทุก endpoint ของตะกร้า เพราะตะกร้าผูกกับ customerId เสมอ
async function requireCustomer(
  cookie: Record<string, { value?: unknown } | undefined>,
  set: { status?: unknown }
) {
  const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload) {
    set.status = 401;
    return { error: "ยังไม่ได้เข้าสู่ระบบ" as const };
  }
  if (payload.role !== "customer") {
    set.status = 403;
    return { error: "ต้องเป็นบัญชีลูกค้าเท่านั้น" as const };
  }
  return { userId: payload.userId };
}

function isAuthError(x: { userId: string } | { error: string }): x is { error: string } {
  return "error" in x;
}

type OptionSelectionInput = { optionId: string; valueId?: string; textValue?: string };

// ตรวจสอบ optionSelections ที่ลูกค้าส่งมา เทียบกับ service_options จริงของบริการนี้:
//   - ทุก optionId ต้องผูกกับ mainServiceId นี้จริง (กันส่ง ID มั่วๆ ข้ามร้าน/ข้ามบริการ)
//   - dropdown/radio/number บังคับต้องเลือก/กรอกมาเสมอ (checkbox/text ไม่บังคับ)
//   - dropdown/radio/checkbox: valueId ต้องมีอยู่จริงในตัวเลือกนั้น
//   - number: textValue ต้องแปลงเป็นตัวเลขได้จริง
// คืน error string ถ้าไม่ผ่าน หรือ null ถ้าผ่านทั้งหมด
async function validateOptionSelections(mainServiceId: string, selections: OptionSelectionInput[]): Promise<string | null> {
  const options = await db.select().from(serviceOptions).where(eq(serviceOptions.mainServiceId, mainServiceId));
  const selectionByOption = new Map(selections.map((s) => [s.optionId, s]));

  const optionIds = new Set(options.map((o) => o.id));
  for (const s of selections) {
    if (!optionIds.has(s.optionId)) return "มีตัวเลือกบางรายการที่ไม่ได้ผูกกับบริการหลักนี้";
  }

  for (const opt of options) {
    const sel = selectionByOption.get(opt.id);
    const isRequired = opt.type === "dropdown" || opt.type === "radio" || opt.type === "number";

    if (!sel) {
      if (isRequired) return `กรุณาเลือก/กรอก "${opt.name}"`;
      continue;
    }

    if (opt.type === "dropdown" || opt.type === "radio" || opt.type === "checkbox") {
      if (!sel.valueId) return `กรุณาเลือกค่าให้ "${opt.name}"`;
      const [value] = await db
        .select({ id: serviceOptionValues.id })
        .from(serviceOptionValues)
        .where(and(eq(serviceOptionValues.id, sel.valueId), eq(serviceOptionValues.optionId, opt.id)));
      if (!value) return `ไม่พบค่าที่เลือกใน "${opt.name}"`;
    } else if (opt.type === "number") {
      if (!sel.textValue || Number.isNaN(Number(sel.textValue))) return `กรุณากรอกตัวเลขที่ถูกต้องใน "${opt.name}"`;
    }
  }

  return null;
}

async function writeOptionSelections(cartItemId: string, selections: OptionSelectionInput[]) {
  await db.delete(cartItemOptionSelections).where(eq(cartItemOptionSelections.cartItemId, cartItemId));
  if (selections.length === 0) return;
  await db.insert(cartItemOptionSelections).values(
    selections
      .filter((s) => s.valueId || s.textValue)
      .map((s) => ({
        cartItemId,
        optionId: s.optionId,
        valueId: s.valueId,
        textValue: s.textValue,
      }))
  );
}

// สร้าง response ตะกร้าแบบเต็มจากแถวตะกร้าที่มีอยู่แล้ว — คำนวณราคาทุกรายการ "สด" จากฐานข้อมูลจริงเสมอ ไม่เคยอ่านราคาจากที่ไหนอื่น
// (ตะกร้าเองก็ไม่ได้เก็บราคาไว้เลยสักฟิลด์ ดู comment ที่ schema.ts cartItems)
async function buildCartResponse(cart: typeof carts.$inferSelect) {
  const [shop] = await db
    .select({ id: shops.id, name: shops.name, shopPhotoUrl: shops.shopPhotoUrl, approvalStatus: shops.approvalStatus })
    .from(shops)
    .where(eq(shops.id, cart.shopId));

  const rows = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));

  const items = await Promise.all(
    rows.map(async (row) => {
      const [mainService] = await db.select().from(mainServices).where(eq(mainServices.id, row.mainServiceId));

      const selectionRows = await db
        .select()
        .from(cartItemOptionSelections)
        .where(eq(cartItemOptionSelections.cartItemId, row.id));

      const optionDeltas: ScopedAmount[] = [];
      const optionSelections = await Promise.all(
        selectionRows.map(async (sel) => {
          const [option] = await db.select().from(serviceOptions).where(eq(serviceOptions.id, sel.optionId));
          let valueName: string | undefined;
          let extraPrice = 0;
          if (sel.valueId) {
            const [value] = await db.select().from(serviceOptionValues).where(eq(serviceOptionValues.id, sel.valueId));
            if (value) {
              valueName = value.name;
              extraPrice = Number(value.extraPrice);
              optionDeltas.push({ scope: value.priceScope, amount: extraPrice });
            }
          }
          return {
            optionId: sel.optionId,
            optionName: option?.name ?? "-",
            valueId: sel.valueId ?? undefined,
            valueName,
            textValue: sel.textValue ?? undefined,
            extraPrice,
          };
        })
      );

      let colorTier: { id: string; label: string; pricePerUnit: number } | undefined;
      if (row.colorTierId) {
        const [tier] = await db.select().from(serviceColorTiers).where(eq(serviceColorTiers.id, row.colorTierId));
        if (tier) colorTier = { id: tier.id, label: tier.label, pricePerUnit: Number(tier.pricePerUnit) };
      }

      const quantityTierRows =
        mainService?.pricingModel === "per_piece"
          ? await db.select().from(serviceQuantityTiers).where(eq(serviceQuantityTiers.mainServiceId, row.mainServiceId))
          : [];
      const quantityTiers = quantityTierRows.map((t) => ({ minQty: t.minQty, maxQty: t.maxQty, unitPrice: Number(t.unitPrice) }));

      const addOnBindings = await db.select().from(cartItemAddOns).where(eq(cartItemAddOns.cartItemId, row.id));
      const addOnCharges: ScopedAmount[] = [];
      const addOns = await Promise.all(
        addOnBindings.map(async (b) => {
          const [binding] = await db
            .select()
            .from(mainServiceAddOns)
            .where(and(eq(mainServiceAddOns.mainServiceId, row.mainServiceId), eq(mainServiceAddOns.addOnServiceId, b.addOnServiceId)));
          const [addOnService] = await db.select().from(addOnServices).where(eq(addOnServices.id, b.addOnServiceId));
          const extraPrice = binding ? Number(binding.extraPrice) : 0;
          if (addOnService) addOnCharges.push({ scope: addOnService.scope, amount: extraPrice });
          return {
            addOnServiceId: b.addOnServiceId,
            name: addOnService?.name ?? "-",
            extraPrice,
          };
        })
      );

      const pricingModel = mainService?.pricingModel ?? "fixed";
      const calc = calculateLineItem({
        pricingModel,
        basePrice: mainService ? Number(mainService.basePrice) : 0,
        colorTierPricePerUnit: colorTier?.pricePerUnit,
        quantity: row.quantity,
        pageCountingMode: mainService?.pageCountingMode,
        rawPageCount: row.pageCount ?? 0,
        widthCm: row.widthCm ? Number(row.widthCm) : undefined,
        heightCm: row.heightCm ? Number(row.heightCm) : undefined,
        minArea: mainService?.minArea != null ? Number(mainService.minArea) : undefined,
        areaRoundingIncrement: mainService ? Number(mainService.areaRoundingIncrement) : undefined,
        quantityTiers,
        optionDeltas,
        addOnCharges,
      });

      let unitBreakdown: { mode: "per_page"; pageCount: number } | { mode: "per_sqm"; widthCm: number; heightCm: number } | null = null;
      if (pricingModel === "per_page" && calc.billedPages != null) {
        unitBreakdown = { mode: "per_page", pageCount: calc.billedPages };
      } else if (pricingModel === "per_sqm" && row.widthCm && row.heightCm) {
        unitBreakdown = { mode: "per_sqm", widthCm: Number(row.widthCm), heightCm: Number(row.heightCm) };
      }

      return {
        id: row.id,
        mainServiceId: row.mainServiceId,
        mainServiceName: mainService?.name ?? "-",
        imageUrl: mainService?.imageUrl ?? undefined,
        isServiceActive: mainService?.isActive ?? false,
        pricingModel,
        colorTierId: colorTier?.id,
        colorTierLabel: colorTier?.label,
        unitBreakdown,
        optionSelections,
        addOns,
        quantity: row.quantity,
        unitPrice: calc.perCopyAmount,
        lineTotal: calc.lineTotal,
        fileUrl: row.fileUrl ?? undefined,
        note: row.note ?? undefined,
      };
    })
  );

  const subtotal = items.reduce((sum, i) => sum + i.lineTotal, 0);

  let deliveryFee = 0;
  let deliveryOption: { id: string; name: string; baseFee: number; freeShippingThreshold?: number } | undefined;
  if (cart.deliveryOptionId) {
    const [opt] = await db.select().from(deliveryOptions).where(eq(deliveryOptions.id, cart.deliveryOptionId));
    if (opt) {
      const threshold = opt.freeShippingThreshold != null ? Number(opt.freeShippingThreshold) : undefined;
      deliveryFee = threshold != null && subtotal >= threshold ? 0 : Number(opt.baseFee);
      deliveryOption = { id: opt.id, name: opt.name, baseFee: Number(opt.baseFee), freeShippingThreshold: threshold };
    }
  }

  return {
    id: cart.id,
    shopId: cart.shopId,
    shopName: shop?.name ?? "-",
    shopPhotoUrl: shop?.shopPhotoUrl ?? undefined,
    isShopApproved: shop?.approvalStatus === "approved",
    deliveryOption,
    items,
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  };
}

// หา cart item + ตะกร้าที่มันอยู่ พร้อมเช็คว่าตะกร้านั้นเป็นของลูกค้าที่ login อยู่จริง (กัน IDOR) — คืน null ถ้าไม่ใช่/ไม่พบ
async function findOwnedCartItem(cartItemId: string, customerId: string) {
  const [row] = await db
    .select({ item: cartItems, cart: carts })
    .from(cartItems)
    .innerJoin(carts, eq(cartItems.cartId, carts.id))
    .where(and(eq(cartItems.id, cartItemId), eq(carts.customerId, customerId)));
  return row ?? null;
}

export const cartRoutes = new Elysia()
  // ตะกร้าทั้งหมดของลูกค้า (คนละร้านคนละใบ) — ใช้แสดงหน้า /cart ที่รวมทุกร้านไว้ในหน้าเดียว
  .get("/carts", async ({ cookie, set }) => {
    const auth = await requireCustomer(cookie, set);
    if (isAuthError(auth)) return auth;

    const rows = await db.select().from(carts).where(eq(carts.customerId, auth.userId));
    return { carts: await Promise.all(rows.map(buildCartResponse)) };
  })

  // ตะกร้าของร้านนี้ร้านเดียว (null ถ้ายังไม่เคยเพิ่มของจากร้านนี้) — ใช้เช็ค badge ตอนเปิดหน้ารายละเอียดร้าน
  .get("/shops/:shopId/cart", async ({ params, cookie, set }) => {
    const auth = await requireCustomer(cookie, set);
    if (isAuthError(auth)) return auth;

    const [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.customerId, auth.userId), eq(carts.shopId, params.shopId)));
    return { cart: cart ? await buildCartResponse(cart) : null };
  })

  .post("/shops/:shopId/cart/items", async ({ params, body, cookie, set }) => {
    const auth = await requireCustomer(cookie, set);
    if (isAuthError(auth)) return auth;

    const parsed = addCartItemSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [shop] = await db.select().from(shops).where(eq(shops.id, params.shopId));
    if (!shop || shop.approvalStatus !== "approved") {
      set.status = 404;
      return { error: "ไม่พบร้านค้านี้" };
    }

    const [mainService] = await db
      .select()
      .from(mainServices)
      .where(and(eq(mainServices.id, parsed.data.mainServiceId), eq(mainServices.shopId, params.shopId)));
    if (!mainService || !mainService.isActive) {
      set.status = 404;
      return { error: "ไม่พบบริการนี้ หรือร้านค้าปิดให้บริการนี้ไปแล้ว" };
    }

    if (mainService.requiresFileUpload && !parsed.data.fileUrl) {
      set.status = 400;
      return { error: "บริการนี้ต้องอัปโหลดไฟล์งานพิมพ์" };
    }

    // เช็คว่าข้อมูลที่ส่งมาตรงกับ pricingModel ของบริการจริง
    let serverPageCount: number | undefined;
    if (mainService.pricingModel === "per_page") {
      if (!parsed.data.fileUrl) {
        set.status = 400;
        return { error: "บริการนี้เป็นราคาตามจำนวนหน้า ต้องอัปโหลดไฟล์ PDF" };
      }
      try {
        serverPageCount = await countPdfPages(parsed.data.fileUrl);
      } catch (err) {
        set.status = 400;
        return { error: err instanceof Error ? err.message : "อ่านไฟล์ PDF ไม่สำเร็จ" };
      }
    } else if (mainService.pricingModel === "per_sqm") {
      if (!parsed.data.widthCm || !parsed.data.heightCm) {
        set.status = 400;
        return { error: "บริการนี้เป็นราคาตามพื้นที่ ต้องระบุขนาดกว้าง/สูง" };
      }
    }

    const optionError = await validateOptionSelections(mainService.id, parsed.data.optionSelections);
    if (optionError) {
      set.status = 400;
      return { error: optionError };
    }

    // เช็คว่าบริการเสริมที่เลือกมา ผูกกับบริการหลักนี้จริง (กันส่ง addonId มั่วๆ ข้ามร้าน/ข้ามบริการ)
    if (parsed.data.addOnIds.length > 0) {
      const bindings = await db
        .select({ addOnServiceId: mainServiceAddOns.addOnServiceId })
        .from(mainServiceAddOns)
        .where(
          and(eq(mainServiceAddOns.mainServiceId, mainService.id), inArray(mainServiceAddOns.addOnServiceId, parsed.data.addOnIds))
        );
      if (bindings.length !== parsed.data.addOnIds.length) {
        set.status = 400;
        return { error: "มีบริการเสริมบางรายการที่ไม่ได้ผูกกับบริการหลักนี้" };
      }
    }

    // เช็คว่า ColorTier ที่เลือกมา ผูกกับบริการหลักนี้จริง (กันส่ง colorTierId มั่วๆ ข้ามร้าน/ข้ามบริการ)
    if (parsed.data.colorTierId) {
      const [tier] = await db
        .select({ id: serviceColorTiers.id })
        .from(serviceColorTiers)
        .where(and(eq(serviceColorTiers.id, parsed.data.colorTierId), eq(serviceColorTiers.mainServiceId, mainService.id)));
      if (!tier) {
        set.status = 400;
        return { error: "ไม่พบระดับสีนี้ในบริการนี้" };
      }
    }

    // 1 ลูกค้ามีได้หลายตะกร้า แต่ 1 ตะกร้าผูกกับร้านเดียว — หาตะกร้าของร้านนี้ก่อน ถ้ายังไม่มีค่อยสร้างใหม่
    let [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.customerId, auth.userId), eq(carts.shopId, params.shopId)));

    if (!cart) {
      [cart] = await db.insert(carts).values({ customerId: auth.userId, shopId: params.shopId }).returning();
    }

    const [item] = await db
      .insert(cartItems)
      .values({
        cartId: cart.id,
        mainServiceId: mainService.id,
        colorTierId: parsed.data.colorTierId,
        widthCm: parsed.data.widthCm?.toFixed(2),
        heightCm: parsed.data.heightCm?.toFixed(2),
        pageCount: serverPageCount,
        quantity: parsed.data.quantity,
        fileUrl: parsed.data.fileUrl,
        note: parsed.data.note,
      })
      .returning();

    await writeOptionSelections(item.id, parsed.data.optionSelections);

    if (parsed.data.addOnIds.length > 0) {
      await db.insert(cartItemAddOns).values(parsed.data.addOnIds.map((addOnServiceId) => ({ cartItemId: item.id, addOnServiceId })));
    }

    return { cart: await buildCartResponse(cart) };
  })

  .patch("/cart/items/:id", async ({ params, body, cookie, set }) => {
    const auth = await requireCustomer(cookie, set);
    if (isAuthError(auth)) return auth;

    const parsed = updateCartItemSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const existing = await findOwnedCartItem(params.id, auth.userId);
    if (!existing) {
      set.status = 404;
      return { error: "ไม่พบรายการนี้ในตะกร้าของคุณ" };
    }

    const [mainService] = await db.select().from(mainServices).where(eq(mainServices.id, existing.item.mainServiceId));
    if (!mainService) {
      set.status = 404;
      return { error: "ไม่พบบริการนี้แล้ว" };
    }

    if (mainService.requiresFileUpload && !parsed.data.fileUrl) {
      set.status = 400;
      return { error: "บริการนี้ต้องอัปโหลดไฟล์งานพิมพ์" };
    }

    let serverPageCount: number | undefined;
    if (mainService.pricingModel === "per_page") {
      if (!parsed.data.fileUrl) {
        set.status = 400;
        return { error: "บริการนี้เป็นราคาตามจำนวนหน้า ต้องอัปโหลดไฟล์ PDF" };
      }
      try {
        serverPageCount = await countPdfPages(parsed.data.fileUrl);
      } catch (err) {
        set.status = 400;
        return { error: err instanceof Error ? err.message : "อ่านไฟล์ PDF ไม่สำเร็จ" };
      }
    } else if (mainService.pricingModel === "per_sqm") {
      if (!parsed.data.widthCm || !parsed.data.heightCm) {
        set.status = 400;
        return { error: "บริการนี้เป็นราคาตามพื้นที่ ต้องระบุขนาดกว้าง/สูง" };
      }
    }

    const optionError = await validateOptionSelections(mainService.id, parsed.data.optionSelections);
    if (optionError) {
      set.status = 400;
      return { error: optionError };
    }

    if (parsed.data.addOnIds.length > 0) {
      const bindings = await db
        .select({ addOnServiceId: mainServiceAddOns.addOnServiceId })
        .from(mainServiceAddOns)
        .where(
          and(eq(mainServiceAddOns.mainServiceId, mainService.id), inArray(mainServiceAddOns.addOnServiceId, parsed.data.addOnIds))
        );
      if (bindings.length !== parsed.data.addOnIds.length) {
        set.status = 400;
        return { error: "มีบริการเสริมบางรายการที่ไม่ได้ผูกกับบริการหลักนี้" };
      }
    }

    if (parsed.data.colorTierId) {
      const [tier] = await db
        .select({ id: serviceColorTiers.id })
        .from(serviceColorTiers)
        .where(and(eq(serviceColorTiers.id, parsed.data.colorTierId), eq(serviceColorTiers.mainServiceId, mainService.id)));
      if (!tier) {
        set.status = 400;
        return { error: "ไม่พบระดับสีนี้ในบริการนี้" };
      }
    }

    await db
      .update(cartItems)
      .set({
        colorTierId: parsed.data.colorTierId ?? null,
        widthCm: parsed.data.widthCm?.toFixed(2) ?? null,
        heightCm: parsed.data.heightCm?.toFixed(2) ?? null,
        pageCount: serverPageCount ?? null,
        quantity: parsed.data.quantity,
        fileUrl: parsed.data.fileUrl,
        note: parsed.data.note,
      })
      .where(eq(cartItems.id, params.id));

    await writeOptionSelections(params.id, parsed.data.optionSelections);

    await db.delete(cartItemAddOns).where(eq(cartItemAddOns.cartItemId, params.id));
    if (parsed.data.addOnIds.length > 0) {
      await db.insert(cartItemAddOns).values(parsed.data.addOnIds.map((addOnServiceId) => ({ cartItemId: params.id, addOnServiceId })));
    }

    return { cart: await buildCartResponse(existing.cart) };
  })

  .delete("/cart/items/:id", async ({ params, cookie, set }) => {
    const auth = await requireCustomer(cookie, set);
    if (isAuthError(auth)) return auth;

    const existing = await findOwnedCartItem(params.id, auth.userId);
    if (!existing) {
      set.status = 404;
      return { error: "ไม่พบรายการนี้ในตะกร้าของคุณ" };
    }

    await db.delete(cartItems).where(eq(cartItems.id, params.id)); // cascade ลบ cart_item_addons/cart_item_option_selections ให้อัตโนมัติ

    return { cart: await buildCartResponse(existing.cart) };
  })

  .patch("/shops/:shopId/cart", async ({ params, body, cookie, set }) => {
    const auth = await requireCustomer(cookie, set);
    if (isAuthError(auth)) return auth;

    const parsed = setCartDeliveryOptionSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.customerId, auth.userId), eq(carts.shopId, params.shopId)));
    if (!cart) {
      set.status = 404;
      return { error: "ไม่มีตะกร้าของร้านนี้อยู่" };
    }

    if (parsed.data.deliveryOptionId) {
      const [opt] = await db
        .select({ id: deliveryOptions.id })
        .from(deliveryOptions)
        .where(and(eq(deliveryOptions.id, parsed.data.deliveryOptionId), eq(deliveryOptions.shopId, cart.shopId)));
      if (!opt) {
        set.status = 400;
        return { error: "ไม่พบตัวเลือกการจัดส่งนี้ในร้านนี้" };
      }
    }

    const [updated] = await db
      .update(carts)
      .set({ deliveryOptionId: parsed.data.deliveryOptionId })
      .where(eq(carts.id, cart.id))
      .returning();

    return { cart: await buildCartResponse(updated) };
  })

  .delete("/shops/:shopId/cart", async ({ params, cookie, set }) => {
    const auth = await requireCustomer(cookie, set);
    if (isAuthError(auth)) return auth;

    await db.delete(carts).where(and(eq(carts.customerId, auth.userId), eq(carts.shopId, params.shopId))); // cascade ลบ items/addons

    return { cart: null };
  })

  // ── Checkout: แปลงตะกร้าเป็น Order + OrderItems พร้อม Price Snapshot ──
  .post("/shops/:shopId/cart/checkout", async ({ params, body, cookie, set }) => {
    const auth = await requireCustomer(cookie, set);
    if (isAuthError(auth)) return auth;

    const parsed = checkoutCartSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    // หาตะกร้าของร้านนี้
    const [cart] = await db
      .select()
      .from(carts)
      .where(and(eq(carts.customerId, auth.userId), eq(carts.shopId, params.shopId)));
    if (!cart) {
      set.status = 404;
      return { error: "ไม่มีตะกร้าของร้านนี้ กรุณาเพิ่มสินค้าก่อน" };
    }

    const rows = await db.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
    if (rows.length === 0) {
      set.status = 400;
      return { error: "ตะกร้าว่างอยู่ กรุณาเพิ่มสินค้าก่อนเช็คเอาต์" };
    }

    // คำนวณราคาทุก item ใหม่อีกครั้ง server-side — ไม่เชื่อตัวเลขใดๆ จาก client
    type SnapshotItem = {
      orderId: string;
      serviceNameSnapshot: string;
      pricingTypeSnapshot: string;
      basePriceSnapshot: string;
      colorTierLabelSnapshot: string | null;
      colorTierPriceSnapshot: string | null;
      quantity: number;
      pageCount: number | null;
      widthCmSnapshot: string | null;
      heightCmSnapshot: string | null;
      noteSnapshot: string | null;
      optionsSnapshotJson: object[];
      additionalServicesSnapshotJson: object[];
      itemTotalPrice: string;
      fileUrl: string | null;
    };
    const snapshots: Omit<SnapshotItem, "orderId">[] = [];
    let subtotal = 0;

    for (const row of rows) {
      const [mainService] = await db.select().from(mainServices).where(eq(mainServices.id, row.mainServiceId));
      if (!mainService || !mainService.isActive) {
        set.status = 400;
        return { error: `บริการ "${mainService?.name ?? row.mainServiceId}" ถูกปิดหรือลบไปแล้ว กรุณาลบออกจากตะกร้าแล้วสั่งใหม่` };
      }

      // ดึง color tier
      let colorTier: { label: string; pricePerUnit: number } | undefined;
      if (row.colorTierId) {
        const [tier] = await db.select().from(serviceColorTiers).where(eq(serviceColorTiers.id, row.colorTierId));
        if (tier) colorTier = { label: tier.label, pricePerUnit: Number(tier.pricePerUnit) };
      }

      // ดึง quantity tiers (per_piece)
      const quantityTierRows = mainService.pricingModel === "per_piece"
        ? await db.select().from(serviceQuantityTiers).where(eq(serviceQuantityTiers.mainServiceId, row.mainServiceId))
        : [];
      const quantityTiers = quantityTierRows.map((t) => ({ minQty: t.minQty, maxQty: t.maxQty, unitPrice: Number(t.unitPrice) }));

      // ดึง option selections พร้อมราคา
      const selectionRows = await db.select().from(cartItemOptionSelections).where(eq(cartItemOptionSelections.cartItemId, row.id));
      const optionDeltas: ScopedAmount[] = [];
      const optionsSnapshot: object[] = [];

      for (const sel of selectionRows) {
        const [option] = await db.select().from(serviceOptions).where(eq(serviceOptions.id, sel.optionId));
        let valueName: string | undefined;
        let extraPrice = 0;
        let priceScope: string = "per_item";

        if (sel.valueId) {
          const [value] = await db.select().from(serviceOptionValues).where(eq(serviceOptionValues.id, sel.valueId));
          if (value) {
            valueName = value.name;
            extraPrice = Number(value.extraPrice);
            priceScope = value.priceScope;
            optionDeltas.push({ scope: value.priceScope, amount: extraPrice });
          }
        }
        optionsSnapshot.push({
          optionName: option?.name ?? "-",
          valueName: valueName ?? sel.textValue ?? null,
          textValue: sel.textValue ?? null,
          extraPrice,
          priceScope,
        });
      }

      // ดึง add-on services
      const addOnBindings = await db.select().from(cartItemAddOns).where(eq(cartItemAddOns.cartItemId, row.id));
      const addOnCharges: ScopedAmount[] = [];
      const addOnsSnapshot: object[] = [];

      for (const b of addOnBindings) {
        const [binding] = await db.select().from(mainServiceAddOns).where(
          and(eq(mainServiceAddOns.mainServiceId, row.mainServiceId), eq(mainServiceAddOns.addOnServiceId, b.addOnServiceId))
        );
        const [addOnService] = await db.select().from(addOnServices).where(eq(addOnServices.id, b.addOnServiceId));
        const extraPrice = binding ? Number(binding.extraPrice) : 0;
        if (addOnService) {
          addOnCharges.push({ scope: addOnService.scope, amount: extraPrice });
          addOnsSnapshot.push({ name: addOnService.name, extraPrice, scope: addOnService.scope });
        }
      }

      // คำนวณ line total server-side
      const calc = calculateLineItem({
        pricingModel: mainService.pricingModel,
        basePrice: Number(mainService.basePrice),
        colorTierPricePerUnit: colorTier?.pricePerUnit,
        quantity: row.quantity,
        pageCountingMode: mainService.pageCountingMode,
        rawPageCount: row.pageCount ?? 0,
        widthCm: row.widthCm ? Number(row.widthCm) : undefined,
        heightCm: row.heightCm ? Number(row.heightCm) : undefined,
        minArea: mainService.minArea != null ? Number(mainService.minArea) : undefined,
        areaRoundingIncrement: Number(mainService.areaRoundingIncrement),
        quantityTiers,
        optionDeltas,
        addOnCharges,
      });

      subtotal += calc.lineTotal;
      snapshots.push({
        serviceNameSnapshot: mainService.name,
        pricingTypeSnapshot: mainService.pricingModel,
        basePriceSnapshot: calc.baseUnitRate.toFixed(2),
        colorTierLabelSnapshot: colorTier?.label ?? null,
        colorTierPriceSnapshot: colorTier?.pricePerUnit != null ? colorTier.pricePerUnit.toFixed(2) : null,
        quantity: row.quantity,
        pageCount: row.pageCount ?? null,
        widthCmSnapshot: row.widthCm ?? null,
        heightCmSnapshot: row.heightCm ?? null,
        noteSnapshot: row.note ?? null,
        optionsSnapshotJson: optionsSnapshot,
        additionalServicesSnapshotJson: addOnsSnapshot,
        itemTotalPrice: calc.lineTotal.toFixed(2),
        fileUrl: row.fileUrl ?? null,
      });
    }

    // คำนวณค่าจัดส่ง
    let shippingFee = 0;
    if (cart.deliveryOptionId) {
      const [opt] = await db.select().from(deliveryOptions).where(eq(deliveryOptions.id, cart.deliveryOptionId));
      if (opt) {
        const threshold = opt.freeShippingThreshold != null ? Number(opt.freeShippingThreshold) : undefined;
        shippingFee = threshold != null && subtotal >= threshold ? 0 : Number(opt.baseFee);
      }
    }

    const totalPrice = subtotal + shippingFee;
    const deliveryMethod = cart.deliveryOptionId ? "shop_delivery" : "self_pickup";

    // สร้าง Order + OrderItems ใน transaction เดียว
    let lastError: unknown;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // รันเลข order code
        const [orderCountRow] = await db.select({ total: count() }).from(orders).where(eq(orders.shopId, params.shopId));
        const orderCount = Number(orderCountRow?.total ?? 0);
        const code = `#${String(orderCount + 1).padStart(4, "0")}`;
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, "0");
        const d = String(now.getDate()).padStart(2, "0");
        const rand = crypto.randomUUID().replace(/-/g, "").slice(0, 4).toUpperCase();
        const ref = `ORD-${y}${m}${d}-${rand}`;

        const [order] = await db.insert(orders).values({
          shopId: params.shopId,
          customerId: auth.userId,
          code,
          ref,
          // Schema v1 fields (ใส่ข้อมูลจาก item แรกเป็น fallback เผื่อ DB เดิมยังมี NOT NULL constraint)
          serviceType: snapshots[0]?.serviceNameSnapshot ?? "สั่งพิมพ์งาน",
          pages: snapshots[0]?.pageCount ?? 1,
          copies: snapshots[0]?.quantity ?? 1,
          colorMode: "มาตรฐาน",
          paperSize: "-",
          binding: false,
          lamination: false,
          fileUrl: snapshots[0]?.fileUrl ?? null,
          // Schema v2 fields
          subtotal: subtotal.toFixed(2),
          shippingFeeSnapshot: shippingFee.toFixed(2),
          totalPrice: Math.round(totalPrice),
          slipUrl: parsed.data.slipUrl,
          slipUploadedAt: new Date(),
          deliveryMethod,
          deliveryAddress: parsed.data.deliveryAddress,
        }).returning();

        // เพิ่ม order_items (snapshot)
        await db.insert(orderItems).values(
          snapshots.map((s) => ({ ...s, orderId: order.id }))
        );

        // ลบตะกร้าหลัง checkout สำเร็จ (cascade ลบ items/addons/option_selections ให้อัตโนมัติ)
        await db.delete(carts).where(eq(carts.id, cart.id));

        // แจ้งเตือนลูกค้าทางอีเมลว่าสั่งซื้อสำเร็จแบบ best-effort
        const [customer] = await db
          .select({ email: users.email })
          .from(users)
          .where(eq(users.id, auth.userId));
        if (customer) {
          notifyOrderCreated({
            to: customer.email,
            orderCode: order.code,
            totalPrice: Number(order.totalPrice ?? 0),
          }).catch((err) => console.error("ส่งอีเมลยืนยันคำสั่งซื้อไม่สำเร็จ:", err));
        }

        return { order: { id: order.id, code: order.code, ref: order.ref, totalPrice: Number(order.totalPrice) } };
      } catch (err) {
        lastError = err;
      }
    }

    console.error("สร้าง order ไม่สำเร็จหลังลองใหม่ 3 ครั้ง:", lastError);
    set.status = 500;
    return { error: "สร้างคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
  });

