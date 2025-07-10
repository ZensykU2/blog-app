import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { Webhook } from "svix";

import { db } from "~/server/db";
import { users } from "~/server/db/schema";
import { eq } from "drizzle-orm";

const webhookSecret = process.env.CLERK_WEBHOOK_SECRET;

export async function POST(req: Request) {
  if (!webhookSecret) {
    throw new Error("Missing CLERK_WEBHOOK_SECRET");
  }

  const headerPayload = await headers();
  const svix_id = headerPayload.get("svix-id");
  const svix_timestamp = headerPayload.get("svix-timestamp");
  const svix_signature = headerPayload.get("svix-signature");

  if (!svix_id || !svix_timestamp || !svix_signature) {
    return new Response("Error occurred -- no svix headers", {
      status: 400,
    });
  }

  const payload = await req.json();
  const body = JSON.stringify(payload);

  const wh = new Webhook(webhookSecret);

  let evt;

  try {
    evt = wh.verify(body, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    }) as any;
  } catch (err) {
    console.error("Error verifying webhook:", err);
    return new Response("Error occurred", {
      status: 400,
    });
  }

  // Handle the webhook
  const eventType = evt.type;

  if (eventType === "user.created") {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

    try {
      await db.insert(users).values({
        id: id,
        clerkId: id,
        email: email_addresses[0]?.email_address ?? "",
        username: username ?? `user_${id.slice(0, 8)}`,
        displayName: first_name && last_name ? `${first_name} ${last_name}` : first_name ?? username ?? "User",
        profileImage: image_url,
        role: "user",
        isVerified: false,
        emailVerified: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("✅ User created:", id);
    } catch (error) {
      console.error("❌ Error creating user:", error);
      return new Response("Error creating user", { status: 500 });
    }
  }

  if (eventType === "user.updated") {
    const { id, email_addresses, username, first_name, last_name, image_url } = evt.data;

    try {
      await db.update(users)
        .set({
          email: email_addresses[0]?.email_address ?? "",
          username: username ?? `user_${id.slice(0, 8)}`,
          displayName: first_name && last_name ? `${first_name} ${last_name}` : first_name ?? username ?? "User",
          profileImage: image_url,
          updatedAt: new Date(),
        })
        .where(eq(users.clerkId, id));

      console.log("✅ User updated:", id);
    } catch (error) {
      console.error("❌ Error updating user:", error);
      return new Response("Error updating user", { status: 500 });
    }
  }

  if (eventType === "user.deleted") {
    const { id } = evt.data;

    try {
      await db.delete(users).where(eq(users.clerkId, id));
      console.log("✅ User deleted:", id);
    } catch (error) {
      console.error("❌ Error deleting user:", error);
      return new Response("Error deleting user", { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}