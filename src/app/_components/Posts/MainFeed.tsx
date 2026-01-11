import Link from "next/link";
import { Plus } from "lucide-react";

import { PostGrid } from "./PostGrid";

export function MainFeed() {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-white mb-2">
            Your <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Feed</span>
          </h1>
          <p className="text-slate-400 hidden md:inline">Discover the latest stories from the community</p>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/create">
            <button className="flex items-center gap-2 rounded-full bg-white text-slate-900 p-3 md:px-6 md:py-3 font-bold hover:bg-slate-200 transition-all shadow-lg hover:shadow-white/20 hover:-translate-y-0.5 cursor-pointer">
              <Plus size={20} />
              <span className="hidden md:inline">New Post</span>
            </button>
          </Link>
        </div>
      </div>

      <PostGrid type="all" />
    </div>
  );
}