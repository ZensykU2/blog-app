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

        if (!session?.user.id) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = (await request.json()) as ProfileUpdateBody;
        const { displayName, username, bio, profileImage, bannerImage } = body;

        // Prevent large base64 strings or massive URLs from being saved
        const validateImage = (img?: string) => {
            if (!img) return true;
            if (img.startsWith("data:")) return false; // Block base64
            if (img.length > 3000) return false; // Block massive URLs
            return true;
        };

        if (!validateImage(profileImage) || !validateImage(bannerImage)) {
            return NextResponse.json(
                { error: "Invalid image format or size. Please use a direct URL." },
                { status: 400 }
            );
        }

        // If username is being updated, check for uniqueness
        if (username) {
            const existingUser = await db.query.users.findFirst({
                where: (u, { eq: tableEq, and, ne }) => and(tableEq(u.username, username), ne(u.id, session.user.id)),
            });

            if (existingUser) {
                return NextResponse.json(
                    { error: "Username already taken" },
                    { status: 409 }
                );
            }
        }

        // Check for image updates to delete old files
        if (profileImage || bannerImage) {
            const currentUser = await db.query.users.findFirst({
                where: (u, { eq: eqOp }) => eqOp(u.id, session.user.id),
            });

            if (currentUser) {
                const { utapi, getUploadthingKey } = await import("~/server/uploadthing");

                if (profileImage && currentUser.profileImage && profileImage !== currentUser.profileImage) {
                    const key = getUploadthingKey(currentUser.profileImage);
                    if (key) await utapi.deleteFiles(key);
                }

                if (bannerImage && currentUser.bannerImage && bannerImage !== currentUser.bannerImage) {
                    const key = getUploadthingKey(currentUser.bannerImage);
                    if (key) await utapi.deleteFiles(key);
                }
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