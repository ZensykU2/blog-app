"use client";

import { useState, useEffect } from "react";
import { Heart, Bookmark, Share2 } from "lucide-react";
import { api } from "~/trpc/react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";

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
    content: string;
    status: string;
    authorId: string;
    createdAt: Date;
    updatedAt: Date | null;
    author: PostAuthor | null;
    likeCount?: number;
    isLiked?: boolean;
    isBookmarked?: boolean;
}

interface PostListCache {
    posts: Post[];
}

type PostCache = Post | PostListCache;

interface PostInteractionsProps {
    postId: number;
    initialLikes: number;
    isLiked: boolean;
    isBookmarked: boolean;
}

export function PostInteractions({
    postId,
    initialLikes,
    isLiked: initialIsLiked,
    isBookmarked: initialIsBookmarked,
}: PostInteractionsProps) {
    const { data: session } = useSession();
    const queryClient = useQueryClient();
    const [likes, setLikes] = useState(initialLikes);
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [isBookmarked, setIsBookmarked] = useState(initialIsBookmarked);

    useEffect(() => {
        setLikes(initialLikes);
        setIsLiked(initialIsLiked);
        setIsBookmarked(initialIsBookmarked);
    }, [initialLikes, initialIsLiked, initialIsBookmarked]);

    const utils = api.useUtils();

    const toggleLike = api.interaction.togglePostLike.useMutation({
        onMutate: async () => {
            if (!session?.user) {
                toast.error("Please sign in to like posts");
                return;
            }
            const newIsLiked = !isLiked;
            const newLikes = newIsLiked ? likes + 1 : likes - 1;

            setIsLiked(newIsLiked);
            setLikes(newLikes);

            await utils.post.getById.cancel({ id: postId });
            const previousPost = utils.post.getById.getData({ id: postId });

            utils.post.getById.setData({ id: postId }, (old) => {
                if (!old) return old;
                return {
                    ...old,
                    likeCount: newLikes,
                    isLiked: newIsLiked,
                };
            });

            queryClient.setQueriesData<PostCache>(
                { queryKey: ["post"] },
                (old) => {
                    if (!old || typeof old !== "object") return old;

                    if ("posts" in old && Array.isArray(old.posts)) {
                        return {
                            ...old,
                            posts: old.posts.map((p) =>
                                p.id === postId
                                    ? { ...p, isLiked: newIsLiked, likeCount: newLikes }
                                    : p
                            ),
                        };
                    }

                    if ("id" in old && old.id === postId) {
                        return {
                            ...old,
                            isLiked: newIsLiked,
                            likeCount: newLikes,
                        };
                    }

                    return old;
                }
            );

            return { previousPost };
        },
        onSuccess: () => {
            void utils.post.invalidate();
        },
        onError: (err, _variables, context) => {
            if (context?.previousPost) {
                utils.post.getById.setData({ id: postId }, context.previousPost);
            }
            setIsLiked(initialIsLiked);
            setLikes(initialLikes);
            toast.error(err.message);
        },
    });

    const toggleBookmark = api.interaction.togglePostBookmark.useMutation({
        onMutate: async () => {
            if (!session?.user) {
                toast.error("Please sign in to bookmark posts");
                return;
            }
            const newIsBookmarked = !isBookmarked;
            setIsBookmarked(newIsBookmarked);

            await utils.post.getById.cancel({ id: postId });
            const previousPost = utils.post.getById.getData({ id: postId });

            queryClient.setQueriesData<PostCache>(
                { queryKey: ["post"] },
                (old) => {
                    if (!old || typeof old !== "object") return old;

                    if ("posts" in old && Array.isArray(old.posts)) {
                        return {
                            ...old,
                            posts: old.posts.map((p) =>
                                p.id === postId ? { ...p, isBookmarked: newIsBookmarked } : p
                            ),
                        };
                    }

                    if ("id" in old && old.id === postId) {
                        return {
                            ...old,
                            isBookmarked: newIsBookmarked,
                        };
                    }

                    return old;
                }
            );

            return { previousPost };
        },
        onSuccess: (data) => {
            toast.success(
                data.bookmarked ? "Post saved to bookmarks" : "Removed from bookmarks"
            );
            void utils.post.invalidate();
        },
        onError: (err, _variables, context) => {
            if (context?.previousPost) {
                utils.post.getById.setData({ id: postId }, context.previousPost);
            }
            setIsBookmarked(initialIsBookmarked);
            toast.error(err.message);
        },
    });

    const handleShare = () => {
        void navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard!");
    };

    return (
        <div className="flex items-center gap-4 py-6 border-t border-white/5 my-8">
            <button
                onClick={() => { toggleLike.mutate({ postId }); }}
                className={`flex items-center gap-2 transition-all hover:scale-105 cursor-pointer px-4 py-2 rounded-full border ${isLiked ? "bg-pink-500/10 border-pink-500/20 text-pink-500" : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"}`}
            >
                <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                <span className="text-sm font-bold">{likes}</span>
            </button>

            <button
                onClick={() => { toggleBookmark.mutate({ postId }); }}
                className={`flex items-center gap-2 transition-all hover:scale-105 cursor-pointer px-4 py-2 rounded-full border ${isBookmarked ? "bg-yellow-500/10 border-yellow-500/20 text-yellow-500" : "bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"}`}
            >
                <Bookmark size={18} fill={isBookmarked ? "currentColor" : "none"} />
                <span className="text-sm font-bold">
                    {isBookmarked ? "Saved" : "Save"}
                </span>
            </button>

            <div className="flex-1" />

            <button
                onClick={handleShare}
                className="flex items-center gap-2 transition-all hover:scale-105 cursor-pointer px-4 py-2 rounded-full border bg-white/5 border-white/5 text-slate-400 hover:text-slate-200"
                title="Share post"
            >
                <Share2 size={18} />
                <span className="text-sm font-bold hidden sm:inline">Share</span>
            </button>
        </div>
    );
}