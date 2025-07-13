import { clerkClient } from "@clerk/nextjs/server";

export async function getClerkUser(userId: string) {
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    return {
      id: user.id,
      displayName: user.fullName ?? null,
      username: user.username ?? `user_${user.id.slice(0, 8)}`, 
      profileImage: user.imageUrl ?? null,
    };
  } catch (error) {
    console.error("Failed to fetch user from Clerk:", error);
    return null; 
  }
}