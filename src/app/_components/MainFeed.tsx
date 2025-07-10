import Link from "next/link";
import { Plus, FileText } from "lucide-react";

import { PostGrid } from "./PostGrid";

export function MainFeed() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container mx-auto px-4 py-8">

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">
            Your <span className="text-[hsl(280,100%,70%)]">Feed</span>
          </h1>
          
          <div className="flex items-center gap-4">
            <Link href="/my-posts">
              <button className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 font-semibold hover:bg-white/20 transition">
                <FileText size={20} />
                My Posts
              </button>
            </Link>
            
            <Link href="/create">
              <button className="flex items-center gap-2 rounded-full bg-purple-600 px-6 py-3 font-semibold hover:bg-purple-700 transition">
                <Plus size={20} />
                New Post
              </button>
            </Link>
          </div>
        </div>

        <PostGrid showAllPosts={true} />
      </div>
    </main>
  );
}