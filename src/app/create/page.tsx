import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { PostEditor } from "../../app/_components/PostEditor";

export default async function CreatePost() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <main className="container mx-auto px-4 py-8 animate-slide-up">
      <PostEditor />
    </main>
  );
}