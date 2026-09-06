import { Elysia } from "elysia";
import { and, eq, ne } from "drizzle-orm";
import { addressInputSchema, addressUpdateSchema } from "@easyprint/shared";

import { db } from "../db";
import { addresses } from "../../drizzle/schema";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../auth/jwt";
import { isValidUUID } from "../utils/validation";


function getUserId(cookie: any) {

    const token = cookie[AUTH_COOKIE_NAME]?.value;

    if (!token) {
        return null;
    }

    const payload = verifyAuthToken(token);

    if (!payload) {
        return null;
    }

    return payload.userId;
}



export const addressRoutes = new Elysia({
    prefix: "/addresses",
})


    .get("/", async ({ cookie, set }) => {

        const userId = getUserId(cookie);


        if (!userId) {
            set.status = 401;

            return {
                error: "ไม่ได้เข้าสู่ระบบ"
            };
        }


        const data = await db
            .select()
            .from(addresses)
            .where(
                eq(addresses.userId, userId)
            );


        return {
            addresses: data
        };

    })



    .post("/", async ({ body, cookie, set }) => {


        const userId = getUserId(cookie);


        if (!userId) {

            set.status = 401;

            return {
                error: "ไม่ได้เข้าสู่ระบบ"
            };
        }


        const parsed = addressInputSchema.safeParse(body);
        if (!parsed.success) {
            set.status = 400;
            return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
        }
        const data = parsed.data;


        const [address] = await db
            .insert(addresses)
            .values({

                userId,

                receiverName: data.receiverName,
                phone: data.phone,

                address: data.address,

                subdistrict: data.subdistrict,
                district: data.district,
                province: data.province,
                postalCode: data.postalCode,

                label: data.label ?? "บ้าน",

                isDefault: data.isDefault ?? false,

            })
            .returning();



        return {
            address
        };


    })



    .put("/:id", async ({ params, body, cookie, set }) => {


        const userId = getUserId(cookie);


        if (!userId) {

            set.status = 401;

            return {
                error: "ไม่ได้เข้าสู่ระบบ"
            };
        }

        if (!isValidUUID(params.id)) {
            set.status = 400;
            return { error: "รูปแบบ id ไม่ถูกต้อง" };
        }

        const parsed = addressUpdateSchema.safeParse(body);
        if (!parsed.success) {
            set.status = 400;
            return { error: "ข้อมูลไม่ถูกต้อง", details: parsed.error.flatten() };
        }
        // ห้ามให้ client กำหนด userId/id เอง (mass assignment) — set เฉพาะฟิลด์ที่ผ่าน schema ข้างบนเท่านั้น
        const data = parsed.data;
        const updateValues = {
            ...(data.receiverName !== undefined ? { receiverName: data.receiverName } : {}),
            ...(data.phone !== undefined ? { phone: data.phone } : {}),
            ...(data.address !== undefined ? { address: data.address } : {}),
            ...(data.subdistrict !== undefined ? { subdistrict: data.subdistrict } : {}),
            ...(data.district !== undefined ? { district: data.district } : {}),
            ...(data.province !== undefined ? { province: data.province } : {}),
            ...(data.postalCode !== undefined ? { postalCode: data.postalCode } : {}),
            ...(data.label !== undefined ? { label: data.label } : {}),
            ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        };

        if (Object.keys(updateValues).length === 0) {
            set.status = 400;
            return { error: "ไม่มีข้อมูลที่จะแก้ไข" };
        }

        const [address] = await db
            .update(addresses)
            .set(updateValues)
            .where(
                and(
                    eq(addresses.id, params.id),
                    eq(addresses.userId, userId)
                )
            )
            .returning();

        if (!address) {
            set.status = 404;
            return { error: "ไม่พบที่อยู่นี้" };
        }

        return {
            address
        };


    })



    .delete("/:id", async ({ params, cookie, set }) => {


        const userId = getUserId(cookie);



        if (!userId) {

            set.status = 401;

            return {
                error: "ไม่ได้เข้าสู่ระบบ"
            };

        }

        if (!isValidUUID(params.id)) {
            set.status = 400;
            return { error: "รูปแบบ id ไม่ถูกต้อง" };
        }

        // ต้อง .returning() แล้วเช็คว่ามี row ถูกลบจริงไหม — เดิมไม่เช็คเลย ทำให้ยิง id ของคนอื่น
        // (ไม่ match WHERE เพราะ userId ไม่ตรง จึงไม่มี row ถูกลบจริง) แต่ยังได้ 200 {ok:true} กลับไปเหมือนสำเร็จ
        // เข้าใจผิดว่าลบสำเร็จทั้งที่ไม่ใช่เจ้าของ (ยืนยันบั๊กจริงจาก QA Phase 02 — BUG-02-01)
        const [deleted] = await db
            .delete(addresses)
            .where(
                and(
                    eq(addresses.id, params.id),
                    eq(addresses.userId, userId)
                )
            )
            .returning();

        if (!deleted) {
            set.status = 404;
            return { error: "ไม่พบที่อยู่นี้" };
        }

        return {
            ok: true
        };


    })



    .patch("/:id/default", async ({ params, cookie, set }) => {


        const userId = getUserId(cookie);



        if (!userId) {

            set.status = 401;

            return {
                error: "ไม่ได้เข้าสู่ระบบ"
            };
        }

        if (!isValidUUID(params.id)) {
            set.status = 400;
            return { error: "รูปแบบ id ไม่ถูกต้อง" };
        }

        // เช็ค+ตั้ง default ให้ address เป้าหมายก่อน (ต้องเป็นของ userId เท่านั้น) ด้วย .returning()
        // ถ้าไม่ใช่เจ้าของ/ไม่พบ ให้ 404 ทันที ไม่ไปแตะ address อื่นของ user เลย (เดิมโค้ดจะไปปิด default
        // ของ address อื่นๆ ของ user ไปก่อนโดยไม่เช็คว่า target ที่ระบุมามีอยู่จริง/เป็นของตัวเองไหม —
        // ยืนยันบั๊กจริงจาก QA Phase 02 — BUG-02-01: คนอื่นยิง id ที่ไม่ใช่ของตัวเองได้ 200 {ok:true} ปลอม)
        const [target] = await db
            .update(addresses)
            .set({ isDefault: true })
            .where(
                and(
                    eq(addresses.id, params.id),
                    eq(addresses.userId, userId)
                )
            )
            .returning();

        if (!target) {
            set.status = 404;
            return { error: "ไม่พบที่อยู่นี้" };
        }

        // ยืนยันว่า target เป็นของ user จริงแล้ว ค่อยปิด default ของที่อยู่อื่นๆ (ไม่รวม target) ของ user คนนี้
        await db
            .update(addresses)
            .set({ isDefault: false })
            .where(
                and(
                    eq(addresses.userId, userId),
                    ne(addresses.id, params.id)
                )
            );

        return {
            ok: true
        };

    });