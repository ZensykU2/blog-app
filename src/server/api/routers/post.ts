import { z } from "zod";
import { desc, eq, and } from "drizzle-orm";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { posts, users } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),
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

      const totalCount = await ctx.db
        .select({ count: posts.id })
        .from(posts)
        .where(eq(posts.status, "published"));

      return {
        posts: allPosts,
        totalCount: totalCount.length,
        hasMore: totalCount.length > offset + input.limit,
      };
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

      const totalCount = await ctx.db
        .select({ count: posts.id })
        .from(posts)
        .where(eq(posts.authorId, userId));

      return {
        posts: userPosts,
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
          // Author-Daten
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

      return post[0] ?? null;
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

  create: protectedProcedure
    .input(z.object({ 
      title: z.string().min(1),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(posts).values({
        title: input.title,
        content: input.content,
        slug: input.title.toLowerCase().replace(/\s+/g, '-'),
        authorId: ctx.auth.userId,
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
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

    return post[0] ?? null;
  }),
});