import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, username, displayName } = body;

        if (!email || !password || !username) {
            return NextResponse.json(
                { error: "Email, password, and username are required" },
                { status: 400 }
            );
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return NextResponse.json(
                { error: "Invalid email format" },
                { status: 400 }
            );
        }

        // Validate password length
        if (password.length < 8) {
            return NextResponse.json(
                { error: "Password must be at least 8 characters" },
                { status: 400 }
            );
        }

        // Validate username format
        const usernameRegex = /^[a-zA-Z0-9_]+$/;
        if (!usernameRegex.test(username) || username.length < 3) {
            return NextResponse.json(
                { error: "Username must be at least 3 characters and contain only letters, numbers, and underscores" },
                { status: 400 }
            );
        }

        // Check if email already exists
        const existingEmail = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1)
            .then((rows) => rows[0]);

        if (existingEmail) {
            return NextResponse.json(
                { error: "Email already registered" },
                { status: 409 }
            );
        }

        // Check if username already exists
        const existingUsername = await db
            .select()
            .from(users)
            .where(eq(users.username, username))
            .limit(1)
            .then((rows) => rows[0]);

        if (existingUsername) {
            return NextResponse.json(
                { error: "Username already taken" },
                { status: 409 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 12);

        // Generate unique ID
        const userId = crypto.randomUUID();

        // Create user
        await db.insert(users).values({
            id: userId,
            email,
            password: hashedPassword,
            username,
            displayName: displayName || username,
            role: "user",
            isVerified: false,
        });

        return NextResponse.json(
            { message: "Account created successfully" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Sign-up error:", error);
        return NextResponse.json(
            { error: "Something went wrong" },
            { status: 500 }
        );
    }
}
