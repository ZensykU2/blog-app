import { DrizzleAdapter } from "@auth/drizzle-adapter";
import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { env } from "~/env";
import { db } from "~/server/db";
import {
    accounts,
    sessions,
    users,
    verificationTokens,
} from "~/server/db/schema";

/**
 * Module augmentation for next-auth types.
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
async function generateUniqueUsername(
    email: string,
    name?: string | null
): Promise<string> {
    let baseUsername =
        name?.toLowerCase().replace(/[^a-z0-9]/g, "") ??
        email.split("@")[0]?.replace(/[^a-z0-9]/g, "") ??
        "user";

    if (baseUsername.length < 3) {
        baseUsername = "user" + baseUsername;
    }

    let username = baseUsername;
    let attempts = 0;

    while (attempts < 10) {
        const existing = await db
            .select({ id: users.id })
            .from(users)
            .where(eq(users.username, username))
            .limit(1)
            .then((rows) => rows[0]);

        if (!existing) return username;

        username = `${baseUsername}${Math.floor(Math.random() * 10000)}`;
        attempts++;
    }

    // Fallback to timestamp if all attempts fail
    return `${baseUsername}${Date.now()}`;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
    // @ts-expect-error - DrizzleAdapter type versions from @auth/core differ slightly
    adapter: DrizzleAdapter(db, {
        usersTable: users,
        accountsTable: accounts,
        sessionsTable: sessions,
        verificationTokensTable: verificationTokens,
    }),

    // ✅ Use database sessions for production stability
    session: {
        strategy: "database",
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
                if (!credentials.email || !credentials.password) return null;

                const email = credentials.email as string;
                const password = credentials.password as string;

                const user = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1)
                    .then((rows) => rows[0]);

                if (!user?.password) return null;

                const passwordMatch = await bcrypt.compare(password, user.password);
                if (!passwordMatch) return null;

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
        // Automatically generate username for Google users
        async createUser({ user }) {
            if (user.id && user.email && !user.username) {
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
        async jwt({ token, user, trigger, account }) {
            // Step 1: attach user info on login
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (user) {
                token.id = user.id;
                token.role = user.role;
                token.username = user.username;
            }

            // Step 2: always refresh data for Google provider or first login
            if ((account?.provider === "google" || trigger === "update") && token.id) {
                const dbUser = await db
                    .select()
                    .from(users)
                    .where(eq(users.id, token.id as string))
                    .limit(1)
                    .then((rows) => rows[0]);

                if (dbUser) {
                    token.username = dbUser.username;
                    token.role = dbUser.role;
                    token.name = dbUser.displayName ?? dbUser.username;
                    token.picture = dbUser.profileImage ?? dbUser.image;
                }
            }

            return token;
        },

        async session({ session, user, token }) {
            // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
            if (session.user) {
                // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                if (user) {
                    session.user.id = user.id;
                    session.user.role = user.role;
                    session.user.username = user.username;
                    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
                } else if (token) {
                    session.user.id = token.id as string;
                    session.user.role = token.role as "admin" | "author" | "user";
                    session.user.username = token.username as string | null;
                }
            }
            return session;
        },
    },

    pages: {
        signIn: "/sign-in",
    },
});