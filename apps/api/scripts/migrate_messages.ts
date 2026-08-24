import { sql } from "drizzle-orm";
import { db } from "../src/db";

async function run() {
  console.log("Migrating messages table...");
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "messages" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "order_id" uuid NOT NULL REFERENCES "orders"("id") ON DELETE cascade,
      "sender_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
      "shop_id" uuid NOT NULL REFERENCES "shops"("id") ON DELETE cascade,
      "content" text NOT NULL,
      "is_read" boolean DEFAULT false NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log("Done");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
