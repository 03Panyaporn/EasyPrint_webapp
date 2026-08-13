import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`ALTER TABLE shops ADD COLUMN bank_account_name text, ADD COLUMN bank_name text, ADD COLUMN bank_account_number text, ADD COLUMN promptpay_qr_url text, ADD COLUMN notification_settings jsonb;`);
  console.log("Columns added");
  process.exit(0);
}
main();
