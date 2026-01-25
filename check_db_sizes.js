import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL, { ssl: 'require' });

async function check() {
    try {
        const users = await sql`
      SELECT id, username, length(image) as img_len, length("profileImage") as prof_len
      FROM "blog-app_user"
      ORDER BY GREATEST(coalesce(length(image),0), coalesce(length("profileImage"),0)) DESC
      LIMIT 10;
    `;
        console.log(JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await sql.end();
    }
}

check();
