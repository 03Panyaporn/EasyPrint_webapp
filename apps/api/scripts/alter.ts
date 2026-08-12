import { db } from "../src/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`ALTER TABLE shops ADD COLUMN description text;`);
  console.log("Column added");
  process.exit(0);
}
main();
