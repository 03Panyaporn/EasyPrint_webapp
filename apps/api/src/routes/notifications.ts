import { Elysia, t } from "elysia";
import { db } from "../db";
import { notifications } from "../../drizzle/schema";
import { eq, desc, and } from "drizzle-orm";
import { verifyAuthToken, AUTH_COOKIE_NAME } from "../auth/jwt";

// Helper to extract auth
async function requireAuth(
  cookie: Record<string, { value?: unknown } | undefined>,
  set: { status?: unknown }
) {
  const token = cookie[AUTH_COOKIE_NAME]?.value as string | undefined;
  const payload = token ? verifyAuthToken(token) : null;
  if (!payload) {
    set.status = 401;
    return { error: "Unauthorized" };
  }
  return { user: payload };
}

export const notificationsRoutes = new Elysia()
  .group("/notifications", (app) =>
    app
      .get(
        "/",
        async ({ cookie, set }) => {
          const auth = await requireAuth(cookie, set);
          if ('error' in auth) return auth;

          const items = await db
            .select()
            .from(notifications)
            .where(eq(notifications.userId, auth.user.userId))
            .orderBy(desc(notifications.createdAt));

          return { notifications: items };
        },
        {
          detail: { summary: "Get user notifications" },
        }
      )
      .put(
        "/read-all",
        async ({ cookie, set }) => {
          const auth = await requireAuth(cookie, set);
          if ('error' in auth) return auth;

          await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.userId, auth.user.userId), eq(notifications.isRead, false)));

          return { success: true };
        },
        {
          detail: { summary: "Mark all notifications as read" },
        }
      )
      .put(
        "/:id/read",
        async ({ params, cookie, set }) => {
          const auth = await requireAuth(cookie, set);
          if ('error' in auth) return auth;

          const [notification] = await db
            .update(notifications)
            .set({ isRead: true })
            .where(and(eq(notifications.id, params.id), eq(notifications.userId, auth.user.userId)))
            .returning();

          if (!notification) {
            set.status = 404;
            return { error: "Notification not found" };
          }

          return { success: true, notification };
        },
        {
          params: t.Object({
            id: t.String(),
          }),
          detail: { summary: "Mark a single notification as read" },
        }
      )
  );
