import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, numeric, primaryKey, jsonb, unique, uniqueIndex } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// โครงสร้างเริ่มต้น อ้างอิงจาก docs/proposal.md หัวข้อ 1.3
// แก้/เพิ่มตารางได้ตามที่ทีมออกแบบ ERD จริงใน docs/erd.md

export const userRoleEnum = pgEnum("user_role", ["shop_owner", "customer", "admin"]);
// ต้องตรงกับ OrderStatus ฝั่ง frontend (apps/web/components/shop/orders/types.ts) เสมอ — แก้ที่นี่ต้องแก้ที่นั่นด้วย
export const orderStatusEnum = pgEnum("order_status", [
  "pending_review", // รอตรวจสอบ (รอร้านตรวจสลิป/ยืนยันรับงาน)
  "accepted", // รับงานแล้ว
  "in_progress", // กำลังดำเนินการ
  "shipping", // กำลังจัดส่ง (ข้ามสถานะนี้ถ้าลูกค้าเลือกมารับเองที่ร้าน)
  "completed", // เสร็จสิ้น
  "cancelled", // ยกเลิก (รวมถึงกรณีปฏิเสธการชำระเงิน)
]);
// เหตุผลตอนยกเลิก/ปฏิเสธการชำระเงิน — ต้องตรงกับ cancelReasonLabels ฝั่ง frontend (apps/web/components/shop/orders/statusConfig.ts)
export const cancelReasonEnum = pgEnum("cancel_reason", [
  "customer_request",
  "invalid_payment_slip",
  "amount_mismatch",
  "no_transfer_found",
  "invalid_file",
  "shop_unavailable",
  "other",
]);
export const deliveryMethodEnum = pgEnum("delivery_method", ["shop_delivery", "self_pickup"]);
// ร้านที่สมัครใหม่เริ่มที่ pending เสมอ — รอแอดมินอนุมัติก่อนถึงจะเปิดขายจริงได้ (ตาม flow "อนุมัติร้านค้า")
export const shopApprovalStatusEnum = pgEnum("shop_approval_status", [
  "pending",
  "approved",
  "rejected",
]);
// วิธีคิด "ราคาพื้นฐาน" ของบริการหลัก (base_price คูณกับหน่วยตามโหมดนี้):
//   per_page  = base_price x จำนวนหน้า PDF ที่นับได้จริง (server นับเองเสมอ)
//   per_piece = base_price x quantity (จำนวนชุดที่ลูกค้ากรอก)
//   per_sqm   = base_price x พื้นที่ (ตร.ม.) จากกว้าง/สูงที่ลูกค้ากรอกเอง
//   fixed     = base_price เหมาจ่ายทั้งงาน ไม่คูณด้วยหน่วยใดๆ (ต่างจาก per_piece ตรงที่ไม่การันตีคูณตาม quantity)
// ราคารวมจริง = (base_price + ผลรวม extraPrice ของตัวเลือก (options) ที่ลูกค้าเลือก) x หน่วยตามโหมด
export const pricingModelEnum = pgEnum("pricing_model", ["per_page", "per_piece", "per_sqm", "fixed"]);

// รูปแบบการเลือกของ "ตัวเลือกบริการ" (service option) ที่ร้านค้าสร้างเองได้ไม่จำกัด
// กฎบังคับกรอกอัตโนมัติ: dropdown/radio/number ต้องเลือก/กรอกก่อนสั่งซื้อ, checkbox/text ไม่บังคับ
export const serviceOptionTypeEnum = pgEnum("service_option_type", ["dropdown", "radio", "checkbox", "number", "text"]);

// หมวดราคาของ Option — 1 หมวดมีได้แค่ 1 Option ต่อบริการ (กันสร้าง Option ซ้ำซ้อนกันโดยไม่ตั้งใจ) ยกเว้น "other" ที่ซ้ำได้
// 'color' ไม่อยู่ใน enum นี้โดยเจตนา — สีอยู่ที่ service_color_tiers เพียงจุดเดียวเท่านั้น ห้ามสร้าง Option เกี่ยวกับสี
export const optionPriceCategoryEnum = pgEnum("option_price_category", ["paper", "printing_side", "size", "other"]);

// ขอบเขตการคูณราคาเพิ่ม — ใช้ทั้งกับ OptionValue.extraPrice และ AdditionalService.scope
export const priceScopeEnum = pgEnum("price_scope", ["per_item", "per_page", "per_piece", "per_sqm"]);

// วิธีนับหน้าเมื่อ pricingModel = per_page: by_file_page = นับหน้าไฟล์ตรงๆ, by_sheet = ปัดขึ้นครึ่งหนึ่ง (พิมพ์สองหน้า)
export const pageCountingModeEnum = pgEnum("page_counting_mode", ["by_file_page", "by_sheet"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // เก็บด้วย Argon2 เท่านั้น
  role: userRoleEnum("role").notNull(),
  firstname: text("firstname").notNull(),
  lastname: text("lastname").notNull(),
  phone: text("phone").notNull(),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  tokenHash: text("token_hash").notNull().unique(), // เก็บ hash ของ token เท่านั้น ไม่เก็บ token ดิบ
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  // "บริการของร้าน" เลือกได้หลายรายการตอนสมัคร (เดิมเป็น dropdown ประเภทร้านค้าเลือกได้ทีละ 1 — เลิกใช้แล้ว)
  // ดูค่าที่รองรับที่ shopServiceTypeSchema ใน packages/shared
  serviceTypes: text("service_types").array(),
  // "วิธีรับสินค้า" ตอนสมัคร (รับหน้าร้าน / จัดส่งโดยร้าน) — คนละความหมายกับ deliveryEnabled ด้านล่าง
  // (deliveryEnabled คือสวิตช์เปิด/ปิดระบบจัดส่งทั้งร้านทีหลังในหน้า /shop/services)
  deliveryMethods: text("delivery_methods").array(),
  googleMapLink: text("google_map_link"), // ไม่บังคับตอนสมัคร ใส่ทีหลังได้
  idCardUrl: text("id_card_url"), // storage path จาก bucket private "id-cards" (ไม่ใช่ public URL)
  shopPhotoUrl: text("shop_photo_url"), // public URL จาก bucket "shop-photos"
  socialMedia: text("social_media"),
  openingHours: jsonb("opening_hours"), // [{ day, isOpen, openTime, closeTime }, ...] ตามฟอร์ม shop-register
  approvalStatus: shopApprovalStatusEnum("approval_status").notNull().default("pending"),
  rejectedReason: text("rejected_reason"), // ใส่ตอนแอดมินกด "ไม่อนุมัติ" — null ถ้ายังไม่เคยถูกปฏิเสธ
  deliveryEnabled: boolean("delivery_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ราคาทุกตารางในกลุ่มบริการ/จัดส่งเก็บเป็นหน่วยบาท (numeric) ไม่ใช่สตางค์แบบ orders.total_price
// เหตุผล: ฟอร์มฝั่ง web กรอก/แสดงผลเป็นบาทตรงๆ อยู่แล้ว เลี่ยงการแปลงหน่วยไปมาโดยไม่จำเป็น
//
// ออกแบบใหม่ (2026-07): เปลี่ยนจากราคาคงที่ตาม paperSize/color hardcode (fixed/area/per_page 3 โหมดแยกตาราง)
// มาเป็นระบบทั่วไป — ร้านค้าเลือก "วิธีคิดราคาพื้นฐาน" (pricingModel) 1 แบบ + ตั้ง basePrice เดียว
// แล้วเพิ่ม "ตัวเลือกบริการ" (service_options) ได้ไม่จำกัดจำนวนเอง ไม่ hardcode ประเภทกระดาษ/สี/วัสดุอีกต่อไป
export const mainServices = pgTable("main_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  pricingModel: pricingModelEnum("pricing_model").notNull().default("fixed"),
  basePrice: numeric("base_price", { precision: 10, scale: 2 }).notNull().default("0"),
  requiresFileUpload: boolean("requires_file_upload").notNull().default(true),
  // นามสกุลไฟล์ที่ร้านรับ เช่น ["pdf","jpg","png","ai","psd"] — ใช้แค่ตอน requiresFileUpload = true
  allowedFileTypes: text("allowed_file_types").array(),
  // ใช้เฉพาะ pricingModel = per_page: by_file_page (ค่าเริ่มต้น) นับหน้าไฟล์ตรงๆ, by_sheet ปัดขึ้นครึ่งหนึ่ง (พิมพ์สองหน้า)
  pageCountingMode: pageCountingModeEnum("page_counting_mode").notNull().default("by_file_page"),
  // ใช้เฉพาะ pricingModel = per_sqm: พื้นที่ขั้นต่ำที่คิดราคา (ตร.ม.) — null = ไม่มีขั้นต่ำ
  minArea: numeric("min_area", { precision: 10, scale: 2 }),
  // ใช้เฉพาะ pricingModel = per_sqm: หน่วยปัดขึ้นของพื้นที่ (ตร.ม.) เช่น 0.1 = ปัดขึ้นทีละ 0.1 ตร.ม.
  areaRoundingIncrement: numeric("area_rounding_increment", { precision: 10, scale: 2 }).notNull().default("0.1"),
  unit: text("unit").notNull(),
  estimatedTime: text("estimated_time"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ตัวเลือกของบริการหลัก — ร้านค้าสร้างเองได้ไม่จำกัด เช่น "ประเภทกระดาษ", "สี", "วัสดุ" (ไม่ hardcode field ตายตัวอีกต่อไป)
export const serviceOptions = pgTable(
  "service_options",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    mainServiceId: uuid("main_service_id").references(() => mainServices.id, { onDelete: "cascade" }).notNull(),
    name: text("name").notNull(), // ชื่อตัวเลือกที่ลูกค้าเห็น เช่น "ประเภทกระดาษ"
    type: serviceOptionTypeEnum("type").notNull(),
    // หมวดราคา ใช้กันสร้าง Option ซ้ำซ้อนกันในหมวดเดียวกัน (ดู uniqueCategoryPerService ด้านล่าง) — default "other" ไม่ถูกจำกัด
    priceCategory: optionPriceCategoryEnum("price_category").notNull().default("other"),
    sortOrder: integer("sort_order").notNull().default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    // 1 price_category (ยกเว้น "other") มีได้แค่ 1 Option ต่อบริการ — ถ้าต้องการเพิ่มระดับราคาใหม่ในหมวดเดิม ให้เพิ่มเป็น OptionValue แทน
    uniqueCategoryPerService: uniqueIndex("service_options_category_unique")
      .on(table.mainServiceId, table.priceCategory)
      .where(sql`${table.priceCategory} != 'other'`),
  })
);

// ค่าที่ลูกค้าเลือกได้ของแต่ละตัวเลือก — ใช้กับ type dropdown/radio/checkbox เท่านั้น
// (number/text ให้ลูกค้ากรอกเองอิสระ ไม่มีราคาเพิ่มผูกกับ type นี้)
export const serviceOptionValues = pgTable("service_option_values", {
  id: uuid("id").primaryKey().defaultRandom(),
  optionId: uuid("option_id").references(() => serviceOptions.id, { onDelete: "cascade" }).notNull(),
  name: text("name").notNull(), // เช่น "A4", "กระดาษ 80 แกรม", "ขาวดำ"
  extraPrice: numeric("extra_price", { precision: 10, scale: 2 }).notNull().default("0"), // ห้ามติดลบ (บังคับที่ Zod)
  // ขอบเขตการคูณราคาเพิ่มนี้ ต้องอยู่ใน allow-list ตาม pricingModel ของบริการ (บังคับที่ API ชั้นถัดไป) — default per_item ไม่คูณอะไร
  priceScope: priceScopeEnum("price_scope").notNull().default("per_item"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const addOnServices = pgTable("addon_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  // ขอบเขตการคูณราคา คงที่ระดับ global ต่อบริการเสริมนี้เสมอ ไม่มี override รายบริการ (unit ด้านบนยังเป็นแค่ label ที่โชว์ลูกค้า)
  scope: priceScopeEnum("scope").notNull().default("per_item"),
  estimatedTime: text("estimated_time"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ระดับราคาตามสีของบริการหลัก — เป็นส่วนหนึ่งของ Base Pricing ไม่ใช่ Option
// price_per_unit เป็นราคาต่อหน่วยแบบเบ็ดเสร็จของ tier นี้ ไม่บวกกับ main_services.base_price
// "ขาวดำ" ไม่มีแถวของตัวเอง เพราะใช้ main_services.base_price เป็นราคาต่อหน่วยของมันตรงๆ (default tier)
// นี่คือจุดเดียวในระบบทั้งหมดที่กำหนดราคาต่างกันตามสี — ห้ามสร้าง Option ที่เกี่ยวกับสีอีกเด็ดขาด (ดู optionPriceCategoryEnum)
export const serviceColorTiers = pgTable("service_color_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  mainServiceId: uuid("main_service_id").references(() => mainServices.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(), // เช่น "สี", "สีพรีเมียม"
  pricePerUnit: numeric("price_per_unit", { precision: 10, scale: 2 }).notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ราคาต่อหน่วยแบบขั้นบันไดตามจำนวน ใช้กับ pricingModel = per_piece เท่านั้น — ช่วงห้ามทับกัน (ตรวจที่ API ชั้นถัดไป)
export const serviceQuantityTiers = pgTable("service_quantity_tiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  mainServiceId: uuid("main_service_id").references(() => mainServices.id, { onDelete: "cascade" }).notNull(),
  minQty: integer("min_qty").notNull(),
  maxQty: integer("max_qty"), // null = ไม่จำกัด
  unitPrice: numeric("unit_price", { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ตารางเชื่อมบริการหลัก <-> บริการเสริม พร้อมราคาบวกเพิ่มเฉพาะคู่นั้น
export const mainServiceAddOns = pgTable(
  "main_service_addons",
  {
    mainServiceId: uuid("main_service_id")
      .references(() => mainServices.id, { onDelete: "cascade" })
      .notNull(),
    addOnServiceId: uuid("addon_service_id")
      .references(() => addOnServices.id, { onDelete: "cascade" })
      .notNull(),
    extraPrice: numeric("extra_price", { precision: 10, scale: 2 }).notNull().default("0"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.mainServiceId, table.addOnServiceId] }),
  })
);

export const deliveryOptions = pgTable("delivery_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  logoUrl: text("logo_url"),
  baseFee: numeric("base_fee", { precision: 10, scale: 2 }).notNull(),
  freeShippingThreshold: numeric("free_shipping_threshold", { precision: 10, scale: 2 }),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const mainServicesRelations = relations(mainServices, ({ many }) => ({
  addOns: many(mainServiceAddOns),
  options: many(serviceOptions),
  colorTiers: many(serviceColorTiers),
  quantityTiers: many(serviceQuantityTiers),
}));

export const serviceColorTiersRelations = relations(serviceColorTiers, ({ one }) => ({
  mainService: one(mainServices, {
    fields: [serviceColorTiers.mainServiceId],
    references: [mainServices.id],
  }),
}));

export const serviceQuantityTiersRelations = relations(serviceQuantityTiers, ({ one }) => ({
  mainService: one(mainServices, {
    fields: [serviceQuantityTiers.mainServiceId],
    references: [mainServices.id],
  }),
}));

export const serviceOptionsRelations = relations(serviceOptions, ({ one, many }) => ({
  mainService: one(mainServices, {
    fields: [serviceOptions.mainServiceId],
    references: [mainServices.id],
  }),
  values: many(serviceOptionValues),
}));

export const serviceOptionValuesRelations = relations(serviceOptionValues, ({ one }) => ({
  option: one(serviceOptions, {
    fields: [serviceOptionValues.optionId],
    references: [serviceOptions.id],
  }),
}));

export const addOnServicesRelations = relations(addOnServices, ({ many }) => ({
  mainServiceBindings: many(mainServiceAddOns),
}));

export const mainServiceAddOnsRelations = relations(mainServiceAddOns, ({ one }) => ({
  mainService: one(mainServices, {
    fields: [mainServiceAddOns.mainServiceId],
    references: [mainServices.id],
  }),
  addOnService: one(addOnServices, {
    fields: [mainServiceAddOns.addOnServiceId],
    references: [addOnServices.id],
  }),
}));

// ตะกร้าสินค้าของลูกค้า — 1 ลูกค้ามีได้หลายตะกร้า แต่ "1 ตะกร้าผูกกับร้านเดียวเท่านั้น" (unique customerId+shopId)
// เช่น สั่งจากร้าน A และร้าน B พร้อมกันได้ แต่ในตะกร้าของร้าน A จะมีแต่สินค้าร้าน A เท่านั้น ไม่ปนกับร้าน B
export const carts = pgTable(
  "carts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    customerId: uuid("customer_id").references(() => users.id).notNull(),
    shopId: uuid("shop_id").references(() => shops.id).notNull(),
    deliveryOptionId: uuid("delivery_option_id").references(() => deliveryOptions.id),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => ({
    uniqueCustomerShop: unique().on(table.customerId, table.shopId),
  })
);

// รายการสินค้าในตะกร้า — "ราคา" ไม่เก็บไว้ที่นี่เด็ดขาด คำนวณสดจาก main_services/service_options/service_option_values ทุกครั้งที่อ่าน
// widthCm/heightCm ใช้ตอน pricingModel = "per_sqm" เท่านั้น (ลูกค้ากรอกเอง), pageCount ใช้ตอน pricingModel = "per_page" เท่านั้น
// ⚠️ pageCount นับจากไฟล์จริงด้วย pdf-lib ฝั่ง server เสมอตอนเพิ่ม/แก้ไข ไม่เคยรับค่าที่ client ส่งมาโดยตรง
export const cartItems = pgTable("cart_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  cartId: uuid("cart_id").references(() => carts.id, { onDelete: "cascade" }).notNull(),
  mainServiceId: uuid("main_service_id").references(() => mainServices.id).notNull(),
  // สี tier ที่ลูกค้าเลือก — null = ใช้ราคาขาวดำ (main_services.base_price) หรือบริการนี้ไม่มีตัวเลือกสี
  colorTierId: uuid("color_tier_id").references(() => serviceColorTiers.id),
  widthCm: numeric("width_cm", { precision: 10, scale: 2 }),
  heightCm: numeric("height_cm", { precision: 10, scale: 2 }),
  pageCount: integer("page_count"),
  quantity: integer("quantity").notNull().default(1),
  fileUrl: text("file_url"), // storage path จาก bucket private "order-files" — ไฟล์งานพิมพ์ของลูกค้า
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// บริการเสริมที่เลือกต่อรายการในตะกร้า — extraPrice ไม่เก็บที่นี่ อ่านสดจาก main_service_addons เสมอ
export const cartItemAddOns = pgTable(
  "cart_item_addons",
  {
    cartItemId: uuid("cart_item_id").references(() => cartItems.id, { onDelete: "cascade" }).notNull(),
    addOnServiceId: uuid("addon_service_id").references(() => addOnServices.id).notNull(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.cartItemId, table.addOnServiceId] }),
  })
);

// ค่าที่ลูกค้าเลือก/กรอกของแต่ละ service_option ต่อรายการในตะกร้า
// valueId มีค่าเมื่อ option type เป็น dropdown/radio/checkbox (อ้าง service_option_values แถวที่เลือก)
// textValue มีค่าเมื่อ option type เป็น number/text (ลูกค้ากรอกเอง ไม่มีผลต่อราคา)
export const cartItemOptionSelections = pgTable(
  "cart_item_option_selections",
  {
    cartItemId: uuid("cart_item_id").references(() => cartItems.id, { onDelete: "cascade" }).notNull(),
    optionId: uuid("option_id").references(() => serviceOptions.id, { onDelete: "cascade" }).notNull(),
    valueId: uuid("value_id").references(() => serviceOptionValues.id),
    textValue: text("text_value"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.cartItemId, table.optionId] }),
  })
);

export const cartsRelations = relations(carts, ({ many }) => ({
  items: many(cartItems),
}));

export const cartItemsRelations = relations(cartItems, ({ one, many }) => ({
  cart: one(carts, { fields: [cartItems.cartId], references: [carts.id] }),
  addOns: many(cartItemAddOns),
  optionSelections: many(cartItemOptionSelections),
}));

export const cartItemAddOnsRelations = relations(cartItemAddOns, ({ one }) => ({
  cartItem: one(cartItems, { fields: [cartItemAddOns.cartItemId], references: [cartItems.id] }),
}));

export const cartItemOptionSelectionsRelations = relations(cartItemOptionSelections, ({ one }) => ({
  cartItem: one(cartItems, { fields: [cartItemOptionSelections.cartItemId], references: [cartItems.id] }),
  option: one(serviceOptions, { fields: [cartItemOptionSelections.optionId], references: [serviceOptions.id] }),
  value: one(serviceOptionValues, { fields: [cartItemOptionSelections.valueId], references: [serviceOptionValues.id] }),
}));

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id).notNull(),
  customerId: uuid("customer_id").references(() => users.id).notNull(),
  code: text("code").notNull(), // เลขที่แสดงสั้นๆ ต่อร้าน เช่น "#0005" — รันเลขต่อร้าน (unique แค่ภายในร้านเดียวกัน ดู uniqueShopCode ด้านล่าง + generateOrderCode() ใน routes/orders.ts)
  ref: text("ref").notNull().unique(), // รหัสอ้างอิงเต็มระบบ ไม่ซ้ำกันทั้งระบบ เช่น "ORD-20260516-B0F2"
  serviceType: text("service_type").notNull(),
  pages: integer("pages").notNull(),
  copies: integer("copies").notNull().default(1),
  colorMode: text("color_mode").notNull().default("bw"),
  paperSize: text("paper_size").notNull().default("A4"),
  binding: boolean("binding").notNull().default(false),
  lamination: boolean("lamination").notNull().default(false),
  selectedAddOns: text("selected_add_ons").array(), // ชื่อบริการเสริมที่ลูกค้าเลือกตอนสั่ง (denormalized ไว้แสดงผล ไม่ผูก FK เพราะราคา ณ ตอนสั่งอาจต่างจากราคาปัจจุบันของร้าน)
  fileUrl: text("file_url"), // nullable เพราะออเดอร์ที่มาจากตะกร้า (POST /shops/:shopId/cart/checkout) อาจมีได้หลายไฟล์/ไม่มีไฟล์เลยก็ได้ (ดู cartSnapshot แทน)
  cartSnapshot: jsonb("cart_snapshot"), // snapshot รายการสินค้าเต็มๆ ตอน checkout จากตะกร้า (ชื่อ/จำนวน/ตัวเลือก/ราคาต่อรายการ) — null ถ้าสร้างผ่าน POST /orders แบบเดิม (1 ออเดอร์ = 1 รายการ)
  totalPrice: integer("total_price").notNull(), // เก็บเป็นสตางค์ กันปัญหา floating point
  status: orderStatusEnum("status").notNull().default("pending_review"),
  note: text("note"),
  deliveryMethod: deliveryMethodEnum("delivery_method").notNull().default("self_pickup"),
  deliveryAddress: text("delivery_address"), // ใช้เมื่อ deliveryMethod = shop_delivery เท่านั้น
  slipUrl: text("slip_url").notNull(), // storage path จาก bucket private "payment-slips" — ลูกค้าต้องแนบสลิปมาพร้อมตอนสั่งเสมอ (จ่ายเงินก่อนร้านเริ่มงาน)
  slipUploadedAt: timestamp("slip_uploaded_at"),
  cancelReason: cancelReasonEnum("cancel_reason"), // ใส่ตอนสถานะเป็น cancelled เท่านั้น (รวมถึงกรณีปฏิเสธการชำระเงิน)
  cancelNote: text("cancel_note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // code ไม่ซ้ำแค่ภายในร้านเดียวกัน (คนละร้านมี #0001 ซ้ำกันได้ตามปกติ)
  uniqueShopCode: unique().on(table.shopId, table.code),
}));
