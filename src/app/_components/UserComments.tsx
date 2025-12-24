"use client";

import { useMemo } from "react";
import {
    MessageSquare,
    ExternalLink,
    Calendar,
    ChevronDown,
    Loader2,
} from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { encodeId } from "~/lib/ids";

interface UserCommentsProps {
    userId?: string;
}

interface Comment {
    id: number;
    content: string;
    createdAt: Date;
    postId: number;
    post: { id: number; title: string } | null;
}

interface GroupedComments {
    postId: number;
    postTitle: string;
    comments: Comment[];
}

function groupConsecutiveComments(comments: Comment[]): GroupedComments[] {
    if (comments.length === 0) return [];

    const groups: GroupedComments[] = [];
    let currentGroup: GroupedComments | null = null;

    for (const comment of comments) {
        if (!currentGroup || currentGroup.postId !== comment.postId) {
            currentGroup = {
                postId: comment.postId,
                postTitle: comment.post?.title ?? "Unknown Post",
                comments: [comment],
            };
            groups.push(currentGroup);
        } else {
            currentGroup.comments.push(comment);
        }
    }

    return groups;
}

export function UserComments({ userId }: UserCommentsProps) {
    const limit = 10;

    const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
        api.comment.getForUser.useInfiniteQuery(
            { userId, limit },
            {
                getNextPageParam: (lastPage) => lastPage.nextCursor,
            }
        );

    const allComments = useMemo(
        () => data?.pages.flatMap((page) => page.items) ?? [],
        [data]
    );

    const groupedComments = useMemo(
        () => groupConsecutiveComments(allComments),
        [allComments]
    );

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="glass-panel p-6 rounded-xl h-24 bg-white/5"
                    />
                ))}
            </div>
        );
    }

    if (allComments.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <MessageSquare
                    size={40}
                    className="mx-auto text-slate-500 mb-4 opacity-20"
                />
                <h3 className="text-xl font-bold text-white mb-2">
                    No comments yet
                </h3>
                <p className="text-slate-400">
                    Share your thoughts on some posts!
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {groupedComments.map((group) => (
                <div
                    key={`${group.postId}-${group.comments[0]?.id}`}
                    className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all group"
                >
                    <div className="flex items-center gap-2 text-xs text-slate-500 mb-3">
                        <span className="text-purple-400 font-medium">
                            On Post:
                        </span>
                        <Link
                            href={`/post/${encodeId(group.postId)}`}
                            className="text-white font-bold hover:text-purple-400 transition-colors flex items-center gap-2"
                        >
                            {group.postTitle}
                            <ExternalLink
                                size={14}
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                            />
                        </Link>
                        {group.comments.length > 1 && (
                            <span className="ml-auto bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full text-xs">
                                {group.comments.length} comments
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {group.comments.map((comment) => (
                            <div
                                key={comment.id}
                                className="bg-black/20 p-4 rounded-lg border border-white/5"
                            >
                                <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                    <Calendar size={12} />
                                    <span>
                                        {comment.createdAt.toLocaleDateString()}{" "}
                                        at{" "}
                                        {comment.createdAt.toLocaleTimeString(
                                            [],
                                            {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            }
                                        )}
                                    </span>
                                </div>
                                <p className="text-slate-300 text-sm leading-relaxed italic">
                                    &quot;{comment.content}&quot;
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            ))}

            {hasNextPage && (
                <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="w-full py-3 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isFetchingNextPage ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Loading...
                        </>
                    ) : (
                        <>
                            <ChevronDown size={16} />
                            Show more comments
                        </>
                    )}
                </button>
            )}
        </div>
    );
}