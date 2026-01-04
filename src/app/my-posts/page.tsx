import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";

import { PostGrid } from "~/app/_components/Posts/PostGrid";

export const dynamic = 'force-dynamic';

export default async function MyPosts() {
  const session = await auth();
  const userId = session?.user.id;

  if (!userId) {
    redirect("/");
  }

  return (
    <main className="container mx-auto px-4 py-8 animate-slide-up">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            My <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Posts</span>
          </h1>
          <p className="text-slate-400">Manage and view your published stories</p>
        </div>

        <Link href="/create">
          <button className="flex items-center gap-2 rounded-full bg-white text-slate-900 px-6 py-3 font-bold hover:bg-slate-200 transition-all shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 cursor-pointer">
            <Plus size={20} />
            New Post
          </button>
        </Link>
      </div>

      <div className="mb-8">
        <Link href="/">
          <button className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors cursor-pointer group">
            <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
            Back to Feed
          </button>
        </Link>
      </div>

      <PostGrid userId={userId} />
    </main>
  );
}