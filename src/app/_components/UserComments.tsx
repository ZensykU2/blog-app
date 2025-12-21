"use client";

import { useState } from "react";
import { MessageSquare, ExternalLink, Calendar } from "lucide-react";
import Link from "next/link";
import { api } from "~/trpc/react";
import { encodeId } from "~/lib/ids";

interface UserCommentsProps {
    userId?: string;
}

export function UserComments({ userId }: UserCommentsProps) {
    const [currentPage] = useState(1);
    const limit = 10;

    const { data: comments, isLoading } = api.comment.getForUser.useQuery({
        userId,
        page: currentPage,
        limit
    });

    if (isLoading) {
        return (
            <div className="space-y-4 animate-pulse">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-panel p-6 rounded-xl h-24 bg-white/5" />
                ))}
            </div>
        );
    }

    if (!comments || comments.length === 0) {
        return (
            <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
                <MessageSquare size={40} className="mx-auto text-slate-500 mb-4 opacity-20" />
                <h3 className="text-xl font-bold text-white mb-2">No comments yet</h3>
                <p className="text-slate-400">Share your thoughts on some posts!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 animate-fade-in">
            {comments.map((comment) => (
                <div key={comment.id} className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-all group">
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                                <Calendar size={12} />
                                <span>
                                    {comment.createdAt.toLocaleDateString()} at {comment.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-white/10">•</span>
                                <span className="text-purple-400 font-medium">On Post:</span>
                            </div>

                            <Link
                                href={`/post/${encodeId(comment.postId)}`}
                                className="text-white font-bold hover:text-purple-400 transition-colors flex items-center gap-2 mb-3"
                            >
                                {comment.post?.title ?? "Unknown Post"}
                                <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Link>

                            <p className="text-slate-300 text-sm leading-relaxed bg-black/20 p-4 rounded-lg border border-white/5 italic">
                                &quot;{comment.content}&quot;
                            </p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}
