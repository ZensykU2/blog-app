import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { auth } from "~/server/auth";

interface ProfileUpdateBody {
    displayName?: string;
    username?: string;
    bio?: string;
    profileImage?: string;
    bannerImage?: string;
}

export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = (await request.json()) as ProfileUpdateBody;
        const { displayName, username, bio, profileImage, bannerImage } = body;

        // If username is being updated, check for uniqueness
        if (username) {
            const existingUser = await db.query.users.findFirst({
                where: (u, { eq, and, ne }) => and(eq(u.username, username), ne(u.id, session.user.id)),
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: "Username already taken" },
                    { status: 409 }
                );
            }
        }

        await db
            .update(users)
            .set({
                displayName: displayName ?? undefined,
                username: username ?? undefined,
                bio: bio ?? undefined,
                profileImage: profileImage ?? undefined,
                bannerImage: bannerImage ?? undefined,
                updatedAt: new Date(),
            })
            .where(eq(users.id, session.user.id));

        return NextResponse.json(
            { message: "Profile updated successfully" },
            { status: 200 }
        );
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}