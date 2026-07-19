import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../drizzle/schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL ไม่ถูกตั้งค่า — เช็คไฟล์ .env (ก็อปจาก .env.example)");
}

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
