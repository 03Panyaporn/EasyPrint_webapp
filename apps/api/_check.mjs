import postgres from "postgres";
import dotenv from "dotenv";
dotenv.config({ path: "../../.env" });
const sql = postgres(process.env.DATABASE_URL);
const shopId = "da618c22-3f90-4402-a474-8bb0821fe557";

const orders = await sql`select id, code, ref from orders where shop_id = ${shopId}`;
console.log("ORDERS:", orders);

const services = await sql`select id from main_services where shop_id = ${shopId}`;
const serviceIds = services.map(s => s.id);
if (serviceIds.length) {
  const cartItems = await sql`select id from cart_items where main_service_id = any(${serviceIds})`;
  console.log("CART_ITEMS referencing these services:", cartItems.length);
}

const deliveryOptions = await sql`select id, name from delivery_options where shop_id = ${shopId}`;
console.log("DELIVERY_OPTIONS:", deliveryOptions);

const owner = await sql`select id, email, role from users where id = 'ed6bcd00-8073-498d-bb83-dd2465d82180'`;
console.log("OWNER:", owner);
const ownerShopCount = await sql`select count(*) from shops where owner_id = 'ed6bcd00-8073-498d-bb83-dd2465d82180'`;
console.log("Shops owned by this user:", ownerShopCount);

await sql.end();
