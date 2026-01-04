import { z } from "zod";
import { eq, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";

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
});
