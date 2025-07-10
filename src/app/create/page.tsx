import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import { PostEditor } from "~/app/_components/PostEditor";

export default async function CreatePost() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto px-4 py-8">
        <PostEditor />
      </div>
    </main>
  );
}