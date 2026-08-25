import { Elysia } from "elysia";
import { and, eq } from "drizzle-orm";
import { addressInputSchema, addressUpdateSchema } from "@easyprint/shared";

import { db } from "../db";
import { addresses } from "../../drizzle/schema";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "../auth/jwt";


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



        await db
            .delete(addresses)
            .where(
                and(
                    eq(addresses.id, params.id),
                    eq(addresses.userId, userId)
                )
            );



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


        // ปิด default เดิมก่อน

        await db
            .update(addresses)
            .set({
                isDefault: false
            })
            .where(
                eq(addresses.userId, userId)
            );



        await db
            .update(addresses)
            .set({
                isDefault: true
            })
            .where(
                and(
                    eq(addresses.id, params.id),
                    eq(addresses.userId, userId)
                )
            );



        return {
            ok: true
        };

    });