import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, numeric, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// โครงสร้างเริ่มต้น อ้างอิงจาก docs/proposal.md หัวข้อ 1.3
// แก้/เพิ่มตารางได้ตามที่ทีมออกแบบ ERD จริงใน docs/erd.md

export const userRoleEnum = pgEnum("user_role", ["shop_owner", "customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "in_progress",
  "completed",
  "cancelled",
]);
// ร้านที่สมัครใหม่เริ่มที่ pending เสมอ — รอแอดมินอนุมัติก่อนถึงจะเปิดขายจริงได้ (ตาม flow "อนุมัติร้านค้า")
export const shopApprovalStatusEnum = pgEnum("shop_approval_status", [
  "pending",
  "approved",
  "rejected",
]);

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
  category: text("category"), // ประเภทร้านค้า เช่น "ร้านถ่ายเอกสารทั่วไป" — ดูค่าที่รองรับที่ shopTypeSchema ใน packages/shared
  googleMapLink: text("google_map_link"), // ไม่บังคับตอนสมัคร ใส่ทีหลังได้
  idCardUrl: text("id_card_url"), // ยังไม่มีระบบอัปโหลดจริง (รอ Supabase Storage) เก็บเป็น URL เฉยๆ ไปก่อน
  shopPhotoUrl: text("shop_photo_url"),
  approvalStatus: shopApprovalStatusEnum("approval_status").notNull().default("pending"),
  deliveryEnabled: boolean("delivery_enabled").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ราคาทุกตารางในกลุ่มบริการ/จัดส่งเก็บเป็นหน่วยบาท (numeric) ไม่ใช่สตางค์แบบ orders.total_price
// เหตุผล: ฟอร์มฝั่ง web กรอก/แสดงผลเป็นบาทตรงๆ อยู่แล้ว เลี่ยงการแปลงหน่วยไปมาโดยไม่จำเป็น
export const mainServices = pgTable("main_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  paperSizes: text("paper_sizes").array().notNull(),
  customPaperSize: text("custom_paper_size"),
  colors: text("colors").array().notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  estimatedTime: text("estimated_time"),
  imageUrl: text("image_url"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const addOnServices = pgTable("addon_services", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id).notNull(),
  name: text("name").notNull(),
  description: text("description"),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  unit: text("unit").notNull(),
  estimatedTime: text("estimated_time"),
  isActive: boolean("is_active").notNull().default(true),
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

export const orders = pgTable("orders", {
  id: uuid("id").primaryKey().defaultRandom(),
  shopId: uuid("shop_id").references(() => shops.id).notNull(),
  customerId: uuid("customer_id").references(() => users.id).notNull(),
  serviceType: text("service_type").notNull(),
  pages: integer("pages").notNull(),
  copies: integer("copies").notNull().default(1),
  colorMode: text("color_mode").notNull().default("bw"),
  paperSize: text("paper_size").notNull().default("A4"),
  binding: boolean("binding").notNull().default(false),
  lamination: boolean("lamination").notNull().default(false),
  fileUrl: text("file_url").notNull(),
  totalPrice: integer("total_price").notNull(), // เก็บเป็นสตางค์ กันปัญหา floating point
  status: orderStatusEnum("status").notNull().default("pending_payment"),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
