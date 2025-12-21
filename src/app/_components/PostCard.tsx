"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Edit2, Trash2, User, Heart, Bookmark } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";
import { getQueryKey } from "@trpc/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { encodeId } from "~/lib/ids";

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
    likeCount?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
  };
  onDelete?: () => void;
}

import { DeleteConfirmationModal } from "./DeleteConfirmationModal";

export function PostCard({ post, onDelete }: PostCardProps) {
  const { user } = useUser();
  const router = useRouter();
  const queryClient = useQueryClient();
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

  const [likes, setLikes] = useState(post.likeCount ?? 0);
  const [isLiked, setIsLiked] = useState(post.isLiked ?? false);
  const [isBookmarked, setIsBookmarked] = useState(post.isBookmarked ?? false);

  useEffect(() => {
    setLikes(post.likeCount ?? 0);
    setIsLiked(post.isLiked ?? false);
    setIsBookmarked(post.isBookmarked ?? false);
  }, [post.likeCount, post.isLiked, post.isBookmarked]);

  const toggleLike = api.interaction.togglePostLike.useMutation({
    onMutate: async () => {
      if (!user) {
        toast.error("Please sign in to like posts");
        return;
      }
      const newIsLiked = !isLiked;
      const newLikes = newIsLiked ? likes + 1 : likes - 1;

      setIsLiked(newIsLiked);
      setLikes(newLikes);

      // Also update the individual post cache if it exists
      await utils.post.getById.cancel({ id: post.id });
      const previousPostById = utils.post.getById.getData({ id: post.id });

      utils.post.getById.setData({ id: post.id }, (old) => {
        if (!old) return old;
        return {
          ...old,
          likeCount: newLikes,
          isLiked: newIsLiked,
        };
      });

      // Update ALL feed queries
      const feedKey = getQueryKey(api.post.getAll, undefined, "query");
      queryClient.setQueriesData({ queryKey: feedKey }, (old: unknown) => {
        if (!old) return old;
        const data = old as {
          posts: Array<{ id: number; isLiked?: boolean; likeCount?: number }>;
          totalCount: number;
          hasMore: boolean
        };
        return {
          ...data,
          posts: data.posts.map((p) =>
            p.id === post.id ? { ...p, isLiked: newIsLiked, likeCount: newLikes } : p
          )
        };
      });

      return { previousPostById };
    },
    onSuccess: async () => {
      void utils.post.invalidate();
    },
    onError: (err, variables, context) => {
      if (context?.previousPostById) {
        utils.post.getById.setData({ id: post.id }, context.previousPostById);
      }
      setIsLiked(post.isLiked ?? false);
      setLikes(post.likeCount ?? 0);
    }
  });

  const toggleBookmark = api.interaction.togglePostBookmark.useMutation({
    onMutate: async () => {
      if (!user) {
        toast.error("Please sign in to save posts");
        return;
      }
      const newIsBookmarked = !isBookmarked;
      setIsBookmarked(newIsBookmarked);

      await utils.post.getById.cancel({ id: post.id });
      const previousPostById = utils.post.getById.getData({ id: post.id });

      utils.post.getById.setData({ id: post.id }, (old) => {
        if (!old) return old;
        return {
          ...old,
          isBookmarked: newIsBookmarked,
        };
      });

      // Update ALL feed queries
      const feedKey = getQueryKey(api.post.getAll, undefined, "query");
      queryClient.setQueriesData({ queryKey: feedKey }, (old: unknown) => {
        if (!old) return old;
        const data = old as {
          posts: Array<{ id: number; isBookmarked?: boolean }>;
          totalCount: number;
          hasMore: boolean
        };
        return {
          ...data,
          posts: data.posts.map((p) =>
            p.id === post.id ? { ...p, isBookmarked: newIsBookmarked } : p
          )
        };
      });

      return { previousPostById };
    },
    onSuccess: async (data) => {
      toast.success(data.bookmarked ? "Post saved to bookmarks" : "Removed from bookmarks");
      void utils.post.invalidate();
    },
    onError: (err, variables, context) => {
      if (context?.previousPostById) {
        utils.post.getById.setData({ id: post.id }, context.previousPostById);
      }
      setIsBookmarked(post.isBookmarked ?? false);
    }
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
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                router.push(`/edit/${encodeId(post.id)}`);
              }}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition backdrop-blur-md border border-white/10 cursor-pointer"
              title="Edit post"
            >
              <Edit2 size={16} className="text-purple-300" />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setIsModalOpen(true);
              }}
              className="p-2 rounded-full bg-red-500/10 hover:bg-red-500/20 transition backdrop-blur-md border border-white/10 cursor-pointer"
              title="Delete post"
            >
              <Trash2 size={16} className="text-red-300" />
            </button>
          </div>
        )}

        <Link href={`/post/${encodeId(post.id)}`} className="flex flex-col h-full relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative">
              {post.author?.profileImage ? (
                <Image
                  src={post.author.profileImage}
                  alt={getAuthorName()}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full ring-2 ring-white/10 object-cover"
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
            <div className="flex items-center gap-4">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user) return toast.error("Please sign in to like posts");
                  toggleLike.mutate({ postId: post.id });
                }}
                className={`flex items-center gap-1.5 transition-colors hover:text-pink-400 ${isLiked ? "text-pink-500" : "text-slate-400"}`}
              >
                <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                <span className="text-xs font-bold">{likes}</span>
              </button>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (!user) return toast.error("Please sign in to save posts");
                  toggleBookmark.mutate({ postId: post.id });
                }}
                className={`flex items-center transition-colors hover:text-yellow-400 ${isBookmarked ? "text-yellow-500" : "text-slate-400"}`}
              >
                <Bookmark size={16} fill={isBookmarked ? "currentColor" : "none"} />
              </button>
            </div>

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