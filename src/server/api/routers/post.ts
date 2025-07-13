import { z } from "zod";
import { desc, eq, and } from "drizzle-orm";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { posts, users } from "~/server/db/schema";
import { getClerkUser } from "~/lib/clerk-user";

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

      // Fallback: Lade fehlende User-Daten von Clerk
      const postsWithAuthors = await Promise.all(
        allPosts.map(async (post) => {
          if (!post.author?.id) {
            const clerkUser = await getClerkUser(post.authorId);
            return {
              ...post,
              author: clerkUser, // Entweder das Clerk User Objekt oder null
            };
          }
          return post;
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

      let postWithAuthor = post[0];
      if (!post[0].author?.id) {
        const clerkUser = await getClerkUser(post[0].authorId);
        postWithAuthor = {
          ...post[0],
          author: clerkUser,
        };
      }

      return postWithAuthor;
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
      await ctx.db
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
        ));
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
      const userId = input.userId ?? ctx.auth.userId;
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
        .where(eq(posts.authorId, userId))
        .orderBy(desc(posts.createdAt))
        .limit(input.limit)
        .offset(offset);

      const postsWithAuthors = await Promise.all(
        userPosts.map(async (post) => {
          if (!post.author?.id) {
            const clerkUser = await getClerkUser(post.authorId);
            return {
              ...post,
              author: clerkUser,
            };
          }
          return post;
        })
      );

      const totalCount = await ctx.db
        .select({ count: posts.id })
        .from(posts)
        .where(eq(posts.authorId, userId));

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

    let postWithAuthor = post[0];
    if (!post[0].author?.id) {
      const clerkUser = await getClerkUser(post[0].authorId);
      postWithAuthor = {
        ...post[0],
        author: clerkUser,
      };
    }

    return postWithAuthor;
  }),
});