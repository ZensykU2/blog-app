import { pusherServer } from "../pusher";
import { notifications, users, type NewNotification } from "../db/schema";
import { eq } from "drizzle-orm";
import { type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import type * as schema from "../db/schema";

export const createNotification = async (
    db: PostgresJsDatabase<typeof schema>,
    data: NewNotification
) => {
    // Logic to prevent self-notification
    if (data.userId === data.relatedUserId) return;

    const [notification] = await db
        .insert(notifications)
        .values(data)
        .returning();

    if (notification) {
        // Fetch actor info for Pusher payload
        const actor = data.relatedUserId
            ? await db.query.users.findFirst({
                where: eq(users.id, data.relatedUserId),
            })
            : null;

        await pusherServer.trigger(`user-${data.userId}`, "new-notification", {
            ...notification,
            actor: actor ? {
                username: actor.username,
                displayName: actor.displayName,
                profileImage: actor.profileImage ?? actor.image,
            } : null,
        });
    }

    return notification;
};

export const parseMentions = (content: string) => {
    const mentionRegex = /@(\w+)/g;
    const matches = content.matchAll(mentionRegex);
    const usernames = new Set<string>();
    for (const match of matches) {
        if (match[1]) usernames.add(match[1]);
    }
    return Array.from(usernames);
};

export const notifyMentions = async (
    db: PostgresJsDatabase<typeof schema>,
    content: string,
    postId: number,
    commentId: number,
    authorId: string
) => {
    const usernames = parseMentions(content);
    for (const username of usernames) {
        const user = await db.query.users.findFirst({
            where: eq(users.username, username),
        });

        if (user && user.id !== authorId) {
            await createNotification(db, {
                userId: user.id,
                type: "mention",
                title: "You were mentioned",
                message: content.substring(0, 100),
                relatedUserId: authorId,
                relatedPostId: postId,
                relatedCommentId: commentId,
            });
        }
    }
};
