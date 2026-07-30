import { Elysia } from "elysia";
import { and, eq, ne, sql } from "drizzle-orm";
import {
  createMainServiceSchema,
  updateMainServiceSchema,
  createAddOnServiceSchema,
  updateAddOnServiceSchema,
  createDeliveryOptionSchema,
  updateDeliveryOptionSchema,
} from "@easyprint/shared";
import { db } from "../db";
import {
  mainServices,
  addOnServices,
  mainServiceAddOns,
  serviceOptions,
  serviceOptionValues,
  deliveryOptions,
  shops,
} from "../../drizzle/schema";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";

// เช็คว่า request มี JWT ที่ login เป็น shop_owner ของร้าน :shopId นี้จริง ก่อนให้แก้ไข/ลบข้อมูล
// คืน { error } object ถ้าไม่ผ่าน (พร้อมตั้ง set.status ให้แล้ว) หรือ null ถ้าผ่าน — ตรวจสอบสิทธิ์แบบเดียวกับที่ /auth/me ใช้อ่าน cookie
// export ไว้ให้ routes/orders.ts เรียกใช้ร่วมด้วย กันเขียนลอจิกตรวจสิทธิ์ซ้ำ
export async function requireShopOwner(
  cookie: Record<string, { value?: unknown } | undefined>,
  shopId: string,
  set: { status?: unknown }
) {
  const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload) {
    set.status = 401;
    return { error: "ยังไม่ได้เข้าสู่ระบบ" };
  }
  if (payload.role !== "shop_owner") {
    set.status = 403;
    return { error: "ต้องเป็นบัญชีร้านค้าเท่านั้น" };
  }

  const [shop] = await db
    .select({ id: shops.id, approvalStatus: shops.approvalStatus })
    .from(shops)
    .where(and(eq(shops.id, shopId), eq(shops.ownerId, payload.userId)));
  if (!shop) {
    set.status = 403;
    return { error: "คุณไม่มีสิทธิ์จัดการร้านนี้" };
  }
  if (shop.approvalStatus !== "approved") {
    set.status = 403;
    return { error: "ร้านค้ายังไม่ได้รับการอนุมัติจากแอดมิน ยังตั้งบริการและราคาไม่ได้" };
  }

  return null;
}

// เช็คว่า shop นี้ "เปิดเผยข้อมูลบริการ/ราคาต่อสาธารณะได้ไหม" — อนุมัติแล้วเท่านั้น ยกเว้นเจ้าของร้านดูของตัวเองได้เสมอไม่ว่าสถานะไหน
// กันไม่ให้ราคา/บริการของร้านที่ยัง pending หรือถูก reject ไปแล้ว (มีข้อมูลค้างจากตอนที่เคยอนุมัติ) หลุดออกไปให้คนนอกเห็นผ่าน shopId ตรงๆ
async function canViewShopPublicly(
  shopId: string,
  cookie: Record<string, { value?: unknown } | undefined>
) {
  const [shop] = await db
    .select({ approvalStatus: shops.approvalStatus, ownerId: shops.ownerId })
    .from(shops)
    .where(eq(shops.id, shopId));
  if (!shop) return false;
  if (shop.approvalStatus === "approved") return true;

  const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
  const payload = token ? verifyAuthToken(token) : null;
  return payload?.role === "shop_owner" && payload.userId === shop.ownerId;
}

type SerializedOptionValue = { id: string; name: string; extraPrice: number };
type SerializedOption = { id: string; name: string; type: string; values: SerializedOptionValue[] };

function serializeMainService(
  row: typeof mainServices.$inferSelect,
  addOns: { addOnId: string; extraPrice: number }[],
  options: SerializedOption[]
) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    pricingModel: row.pricingModel,
    basePrice: Number(row.basePrice),
    requiresFileUpload: row.requiresFileUpload,
    allowedFileTypes: row.allowedFileTypes ?? [],
    options,
    unit: row.unit,
    estimatedTime: row.estimatedTime ?? undefined,
    availableAddOns: addOns,
    imageUrl: row.imageUrl ?? undefined,
    isActive: row.isActive,
  };
}

function serializeAddOnService(row: typeof addOnServices.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    price: Number(row.price),
    unit: row.unit,
    estimatedTime: row.estimatedTime ?? undefined,
    imageUrl: row.imageUrl ?? undefined,
    isActive: row.isActive,
  };
}

function serializeDeliveryOption(row: typeof deliveryOptions.$inferSelect) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    isActive: row.isActive,
    baseFee: Number(row.baseFee),
    freeShippingThreshold:
      row.freeShippingThreshold != null ? Number(row.freeShippingThreshold) : undefined,
  };
}

async function fetchAddOnBindings(mainServiceId: string) {
  const rows = await db
    .select()
    .from(mainServiceAddOns)
    .where(eq(mainServiceAddOns.mainServiceId, mainServiceId));
  return rows.map((b) => ({ addOnId: b.addOnServiceId, extraPrice: Number(b.extraPrice) }));
}

// ดึงตัวเลือกบริการ + ค่าที่เลือกได้ทั้งหมดของบริการหลักหนึ่งอัน เรียงตาม sortOrder
async function fetchOptions(mainServiceId: string): Promise<SerializedOption[]> {
  const optionRows = await db
    .select()
    .from(serviceOptions)
    .where(eq(serviceOptions.mainServiceId, mainServiceId))
    .orderBy(serviceOptions.sortOrder);

  return Promise.all(
    optionRows.map(async (opt) => {
      const valueRows = await db
        .select()
        .from(serviceOptionValues)
        .where(eq(serviceOptionValues.optionId, opt.id))
        .orderBy(serviceOptionValues.sortOrder);
      return {
        id: opt.id,
        name: opt.name,
        type: opt.type,
        values: valueRows.map((v) => ({ id: v.id, name: v.name, extraPrice: Number(v.extraPrice) })),
      };
    })
  );
}

// เขียนตัวเลือกบริการ + ค่าทั้งหมดใหม่ทั้งชุดให้บริการหลักหนึ่งอัน — ลบของเดิมแล้วใส่ใหม่ (เหมือนแพทเทิร์นเดิมของ priceOptions/areaRates)
async function writeOptions(
  mainServiceId: string,
  options: { name: string; type: "dropdown" | "radio" | "checkbox" | "number" | "text"; values: { name: string; extraPrice: number }[] }[]
): Promise<SerializedOption[]> {
  await db.delete(serviceOptions).where(eq(serviceOptions.mainServiceId, mainServiceId));
  if (options.length === 0) return [];

  const result: SerializedOption[] = [];
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const [inserted] = await db
      .insert(serviceOptions)
      .values({ mainServiceId, name: opt.name, type: opt.type, sortOrder: i })
      .returning();

    let values: SerializedOptionValue[] = [];
    if (opt.values.length > 0) {
      const insertedValues = await db
        .insert(serviceOptionValues)
        .values(opt.values.map((v, vi) => ({ optionId: inserted.id, name: v.name, extraPrice: v.extraPrice.toFixed(2), sortOrder: vi })))
        .returning();
      values = insertedValues.map((v) => ({ id: v.id, name: v.name, extraPrice: Number(v.extraPrice) }));
    }
    result.push({ id: inserted.id, name: inserted.name, type: inserted.type, values });
  }
  return result;
}

export const servicesRoutes = new Elysia()
  // ── บริการหลัก ──────────────────────────────
  .get("/shops/:shopId/services", async ({ params, cookie }) => {
    if (!(await canViewShopPublicly(params.shopId, cookie))) {
      return { services: [] };
    }

    const rows = await db.query.mainServices.findMany({
      where: eq(mainServices.shopId, params.shopId),
      with: { addOns: true },
    });
    return {
      services: await Promise.all(
        rows.map(async (row) =>
          serializeMainService(
            row,
            row.addOns.map((b) => ({ addOnId: b.addOnServiceId, extraPrice: Number(b.extraPrice) })),
            await fetchOptions(row.id)
          )
        )
      ),
    };
  })

  .post("/shops/:shopId/services", async ({ params, body, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsed = createMainServiceSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [duplicate] = await db
      .select({ id: mainServices.id })
      .from(mainServices)
      .where(
        and(
          eq(mainServices.shopId, params.shopId),
          sql`lower(${mainServices.name}) = lower(${parsed.data.name})`
        )
      );
    if (duplicate) {
      set.status = 400;
      return { error: "มีบริการชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" };
    }

    const [service] = await db
      .insert(mainServices)
      .values({
        shopId: params.shopId,
        name: parsed.data.name,
        description: parsed.data.description,
        pricingModel: parsed.data.pricingModel,
        basePrice: parsed.data.basePrice.toFixed(2),
        requiresFileUpload: parsed.data.requiresFileUpload,
        allowedFileTypes: parsed.data.allowedFileTypes,
        unit: parsed.data.unit,
        estimatedTime: parsed.data.estimatedTime,
        imageUrl: parsed.data.imageUrl,
        isActive: parsed.data.isActive,
      })
      .returning();

    const insertedOptions = await writeOptions(service.id, parsed.data.options);

    if (parsed.data.addOns.length > 0) {
      await db.insert(mainServiceAddOns).values(
        parsed.data.addOns.map((b) => ({
          mainServiceId: service.id,
          addOnServiceId: b.addOnId,
          extraPrice: b.extraPrice.toFixed(2),
        }))
      );
    }

    return { service: serializeMainService(service, parsed.data.addOns, insertedOptions) };
  })

  // คัดลอกบริการหลัก (พร้อมตัวเลือก+ค่า+บริการเสริมที่ผูกไว้) — ตั้งชื่อใหม่อัตโนมัติ + ปิดใช้งานไว้ก่อนให้ร้านตรวจสอบก่อนเปิดขายจริง
  .post("/shops/:shopId/services/:id/duplicate", async ({ params, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const [original] = await db
      .select()
      .from(mainServices)
      .where(and(eq(mainServices.id, params.id), eq(mainServices.shopId, params.shopId)));
    if (!original) {
      set.status = 404;
      return { error: "ไม่พบบริการนี้" };
    }

    let newName = `${original.name} (คัดลอก)`;
    let suffix = 2;
    while (
      (
        await db
          .select({ id: mainServices.id })
          .from(mainServices)
          .where(and(eq(mainServices.shopId, params.shopId), sql`lower(${mainServices.name}) = lower(${newName})`))
      ).length > 0
    ) {
      newName = `${original.name} (คัดลอก ${suffix})`;
      suffix += 1;
    }

    const [copy] = await db
      .insert(mainServices)
      .values({
        shopId: params.shopId,
        name: newName,
        description: original.description,
        pricingModel: original.pricingModel,
        basePrice: original.basePrice,
        requiresFileUpload: original.requiresFileUpload,
        allowedFileTypes: original.allowedFileTypes,
        unit: original.unit,
        estimatedTime: original.estimatedTime,
        imageUrl: original.imageUrl,
        isActive: false, // ปิดไว้ก่อนเสมอ กันลูกค้าเห็นบริการซ้ำก่อนร้านตรวจสอบ/แก้ไข
      })
      .returning();

    const originalOptions = await fetchOptions(original.id);
    const copiedOptions = await writeOptions(
      copy.id,
      originalOptions.map((o) => ({
        name: o.name,
        type: o.type as "dropdown" | "radio" | "checkbox" | "number" | "text",
        values: o.values.map((v) => ({ name: v.name, extraPrice: v.extraPrice })),
      }))
    );

    const originalAddOns = await fetchAddOnBindings(original.id);
    if (originalAddOns.length > 0) {
      await db.insert(mainServiceAddOns).values(
        originalAddOns.map((b) => ({
          mainServiceId: copy.id,
          addOnServiceId: b.addOnId,
          extraPrice: b.extraPrice.toFixed(2),
        }))
      );
    }

    return { service: serializeMainService(copy, originalAddOns, copiedOptions) };
  })

  .patch("/shops/:shopId/services/:id", async ({ params, body, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsed = updateMainServiceSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    if (parsed.data.name) {
      const [duplicate] = await db
        .select({ id: mainServices.id })
        .from(mainServices)
        .where(
          and(
            eq(mainServices.shopId, params.shopId),
            sql`lower(${mainServices.name}) = lower(${parsed.data.name})`,
            ne(mainServices.id, params.id)
          )
        );
      if (duplicate) {
        set.status = 400;
        return { error: "มีบริการชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" };
      }
    }

    const { addOns, options, basePrice, ...rest } = parsed.data;

    const [service] = await db
      .update(mainServices)
      .set({ ...rest, ...(basePrice !== undefined ? { basePrice: basePrice.toFixed(2) } : {}) })
      .where(and(eq(mainServices.id, params.id), eq(mainServices.shopId, params.shopId)))
      .returning();

    if (!service) {
      set.status = 404;
      return { error: "ไม่พบบริการนี้" };
    }

    if (addOns !== undefined) {
      await db.delete(mainServiceAddOns).where(eq(mainServiceAddOns.mainServiceId, service.id));
      if (addOns.length > 0) {
        await db.insert(mainServiceAddOns).values(
          addOns.map((b: { addOnId: string; extraPrice: number }) => ({
            mainServiceId: service.id,
            addOnServiceId: b.addOnId,
            extraPrice: b.extraPrice.toFixed(2),
          }))
        );
      }
    }

    const currentOptions = options !== undefined ? await writeOptions(service.id, options) : await fetchOptions(service.id);
    const currentAddOns = addOns ?? (await fetchAddOnBindings(service.id));
    return { service: serializeMainService(service, currentAddOns, currentOptions) };
  })

  .delete("/shops/:shopId/services/:id", async ({ params, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    // ON DELETE CASCADE บน main_service_addons + service_options (+ service_option_values ต่อเนื่อง) ลบข้อมูลที่ผูกกับบริการนี้ให้อัตโนมัติ
    const [deleted] = await db
      .delete(mainServices)
      .where(and(eq(mainServices.id, params.id), eq(mainServices.shopId, params.shopId)))
      .returning();

    if (!deleted) {
      set.status = 404;
      return { error: "ไม่พบบริการนี้" };
    }
    return { service: serializeMainService(deleted, [], []) };
  })

  // ── บริการเสริม ──────────────────────────────
  .get("/shops/:shopId/addons", async ({ params, cookie }) => {
    if (!(await canViewShopPublicly(params.shopId, cookie))) {
      return { addOns: [] };
    }

    const rows = await db.select().from(addOnServices).where(eq(addOnServices.shopId, params.shopId));
    return { addOns: rows.map(serializeAddOnService) };
  })

  .post("/shops/:shopId/addons", async ({ params, body, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsed = createAddOnServiceSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [duplicate] = await db
      .select({ id: addOnServices.id })
      .from(addOnServices)
      .where(
        and(
          eq(addOnServices.shopId, params.shopId),
          sql`lower(${addOnServices.name}) = lower(${parsed.data.name})`
        )
      );
    if (duplicate) {
      set.status = 400;
      return { error: "มีบริการชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" };
    }

    const [addOn] = await db
      .insert(addOnServices)
      .values({
        shopId: params.shopId,
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price.toFixed(2),
        unit: parsed.data.unit,
        estimatedTime: parsed.data.estimatedTime,
        imageUrl: parsed.data.imageUrl,
        isActive: parsed.data.isActive,
      })
      .returning();

    return { addOn: serializeAddOnService(addOn) };
  })

  .patch("/shops/:shopId/addons/:id", async ({ params, body, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsed = updateAddOnServiceSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    if (parsed.data.name) {
      const [duplicate] = await db
        .select({ id: addOnServices.id })
        .from(addOnServices)
        .where(
          and(
            eq(addOnServices.shopId, params.shopId),
            sql`lower(${addOnServices.name}) = lower(${parsed.data.name})`,
            ne(addOnServices.id, params.id)
          )
        );
      if (duplicate) {
        set.status = 400;
        return { error: "มีบริการชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" };
      }
    }

    const { price, ...rest } = parsed.data;

    const [addOn] = await db
      .update(addOnServices)
      .set({ ...rest, ...(price !== undefined ? { price: price.toFixed(2) } : {}) })
      .where(and(eq(addOnServices.id, params.id), eq(addOnServices.shopId, params.shopId)))
      .returning();

    if (!addOn) {
      set.status = 404;
      return { error: "ไม่พบบริการเสริมนี้" };
    }
    return { addOn: serializeAddOnService(addOn) };
  })

  .delete("/shops/:shopId/addons/:id", async ({ params, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    // ON DELETE CASCADE บน main_service_addons ลบ binding ที่บริการหลักอื่นผูกไว้กับบริการเสริมนี้ให้อัตโนมัติ
    const [deleted] = await db
      .delete(addOnServices)
      .where(and(eq(addOnServices.id, params.id), eq(addOnServices.shopId, params.shopId)))
      .returning();

    if (!deleted) {
      set.status = 404;
      return { error: "ไม่พบบริการเสริมนี้" };
    }
    return { addOn: serializeAddOnService(deleted) };
  })

  // ── ตัวเลือกการจัดส่ง ────────────────────────
  .get("/shops/:shopId/delivery-options", async ({ params, cookie }) => {
    if (!(await canViewShopPublicly(params.shopId, cookie))) {
      return { deliveryOptions: [] };
    }

    const rows = await db
      .select()
      .from(deliveryOptions)
      .where(eq(deliveryOptions.shopId, params.shopId));
    return { deliveryOptions: rows.map(serializeDeliveryOption) };
  })

  .post("/shops/:shopId/delivery-options", async ({ params, body, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsed = createDeliveryOptionSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    const [duplicate] = await db
      .select({ id: deliveryOptions.id })
      .from(deliveryOptions)
      .where(
        and(
          eq(deliveryOptions.shopId, params.shopId),
          sql`lower(${deliveryOptions.name}) = lower(${parsed.data.name})`
        )
      );
    if (duplicate) {
      set.status = 400;
      return { error: "มีประเภทการจัดส่งชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" };
    }

    const [option] = await db
      .insert(deliveryOptions)
      .values({
        shopId: params.shopId,
        name: parsed.data.name,
        description: parsed.data.description,
        logoUrl: parsed.data.logoUrl,
        baseFee: parsed.data.baseFee.toFixed(2),
        freeShippingThreshold:
          parsed.data.freeShippingThreshold != null
            ? parsed.data.freeShippingThreshold.toFixed(2)
            : undefined,
        isActive: parsed.data.isActive,
      })
      .returning();

    return { deliveryOption: serializeDeliveryOption(option) };
  })

  .patch("/shops/:shopId/delivery-options/:id", async ({ params, body, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const parsed = updateDeliveryOptionSchema.safeParse(body);
    if (!parsed.success) {
      set.status = 400;
      return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
    }

    if (parsed.data.name) {
      const [duplicate] = await db
        .select({ id: deliveryOptions.id })
        .from(deliveryOptions)
        .where(
          and(
            eq(deliveryOptions.shopId, params.shopId),
            sql`lower(${deliveryOptions.name}) = lower(${parsed.data.name})`,
            ne(deliveryOptions.id, params.id)
          )
        );
      if (duplicate) {
        set.status = 400;
        return { error: "มีประเภทการจัดส่งชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น" };
      }
    }

    const { baseFee, freeShippingThreshold, ...rest } = parsed.data;

    const [option] = await db
      .update(deliveryOptions)
      .set({
        ...rest,
        ...(baseFee !== undefined ? { baseFee: baseFee.toFixed(2) } : {}),
        ...(freeShippingThreshold !== undefined
          ? { freeShippingThreshold: freeShippingThreshold === null ? null : freeShippingThreshold.toFixed(2) }
          : {}),
      })
      .where(and(eq(deliveryOptions.id, params.id), eq(deliveryOptions.shopId, params.shopId)))
      .returning();

    if (!option) {
      set.status = 404;
      return { error: "ไม่พบประเภทการจัดส่งนี้" };
    }
    return { deliveryOption: serializeDeliveryOption(option) };
  })

  .delete("/shops/:shopId/delivery-options/:id", async ({ params, set, cookie }) => {
    const authError = await requireShopOwner(cookie, params.shopId, set);
    if (authError) return authError;

    const [deleted] = await db
      .delete(deliveryOptions)
      .where(and(eq(deliveryOptions.id, params.id), eq(deliveryOptions.shopId, params.shopId)))
      .returning();

    if (!deleted) {
      set.status = 404;
      return { error: "ไม่พบประเภทการจัดส่งนี้" };
    }
    return { deliveryOption: serializeDeliveryOption(deleted) };
  });
