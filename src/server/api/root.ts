import { postRouter } from "~/server/api/routers/post";
import { commentRouter } from "~/server/api/routers/comment";
import { interactionRouter } from "~/server/api/routers/interaction";
import { adminRouter } from "~/server/api/routers/admin";
import { userRouter } from "~/server/api/routers/user";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
import { tagRouter } from "~/server/api/routers/tag";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  admin: adminRouter,
  post: postRouter,
  comment: commentRouter,
  interaction: interactionRouter,
  user: userRouter,
  tag: tagRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
