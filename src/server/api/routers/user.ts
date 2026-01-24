import { z } from "zod";
import { eq, ilike, and, count } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { users, followers } from "~/server/db/schema";

export const userRouter = createTRPCRouter({
    getProfile: publicProcedure
        .input(z.object({ username: z.string() }))
        .query(async ({ ctx, input }) => {
            const user = await ctx.db
                .select()
                .from(users)
                .where(ilike(users.username, input.username))
                .limit(1)
                .then((rows) => rows[0]);

            if (!user) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "User not found",
                });
            }

            return user;
        }),

    updateBio: protectedProcedure
        .input(z.object({ bio: z.string().max(500) }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(users)
                .set({
                    bio: input.bio,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, ctx.auth.userId));

            return { success: true };
        }),

    updateBanner: protectedProcedure
        .input(z.object({ bannerImage: (z as typeof z & { url: () => z.ZodString }).url() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .update(users)
                .set({
                    bannerImage: input.bannerImage,
                    updatedAt: new Date(),
                })
                .where(eq(users.id, ctx.auth.userId));

            return { success: true };
        }),

    getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
        const user = await ctx.db
            .select()
            .from(users)
            .where(eq(users.id, ctx.auth.userId))
            .limit(1)
            .then((rows) => rows[0]);

        return user ?? null;
    }),

    follow: protectedProcedure
        .input(z.object({ targetUserId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            if (input.targetUserId === ctx.auth.userId) {
                throw new TRPCError({
                    code: "BAD_REQUEST",
                    message: "You cannot follow yourself",
                });
            }

            await ctx.db.insert(followers).values({
                followerId: ctx.auth.userId,
                followingId: input.targetUserId,
            }).onConflictDoNothing();

            return { success: true };
        }),

    unfollow: protectedProcedure
        .input(z.object({ targetUserId: z.string() }))
        .mutation(async ({ ctx, input }) => {
            await ctx.db
                .delete(followers)
                .where(and(
                    eq(followers.followerId, ctx.auth.userId),
                    eq(followers.followingId, input.targetUserId)
                ));

            return { success: true };
        }),

    isFollowing: protectedProcedure
        .input(z.object({ targetUserId: z.string() }))
        .query(async ({ ctx, input }) => {
            const [follow] = await ctx.db
                .select()
                .from(followers)
                .where(and(
                    eq(followers.followerId, ctx.auth.userId),
                    eq(followers.followingId, input.targetUserId)
                ))
                .limit(1);

            return !!follow;
        }),

    getFollowCounts: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const [followerCount] = await ctx.db
                .select({ count: count() })
                .from(followers)
                .where(eq(followers.followingId, input.userId));

            const [followingCount] = await ctx.db
                .select({ count: count() })
                .from(followers)
                .where(eq(followers.followerId, input.userId));

            return {
                followers: followerCount?.count ?? 0,
                following: followingCount?.count ?? 0,
            };
        }),

    getFollowers: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const results = await ctx.db
                .select({
                    user: {
                        id: users.id,
                        username: users.username,
                        displayName: users.displayName,
                        image: users.image,
                        profileImage: users.profileImage,
                    }
                })
                .from(followers)
                .innerJoin(users, eq(followers.followerId, users.id))
                .where(eq(followers.followingId, input.userId));

            return results.map(r => r.user);
        }),

    getFollowing: publicProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const results = await ctx.db
                .select({
                    user: {
                        id: users.id,
                        username: users.username,
                        displayName: users.displayName,
                        image: users.image,
                        profileImage: users.profileImage,
                    }
                })
                .from(followers)
                .innerJoin(users, eq(followers.followingId, users.id))
                .where(eq(followers.followerId, input.userId));

            return results.map(r => r.user);
        }),
});
