import { z } from "zod";
import { eq, and, count } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { postLikes, postBookmarks, commentLikes } from "~/server/db/schema";

export const interactionRouter = createTRPCRouter({
    togglePostLike: protectedProcedure
        .input(z.object({ postId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth.userId;

            const existing = await ctx.db
                .select()
                .from(postLikes)
                .where(
                    and(
                        eq(postLikes.postId, input.postId),
                        eq(postLikes.userId, userId)
                    )
                )
                .limit(1)
                .then(rows => rows[0]);

            if (existing) {
                await ctx.db
                    .delete(postLikes)
                    .where(
                        and(
                            eq(postLikes.postId, input.postId),
                            eq(postLikes.userId, userId)
                        )
                    );
                return { liked: false };
            } else {
                await ctx.db
                    .insert(postLikes)
                    .values({
                        postId: input.postId,
                        userId: userId,
                    });
                return { liked: true };
            }
        }),

    togglePostBookmark: protectedProcedure
        .input(z.object({ postId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth.userId;

            const existing = await ctx.db
                .select()
                .from(postBookmarks)
                .where(
                    and(
                        eq(postBookmarks.postId, input.postId),
                        eq(postBookmarks.userId, userId)
                    )
                )
                .limit(1)
                .then(rows => rows[0]);

            if (existing) {
                await ctx.db
                    .delete(postBookmarks)
                    .where(
                        and(
                            eq(postBookmarks.postId, input.postId),
                            eq(postBookmarks.userId, userId)
                        )
                    );
                return { bookmarked: false };
            } else {
                await ctx.db
                    .insert(postBookmarks)
                    .values({
                        postId: input.postId,
                        userId: userId,
                    });
                return { bookmarked: true };
            }
        }),

    toggleCommentLike: protectedProcedure
        .input(z.object({ commentId: z.number() }))
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.auth.userId;

            const existing = await ctx.db
                .select()
                .from(commentLikes)
                .where(
                    and(
                        eq(commentLikes.commentId, input.commentId),
                        eq(commentLikes.userId, userId)
                    )
                )
                .limit(1)
                .then(rows => rows[0]);

            if (existing) {
                await ctx.db
                    .delete(commentLikes)
                    .where(
                        and(
                            eq(commentLikes.commentId, input.commentId),
                            eq(commentLikes.userId, userId)
                        )
                    );
                return { liked: false };
            } else {
                await ctx.db
                    .insert(commentLikes)
                    .values({
                        commentId: input.commentId,
                        userId: userId,
                    });
                return { liked: true };
            }
        }),
});
