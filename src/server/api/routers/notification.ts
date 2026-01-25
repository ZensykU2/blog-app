import { z } from "zod";
import { desc, eq, and, count } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { notifications, users } from "~/server/db/schema";

export const notificationRouter = createTRPCRouter({
    getMany: protectedProcedure
        .input(z.object({
            limit: z.number().min(1).max(100).default(20),
            cursor: z.number().nullish(), // offset-based pagination for simplicity here
        }))
        .query(async ({ ctx, input }) => {
            const userId = ctx.auth.userId;
            const offset = input.cursor ?? 0;

            const items = await ctx.db
                .select({
                    id: notifications.id,
                    type: notifications.type,
                    title: notifications.title,
                    message: notifications.message,
                    relatedUserId: notifications.relatedUserId,
                    relatedPostId: notifications.relatedPostId,
                    relatedCommentId: notifications.relatedCommentId,
                    isRead: notifications.isRead,
                    createdAt: notifications.createdAt,
                    actor: {
                        id: users.id,
                        username: users.username,
                        displayName: users.displayName,
                        profileImage: users.profileImage,
                        image: users.image,
                    },
                })
                .from(notifications)
                .leftJoin(users, eq(notifications.relatedUserId, users.id))
                .where(eq(notifications.userId, userId))
                .orderBy(desc(notifications.createdAt))
                .limit(input.limit)
                .offset(offset);

            return {
                items,
                nextCursor: items.length === input.limit ? offset + input.limit : undefined,
            };
        }),

    getUnreadCount: protectedProcedure
        .query(async ({ ctx }) => {
            const [result] = await ctx.db
                .select({ count: count() })
                .from(notifications)
                .where(and(
                    eq(notifications.userId, ctx.auth.userId),
                    eq(notifications.isRead, false)
                ));

            return result?.count ?? 0;
        }),

    markAsRead: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(notifications)
                .set({ isRead: true })
                .where(and(
                    eq(notifications.id, input.id),
                    eq(notifications.userId, ctx.auth.userId)
                ));

            return { success: true };
        }),

    markAllAsRead: protectedProcedure
        .mutation(async ({ ctx }) => {
            await ctx.db
                .update(notifications)
                .set({ isRead: true })
                .where(eq(notifications.userId, ctx.auth.userId));

            return { success: true };
        }),
});
