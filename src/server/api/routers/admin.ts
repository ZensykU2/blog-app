import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
    users,
    posts,
    comments,
    accounts,
    sessions,
    verificationTokens,
} from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
    if (ctx.session.user.role !== "admin") {
        throw new TRPCError({
            code: "FORBIDDEN",
            message: "Admin access required",
        });
    }
    return next();
});

export const adminRouter = createTRPCRouter({
    // Get all users
    getUsers: adminProcedure.query(async ({ ctx }) => {
        return ctx.db
            .select({
                id: users.id,
                email: users.email,
                username: users.username,
                displayName: users.displayName,
                role: users.role,
                createdAt: users.createdAt,
            })
            .from(users)
            .orderBy(users.createdAt);
    }),

    // Delete user and all their content + OAuth data
    deleteUser: adminProcedure
        .input(z.object({ userId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (input.userId === ctx.session.user.id) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot delete yourself",
                });
            }

            try {
                // Delete user's comments
                await ctx.db
                    .delete(comments)
                    .where(eq(comments.authorId, input.userId));

                // Delete user's posts
                await ctx.db
                    .delete(posts)
                    .where(eq(posts.authorId, input.userId));

                // Delete user's OAuth accounts
                await ctx.db
                    .delete(accounts)
                    .where(eq(accounts.userId, input.userId));

                // Delete user's sessions
                await ctx.db
                    .delete(sessions)
                    .where(eq(sessions.userId, input.userId));

                // Delete user's verification tokens (if any)
                await ctx.db
                    .delete(verificationTokens)
                    .where(eq(verificationTokens.identifier, input.userId));

                // Finally delete user
                await ctx.db.delete(users).where(eq(users.id, input.userId));

                return { success: true };
            } catch (error) {
                console.error("Admin user deletion error:", error);
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: "Failed to delete user and related data",
                });
            }
        }),

    // Update user role
    updateUserRole: adminProcedure
        .input(
            z.object({
                userId: z.string(),
                role: z.enum(["admin", "author", "user"]),
            })
        )
        .mutation(async ({ ctx, input }) => {
            if (input.userId === ctx.session.user.id) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "Cannot change your own role",
                });
            }

            await ctx.db
                .update(users)
                .set({ role: input.role })
                .where(eq(users.id, input.userId));

            return { success: true };
        }),

    // Delete any post (and its comments)
    deletePost: adminProcedure
        .input(z.object({ postId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(comments).where(eq(comments.postId, input.postId));
            await ctx.db.delete(posts).where(eq(posts.id, input.postId));
            return { success: true };
        }),

    // Delete any comment
    deleteComment: adminProcedure
        .input(z.object({ commentId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db.delete(comments).where(eq(comments.id, input.commentId));
            return { success: true };
        }),

    // Get site stats
    getStats: adminProcedure.query(async ({ ctx }) => {
        const [userCount] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(users);

        const [postCount] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(posts);

        const [commentCount] = await ctx.db
            .select({ count: sql<number>`count(*)` })
            .from(comments);

        return {
            users: userCount?.count ?? 0,
            posts: postCount?.count ?? 0,
            comments: commentCount?.count ?? 0,
        };
    }),
});