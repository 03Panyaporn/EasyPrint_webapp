import { Elysia } from "elysia";
import { and, eq } from "drizzle-orm";

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


        const data = body as any;


        const [address] = await db
            .insert(addresses)
            .values({

                userId,

                receiverName: data.receiverName,
                phone: data.phone,

                address: data.address,

                subdistrict: data.subdistrict ?? "",
                district: data.district ?? "",
                province: data.province ?? "",
                postalCode: data.postalCode ?? "",

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



        const [address] = await db
            .update(addresses)
            .set(body as any)
            .where(
                and(
                    eq(addresses.id, params.id),
                    eq(addresses.userId, userId)
                )
            )
            .returning();



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