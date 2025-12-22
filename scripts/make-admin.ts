import "dotenv/config";
import { env } from "~/env";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

async function makeAdmin(email: string) {
    if (!env.DATABASE_URL) {
        console.error("Missing DATABASE_URL in environment.");
        process.exit(1);
    }

    const result = await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.email, email));

    if (result) {
        console.log(`User ${email} promoted to admin.`);
    } else {
        console.log(`No user found with email ${email}.`);
    }

    process.exit(0);
}

const email = process.argv[2];
if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
}

void makeAdmin(email);