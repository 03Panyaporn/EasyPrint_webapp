import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum } from "drizzle-orm/pg-core";

// โครงสร้างเริ่มต้น อ้างอิงจาก docs/proposal.md หัวข้อ 1.3
// แก้/เพิ่มตารางได้ตามที่ทีมออกแบบ ERD จริงใน docs/erd.md

export const userRoleEnum = pgEnum("user_role", ["shop_owner", "customer", "admin"]);
export const orderStatusEnum = pgEnum("order_status", [
  "pending_payment",
  "in_progress",
  "completed",
  "cancelled",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(), // เก็บด้วย Argon2 เท่านั้น
  role: userRoleEnum("role").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const shops = pgTable("shops", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  phone: text("phone"),
  address: text("address"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

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
