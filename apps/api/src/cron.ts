import { Elysia } from "elysia";
import { cron } from "@elysiajs/cron";
import { db } from "./db";
import { shops, orders, mainServices, deliveryOptions } from "../drizzle/schema";
import { eq, and, ne } from "drizzle-orm";
import { createNotification } from "./utils/notification";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(isBetween);
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
// Set timezone if needed, default to local

export const cronRoutes = new Elysia()
  .use(
    cron({
      name: "daily-reminders",
      pattern: "0 0 * * *", // รันทุกเที่ยงคืน
      async run() {
        console.log("[CRON] Running daily reminders...");
        const allShops = await db.select().from(shops).where(eq(shops.approvalStatus, "approved"));
        
        for (const shop of allShops) {
          if (!shop.promptpayNumber && !shop.bankAccountNumber) {
            await createNotification({
              userId: shop.ownerId,
              typeId: 11,
      category: "general",
              title: "ตั้งค่าช่องทางชำระเงิน",
              message: "อย่าลืมตั้งค่าช่องทางชำระเงินของคุณ เพื่อให้ลูกค้าสามารถชำระค่าบริการได้",
              link: "/shop/settings/payment",
            });
          }
          
          if (!shop.phone || !shop.address) {
            await createNotification({
              userId: shop.ownerId,
              typeId: 8,
      category: "general",
              title: "ตั้งค่าโปรไฟล์ร้านค้าไม่สมบูรณ์",
              message: "กรุณากรอกข้อมูลโปรไฟล์ร้านค้าให้ครบถ้วน เช่น ที่อยู่ และเบอร์โทรศัพท์",
              link: "/shop/settings",
            });
          }

          if (!shop.openingHours || (Array.isArray(shop.openingHours) && shop.openingHours.length === 0)) {
            await createNotification({
              userId: shop.ownerId,
              typeId: 8,
      category: "general",
              title: "เตือนตั้งค่าเวลาทำการ",
              message: "คุณยังไม่ได้กำหนดเวลาเปิด-ปิดร้าน ลูกค้าจะไม่สามารถเช็คเวลาให้บริการได้",
              link: "/shop/settings",
            });
          }

          const shopServices = await db.select().from(mainServices).where(eq(mainServices.shopId, shop.id));
          if (shopServices.length === 0) {
            await createNotification({
              userId: shop.ownerId,
              typeId: 9,
      category: "general", // 9 = เตือนร้านค้าเปิดรับออเดอร์/ตั้งค่าบริการ
              title: "เตือนตั้งค่าบริการและราคา",
              message: "คุณยังไม่ได้เพิ่มบริการถ่ายเอกสารหรือปริ้นงาน ลูกค้าจะไม่สามารถสั่งงานได้",
              link: "/shop/services",
            });
          }

          if (shop.deliveryEnabled) {
            const shopDelivery = await db.select().from(deliveryOptions).where(eq(deliveryOptions.shopId, shop.id));
            if (shopDelivery.length === 0) {
              await createNotification({
                userId: shop.ownerId,
                typeId: 12,
      category: "general", // ใช้ 12 เป็นแจ้งเตือนการตั้งค่าทั่วไป
                title: "เตือนตั้งค่าการจัดส่ง",
                message: "คุณเปิดรับการจัดส่งไว้ แต่ยังไม่ได้เพิ่มตัวเลือกหรือราคาค่าจัดส่ง",
                link: "/shop/services", // หรือ /shop/settings/delivery แล้วแต่ route ที่มี
              });
            }
          }
        }
      }
    })
  )
  .use(
    cron({
      name: "minutely-checks",
      pattern: "* * * * *", // รันทุกๆ นาที
      async run() {
        // ใช้เวลาปัจจุบัน (สมมติว่าเป็นเวลาท้องถิ่น)
        const now = dayjs().tz("Asia/Bangkok");
        const currentDayStr = now.format("dddd"); // e.g. "Monday"
        // ⚠️ opening_hours.day ในฐานข้อมูลจริงเก็บเป็นภาษาไทย "ไม่มี" คำว่า "วัน" นำหน้า (เช่น "จันทร์" ไม่ใช่ "วันจันทร์")
        // หรือบาง record เก็บเป็น id ภาษาอังกฤษ ("mon","tue",...) แล้วแต่ว่าร้านสมัครช่วงไหน — ต้องรองรับทั้งสองแบบ
        // ไม่งั้น find() ด้านล่างจะไม่ match กับข้อมูลจริงเลยสักร้าน (ดู apps/web/lib/shopHours.ts::THAI_DAY_BY_JS_INDEX ที่ใช้รูปแบบเดียวกันนี้)
        const currentDayMap: Record<string, string> = {
          "Monday": "จันทร์", "Tuesday": "อังคาร", "Wednesday": "พุธ",
          "Thursday": "พฤหัสบดี", "Friday": "ศุกร์", "Saturday": "เสาร์", "Sunday": "อาทิตย์"
        };
        const dayIdMap: Record<string, string> = {
          "Monday": "mon", "Tuesday": "tue", "Wednesday": "wed",
          "Thursday": "thu", "Friday": "fri", "Saturday": "sat", "Sunday": "sun"
        };
        const currentDayTh = currentDayMap[currentDayStr];
        const currentDayId = dayIdMap[currentDayStr];
        const currentTimeStr = now.format("HH:mm");

        const allShops = await db.select().from(shops).where(eq(shops.approvalStatus, "approved"));

        for (const shop of allShops) {
          // 1. ตรวจสอบพักร้อน (Vacation Mode)
          if (shop.tempCloseEnd) {
            const tempCloseEnd = dayjs(shop.tempCloseEnd).tz("Asia/Bangkok");
            // ถ้านาทีปัจจุบันตรงกับเวลาหมดพักร้อนพอดี (หรือเพิ่งเลยมา 1 นาที)
            if (now.isSame(tempCloseEnd, "minute")) {
              await createNotification({
                userId: shop.ownerId,
                typeId: 13,
      category: "general", // สิ้นสุดช่วงปิดชั่วคราว
                title: "สิ้นสุดช่วงปิดร้านชั่วคราวแล้ว",
                message: "ร้านของคุณกลับมาเปิดรับงานตามปกติแล้ว",
                link: "/shop/settings",
              });
            }
          }

          // 2. ตรวจสอบเวลาเปิด-ปิดร้านประจำวัน
          if (shop.openingHours && Array.isArray(shop.openingHours)) {
            const todayHours = shop.openingHours.find((h: any) => h.day === currentDayTh || h.day === currentDayId);
            
            if (todayHours && todayHours.isOpen) {
              const { openTime, closeTime } = todayHours;
              
              // แจ้งร้านเปิด
              if (currentTimeStr === openTime) {
                await createNotification({
                  userId: shop.ownerId,
                  typeId: 14,
      category: "general", // 14 = ร้านเปิดอัตโนมัติ
                  title: "หน้าร้านเปิดแล้ว!",
                  message: "ระบบเปิดรับออเดอร์ตามเวลาทำการแล้ว ขอให้ยอดขายปังๆ ครับ",
                });
              }

              // แจ้งร้านปิด
              if (currentTimeStr === closeTime) {
                await createNotification({
                  userId: shop.ownerId,
                  typeId: 15,
      category: "general", // 15 = ร้านปิดอัตโนมัติ
                  title: "หน้าร้านปิดแล้ว",
                  message: "ระบบปิดรับออเดอร์ตามเวลาทำการแล้ว พักผ่อนให้เต็มที่ครับ",
                });
              }

              // แจ้งเตือนก่อนปิดร้าน 30 นาที (ถ้ามีงานค้าง)
              if (closeTime) {
                const closeDayjs = dayjs(`${now.format("YYYY-MM-DD")} ${closeTime}`, "YYYY-MM-DD HH:mm");
                const notifyTime = closeDayjs.subtract(30, "minute").format("HH:mm");
                
                if (currentTimeStr === notifyTime) {
                  // เช็คว่ามีออเดอร์ค้าง (สถานะไม่ใช่ completed/cancelled)
                  const pendingOrders = await db.select().from(orders).where(
                    and(
                      eq(orders.shopId, shop.id),
                      ne(orders.status, "completed"),
                      ne(orders.status, "cancelled")
                    )
                  );

                  if (pendingOrders.length > 0) {
                    await createNotification({
                      userId: shop.ownerId,
                      typeId: 7,
      category: "general", // 7 = แจ้งเตือนใกล้เวลาปิดร้าน
                      title: "ร้านใกล้ปิดแล้ว!",
                      message: `เหลือเวลา 30 นาทีก่อนร้านปิดอัตโนมัติ คุณยังมีออเดอร์ค้างอยู่ ${pendingOrders.length} รายการ`,
                      link: "/shop/orders",
                    });
                  }
                }
              }
            }
          }
        }
      }
    })
  );
