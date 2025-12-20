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

import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

export function PostCard({ post, onDelete, hideStatus = false }: PostCardProps & { hideStatus?: boolean }) {
  const { user } = useUser();
  const [isHovered, setIsHovered] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const utils = api.useUtils();

  const deletePost = api.post.delete.useMutation({
    onSuccess: async () => {
      await utils.post.invalidate();
      onDelete?.();
      setIsModalOpen(false);
    },
  });

  const isOwner = user?.id === post.authorId;
  const getAuthorName = () => {
    if (!post.author) return "Unknown Author";
    if (post.author.displayName) return post.author.displayName;
    if (post.author.username) return `@${post.author.username}`;
    return "Unknown Author";
  };

  const handleDelete = () => {
    deletePost.mutate({ id: post.id });
  };

  return (
    <>
      <div
        className="glass-panel group relative rounded-xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-purple-500/10 hover:border-purple-500/30 flex flex-col h-[320px] overflow-hidden"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="absolute top-0 right-0 p-32 bg-purple-500/10 blur-[80px] rounded-full -translate-y-1/2 translate-x-1/2 group-hover:bg-purple-500/20 transition-all duration-700"></div>

        {isOwner && isHovered && (
          <div className="absolute top-4 right-4 flex gap-2 z-20 animate-fade-in">
            <Link href={`/edit/${post.id}`}>
              <button className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10 cursor-pointer">
                <Edit2 size={16} className="text-purple-300" />
              </button>
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 transition backdrop-blur-md border border-white/10 cursor-pointer"
            >
              <Trash2 size={16} className="text-red-300" />
            </button>
          </div>
        )}

        <Link href={`/post/${post.id}`} className="flex flex-col h-full relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              {post.author?.profileImage ? (
                <img
                  src={post.author.profileImage}
                  alt={getAuthorName()}
                  className="w-8 h-8 rounded-full ring-2 ring-white/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-white/5 ring-2 ring-white/10 flex items-center justify-center">
                  <User size={14} className="text-white/40" />
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <span className="text-sm text-slate-200 font-medium truncate leading-none mb-1">
                {getAuthorName()}
              </span>
              <span className="text-xs text-slate-400">
                {post.createdAt.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <h3 className="font-bold text-slate-100 text-xl line-clamp-2 leading-tight group-hover:text-purple-300 transition-colors">
              {post.title}
            </h3>
          </div>

          <div className="flex-1 mb-4 overflow-hidden mask-image-b">
            <p className="text-slate-400 text-sm leading-relaxed line-clamp-4">
              {post.content}
            </p>
          </div>

          <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
            {!hideStatus && (
              <span className={`px-2.5 py-1 rounded-md text-xs font-medium border ${post.status === 'published'
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400'
                }`}>
                {post.status.charAt(0).toUpperCase() + post.status.slice(1)}
              </span>
            )}
            {hideStatus && <span></span>} {/* Spacer if status hidden */}

            <span className="text-xs text-purple-400 font-medium group-hover:translate-x-1 transition-transform">
              Read blog →
            </span>
          </div>
        </Link>
      </div>

      <DeleteConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDelete}
        isDeleting={deletePost.isPending}
      />
    </>
  );
}