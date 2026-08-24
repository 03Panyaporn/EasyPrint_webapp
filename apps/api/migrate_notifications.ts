import { db } from "./src/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "notifications" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE cascade,
      "type_id" integer NOT NULL,
      "title" text NOT NULL,
      "message" text NOT NULL,
      "category" text NOT NULL,
      "is_read" boolean NOT NULL DEFAULT false,
      "link" text,
      "created_at" timestamp NOT NULL DEFAULT now()
    );
  `);
  console.log("Notifications table created successfully!");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
