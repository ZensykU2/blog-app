import "dotenv/config";
import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

async function makeAdmin(email: string) {
    await db
        .update(users)
        .set({ role: "admin" })
        .where(eq(users.email, email));

    console.log(`Command executed for ${email}. Check database for confirmation.`);

    process.exit(0);
}

const email = process.argv[2];
if (!email) {
    console.error("Usage: npx tsx scripts/make-admin.ts <email>");
    process.exit(1);
}

void makeAdmin(email);