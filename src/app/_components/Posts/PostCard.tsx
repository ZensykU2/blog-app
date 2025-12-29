"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Bookmark, Share2, Edit2, Trash2 } from "lucide-react";
import { useSession } from "next-auth/react";
import { useState } from "react";
import { toast } from "react-hot-toast";

import { api } from "~/trpc/react";
import { encodeId } from "~/lib/ids";
import { DeleteConfirmationModal } from "../Shared/DeleteConfirmationModal";
import { MarkdownRenderer } from "../Shared/MarkdownRenderer";
import { extractImages } from "~/lib/post-utils";
import { Lightbox } from "../Shared/Lightbox";

interface PostAuthor {
  id: string | null;
  displayName: string | null;
  username: string | null;
  profileImage: string | null;
  image: string | null;
}

interface Post {
  id: number;
  title: string;
  excerpt: string | null;
  content: string;
  slug: string;
  createdAt: Date;
  readingTime: number | null;
  author: PostAuthor | null;
  likeCount?: number;
  isLiked?: boolean;
  isBookmarked?: boolean;
  tags?: { id: number; name: string; slug: string }[];
}

interface PostListCache {
  posts: Post[];
}

type _PostCache = Post | PostListCache;

interface PostCardProps {
  post: Post;
  priority?: boolean;
}

export function PostCard({ post, priority = false }: PostCardProps) {
  const { data: session } = useSession();
  const utils = api.useUtils();
  const [isLikeAnimating, setIsLikeAnimating] = useState(false);
  const [isBookmarkAnimating, setIsBookmarkAnimating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const isOwner = session?.user?.id === post.author?.id;

  const toggleLike = api.interaction.togglePostLike.useMutation({
    onMutate: async () => {
      if (!session?.user) {
        toast.error("Please sign in to like posts");
        return;
      }
      setIsLikeAnimating(true);

      // Optimistic update
      await utils.post.getAll.cancel();

      utils.post.getAll.setData({ limit: 10 }, (old) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((p) => {
            if (p.id === post.id) {
              return {
                ...p,
                isLiked: !p.isLiked,
                likeCount: (p.likeCount ?? 0) + (p.isLiked ? -1 : 1),
              };
            }
            return p;
          }),
        };
      });
    },
    onSettled: () => {
      setTimeout(() => setIsLikeAnimating(false), 1000);
      void utils.post.getAll.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const toggleBookmark = api.interaction.togglePostBookmark.useMutation({
    onMutate: async () => {
      if (!session?.user) {
        toast.error("Please sign in to bookmark posts");
        return;
      }
      setIsBookmarkAnimating(true);

      // Optimistic update
      utils.post.getAll.setData({ limit: 10 }, (old) => {
        if (!old) return old;
        return {
          ...old,
          posts: old.posts.map((p) => {
            if (p.id === post.id) {
              return {
                ...p,
                isBookmarked: !p.isBookmarked,
              };
            }
            return p;
          }),
        };
      });
    },
    onSettled: () => {
      setTimeout(() => setIsBookmarkAnimating(false), 1000);
      void utils.post.getAll.invalidate();
    },
    onError: (err) => {
      toast.error(err.message);
    }
  });

  const deletePost = api.post.delete.useMutation({
    onSuccess: () => {
      toast.success("Post deleted successfully");
      setShowDeleteModal(false);
      void utils.post.getAll.invalidate();
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const getRelativeTime = (date: Date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    void navigator.clipboard.writeText(`${window.location.origin}/post/${encodeId(post.id)}`);
    toast.success("Link copied to clipboard!");
  };

  const getAuthorName = () => {
    if (!post.author) return "Unknown Author";
    if (post.author.displayName) return post.author.displayName;
    if (post.author.username) return `@${post.author.username}`;
    return "Unknown Author";
  };

  const getProfileImage = () => {
    return post.author?.profileImage ?? post.author?.image ?? null;
  };

  const coverImages = extractImages(post.content, 4);

  return (
    <>
      <div className="h-full relative block">
        <article className="group relative flex flex-col h-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden hover:bg-white/10 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/10">
          {/* Entire card link overlay */}
          <Link
            href={`/post/${encodeId(post.id)}`}
            className="absolute inset-0 z-10"
            aria-label={`Read ${post.title}`}
          />

          {/* Top Bar: Author & Date */}
          <div className="flex items-center justify-between p-4 border-b border-white/5 bg-black/20">
            <div className="flex items-center gap-3 z-20">
              <Link
                href={post.author?.username ? `/profile/${post.author.username}` : "#"}
                className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white/10 group-hover:ring-purple-500/50 transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                {getProfileImage() ? (
                  <Image
                    src={getProfileImage()!}
                    alt={getAuthorName()}
                    fill
                    className="object-cover"
                    sizes="32px"
                  />
                ) : (
                  <div className="w-full h-full bg-purple-500/20 flex items-center justify-center text-purple-200 text-xs font-bold">
                    {getAuthorName()[0]?.toUpperCase()}
                  </div>
                )}
              </Link>
              <div className="flex flex-col">
                <Link
                  href={post.author?.username ? `/profile/${post.author.username}` : "#"}
                  className="text-sm font-semibold text-slate-200 hover:text-purple-400 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  {getAuthorName()}
                </Link>
                <span className="text-[10px] text-slate-500 font-medium">
                  {getRelativeTime(new Date(post.createdAt))}
                </span>
              </div>
            </div>

            {/* Admin/Owner Actions */}
            {isOwner && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                <Link href={`/edit/${encodeId(post.id)}`} onClick={(e) => e.stopPropagation()}>
                  <button className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer">
                    <Edit2 size={14} />
                  </button>
                </Link>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setShowDeleteModal(true);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col flex-1 p-5 min-h-0">
            {/* Title */}
            <div className="mb-2">
              <h3 className="text-2xl font-bold text-slate-100 line-clamp-2 leading-tight group-hover:text-purple-300 transition-colors">
                {post.title}
              </h3>
            </div>

            {/* Content Preview */}
            <div className="mb-3 overflow-hidden mask-image-b min-h-0 relative">
              <div className="line-clamp-3 text-slate-400 text-base leading-relaxed pointer-events-none">                <MarkdownRenderer content={post.content} variant="sm" />
              </div>
            </div>

            {/* Cover Images */}
            {coverImages.length > 0 && (
              <div className={`mb-3 overflow-hidden rounded-xl ${coverImages.length === 1 ? '' :
                coverImages.length === 2 ? 'grid grid-cols-2 gap-2' :
                  coverImages.length === 3 ? 'grid grid-cols-3 gap-2' :
                    'grid grid-cols-2 gap-2'
                }`}>
                {coverImages.map((image, index) => (
                  <div
                    key={index}
                    className={`relative overflow-hidden rounded-lg cursor-pointer z-20 ${coverImages.length === 1 ? 'aspect-[3/2]' :
                      coverImages.length === 4 ? 'aspect-square' :
                        'aspect-[3/2]'
                      }`}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLightboxIndex(index);
                    }}
                  >
                    <Image
                      src={image}
                      alt={`${post.title} - Image ${index + 1}`}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      priority={priority && index === 0}
                    />
                  </div>
                ))}
              </div>
            )}
            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3 flex-shrink-0 relative z-20">
                {post.tags.slice(0, 3).map(tag => (
                  <span key={tag.id} className="text-xs px-3 py-1 rounded-full bg-purple-500/10 text-purple-300 border border-purple-500/20 font-medium">
                    {tag.name}
                  </span>
                ))}
                {post.tags.length > 3 && (
                  <span className="text-xs text-slate-500 font-medium">+{post.tags.length - 3}</span>
                )}
              </div>
            )}

            {/* Footer */}
            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs font-medium text-slate-500 relative z-20">
              <div className="flex items-center gap-4">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleLike.mutate({ postId: post.id });
                  }}
                  className={`flex items-center gap-1.5 transition-colors ${post.isLiked ? "text-pink-500" : "hover:text-pink-400"}`}
                >
                  <Heart
                    size={14}
                    className={`${isLikeAnimating ? "animate-ping" : ""} ${post.isLiked ? "fill-current" : ""}`}
                  />
                  <span>{post.likeCount}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleBookmark.mutate({ postId: post.id });
                  }}
                  className={`transition-colors ${post.isBookmarked ? "text-yellow-400" : "hover:text-yellow-400"}`}
                >
                  <Bookmark
                    size={14}
                    className={`${isBookmarkAnimating ? "animate-bounce" : ""} ${post.isBookmarked ? "fill-current" : ""}`}
                  />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <span>{Math.max(1, post.readingTime ?? 0)} min read</span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleShare(e);
                  }}
                  className="hover:text-white transition-colors"
                >
                  <Share2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      <Lightbox
        images={lightboxIndex !== null ? coverImages : []}
        initialIndex={lightboxIndex ?? 0}
        onClose={() => setLightboxIndex(null)}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={() => deletePost.mutate({ id: post.id })}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        isDeleting={deletePost.isPending}
      />
    </>
  );
}