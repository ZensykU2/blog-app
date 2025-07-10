import { z } from "zod";
import { desc } from "drizzle-orm";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { posts } from "~/server/db/schema";

export const postRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ text: z.string() }))
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text}`,
      };
    }),

  create: publicProcedure
    .input(z.object({ 
      title: z.string().min(1),
      content: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.insert(posts).values({
        title: input.title,
        content: input.content,
        slug: input.title.toLowerCase().replace(/\s+/g, '-'),
        authorId: "temp-user",
        status: "published",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }),

  getLatest: publicProcedure.query(async ({ ctx }) => {
    const post = await ctx.db.select().from(posts)
      .orderBy(desc(posts.createdAt))
      .limit(1);

    return post[0] ?? null;
  }),
});