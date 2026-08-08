import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
const sql = postgres(process.env.DATABASE_URL);
const shopId = "da618c22-3f90-4402-a474-8bb0821fe557";

const carts = await sql`select id from carts where shop_id = ${shopId}`;
console.log("CARTS for this shop:", carts.length);

const addonIds = (await sql`select id from addon_services where shop_id = ${shopId}`).map(r => r.id);
if (addonIds.length) {
  const cartAddons = await sql`select cart_item_id from cart_item_addons where addon_service_id = any(${addonIds})`;
  console.log("CART_ITEM_ADDONS referencing this shop's addons:", cartAddons.length);
}

await sql.end();
