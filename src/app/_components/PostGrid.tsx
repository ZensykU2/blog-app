"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { PostCard } from "./PostCard";
import { api } from "~/trpc/react";

interface PostGridProps {
  userId?: string;
  showAllPosts?: boolean;
}

export function PostGrid({ userId, showAllPosts = false }: PostGridProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 8;

  const { data, isLoading, refetch } = showAllPosts
    ? api.post.getAll.useQuery({ page: currentPage, limit })
    : api.post.getByUser.useQuery({ userId, page: currentPage, limit });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="rounded-lg bg-white/10 p-6 animate-pulse">
            <div className="h-6 bg-white/20 rounded mb-2"></div>
            <div className="h-4 bg-white/20 rounded mb-4"></div>
            <div className="h-3 bg-white/20 rounded"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data?.posts.length) {
    return (
      <div className="text-center py-12">
        <p className="text-white/70 text-lg">No posts found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {data.posts.map((post) => (
          <PostCard key={post.id} post={post} onDelete={() => refetch()} />
        ))}
      </div>

      {data.totalCount > limit && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
          >
            <ChevronLeft size={16} />
            Previous
          </button>
          
          <span className="text-white/70">
            Page {currentPage} of {Math.ceil(data.totalCount / limit)}
          </span>
          
          <button
            onClick={() => setCurrentPage(prev => prev + 1)}
            disabled={!data.hasMore}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 transition disabled:opacity-50"
          >
            Next
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}