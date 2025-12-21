import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { env } from "~/env";
import { db } from "~/server/db";
import { accounts, sessions, users, verificationTokens } from "~/server/db/schema";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
    interface Session extends DefaultSession {
        user: {
            id: string;
            role: "admin" | "author" | "user";
            username: string | null;
        } & DefaultSession["user"];
    }

    interface User {
        id: string;
        role: "admin" | "author" | "user";
        username: string | null;
    }
}

/**
 * Generate a unique username from email or name
 */
async function generateUniqueUsername(email: string, name?: string | null): Promise<string> {
    // Try to create username from name or email prefix
    let baseUsername = name?.toLowerCase().replace(/[^a-z0-9]/g, "") ?? email.split("@")[0]?.replace(/[^a-z0-9]/g, "") ?? "user";

    // Ensure minimum length
    if (baseUsername.length < 3) {
        baseUsername = "user" + baseUsername;
    }

    // Check if username exists and add random suffix if needed
    let username = baseUsername;
    let attempts = 0;

    while (attempts < 10) {
        const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, username))
            .limit(1)
            .then((rows) => rows[0]);

        if (!existing) {
            return username;
        }

        // Add random suffix
        username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
        attempts++;
    }

    // Fallback with timestamp
    return `${baseUsername}${Date.now()}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    // @ts-expect-error - DrizzleAdapter types have minor incompatibility with NextAuth beta
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),
    session: {
        strategy: "jwt", // Required for Credentials provider
    },
    providers: [
        Google({
            clientId: env.AUTH_GOOGLE_ID,
            clientSecret: env.AUTH_GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
        }),
        Credentials({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1)
                    .then((rows) => rows[0]);

                if (!user || !user.password) {
                    return null;
                }

                const passwordMatch = await bcrypt.compare(password, user.password);

                if (!passwordMatch) {
                    return null;
                }

                return {
                    id: user.id,
                    email: user.email,
                    name: user.displayName ?? user.username,
                    image: user.profileImage,
                    role: user.role,
                    username: user.username,
                };
            },
        }),
    ],
    events: {
        // Generate username for OAuth users when they first sign up
        async createUser({ user }) {
            if (user.id != null && user.email != null && user.username == null) {
                const username = await generateUniqueUsername(user.email, user.name);
                await db
                    .update(users)
                    .set({
                        username,
                        displayName: user.name ?? username,
                    })
                    .where(eq(users.id, user.id));
            }
        },
    },
    callbacks: {
        async jwt({ token, user, trigger }) {
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
            }
            // Refresh user data on session update
            if (trigger === "update" && token.id) {
                const dbUser = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, token.id as string))
                    .limit(1)
                    .then((rows) => rows[0]);
                if (dbUser) {
                    token.username = dbUser.username;
                    token.role = dbUser.role;
                }
            }
            return token;
        },
        async session({ session, token }) {
            if (token) {
                session.user.id = token.id as string;
                session.user.role = token.role as "admin" | "author" | "user";
                session.user.username = token.username as string | null;
            }
            return session;
        },
    },
    pages: {
        signIn: "/sign-in",
    },
});
