import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { PostGrid } from "~/app/_components/PostGrid";

export default async function MyPosts() {
  const { userId } = await auth();
  
  if (!userId) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-4">
          <h1 className="text-4xl font-bold">
            My <span className="text-[hsl(280,100%,70%)]">Posts</span>
          </h1>
          
          <Link href="/create">
            <button className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 transition">
              <Plus size={20} />
              New Post
            </button>
          </Link>
        </div>

        <div className="mb-8">
          <Link href="/">
            <button className="flex items-center gap-2 text-white/70 hover:text-white transition">
              <ArrowLeft size={20} />
              Back to Feed
            </button>
          </Link>
        </div>

        <PostGrid userId={userId} />
      </div>
    </main>
  );
}