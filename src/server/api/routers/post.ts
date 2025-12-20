import { z } from "zod";
import { desc, eq, and, count } from "drizzle-orm";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { posts, users, postLikes, postBookmarks } from "~/server/db/schema";
import { getClerkUser } from "~/lib/clerk-user";
import { sql } from "drizzle-orm";

export const postRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      page: z.number().default(1),
      limit: z.number().default(8),
    }))
    .query(async ({ ctx, input }) => {
      const offset = (input.page - 1) * input.limit;

      const allPosts = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          content: posts.content,
          excerpt: posts.excerpt,
          status: posts.status,
          authorId: posts.authorId,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          publishedAt: posts.publishedAt,
          author: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            profileImage: users.profileImage,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.clerkId))
        .where(eq(posts.status, "published"))
        .orderBy(desc(posts.createdAt))
        .limit(input.limit)
        .offset(offset);

      const userId = ctx.auth.userId;

      const postsWithAuthors = await Promise.all(
        allPosts.map(async (post) => {
          // Get like count
          const [likeCountResult] = await ctx.db
            .select({ count: count() })
            .from(postLikes)
            .where(eq(postLikes.postId, post.id));

          let isLiked = false;
          let isBookmarked = false;

          if (userId) {
            const [like] = await ctx.db
              .select()
              .from(postLikes)
              .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, userId)))
              .limit(1);
            isLiked = !!like;

            const [bookmark] = await ctx.db
              .select()
              .from(postBookmarks)
              .where(and(eq(postBookmarks.postId, post.id), eq(postBookmarks.userId, userId)))
              .limit(1);
            isBookmarked = !!bookmark;
          }

          let author = post.author;
          if (!author?.id) {
            author = await getClerkUser(post.authorId);
          }

          return {
            ...post,
            author,
            likeCount: likeCountResult?.count ?? 0,
            isLiked,
            isBookmarked,
          };
        })
      );

      const totalCount = await ctx.db
        .select({ count: posts.id })
        .from(posts)
        .where(eq(posts.status, "published"));

      return {
        posts: postsWithAuthors,
        totalCount: totalCount.length,
        hasMore: totalCount.length > offset + input.limit,
      };
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const post = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          content: posts.content,
          excerpt: posts.excerpt,
          status: posts.status,
          authorId: posts.authorId,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          publishedAt: posts.publishedAt,
          author: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            profileImage: users.profileImage,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.clerkId))
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!post[0]) return null;

      const userId = ctx.auth.userId;
      const targetPost = post[0];

      const [likeCountResult] = await ctx.db
        .select({ count: count() })
        .from(postLikes)
        .where(eq(postLikes.postId, targetPost.id));

      let isLiked = false;
      let isBookmarked = false;

      if (userId) {
        const [like] = await ctx.db
          .select()
          .from(postLikes)
          .where(and(eq(postLikes.postId, targetPost.id), eq(postLikes.userId, userId)))
          .limit(1);
        isLiked = !!like;

        const [bookmark] = await ctx.db
          .select()
          .from(postBookmarks)
          .where(and(eq(postBookmarks.postId, targetPost.id), eq(postBookmarks.userId, userId)))
          .limit(1);
        isBookmarked = !!bookmark;
      }

      let author = targetPost.author;
      if (!author?.id) {
        author = await getClerkUser(targetPost.authorId);
      }

      return {
        ...targetPost,
        author,
        likeCount: likeCountResult?.count ?? 0,
        isLiked,
        isBookmarked,
      };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const [newPost] = await ctx.db.insert(posts).values({
        title: input.title,
        content: input.content,
        slug: input.title.toLowerCase().replace(/\s+/g, '-'),
        authorId: ctx.auth.userId,
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({ id: posts.id });

      return newPost;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const [updatedPost] = await ctx.db
        .update(posts)
        .set({
          title: input.title,
          content: input.content,
          slug: input.title.toLowerCase().replace(/\s+/g, '-'),
          updatedAt: new Date(),
        })
        .where(and(
          eq(posts.id, input.id),
          eq(posts.authorId, ctx.auth.userId)
        ))
        .returning({ id: posts.id });

      return updatedPost;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db
        .delete(posts)
        .where(and(
          eq(posts.id, input.id),
          eq(posts.authorId, ctx.auth.userId)
        ));
    }),

  getByUser: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      page: z.number().default(1),
      limit: z.number().default(8),
    }))
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.auth.userId;
      const offset = (input.page - 1) * input.limit;

      const userPosts = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          content: posts.content,
          excerpt: posts.excerpt,
          status: posts.status,
          authorId: posts.authorId,
          createdAt: posts.createdAt,
          updatedAt: posts.updatedAt,
          publishedAt: posts.publishedAt,
          author: {
            id: users.id,
            displayName: users.displayName,
            username: users.username,
            profileImage: users.profileImage,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.clerkId))
        .where(eq(posts.authorId, targetUserId))
        .orderBy(desc(posts.createdAt))
        .limit(input.limit)
        .offset(offset);

      const viewerId = ctx.auth.userId;

      const postsWithAuthors = await Promise.all(
        userPosts.map(async (post) => {
          const [likeCountResult] = await ctx.db
            .select({ count: count() })
            .from(postLikes)
            .where(eq(postLikes.postId, post.id));

          let isLiked = false;
          let isBookmarked = false;

          if (viewerId) {
            const [like] = await ctx.db
              .select()
              .from(postLikes)
              .where(and(eq(postLikes.postId, post.id), eq(postLikes.userId, viewerId)))
              .limit(1);
            isLiked = !!like;

            const [bookmark] = await ctx.db
              .select()
              .from(postBookmarks)
              .where(and(eq(postBookmarks.postId, post.id), eq(postBookmarks.userId, viewerId)))
              .limit(1);
            isBookmarked = !!bookmark;
          }

          let author = post.author;
          if (!author?.id) {
            author = await getClerkUser(post.authorId);
          }

          return {
            ...post,
            author,
            likeCount: likeCountResult?.count ?? 0,
            isLiked,
            isBookmarked,
          };
        })
      );

      const totalCount = await ctx.db
        .select({ count: posts.id })
        .from(posts)
        .where(eq(posts.authorId, targetUserId));

      return {
        posts: postsWithAuthors,
        totalCount: totalCount.length,
        hasMore: totalCount.length > offset + input.limit,
      };
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        content: posts.content,
        excerpt: posts.excerpt,
        status: posts.status,
        authorId: posts.authorId,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
        publishedAt: posts.publishedAt,
        author: {
          id: users.id,
          displayName: users.displayName,
          username: users.username,
          profileImage: users.profileImage,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.clerkId))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.createdAt))
      .limit(1);

    if (!post[0]) return null;

    const userId = ctx.auth.userId;
    const targetPost = post[0];

    const [likeCountResult] = await ctx.db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, targetPost.id));

    let isLiked = false;
    let isBookmarked = false;

    if (userId) {
      const [like] = await ctx.db
        .select()
        .from(postLikes)
        .where(and(eq(postLikes.postId, targetPost.id), eq(postLikes.userId, userId)))
        .limit(1);
      isLiked = !!like;

      const [bookmark] = await ctx.db
        .select()
        .from(postBookmarks)
        .where(and(eq(postBookmarks.postId, targetPost.id), eq(postBookmarks.userId, userId)))
        .limit(1);
      isBookmarked = !!bookmark;
    }

    let author = targetPost.author;
    if (!author?.id) {
      author = await getClerkUser(targetPost.authorId);
    }

    return {
      ...targetPost,
      author,
      likeCount: likeCountResult?.count ?? 0,
      isLiked,
      isBookmarked,
    };
  }),
});