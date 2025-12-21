import { z } from "zod";
import { eq, ilike } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import { getClerkUser } from "~/lib/clerk-user";

import { clerkClient } from "@clerk/nextjs/server";

export const userRouter = createTRPCRouter({
    getProfile: publicProcedure
        .input(z.object({ username: z.string() }))
        .query(async ({ ctx, input }) => {
            let user = await ctx.db
                .select()
                .from(users)
                .where(ilike(users.username, input.username))
                .limit(1)
                .then((rows) => rows[0]);

            if (!user) {
                // Fallback: Attempt to fetch from Clerk directly if not in our DB
                try {
                    const client = await clerkClient();
                    const clerkUsers = await client.users.getUserList({
                        username: [input.username],
                    });
                    const clerkUser = clerkUsers.data[0];

                    if (clerkUser) {
                        // Sync user to our database
                        const [newUser] = await ctx.db.insert(users).values({
                            id: clerkUser.id,
                            clerkId: clerkUser.id,
                            email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
                            username: clerkUser.username ?? `user_${clerkUser.id.slice(0, 8)}`,
                            displayName: clerkUser.firstName && clerkUser.lastName
                                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                                : clerkUser.firstName ?? clerkUser.username ?? "User",
                            profileImage: clerkUser.imageUrl ?? null,
                            role: "user",
                            isVerified: false,
                            emailVerified: new Date(),
                            createdAt: new Date(),
                            updatedAt: new Date(),
                        }).onConflictDoUpdate({
                            target: users.clerkId,
                            set: {
                                username: clerkUser.username ?? `user_${clerkUser.id.slice(0, 8)}`,
                                displayName: clerkUser.firstName && clerkUser.lastName
                                    ? `${clerkUser.firstName} ${clerkUser.lastName}`
                                    : clerkUser.firstName ?? clerkUser.username ?? "User",
                                profileImage: clerkUser.imageUrl ?? null,
                                updatedAt: new Date(),
                            }
                        }).returning();

                        user = newUser;
                    }
                } catch (error) {
                    console.error("Failed to sync user from Clerk in getProfile:", error);
                }
            }

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
                .where(eq(users.clerkId, ctx.auth.userId));

            return { success: true };
        }),

    getCurrentUser: protectedProcedure.query(async ({ ctx }) => {
        let user = await ctx.db
            .select()
            .from(users)
            .where(eq(users.clerkId, ctx.auth.userId))
            .limit(1)
            .then((rows) => rows[0]);

        if (!user) {
            // Fallback: Sync from Clerk if not in our DB
            try {
                const client = await clerkClient();
                const clerkUser = await client.users.getUser(ctx.auth.userId);

                if (clerkUser) {
                    const [newUser] = await ctx.db.insert(users).values({
                        id: clerkUser.id,
                        clerkId: clerkUser.id,
                        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
                        username: clerkUser.username ?? `user_${clerkUser.id.slice(0, 8)}`,
                        displayName: clerkUser.firstName && clerkUser.lastName
                            ? `${clerkUser.firstName} ${clerkUser.lastName}`
                            : clerkUser.firstName ?? clerkUser.username ?? "User",
                        profileImage: clerkUser.imageUrl ?? null,
                        role: "user",
                        isVerified: false,
                        emailVerified: new Date(),
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    }).onConflictDoUpdate({
                        target: users.clerkId,
                        set: {
                            username: clerkUser.username ?? `user_${clerkUser.id.slice(0, 8)}`,
                            displayName: clerkUser.firstName && clerkUser.lastName
                                ? `${clerkUser.firstName} ${clerkUser.lastName}`
                                : clerkUser.firstName ?? clerkUser.username ?? "User",
                            profileImage: clerkUser.imageUrl ?? null,
                            updatedAt: new Date(),
                        }
                    }).returning();

                    user = newUser;
                }
            } catch (error) {
                console.error("Failed to sync current user from Clerk:", error);
            }
        }

        return user ?? null;
    }),
});
