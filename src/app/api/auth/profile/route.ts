import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { auth } from "~/server/auth";

interface ProfileUpdateBody {
    displayName?: string;
    profileImage?: string;
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
        const { displayName, profileImage } = body;

        await db
            .update(users)
            .set({
                displayName: displayName ?? undefined,
                profileImage: profileImage ?? undefined,
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