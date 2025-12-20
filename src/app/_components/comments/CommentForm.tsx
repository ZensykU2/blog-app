"use client";

import { useState } from "react";
import { Send } from "lucide-react";
import { api } from "~/trpc/react";
import { useUser } from "@clerk/nextjs";
import Link from "next/link";

import TextareaAutosize from "react-textarea-autosize";

interface CommentFormProps {
    postId: number;
    onCommentAdded: () => void;
    initialContent?: string;
    isUpdate?: boolean;
    commentId?: number;
    parentId?: number;
    onCancel?: () => void;
}

export function CommentForm({
    postId,
    onCommentAdded,
    initialContent = "",
    isUpdate = false,
    commentId,
    parentId,
    onCancel
}: CommentFormProps) {
    const { user, isLoaded, isSignedIn } = useUser();
    const [content, setContent] = useState(initialContent);

    const createComment = api.comment.create.useMutation({
        onSuccess: () => {
            if (!isUpdate) setContent("");
            onCommentAdded();
        },
    });

    const updateComment = api.comment.update.useMutation({
        onSuccess: () => {
            onCommentAdded();
        },
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        if (isUpdate && commentId) {
            updateComment.mutate({
                id: commentId,
                content: content.trim(),
            });
        } else {
            createComment.mutate({
                postId,
                content: content.trim(),
                parentId,
            });
        }
    };

    if (!isLoaded) return null;

    if (!isSignedIn && !isUpdate) {
        return (
            <div className="glass-panel p-6 rounded-xl text-center">
                <p className="text-slate-300 mb-4">Sign in to join the conversation</p>
                <Link href="/sign-in">
                    <button className="px-6 py-2 rounded-full glass-button hover:bg-white/10 transition-colors cursor-pointer">
                        Sign In
                    </button>
                </Link>
            </div>
        );
    }

    const isPending = createComment.isPending || updateComment.isPending;

    return (
        <div className={`glass-panel p-6 rounded-xl ${isUpdate ? "mt-4" : "mb-8"}`}>
            <div className="flex gap-4">
                {!isUpdate && user?.imageUrl && (
                    <img
                        src={user.imageUrl}
                        alt={user.fullName || "User"}
                        className="w-10 h-10 rounded-full ring-2 ring-white/10"
                    />
                )}
                <form onSubmit={handleSubmit} className="flex-1">
                    <div className="relative group">
                        <TextareaAutosize
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder={isUpdate ? "Edit your comment..." : "Write a comment..."}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 pr-12 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all min-h-[50px] overflow-hidden !resize-none"
                            spellCheck={false}
                            maxRows={15}
                            autoFocus={isUpdate}
                        />
                        <button
                            type="submit"
                            disabled={!content.trim() || isPending || (isUpdate && content.trim() === initialContent)}
                            className="absolute bottom-3 right-3 p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                            {isPending ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <Send size={18} />
                            )}
                        </button>
                    </div>
                    {isUpdate && onCancel && (
                        <div className="flex justify-end mt-2">
                            <button
                                type="button"
                                onClick={onCancel}
                                className="text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </div>
    );
}
