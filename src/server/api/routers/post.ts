import { z } from "zod";
import { desc, eq, and, count, lt } from "drizzle-orm";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "~/server/api/trpc";
import { posts, users, postLikes, postBookmarks, postTags, tags } from "~/server/db/schema";


export const postRouter = createTRPCRouter({
  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(100).default(10),
      cursor: z.date().nullish(), // <-- cursor is a date
    }))
    .query(async ({ ctx, input }) => {
      const { limit, cursor } = input;

      const allPosts = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          content: posts.content,
          excerpt: posts.excerpt,
          wordCount: posts.wordCount,
          readingTime: posts.readingTime,
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
            image: users.image,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(posts.status, "published"),
            cursor ? lt(posts.createdAt, cursor) : undefined
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit + 1); // Fetch one extra to check for hasMore

      const userId = ctx.session?.user.id;

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

          // Get tags
          const postTagsData = await ctx.db
            .select({
              id: tags.id,
              name: tags.name,
              slug: tags.slug,
            })
            .from(postTags)
            .innerJoin(tags, eq(postTags.tagId, tags.id))
            .where(eq(postTags.postId, post.id));

          return {
            ...post,
            likeCount: likeCountResult?.count ?? 0,
            isLiked,
            isBookmarked,
            tags: postTagsData,
          };
        })
      );

      let nextCursor: typeof cursor | undefined = undefined;
      if (postsWithAuthors.length > limit) {
        const nextItem = postsWithAuthors.pop();
        nextCursor = nextItem?.createdAt;
      }

      return {
        posts: postsWithAuthors,
        nextCursor,
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
          wordCount: posts.wordCount,
          readingTime: posts.readingTime,
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
            image: users.image,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(eq(posts.id, input.id))
        .limit(1);

      if (!post[0]) return null;

      const userId = ctx.session?.user.id;
      const targetPost = post[0];

      const [likeCountResult] = await ctx.db
        .select({ count: count() })
        .from(postLikes)
        .where(eq(postLikes.postId, targetPost.id));

      // Get tags
      const postTagsData = await ctx.db
        .select({
          id: tags.id,
          name: tags.name,
          slug: tags.slug,
        })
        .from(postTags)
        .innerJoin(tags, eq(postTags.tagId, tags.id))
        .where(eq(postTags.postId, targetPost.id));

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

      return {
        ...targetPost,
        likeCount: likeCountResult?.count ?? 0,
        isLiked,
        isBookmarked,
        tags: postTagsData,
      };
    }),

  create: protectedProcedure
    .input(z.object({
      title: z.string().min(1),
      content: z.string().min(1),
      tags: z.array(z.number()).optional(),
      wordCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const readingTime = Math.ceil((input.wordCount ?? 0) / 200);
      const randomSuffix = Math.random().toString(36).substring(2, 7);
      const slug = `${input.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')}-${randomSuffix}`;

      const [newPost] = await ctx.db.insert(posts).values({
        title: input.title,
        content: input.content,
        slug,
        authorId: ctx.auth.userId,
        status: "published",
        wordCount: input.wordCount ?? 0,
        readingTime,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning({ id: posts.id });

      if (newPost && input.tags && input.tags.length > 0) {
        await ctx.db.insert(postTags).values(
          input.tags.map(tagId => ({
            postId: newPost.id,
            tagId,
          }))
        );
      }

      if (!newPost) {
        throw new Error("Failed to create post");
      }

      return newPost;
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().min(1),
      content: z.string().min(1),
      tags: z.array(z.number()).optional(),
      wordCount: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const readingTime = Math.ceil((input.wordCount ?? 0) / 200);

      const [updatedPost] = await ctx.db
        .update(posts)
        .set({
          title: input.title,
          content: input.content,
          slug: input.title.toLowerCase().replace(/\s+/g, '-'),
          wordCount: input.wordCount ?? 0,
          readingTime,
          updatedAt: new Date(),
        })
        .where(and(
          eq(posts.id, input.id),
          eq(posts.authorId, ctx.auth.userId)
        ))
        .returning({ id: posts.id });

      if (updatedPost) {
        // Delete existing tags
        await ctx.db.delete(postTags).where(eq(postTags.postId, input.id));

        // Insert new tags
        if (input.tags && input.tags.length > 0) {
          await ctx.db.insert(postTags).values(
            input.tags.map(tagId => ({
              postId: input.id,
              tagId,
            }))
          );
        }
      }

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
      limit: z.number().min(1).max(100).default(10),
      cursor: z.date().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.auth.userId;
      const { limit, cursor } = input;

      const userPosts = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          content: posts.content,
          excerpt: posts.excerpt,
          wordCount: posts.wordCount,
          readingTime: posts.readingTime,
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
            image: users.image,
          },
        })
        .from(posts)
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(posts.authorId, targetUserId),
            cursor ? lt(posts.createdAt, cursor) : undefined
          )
        )
        .orderBy(desc(posts.createdAt))
        .limit(limit + 1);

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

          // Get tags
          const postTagsData = await ctx.db
            .select({
              id: tags.id,
              name: tags.name,
              slug: tags.slug,
            })
            .from(postTags)
            .innerJoin(tags, eq(postTags.tagId, tags.id))
            .where(eq(postTags.postId, post.id));

          return {
            ...post,
            likeCount: likeCountResult?.count ?? 0,
            isLiked,
            isBookmarked,
            tags: postTagsData,
          };
        })
      );

      let nextCursor: typeof cursor | undefined = undefined;
      if (postsWithAuthors.length > limit) {
        const nextItem = postsWithAuthors.pop();
        nextCursor = nextItem?.createdAt;
      }

      return {
        posts: postsWithAuthors,
        nextCursor,
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
          image: users.image,
        },
      })
      .from(posts)
      .leftJoin(users, eq(posts.authorId, users.id))
      .where(eq(posts.status, "published"))
      .orderBy(desc(posts.createdAt))
      .limit(1);

    if (!post[0]) return null;

    const userId = ctx.session?.user.id;
    const targetPost = post[0];

    const [likeCountResult] = await ctx.db
      .select({ count: count() })
      .from(postLikes)
      .where(eq(postLikes.postId, targetPost.id));

    // Get tags
    const postTagsData = await ctx.db
      .select({
        id: tags.id,
        name: tags.name,
        slug: tags.slug,
      })
      .from(postTags)
      .innerJoin(tags, eq(postTags.tagId, tags.id))
      .where(eq(postTags.postId, targetPost.id));

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

    return {
      ...targetPost,
      likeCount: likeCountResult?.count ?? 0,
      isLiked,
      isBookmarked,
      tags: postTagsData,
    };
  }),

  getLikedByUser: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
      cursor: z.date().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.auth.userId;
      const { limit, cursor } = input;

      const likedPosts = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          content: posts.content,
          excerpt: posts.excerpt,
          wordCount: posts.wordCount,
          readingTime: posts.readingTime,
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
            image: users.image,
          },
        })
        .from(postLikes)
        .innerJoin(posts, eq(postLikes.postId, posts.id))
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(postLikes.userId, targetUserId),
            cursor ? lt(postLikes.createdAt, cursor) : undefined
          )
        )
        .orderBy(desc(postLikes.createdAt))
        .limit(limit + 1);

      const viewerId = ctx.auth.userId;

      const postsWithAuthors = await Promise.all(
        likedPosts.map(async (post) => {
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

          // Get tags
          const postTagsData = await ctx.db
            .select({
              id: tags.id,
              name: tags.name,
              slug: tags.slug,
            })
            .from(postTags)
            .innerJoin(tags, eq(postTags.tagId, tags.id))
            .where(eq(postTags.postId, post.id));

          return {
            ...post,
            likeCount: likeCountResult?.count ?? 0,
            isLiked,
            isBookmarked,
            tags: postTagsData,
          };
        })
      );

      let nextCursor: typeof cursor | undefined = undefined;
      if (postsWithAuthors.length > limit) {
        const nextItem = postsWithAuthors.pop();
        nextCursor = nextItem?.createdAt;
      }

      return {
        posts: postsWithAuthors,
        nextCursor,
      };
    }),

  getBookmarkedByUser: protectedProcedure
    .input(z.object({
      userId: z.string().optional(),
      limit: z.number().min(1).max(100).default(10),
      cursor: z.date().nullish(),
    }))
    .query(async ({ ctx, input }) => {
      const targetUserId = input.userId ?? ctx.auth.userId;
      const { limit, cursor } = input;

      const bookmarkedPosts = await ctx.db
        .select({
          id: posts.id,
          title: posts.title,
          slug: posts.slug,
          content: posts.content,
          excerpt: posts.excerpt,
          wordCount: posts.wordCount,
          readingTime: posts.readingTime,
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
            image: users.image,
          },
        })
        .from(postBookmarks)
        .innerJoin(posts, eq(postBookmarks.postId, posts.id))
        .leftJoin(users, eq(posts.authorId, users.id))
        .where(
          and(
            eq(postBookmarks.userId, targetUserId),
            cursor ? lt(postBookmarks.createdAt, cursor) : undefined
          )
        )
        .orderBy(desc(postBookmarks.createdAt))
        .limit(limit + 1);

      const viewerId = ctx.auth.userId;

      const postsWithAuthors = await Promise.all(
        bookmarkedPosts.map(async (post) => {
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

          // Get tags
          const postTagsData = await ctx.db
            .select({
              id: tags.id,
              name: tags.name,
              slug: tags.slug,
            })
            .from(postTags)
            .innerJoin(tags, eq(postTags.tagId, tags.id))
            .where(eq(postTags.postId, post.id));

          return {
            ...post,
            likeCount: likeCountResult?.count ?? 0,
            isLiked,
            isBookmarked,
            tags: postTagsData,
          };
        })
      );

      let nextCursor: typeof cursor | undefined = undefined;
      if (postsWithAuthors.length > limit) {
        const nextItem = postsWithAuthors.pop();
        nextCursor = nextItem?.createdAt;
      }

      return {
        posts: postsWithAuthors,
        nextCursor,
      };
    }),
});
