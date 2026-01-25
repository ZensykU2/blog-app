import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function cleanup() {
    try {
        console.log("Cleaning up large profile images...");

        // Update users where profileImage is a base64 string or extremely long
        const result = await sql`
      UPDATE "blog-app_user"
      SET "profileImage" = NULL
      WHERE "profileImage" LIKE 'data:%' OR length("profileImage") > 5000;
    `;

        console.log(`Cleanup complete. Rows affected: ${result.count}`);

        // Verify
        const remaining = await sql`
      SELECT id, username, length("profileImage") as prof_len
      FROM "blog-app_user"
      WHERE "profileImage" LIKE 'data:%' OR length("profileImage") > 5000;
    `;

        if (remaining.length > 0) {
            console.log("Warning: some large images remain:", remaining);
        } else {
            console.log("No large images remain in the database.");
        }

    } catch (e) {
        console.error("Cleanup failed:", e);
    } finally {
        await sql.end();
    }
}

cleanup();
