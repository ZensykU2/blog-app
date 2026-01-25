import { z } from "zod";
import { eq, and } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { postLikes, postBookmarks, commentLikes, posts, comments } from "~/server/db/schema";
import { createNotification } from "~/server/services/notification.service";

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

                // Trigger notification
                const post = await ctx.db.query.posts.findFirst({
                    where: eq(posts.id, input.postId),
                    columns: { authorId: true, title: true }
                });

                if (post && post.authorId !== userId) {
                    await createNotification(ctx.db, {
                        userId: post.authorId,
                        type: "post_like",
                        title: "New Like",
                        message: `liked your post: ${post.title ?? 'Untitled'}`,
                        relatedUserId: userId,
                        relatedPostId: input.postId,
                    });
                }

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

                // Trigger notification
                const post = await ctx.db.query.posts.findFirst({
                    where: eq(posts.id, input.postId),
                    columns: { authorId: true, title: true }
                });

                if (post && post.authorId !== userId) {
                    await createNotification(ctx.db, {
                        userId: post.authorId,
                        type: "post_bookmark",
                        title: "New Bookmark",
                        message: `Someone bookmarked your post: ${post.title}`,
                        // Note: relatedUserId is null for bookmarks as per user request to hide who bookmarked
                        relatedPostId: input.postId,
                    });
                }

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

                // Trigger notification
                const comment = await ctx.db.query.comments.findFirst({
                    where: eq(comments.id, input.commentId),
                    columns: { authorId: true, content: true, postId: true }
                });

                if (comment && comment.authorId !== userId) {
                    await createNotification(ctx.db, {
                        userId: comment.authorId,
                        type: "comment_like",
                        title: "New Comment Like",
                        message: `liked your comment: ${comment.content.substring(0, 50)}...`,
                        relatedUserId: userId,
                        relatedCommentId: input.commentId,
                        relatedPostId: comment.postId,
                    });
                }

                return { liked: true };
            }
        }),
});
