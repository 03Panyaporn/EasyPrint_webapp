import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { join } from "path";

config({ path: join(process.cwd(), "../../.env") });

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  // จำกัด introspect เฉพาะ schema "public" (ตารางของเราเอง) — ไม่งั้น drizzle-kit จะไล่สแกน schema ภายในของ Supabase
  // (auth, storage, realtime, vault ฯลฯ) ไปด้วย ทำให้ "Pulling schema from database..." ช้ามาก/ค้างได้
  schemaFilter: ["public"],
});
