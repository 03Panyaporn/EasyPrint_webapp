import { Elysia } from "elysia";
import { and, count, eq, inArray } from "drizzle-orm";
import { PDFDocument } from "pdf-lib";
import {
  addCartItemSchema,
  updateCartItemSchema,
  setCartDeliveryOptionSchema,
  checkoutCartSchema,
  calculateLineItem,
  calculateDeliveryFee,
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
import { objectStorage } from "../storage";
import { createNotification } from "../utils/notification";
import { generateOrderCode, generateOrderRef, serializeOrder, assertShopAcceptingOrders } from "./orders";
import { notifyOrderCreated } from "../notifications";

// นับจำนวนหน้าจริงจากไฟล์ PDF ที่อัปโหลดไว้ใน Storage — ใช้เสมอตอนเพิ่ม/แก้ไขรายการ pricingModel = per_page
// ⚠️ ห้ามรับ pageCount จาก client มาใช้คำนวณราคาโดยตรงเด็ดขาด (กัน customer แก้ตัวเลขใน request เพื่อกดราคาถูกลง)
async function countPdfPages(path: string) {
  const { data, error } = await objectStorage.from("order-files").download(path);
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
      // undefined = ลูกค้าไม่ได้เลือกตัวเลือกหมวด "printing_side" เลย (บริการนี้อาจไม่มีตัวเลือกนี้) → ใช้
      // page_counting_mode ของบริการตามเดิม; true/false = ลูกค้าเลือกค่าที่เป็น/ไม่เป็นพิมพ์สองหน้า → override เสมอ
      // (แก้บั๊ก QA Phase 05: เดิมนับแผ่นกระดาษจากค่าคงที่ระดับบริการ ไม่ผูกกับตัวเลือกที่ลูกค้าเพิ่งเลือกในออเดอร์นี้เลย)
      let printingSideDuplex: boolean | undefined;
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
              if (option?.priceCategory === "printing_side") printingSideDuplex = value.isDuplex;
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
      const effectivePageCountingMode =
        printingSideDuplex === undefined ? mainService?.pageCountingMode : printingSideDuplex ? "by_sheet" : "by_file_page";

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
          // คิดราคาตาม addon_services.price ที่ร้านตั้งไว้ที่ตัวบริการเสริมเสมอ — main_service_addons.extra_price
          // ไม่มี UI ไหนตั้งค่าได้จริง (Wizard บันทึกเป็น 0 ตลอด) ถ้าอ่านจากตรงนั้นบริการเสริมทุกตัวจะกลายเป็นฟรี
          const extraPrice = binding && addOnService ? Number(addOnService.price) : 0;
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
        pageCountingMode: effectivePageCountingMode,
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
        fileName: row.fileName ?? undefined,
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
      deliveryFee = calculateDeliveryFee(subtotal, { baseFee: Number(opt.baseFee), freeShippingThreshold: threshold });
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

// ตัวเลือกจัดส่งที่ลูกค้าเลือกได้ต้อง: เป็นของร้านนี้, ร้านยังเปิดระบบจัดส่งอยู่ (shops.delivery_enabled) และตัวเลือกยังเปิดใช้ (is_active)
// ใช้ทั้งตอนเลือกตัวเลือกในตะกร้าและตอน checkout — เพราะร้านอาจปิดตัวเลือก/ปิดระบบจัดส่งหลังลูกค้าเลือกไว้แล้ว
async function checkDeliveryOptionUsable(
  conn: Pick<typeof db, "select">,
  shopId: string,
  deliveryOptionId: string
): Promise<string | null> {
  const [row] = await conn
    .select({ isActive: deliveryOptions.isActive, deliveryEnabled: shops.deliveryEnabled })
    .from(deliveryOptions)
    .innerJoin(shops, eq(deliveryOptions.shopId, shops.id))
    .where(and(eq(deliveryOptions.id, deliveryOptionId), eq(deliveryOptions.shopId, shopId)));
  if (!row) return "ไม่พบตัวเลือกการจัดส่งนี้ในร้านนี้";
  if (!row.deliveryEnabled) return "ร้านนี้ปิดบริการจัดส่งชั่วคราว กรุณาเลือกรับเองที่ร้าน";
  if (!row.isActive) return "ตัวเลือกการจัดส่งนี้ร้านปิดใช้งานแล้ว กรุณาเลือกวิธีรับสินค้าใหม่";
  return null;
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
        fileName: parsed.data.fileName,
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
        fileName: parsed.data.fileName,
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
      const deliveryError = await checkDeliveryOptionUsable(db, cart.shopId, parsed.data.deliveryOptionId);
      if (deliveryError) {
        set.status = 400;
        return { error: deliveryError };
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

    const shopError = await assertShopAcceptingOrders(params.shopId);
    if (shopError) {
      set.status = 400;
      return shopError;
    }

    // ⚠️ ทั้งบล็อกนี้ (หาตะกร้า → คำนวณราคา → สร้าง order → ลบตะกร้า) ต้องอยู่ใน transaction เดียวกัน
    // พร้อม lock แถวตะกร้าด้วย .for("update") เสมอ — กันบั๊กที่ยืนยันแล้วจริงจาก QA Phase 05 (CO05-09):
    // ถ้ายิง checkout พร้อมกันหลาย request (กดปุ่มซ้ำเร็วๆ/double-click/retry จาก network) โดยไม่ lock,
    // ทุก request จะอ่านตะกร้าเดิมเห็นว่ายังไม่ถูกลบพร้อมกันหมด แล้วสร้าง order ซ้ำกันหลายใบจากตะกร้าใบเดียว
    // (ยืนยันจริง: ยิง 3 requests พร้อมกัน → ได้ order แยกกัน 3 ใบ) — การ lock แถวทำให้ request ที่ 2/3 ต้องรอ
    // request แรก commit (ลบตะกร้า) ก่อน แล้วจะเห็นว่าไม่มีตะกร้าแล้ว จึงคืน 404 แทนที่จะสร้าง order ซ้ำ
    try {
      const result = await db.transaction(async (tx) => {
        // หาตะกร้าของร้านนี้ — ล็อกแถวไว้กันคำขอ checkout อื่นที่ตะกร้าเดียวกันแทรกเข้ามาระหว่างนี้
        const [cart] = await tx
          .select()
          .from(carts)
          .where(and(eq(carts.customerId, auth.userId), eq(carts.shopId, params.shopId)))
          .for("update");
        if (!cart) {
          set.status = 404;
          return { error: "ไม่มีตะกร้าของร้านนี้ กรุณาเพิ่มสินค้าก่อน" };
        }

        const allRows = await tx.select().from(cartItems).where(eq(cartItems.cartId, cart.id));
        if (allRows.length === 0) {
          set.status = 400;
          return { error: "ตะกร้าว่างอยู่ กรุณาเพิ่มสินค้าก่อนเช็คเอาต์" };
        }

        // checkout เฉพาะรายการที่ลูกค้าติ๊กเลือกไว้ (ถ้าส่ง itemIds มา) — ทุก id ต้องยังอยู่ในตะกร้าใบนี้จริง
        // ถ้าไม่ครบ = รายการถูกลบ/ถูก checkout ไปแล้ว (เช่น กดยืนยันซ้ำ) ตอบ 400 แทนการสร้าง order ใหม่ที่ยอดไม่ตรงกับสลิป
        const requestedIds = parsed.data.itemIds ? new Set(parsed.data.itemIds) : null;
        const rows = requestedIds ? allRows.filter((r) => requestedIds.has(r.id)) : allRows;
        if (requestedIds && rows.length !== requestedIds.size) {
          set.status = 400;
          return { error: "มีบางรายการที่เลือกไม่อยู่ในตะกร้าแล้ว กรุณากลับไปตรวจสอบตะกร้าอีกครั้ง" };
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
          fileName: string | null;
        };
        const snapshots: Omit<SnapshotItem, "orderId">[] = [];
        let subtotal = 0;

        for (const row of rows) {
          const [mainService] = await tx.select().from(mainServices).where(eq(mainServices.id, row.mainServiceId));
          if (!mainService || !mainService.isActive) {
            set.status = 400;
            return { error: `บริการ "${mainService?.name ?? row.mainServiceId}" ถูกปิดหรือลบไปแล้ว กรุณาลบออกจากตะกร้าแล้วสั่งใหม่` };
          }

          // ดึง color tier
          let colorTier: { label: string; pricePerUnit: number } | undefined;
          if (row.colorTierId) {
            const [tier] = await tx.select().from(serviceColorTiers).where(eq(serviceColorTiers.id, row.colorTierId));
            if (tier) colorTier = { label: tier.label, pricePerUnit: Number(tier.pricePerUnit) };
          }

          // ดึง quantity tiers (per_piece)
          const quantityTierRows = mainService.pricingModel === "per_piece"
            ? await tx.select().from(serviceQuantityTiers).where(eq(serviceQuantityTiers.mainServiceId, row.mainServiceId))
            : [];
          const quantityTiers = quantityTierRows.map((t) => ({ minQty: t.minQty, maxQty: t.maxQty, unitPrice: Number(t.unitPrice) }));

          // ดึง option selections พร้อมราคา
          const selectionRows = await tx.select().from(cartItemOptionSelections).where(eq(cartItemOptionSelections.cartItemId, row.id));
          const optionDeltas: ScopedAmount[] = [];
          const optionsSnapshot: object[] = [];
          // ดู comment เต็มที่จุดเดียวกันใน GET cart ด้านบนของไฟล์นี้ — ต้อง duplicate logic นี้ที่นี่ด้วย
          // เพราะ checkout คำนวณราคาสุดท้าย server-side แยกจาก GET cart (คนละ query/loop) ต้องยืนยันผลตรงกันเป๊ะ
          let printingSideDuplex: boolean | undefined;

          for (const sel of selectionRows) {
            const [option] = await tx.select().from(serviceOptions).where(eq(serviceOptions.id, sel.optionId));
            let valueName: string | undefined;
            let extraPrice = 0;
            let priceScope: string = "per_item";

            if (sel.valueId) {
              const [value] = await tx.select().from(serviceOptionValues).where(eq(serviceOptionValues.id, sel.valueId));
              if (value) {
                valueName = value.name;
                extraPrice = Number(value.extraPrice);
                priceScope = value.priceScope;
                optionDeltas.push({ scope: value.priceScope, amount: extraPrice });
                if (option?.priceCategory === "printing_side") printingSideDuplex = value.isDuplex;
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

          // นำ colorTier เข้าไปรวมใน optionsSnapshot ด้วย เพื่อไม่ให้ข้อมูลสูญหาย
          if (colorTier) {
            optionsSnapshot.unshift({
              optionName: "สี",
              valueName: colorTier.label,
              textValue: null,
              extraPrice: colorTier.pricePerUnit,
              priceScope: mainService.pricingModel !== "per_page" ? "per_piece" : "per_page",
            });
          } else if (!row.colorTierId) {
            // ถ้าบริการนี้มี color tiers แต่ลูกค้าไม่ได้เลือก tier ใด = เลือก "ขาวดำ" (ราคาพื้นฐาน)
            const [hasColorTier] = await tx
              .select({ id: serviceColorTiers.id })
              .from(serviceColorTiers)
              .where(eq(serviceColorTiers.mainServiceId, row.mainServiceId))
              .limit(1);
            if (hasColorTier) {
              optionsSnapshot.unshift({
                optionName: "สี",
                valueName: "ขาวดำ",
                textValue: null,
                extraPrice: 0,
                priceScope: mainService.pricingModel !== "per_page" ? "per_piece" : "per_page",
              });
            }
          }

          // ดึง add-on services
          const addOnBindings = await tx.select().from(cartItemAddOns).where(eq(cartItemAddOns.cartItemId, row.id));
          const addOnCharges: ScopedAmount[] = [];
          const addOnsSnapshot: object[] = [];

          for (const b of addOnBindings) {
            const [binding] = await tx.select().from(mainServiceAddOns).where(
              and(eq(mainServiceAddOns.mainServiceId, row.mainServiceId), eq(mainServiceAddOns.addOnServiceId, b.addOnServiceId))
            );
            const [addOnService] = await tx.select().from(addOnServices).where(eq(addOnServices.id, b.addOnServiceId));
            const extraPrice = binding && addOnService ? Number(addOnService.price) : 0; // ดู comment ที่ GET cart ด้านบน
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
            pageCountingMode: printingSideDuplex === undefined ? mainService.pageCountingMode : printingSideDuplex ? "by_sheet" : "by_file_page",
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
            fileName: row.fileName ?? null,
          });
        }

        // คำนวณค่าจัดส่ง — คิดจากยอดของรายการที่ checkout รอบนี้เท่านั้น (ตรงกับที่หน้า checkout แสดงให้ลูกค้าโอน)
        let shippingFee = 0;
        if (cart.deliveryOptionId) {
          const deliveryError = await checkDeliveryOptionUsable(tx, params.shopId, cart.deliveryOptionId);
          if (deliveryError) {
            set.status = 400;
            return { error: deliveryError };
          }
          if (!parsed.data.deliveryAddress) {
            set.status = 400;
            return { error: "กรุณาเลือกที่อยู่จัดส่ง" };
          }
          const [opt] = await tx.select().from(deliveryOptions).where(eq(deliveryOptions.id, cart.deliveryOptionId));
          const threshold = opt.freeShippingThreshold != null ? Number(opt.freeShippingThreshold) : undefined;
          shippingFee = calculateDeliveryFee(subtotal, { baseFee: Number(opt.baseFee), freeShippingThreshold: threshold });
        }

        const totalPrice = subtotal + shippingFee;
        const deliveryMethod = cart.deliveryOptionId ? "shop_delivery" : "self_pickup";

        // สร้าง order code แล้ว insert order+items — ใช้ savepoint (nested transaction) แยกต่างหาก
        // เพราะถ้าเลข order code ชนกัน (unique constraint) ต้อง retry ได้โดยไม่ทำให้ transaction ชั้นนอก
        // (ที่ถือ lock ตะกร้าอยู่) เสียหายไปด้วย — Postgres จะ abort ทั้ง transaction ทันทีถ้ามี statement
        // ใดพังโดยไม่มี savepoint กันไว้
        let lastError: unknown;
        for (let attempt = 0; attempt < 3; attempt++) {
          try {
            const orderResult = await tx.transaction(async (tx2) => {
              // รันเลข order code
              const [orderCountRow] = await tx2.select({ total: count() }).from(orders).where(eq(orders.shopId, params.shopId));
              const orderCount = Number(orderCountRow?.total ?? 0);
              const code = `#${String(orderCount + 1).padStart(4, "0")}`;
              const ref = generateOrderRef(); // วันที่ตามเวลาไทย (ดู orders.ts)

              const [order] = await tx2.insert(orders).values({
                shopId: params.shopId,
                customerId: auth.userId,
                code,
                ref,
                // Schema v1 fields (ใส่ข้อมูลจาก item แรกเป็น fallback เผื่อ DB เดิมยังมี NOT NULL constraint)
                serviceType: snapshots[0]?.serviceNameSnapshot ?? "สั่งพิมพ์งาน",
                pages: snapshots[0]?.pageCount ?? 1,
                copies: snapshots[0]?.quantity ?? 1,
                colorMode: snapshots[0]?.colorTierLabelSnapshot ? "color" : "bw",
                paperSize: "-",
                binding: false,
                lamination: false,
                fileUrl: snapshots[0]?.fileUrl ?? null,
                // Schema v2 fields
                subtotal: subtotal.toFixed(2),
                shippingFeeSnapshot: shippingFee.toFixed(2),
                totalPrice: totalPrice.toFixed(2), // เก็บยอดจริงไม่ปัดเศษ — ต้องเท่ากับยอดที่ลูกค้าเห็นตอนโอน
                slipUrl: parsed.data.slipUrl,
                slipUploadedAt: new Date(),
                deliveryMethod,
                // รับเองที่ร้านไม่ต้องเก็บที่อยู่ — กัน client ส่งที่อยู่มาทั้งที่ไม่ได้เลือกจัดส่ง
                deliveryAddress: deliveryMethod === "shop_delivery" ? parsed.data.deliveryAddress : null,
              }).returning();

              // เพิ่ม order_items (snapshot)
              await tx2.insert(orderItems).values(
                snapshots.map((s) => ({ ...s, orderId: order.id }))
              );

              // ลบเฉพาะรายการที่ checkout แล้ว (cascade ลบ addons/option_selections ให้อัตโนมัติ)
              // ถ้าไม่เหลือรายการไหนในตะกร้าแล้วค่อยลบตัวตะกร้าทิ้ง — รายการที่ไม่ได้เลือกยังอยู่ให้สั่งรอบหน้าได้
              if (rows.length === allRows.length) {
                await tx2.delete(carts).where(eq(carts.id, cart.id));
              } else {
                await tx2.delete(cartItems).where(inArray(cartItems.id, rows.map((r) => r.id)));
              }

              return order;
            });

            // แจ้งเตือนลูกค้าทางอีเมล + ร้านค้า เป็น best-effort ล้วนๆ — ห้ามให้ error ตรงนี้ไปโดน catch
            // ของ retry loop ด้านบน เพราะ order ถูกสร้างสำเร็จแล้วจริง (commit ไปแล้ว) ไม่ควร retry ซ้ำ
            try {
              const [customer] = await tx
                .select({ email: users.email, firstname: users.firstname, lastname: users.lastname })
                .from(users)
                .where(eq(users.id, auth.userId));
              if (customer) {
                notifyOrderCreated({
                  to: customer.email,
                  orderCode: orderResult.code,
                  totalPrice: Number(orderResult.totalPrice ?? 0),
                }).catch((err) => console.error("ส่งอีเมลยืนยันคำสั่งซื้อไม่สำเร็จ:", err));
              }

              const [shopInfo] = await tx.select({ ownerId: shops.ownerId }).from(shops).where(eq(shops.id, params.shopId));
              if (shopInfo) {
                const customerName = customer ? `${customer.firstname} ${customer.lastname}`.trim() : "ลูกค้า";
                await createNotification({
                  userId: shopInfo.ownerId,
                  typeId: 1, // 1 = ออเดอร์ใหม่
                  title: `ออเดอร์ใหม่ ${orderResult.code}`,
                  message: `คุณได้รับคำสั่งซื้อใหม่จาก ${customerName} กรุณาตรวจสอบและรับงาน`,
                  category: "general",
                  link: `/shop/orders/${orderResult.id}`,
                });
              }
            } catch (notifyErr) {
              console.error("แจ้งเตือนหลังสร้างออเดอร์ไม่สำเร็จ (ไม่กระทบออเดอร์ที่สร้างแล้ว):", notifyErr);
            }

            return { order: { id: orderResult.id, code: orderResult.code, ref: orderResult.ref, totalPrice: Number(orderResult.totalPrice) } };
          } catch (err) {
            lastError = err;
          }
        }

        console.error("สร้าง order ไม่สำเร็จหลังลองใหม่ 3 ครั้ง:", lastError);
        set.status = 500;
        return { error: "สร้างคำสั่งซื้อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง" };
      });

      return result;
    } catch (err) {
      console.error("Checkout transaction ล้มเหลวโดยไม่คาดคิด:", err);
      set.status = 500;
      return { error: "เกิดข้อผิดพลาดที่ไม่คาดคิด กรุณาลองใหม่อีกครั้ง" };
    }
  });

