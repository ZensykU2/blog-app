"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PostCard } from "./PostCard";
import { api } from "~/trpc/react";

interface PostGridProps {
  userId?: string;
  type?: "all" | "user" | "liked" | "bookmarked";
}

export function PostGrid({ userId, type = "user" }: PostGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 8;

  const { data, isLoading, refetch } =
    type === "all" ? api.post.getAll.useQuery({ page: currentPage, limit }) :
      type === "user" ? api.post.getByUser.useQuery({ userId, page: currentPage, limit }) :
        type === "liked" ? api.post.getLikedByUser.useQuery({ userId, page: currentPage, limit }) :
          api.post.getBookmarkedByUser.useQuery({ userId, page: currentPage, limit });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass-panel h-[320px] rounded-xl p-6 animate-pulse">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-8 w-8 bg-white/10 rounded-full"></div>
              <div className="h-4 w-24 bg-white/10 rounded"></div>
            </div>
            <div className="h-8 bg-white/10 rounded mb-4"></div>
            <div className="h-4 bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-white/10 rounded mb-2 w-2/3"></div>
            <div className="mt-auto pt-6 border-t border-white/5 flex justify-between">
              <div className="h-6 w-16 bg-white/10 rounded"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!data?.posts.length) {
    return (
      <div className="text-center py-20 animate-fade-in">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4">
          <div className="w-8 h-8 rounded-sm bg-white/20"></div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No posts found</h3>
        <p className="text-slate-400">Be the first to share a story!</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
        {data.posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {data.totalCount > limit && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="glass-button flex items-center gap-2 px-6 py-3 rounded-full text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10"
          >
            <ChevronLeft size={16} />
            Previous
          </button>

          <span className="text-slate-400 font-medium">
            Page {currentPage} of {Math.ceil(data.totalCount / limit)}
          </span>

          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!data.hasMore}
            className="glass-button flex items-center gap-2 px-6 py-3 rounded-full text-slate-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/10"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}