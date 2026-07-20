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
});
