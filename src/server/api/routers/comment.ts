import { z } from "zod";
import { desc, eq, and } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { comments, posts, users, commentLikes } from "~/server/db/schema";
import { getClerkUser } from "~/lib/clerk-user";
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
                    },
                })
                .from(comments)
                .leftJoin(users, eq(comments.authorId, users.clerkId))
                .where(eq(comments.postId, input.postId))
                .orderBy(desc(comments.createdAt));

            const userId = ctx.auth.userId;

            // Fallback: Fetch missing user data from Clerk and interactions
            const commentsWithAuthors = await Promise.all(
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

                    let author = comment.author;
                    if (!author?.id) {
                        author = await getClerkUser(comment.authorId);
                    }

                    return {
                        ...comment,
                        author,
                        likeCount: likeCountResult?.count ?? 0,
                        isLiked,
                    };
                })
            );

            return commentsWithAuthors;
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
            page: z.number().default(1),
            limit: z.number().default(10),
        }))
        .query(async ({ ctx, input }) => {
            const targetUserId = input.userId ?? ctx.auth.userId;
            if (!targetUserId) {
                throw new TRPCError({ code: "BAD_REQUEST", message: "User ID is required" });
            }

            const offset = (input.page - 1) * input.limit;

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
                    },
                })
                .from(comments)
                .leftJoin(users, eq(comments.authorId, users.clerkId))
                .leftJoin(posts, eq(comments.postId, posts.id))
                .where(eq(comments.authorId, targetUserId))
                .orderBy(desc(comments.createdAt))
                .limit(input.limit)
                .offset(offset);

            const viewerId = ctx.auth.userId;

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

            return commentsWithData;
        }),
});
