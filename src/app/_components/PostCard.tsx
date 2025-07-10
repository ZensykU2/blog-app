"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Edit2, Trash2 } from "lucide-react";
import Link from "next/link";

import { api } from "~/trpc/react";
import type { Post } from "~/server/db/schema";

interface PostCardProps {
  post: Post;
  onDelete?: () => void;
}

export function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useUser();
  const [isHovered, setIsHovered] = useState(false);
  const utils = api.useUtils();

  const deletePost = api.post.delete.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      onDelete?.();
    },
  });

  const isOwner = user?.id === post.authorId;

  return (
    <div 
      className="relative rounded-lg bg-white/10 p-6 hover:bg-white/15 transition-all duration-200 cursor-pointer"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isOwner && isHovered && (
        <div className="absolute top-4 right-4 flex gap-2">
          <Link href={`/edit/${post.id}`}>
            <button className="p-2 rounded-full bg-purple-600/20 hover:bg-purple-600/40 transition backdrop-blur-sm">
              <Edit2 size={16} className="text-purple-300" />
            </button>
          </Link>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm("Are you sure you want to delete this post?")) {
                deletePost.mutate({ id: post.id });
              }
            }}
            className="p-2 rounded-full bg-red-600/20 hover:bg-red-600/40 transition backdrop-blur-sm"
          >
            <Trash2 size={16} className="text-red-300" />
          </button>
        </div>
      )}

      <Link href={`/post/${post.id}`}>
        <div>
          <h3 className="font-semibold text-white text-xl mb-2">{post.title}</h3>
          <p className="text-white/80 text-sm mb-4 line-clamp-3">
            {post.content.substring(0, 150)}...
          </p>
          <div className="flex items-center justify-between text-xs text-white/60">
            <span>{post.createdAt.toLocaleDateString()}</span>
            <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded">
              {post.status}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}