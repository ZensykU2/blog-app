"use client";

import { useEffect, useRef } from "react";
import { useInView } from "react-intersection-observer";
import { PostCard } from "./PostCard";
import { api } from "~/trpc/react";

interface PostGridProps {
  userId?: string;
  type?: "all" | "user" | "liked" | "bookmarked";
}

export function PostGrid({ userId, type = "all" }: PostGridProps) {
  const { ref, inView } = useInView();
  const limit = 10;

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status
  } = (
      type === "all" ? api.post.getAll.useInfiniteQuery({ limit }, { getNextPageParam: (lastPage) => lastPage.nextCursor }) :
        type === "user" ? api.post.getByUser.useInfiniteQuery({ userId, limit }, { getNextPageParam: (lastPage) => lastPage.nextCursor }) :
          type === "liked" ? api.post.getLikedByUser.useInfiniteQuery({ userId, limit }, { getNextPageParam: (lastPage) => lastPage.nextCursor }) :
            api.post.getBookmarkedByUser.useInfiniteQuery({ userId, limit }, { getNextPageParam: (lastPage) => lastPage.nextCursor })
    );

  useEffect(() => {
    if (inView && hasNextPage && !isFetchingNextPage) {
      void fetchNextPage();
    }
  }, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="glass-panel h-64 rounded-2xl p-6 animate-pulse border border-white/5 opacity-50">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 bg-white/10 rounded-full"></div>
              <div className="h-4 w-32 bg-white/10 rounded"></div>
            </div>
            <div className="h-8 bg-white/10 rounded mb-4 w-3/4"></div>
            <div className="h-4 bg-white/10 rounded mb-2"></div>
            <div className="h-4 bg-white/10 rounded mb-2 w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const posts = data?.pages.flatMap((page) => page.posts) ?? [];

  if (status === "success" && posts.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-in max-w-2xl mx-auto">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/5 mb-4 border border-white/10">
          <div className="w-8 h-8 rounded-sm bg-white/20"></div>
        </div>
        <h3 className="text-xl font-bold text-white mb-2">No posts found</h3>
        <p className="text-slate-400">Be the first to share a story!</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto pb-20">
      <div className="flex flex-col gap-6">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>

      {/* Observer element */}
      <div ref={ref} className="h-10 flex items-center justify-center mt-8">
        {isFetchingNextPage && (
          <div className="flex items-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">Loading more...</span>
          </div>
        )}
      </div>
    </div>
  );
}
