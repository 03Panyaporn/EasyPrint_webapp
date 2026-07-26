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
import { mainServices, addOnServices, mainServiceAddOns, deliveryOptions } from "../../drizzle/schema";

// ⚠️ TODO: endpoint POST/PATCH/DELETE ในไฟล์นี้ยังไม่เช็ค JWT ว่าผู้เรียกเป็นเจ้าของร้าน (:shopId) จริง
// (รูปแบบ TODO เดียวกับ customerId ใน POST /orders ที่ src/index.ts) — ต้องเพิ่ม auth middleware ก่อนใช้งานจริง
// ตอนนี้ใครก็เรียก endpoint พร้อม shopId ของร้านอื่นแล้วแก้ข้อมูลร้านนั้นได้ ห้ามขึ้น production ก่อนแก้จุดนี้

function serializeMainService(
  row: typeof mainServices.$inferSelect,
  addOns: { addOnId: string; extraPrice: number }[]
) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    paperSizes: row.paperSizes,
    customPaperSize: row.customPaperSize ?? undefined,
    colors: row.colors,
    price: Number(row.price),
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

export const servicesRoutes = new Elysia()
  // ── บริการหลัก ──────────────────────────────
  .get("/shops/:shopId/services", async ({ params }) => {
    const rows = await db.query.mainServices.findMany({
      where: eq(mainServices.shopId, params.shopId),
      with: { addOns: true },
    });
    return {
      services: rows.map((row) =>
        serializeMainService(
          row,
          row.addOns.map((b) => ({ addOnId: b.addOnServiceId, extraPrice: Number(b.extraPrice) }))
        )
      ),
    };
  })

  .post("/shops/:shopId/services", async ({ params, body, set }) => {
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
        paperSizes: parsed.data.paperSizes,
        customPaperSize: parsed.data.customPaperSize,
        colors: parsed.data.colors,
        price: parsed.data.price.toFixed(2),
        unit: parsed.data.unit,
        estimatedTime: parsed.data.estimatedTime,
        imageUrl: parsed.data.imageUrl,
        isActive: parsed.data.isActive,
      })
      .returning();

    if (parsed.data.addOns.length > 0) {
      await db.insert(mainServiceAddOns).values(
        parsed.data.addOns.map((b) => ({
          mainServiceId: service.id,
          addOnServiceId: b.addOnId,
          extraPrice: b.extraPrice.toFixed(2),
        }))
      );
    }

    return { service: serializeMainService(service, parsed.data.addOns) };
  })

  .patch("/shops/:shopId/services/:id", async ({ params, body, set }) => {
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

    const { addOns, price, ...rest } = parsed.data;

    const [service] = await db
      .update(mainServices)
      .set({ ...rest, ...(price !== undefined ? { price: price.toFixed(2) } : {}) })
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
          addOns.map((b) => ({
            mainServiceId: service.id,
            addOnServiceId: b.addOnId,
            extraPrice: b.extraPrice.toFixed(2),
          }))
        );
      }
    }

    const currentAddOns = addOns ?? (await fetchAddOnBindings(service.id));
    return { service: serializeMainService(service, currentAddOns) };
  })

  .delete("/shops/:shopId/services/:id", async ({ params, set }) => {
    // ON DELETE CASCADE บน main_service_addons ลบ binding ที่ผูกกับบริการนี้ให้อัตโนมัติ
    const [deleted] = await db
      .delete(mainServices)
      .where(and(eq(mainServices.id, params.id), eq(mainServices.shopId, params.shopId)))
      .returning();

    if (!deleted) {
      set.status = 404;
      return { error: "ไม่พบบริการนี้" };
    }
    return { service: serializeMainService(deleted, []) };
  })

  // ── บริการเสริม ──────────────────────────────
  .get("/shops/:shopId/addons", async ({ params }) => {
    const rows = await db.select().from(addOnServices).where(eq(addOnServices.shopId, params.shopId));
    return { addOns: rows.map(serializeAddOnService) };
  })

  .post("/shops/:shopId/addons", async ({ params, body, set }) => {
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
        isActive: parsed.data.isActive,
      })
      .returning();

    return { addOn: serializeAddOnService(addOn) };
  })

  .patch("/shops/:shopId/addons/:id", async ({ params, body, set }) => {
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

  .delete("/shops/:shopId/addons/:id", async ({ params, set }) => {
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
  .get("/shops/:shopId/delivery-options", async ({ params }) => {
    const rows = await db
      .select()
      .from(deliveryOptions)
      .where(eq(deliveryOptions.shopId, params.shopId));
    return { deliveryOptions: rows.map(serializeDeliveryOption) };
  })

  .post("/shops/:shopId/delivery-options", async ({ params, body, set }) => {
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

  .patch("/shops/:shopId/delivery-options/:id", async ({ params, body, set }) => {
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

  .delete("/shops/:shopId/delivery-options/:id", async ({ params, set }) => {
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
