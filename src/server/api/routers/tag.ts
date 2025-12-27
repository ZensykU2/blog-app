import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { tags } from "~/server/db/schema";

export const tagRouter = createTRPCRouter({
    getAll: publicProcedure.query(async ({ ctx }) => {
        return ctx.db.select().from(tags).orderBy(tags.name);
    }),
});
