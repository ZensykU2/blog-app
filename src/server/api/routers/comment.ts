import { z } from "zod";
import { desc, eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { comments, posts, users, commentLikes } from "~/server/db/schema";
import { createNotification, notifyMentions } from "~/server/services/notification.service";
import { count } from "drizzle-orm";

export const commentRouter = createTRPCRouter({
    getByPostId: publicProcedure
        .input(z.object({ postId: z.number() }))
        .query(async ({ ctx, input }) => {
            const allComments = await ctx.db
                .select({
                    id: comments.id,
                    content: comments.content,
                    postId: comments.postId,
                    authorId: comments.authorId,
                    parentId: comments.parentId,
                    createdAt: comments.createdAt,
                    updatedAt: comments.updatedAt,
                    author: {
                        id: users.id,
                        displayName: users.displayName,
                        username: users.username,
                        profileImage: users.profileImage,
                        image: users.image,
                    },
                })
                .from(comments)
                .leftJoin(users, eq(comments.authorId, users.id))
                .where(eq(comments.postId, input.postId))
                .orderBy(desc(comments.createdAt));

            const userId = ctx.session?.user.id;

            const commentsWithData = await Promise.all(
                allComments.map(async (comment) => {
                    // Get like count
                    const [likeCountResult] = await ctx.db
                        .select({ count: count() })
                        .from(commentLikes)
                        .where(eq(commentLikes.commentId, comment.id));

                    let isLiked = false;
                    if (userId) {
                        const [like] = await ctx.db
                            .select()
                            .from(commentLikes)
                            .where(and(eq(commentLikes.commentId, comment.id), eq(commentLikes.userId, userId)))
                            .limit(1);
                        isLiked = !!like;
                    }

                    return {
                        ...comment,
                        likeCount: likeCountResult?.count ?? 0,
                        isLiked,
                    };
                })
            );

            return commentsWithData;
        }),

    create: protectedProcedure
        .input(z.object({
            postId: z.number(),
            content: z.string().min(1).max(1000),
            parentId: z.number().optional(),
        }))
        .mutation(async ({ ctx, input }) => {
            const [newComment] = await ctx.db
                .insert(comments)
                .values({
                    postId: input.postId,
                    content: input.content,
                    authorId: ctx.auth.userId,
                    parentId: input.parentId,
                })
                .returning();

            if (newComment) {
                const post = await ctx.db.query.posts.findFirst({
                    where: eq(posts.id, input.postId),
                    columns: { authorId: true, title: true }
                });

                let notifiedPostAuthor = false;

                // 1. Handle reply notification (priority)
                if (input.parentId) {
                    const parentComment = await ctx.db.query.comments.findFirst({
                        where: eq(comments.id, input.parentId),
                        columns: { authorId: true, content: true }
                    });

                    if (parentComment && parentComment.authorId !== ctx.auth.userId) {
                        const parentSnippet = parentComment.content.length > 20
                            ? parentComment.content.substring(0, 20) + "..."
                            : parentComment.content;
                        const replySnippet = input.content.length > 30
                            ? input.content.substring(0, 30) + "..."
                            : input.content;

                        await createNotification(ctx.db, {
                            userId: parentComment.authorId,
                            type: "new_comment",
                            title: "New Reply",
                            message: `replied to "${parentSnippet}": ${replySnippet}`,
                            relatedUserId: ctx.auth.userId,
                            relatedPostId: input.postId,
                            relatedCommentId: newComment.id,
                        });

                        if (parentComment.authorId === post?.authorId) {
                            notifiedPostAuthor = true;
                        }
                    }
                }

                // 2. Handle post author notification (if not already notified as parent)
                if (post && post.authorId !== ctx.auth.userId && !notifiedPostAuthor) {
                    const commentSnippet = input.content.length > 30
                        ? input.content.substring(0, 30) + "..."
                        : input.content;

                    await createNotification(ctx.db, {
                        userId: post.authorId,
                        type: "new_comment",
                        title: "New Comment",
                        message: `commented: "${commentSnippet}" on your post: ${post.title ?? 'Untitled'}`,
                        relatedUserId: ctx.auth.userId,
                        relatedPostId: input.postId,
                        relatedCommentId: newComment.id,
                    });
                }

                // 3. Handle mentions
                await notifyMentions(ctx.db, input.content, input.postId, newComment.id, ctx.auth.userId);
            }

            return newComment;
        }),

    update: protectedProcedure
        .input(z.object({
            id: z.number(),
            content: z.string().min(1).max(1000),
        }))
        .mutation(async ({ ctx, input }) => {
            const comment = await ctx.db
                .select({ authorId: comments.authorId })
                .from(comments)
                .where(eq(comments.id, input.id))
                .limit(1)
                .then((rows) => rows[0]);

            if (!comment) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
            }

            if (comment.authorId !== ctx.auth.userId) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not authorized to edit this comment"
                });
            }

            await ctx.db
                .update(comments)
                .set({
                    content: input.content,
                    updatedAt: new Date(),
                })
                .where(eq(comments.id, input.id));

            return { success: true };
        }),

    delete: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ ctx, input }) => {
            // Fetch comment and the associated post to check permissions
            const comment = await ctx.db
                .select({
                    id: comments.id,
                    authorId: comments.authorId,
                    postId: comments.postId,
                })
                .from(comments)
                .where(eq(comments.id, input.id))
                .limit(1)
                .then((rows) => rows[0]);

            if (!comment) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Comment not found" });
            }

            // Check if user is comment author
            const isCommentAuthor = comment.authorId === ctx.auth.userId;

            // Check if user is post author
            let isPostAuthor = false;
            if (!isCommentAuthor) {
                const post = await ctx.db
                    .select({ authorId: posts.authorId })
                    .from(posts)
                    .where(eq(posts.id, comment.postId))
                    .limit(1)
                    .then((rows) => rows[0]);

                if (post) {
                    isPostAuthor = post.authorId === ctx.auth.userId;
                }
            }

            if (!isCommentAuthor && !isPostAuthor) {
                throw new TRPCError({
                    code: "FORBIDDEN",
                    message: "You are not authorized to delete this comment"
                });
            }

            await ctx.db
                .delete(comments)
                .where(eq(comments.id, input.id));

            return { success: true };
        }),

    getForUser: publicProcedure
        .input(z.object({
            userId: z.string().optional(),
            limit: z.number().default(10),
            cursor: z.number().nullish(), // cursor is the page number
        }))
        .query(async ({ ctx, input }) => {
            const targetUserId = input.userId ?? ctx.session?.user.id;
            if (!targetUserId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "User ID is required" });
            }

            const page = input.cursor ?? 1;
            const offset = (page - 1) * input.limit;

            const userComments = await ctx.db
                .select({
                    id: comments.id,
                    content: comments.content,
                    postId: comments.postId,
                    authorId: comments.authorId,
                    parentId: comments.parentId,
                    createdAt: comments.createdAt,
                    updatedAt: comments.updatedAt,
                    post: {
                        id: posts.id,
                        title: posts.title,
                    },
                    author: {
                        id: users.id,
                        displayName: users.displayName,
                        username: users.username,
                        profileImage: users.profileImage,
                        image: users.image,
                    },
                })
                .from(comments)
                .leftJoin(users, eq(comments.authorId, users.id))
                .leftJoin(posts, eq(comments.postId, posts.id))
                .where(eq(comments.authorId, targetUserId))
                .orderBy(desc(comments.createdAt))
                .limit(input.limit)
                .offset(offset);

            const viewerId = ctx.session?.user.id;

            const commentsWithData = await Promise.all(
                userComments.map(async (comment) => {
                    const [likeCountResult] = await ctx.db
                        .select({ count: count() })
                        .from(commentLikes)
                        .where(eq(commentLikes.commentId, comment.id));

                    let isLiked = false;
                    if (viewerId) {
                        const [like] = await ctx.db
                            .select()
                            .from(commentLikes)
                            .where(and(eq(commentLikes.commentId, comment.id), eq(commentLikes.userId, viewerId)))
                            .limit(1);
                        isLiked = !!like;
                    }

                    return {
                        ...comment,
                        likeCount: likeCountResult?.count ?? 0,
                        isLiked,
                    };
                })
            );

            return {
                items: commentsWithData,
                nextCursor: commentsWithData.length === input.limit ? page + 1 : undefined,
            };
        }),
});
