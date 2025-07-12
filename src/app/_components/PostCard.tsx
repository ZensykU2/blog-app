"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { Edit2, Trash2, User } from "lucide-react";
import Link from "next/link";

import { api } from "~/trpc/react";

interface PostCardProps {
  post: {
    id: number;
    title: string;
    content: string;
    status: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date | null;
    author: {
      id: string | null;
      displayName: string | null;
      username: string | null;
      profileImage: string | null;
    } | null;
  };
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
  const getAuthorName = () => {
    if (!post.author) return "Unknown Author";
    if (post.author.displayName) return post.author.displayName;
    if (post.author.username) return `@${post.author.username}`;
    return "Unknown Author";
  };

  return (
    <div 
      className="relative rounded-lg bg-white/10 p-6 hover:bg-white/15 transition-all duration-200 cursor-pointer flex flex-col h-[280px]"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {isOwner && isHovered && (
        <div className="absolute top-4 right-4 flex gap-2 z-10">
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

      <Link href={`/post/${post.id}`} className="flex flex-col h-full">
        <div className="flex items-center gap-2 mb-3 h-6">
          {post.author?.profileImage ? (
            <img 
              src={post.author.profileImage} 
              alt={getAuthorName()}
              className="w-5 h-5 rounded-full"
            />
          ) : (
            <User size={16} className="text-white/60" />
          )}
          <span className="text-xs text-white/60 font-medium truncate">
            {getAuthorName()}
          </span>
        </div>

        <div className="mb-3 h-14">
          <h3 className="font-semibold text-white text-xl line-clamp-2 leading-tight">
            {post.title}
          </h3>
        </div>

        <div className="flex-1 mb-4 overflow-hidden">
          <p className="text-white/80 text-sm line-clamp-6 leading-relaxed">
            {post.content.substring(0, 100)}...
          </p>
        </div>

        <div className="flex items-center justify-between text-xs text-white/60 mt-auto pt-2 border-t border-white/10">
          <span>{post.createdAt.toLocaleDateString()}</span>
          <div className="flex items-center gap-2">
            <span className="px-2 py-1 bg-green-600/20 text-green-400 rounded">
              {post.status}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}