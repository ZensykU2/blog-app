"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { CommentForm } from "./CommentForm";
import { CommentItem, type CommentWithReplies } from "./CommentItem";
import { MessageSquare, ArrowLeft } from "lucide-react";

interface CommentListProps {
    postId: number;
    postAuthorId: string;
}

export function CommentList({ postId, postAuthorId }: CommentListProps) {
    const { data: comments, isLoading, refetch } = api.comment.getByPostId.useQuery({ postId });
    const [visibleCommentsCount, setVisibleCommentsCount] = useState(5);
    const [activeThread, setActiveThread] = useState<CommentWithReplies | null>(null);

    return (
        <div id="comments-section" className="mt-16 pt-12 border-t border-white/10">
            <div className="flex items-center gap-3 mb-8">
                <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400">
                    <MessageSquare size={24} />
                </div>
                <h2 className="text-2xl font-bold text-white">
                    Comments {comments ? `(${comments.length})` : ""}
                </h2>
            </div>

            <CommentForm postId={postId} onCommentAdded={() => void refetch()} />

            {isLoading ? (
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="glass-panel p-4 rounded-xl h-24 animate-pulse flex gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="w-32 h-4 bg-white/10 rounded" />
                                <div className="w-full h-12 bg-white/5 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : comments?.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                    No comments yet. Be the first to share your thoughts!
                </div>
            ) : (
                <div className="space-y-6">
                    {(() => {
                        const commentMap = new Map<number, CommentWithReplies>();
                        comments?.forEach(c => commentMap.set(c.id, { ...c, replies: [] }));

                        const rootComments: CommentWithReplies[] = [];
                        comments?.forEach(c => {
                            const mappedComment = commentMap.get(c.id);
                            if (!mappedComment) return;

                            if (c.parentId && commentMap.has(c.parentId)) {
                                const parent = commentMap.get(c.parentId);
                                if (parent) {
                                    parent.replies ??= [];
                                    parent.replies.push(mappedComment);
                                }
                            } else {
                                rootComments.push(mappedComment);
                            }
                        });

                        const hasMoreComments = rootComments.length > visibleCommentsCount;
                        const displayedRootComments = rootComments.slice(0, visibleCommentsCount);

                        return (
                            <div className="space-y-6">
                                {/* Thread View */}
                                {activeThread && (
                                    <div className="space-y-6 animate-fade-in mb-12">
                                        <div className="flex items-center justify-between mb-4 sticky top-[73px] z-500 py-3 px-1 -mx-1 border-b border-white/5">
                                            <button
                                                onClick={() => {
                                                    const commentId = activeThread.id;
                                                    setActiveThread(null);
                                                    // Precise scroll to the original comment
                                                    setTimeout(() => {
                                                        const element = document.getElementById(`comment-${commentId}`);
                                                        if (element) {
                                                            const headerOffset = 150;
                                                            const elementPosition = element.getBoundingClientRect().top;
                                                            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                                                            window.scrollTo({
                                                                top: offsetPosition,
                                                                behavior: 'smooth'
                                                            });
                                                        }
                                                    }, 10);
                                                }}
                                                className="flex items-center gap-2 text-slate-400 hover:text-purple-400 transition-colors bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl border border-white/10 text-sm font-medium"
                                            >
                                                <ArrowLeft size={18} />
                                            </button>
                                            <span className="text-sm font-medium text-slate-500 bg-white/5 px-3 py-1 rounded-lg">
                                                Discussion Thread
                                            </span>
                                        </div>

                                        <div className="space-y-6">
                                            <CommentItem
                                                key={`thread-${activeThread.id}`}
                                                comment={activeThread}
                                                replies={activeThread.replies}
                                                postAuthorId={postAuthorId}
                                                onDelete={() => {
                                                    setActiveThread(null);
                                                    void refetch();
                                                }}
                                                onUpdate={() => void refetch()}
                                                depth={0}
                                                isThreadView={true}
                                                onReadThread={setActiveThread}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Main Comments List - Hidden when thread is active to preserve state */}
                                <div className={activeThread ? "hidden" : "space-y-6 animate-fade-in"}>
                                    {displayedRootComments.map((comment) => (
                                        <CommentItem
                                            key={comment.id}
                                            comment={comment}
                                            replies={comment.replies}
                                            postAuthorId={postAuthorId}
                                            onDelete={() => void refetch()}
                                            onUpdate={() => void refetch()}
                                            depth={0}
                                            onReadThread={setActiveThread}
                                        />
                                    ))}

                                    <div className="flex gap-3 justify-center mt-8">
                                        {hasMoreComments && (
                                            <button
                                                onClick={() => { setVisibleCommentsCount(prev => prev + 5); }}
                                                className="px-8 py-3 rounded-full glass-button text-purple-400 font-bold hover:bg-purple-500/10 transition-all cursor-pointer border border-purple-500/20"
                                            >
                                                More Comments ({rootComments.length - visibleCommentsCount} remaining)
                                            </button>
                                        )}
                                        {visibleCommentsCount > 5 && (
                                            <button
                                                onClick={() => {
                                                    setVisibleCommentsCount(5);
                                                    window.scrollTo({ top: (document.getElementById('comments-section')?.offsetTop ?? 0) - 100, behavior: 'smooth' });
                                                }}
                                                className="px-8 py-3 rounded-full glass-button text-slate-400 font-bold hover:bg-white/5 transition-all cursor-pointer border border-white/10"
                                            >
                                                Show Less
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
