"use client";

import { useSession } from "next-auth/react";
import {
    Trash2,
    User as UserIcon,
    Edit3,
    ChevronDown,
    ChevronUp,
    Heart,
} from "lucide-react";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { api } from "~/trpc/react";
import { CommentForm } from "./CommentForm";
import { DeleteConfirmationModal } from "../Shared/DeleteConfirmationModal";
import { toast } from "react-hot-toast";

export type CommentWithReplies = {
    id: number;
    content: string;
    createdAt: Date;
    updatedAt: Date | null;
    authorId: string;
    postId: number;
    parentId: number | null;
    author: {
        id: string | null;
        displayName: string | null;
        username: string | null;
        profileImage: string | null;
        image: string | null;
    } | null;
    likeCount?: number;
    isLiked?: boolean;
    replies?: CommentWithReplies[];
};

interface CommentItemProps {
    comment: CommentWithReplies;
    replies?: CommentWithReplies[];
    postAuthorId: string;
    onDelete: () => void;
    onUpdate: () => void;
    depth?: number;
}

export function CommentItem({
    comment,
    replies = [],
    postAuthorId,
    onDelete,
    onUpdate,
    depth = 0,
}: CommentItemProps) {
    const { data: session, status } = useSession();
    const [isDeleting, setIsDeleting] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [isReplying, setIsReplying] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const [visibleRepliesCount, setVisibleRepliesCount] = useState(5);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [likes, setLikes] = useState(comment.likeCount ?? 0);
    const [isLiked, setIsLiked] = useState(comment.isLiked ?? false);
    const utils = api.useUtils();

    const toggleLike = api.interaction.toggleCommentLike.useMutation({
        onMutate: () => {
            if (status !== "authenticated") {
                toast.error("Please sign in to like comments");
                return;
            }
            const newLiked = !isLiked;
            setIsLiked(newLiked);
            setLikes((prev: number) => (newLiked ? prev + 1 : prev - 1));
        },
        onSuccess: async () => {
            await utils.comment.getByPostId.invalidate({ postId: comment.postId });
        },
        onError: () => {
            setIsLiked(comment.isLiked ?? false);
            setLikes(comment.likeCount ?? 0);
        },
    });

    // Regular user deletion
    const deleteComment = api.comment.delete.useMutation({
        onSuccess: () => {
            onDelete();
            setIsDeleting(false);
            toast.success("Comment deleted");
        },
        onError: () => {
            setIsDeleting(false);
            toast.error("Failed to delete comment");
        },
    });

    // Admin deletion
    const adminDeleteComment = api.admin.deleteComment.useMutation({
        onSuccess: () => {
            onDelete();
            setIsDeleting(false);
            toast.success("Comment deleted by admin");
        },
        onError: () => {
            setIsDeleting(false);
            toast.error("Failed to delete comment");
        },
    });

    const isAdmin = session?.user.role === "admin";
    const isAuthor = session?.user.id === comment.authorId;
    const isPostAuthor = session?.user.id === postAuthorId;

    // author / post owner / admin can delete
    const canDelete = isAuthor || isPostAuthor || isAdmin;
    const canEdit = isAuthor;

    const isEdited =
        comment.updatedAt &&
        comment.updatedAt.getTime() > comment.createdAt.getTime();

    const CHAR_LIMIT = 255;
    const isLongComment = comment.content.length > CHAR_LIMIT;
    const displayContent =
        isLongComment && !isExpanded
            ? comment.content.slice(0, CHAR_LIMIT) + "..."
            : comment.content;

    const handleDelete = () => { setShowDeleteModal(true); };

    const confirmDelete = () => {
        setIsDeleting(true);
        if (isAdmin && !isAuthor && !isPostAuthor) {
            // admin override
            adminDeleteComment.mutate({ commentId: comment.id });
        } else {
            deleteComment.mutate({ id: comment.id });
        }
        setShowDeleteModal(false);
    };

    const getAuthorName = () => {
        if (!comment.author) return "Unknown User";
        return (
            comment.author.displayName ??
            comment.author.username ??
            "Unknown User"
        );
    };

    const hasMoreReplies = replies.length > visibleRepliesCount;
    const displayedReplies = replies.slice(0, visibleRepliesCount);

    return (
        <div
            className={`rounded-xl mb-4 group relative transition-all duration-300 ${comment.parentId ? "bg-transparent mt-4" : "glass-panel p-2.5 pr-2 md:p-5 shadow-lg"
                }`}
        >
            <div className="flex gap-2 md:gap-4">
                <Link
                    href={
                        comment.author?.username
                            ? `/profile/${comment.author.username}`
                            : "#"
                    }
                    className="flex-shrink-0 shrink-0 transition-transform hover:scale-110"
                >
                    {(() => {
                        const author = comment.author;
                        const profileImage = author?.profileImage ?? author?.image;
                        return profileImage ? (
                            <Image
                                src={profileImage}
                                alt={getAuthorName()}
                                width={40}
                                height={40}
                                className="w-8 h-8 md:w-10 md:h-10 rounded-full ring-2 ring-white/10 object-cover"
                                unoptimized
                            />
                        ) : (
                            <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/10">
                                <UserIcon size={20} className="text-slate-400" />
                            </div>
                        );
                    })()}
                </Link>

                <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between mb-1">
                        <div className="flex items-center gap-2">
                            <Link
                                href={
                                    comment.author?.username
                                        ? `/profile/${comment.author.username}`
                                        : "#"
                                }
                                className="font-semibold text-slate-200 hover:text-purple-400 transition-colors"
                            >
                                {getAuthorName()}
                            </Link>
                            {comment.authorId === postAuthorId && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/20 font-medium">
                                    Author
                                </span>
                            )}
                            <span className="text-xs text-slate-500">
                                {(() => {
                                    const now = new Date();
                                    const diff = now.getTime() - comment.createdAt.getTime();
                                    const oneDay = 24 * 60 * 60 * 1000;
                                    if (diff < oneDay) {
                                        return comment.createdAt.toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        });
                                    }
                                    return comment.createdAt.toLocaleDateString();
                                })()}
                            </span>
                            {isEdited && (
                                <span className="text-[10px] text-slate-500 italic">
                                    (edited)
                                </span>
                            )}
                        </div>
                    </div>

                    {isEditing ? (
                        <div className="mt-2 text-left">
                            <CommentForm
                                postId={comment.postId}
                                commentId={comment.id}
                                initialContent={comment.content}
                                isUpdate={true}
                                onCommentAdded={() => {
                                    setIsEditing(false);
                                    onUpdate();
                                }}
                                onCancel={() => { setIsEditing(false); }}
                            />
                        </div>
                    ) : (
                        <div className="space-y-3 text-left">
                            <div className="flex flex-col items-start">
                                <p className="text-slate-300 text-sm leading-relaxed break-words whitespace-pre-wrap text-left">
                                    {displayContent}
                                </p>

                                {isLongComment && (
                                    <button
                                        onClick={() => { setIsExpanded(!isExpanded); }}
                                        className="mt-1 text-xs font-bold text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer p-0 border-none bg-transparent"
                                    >
                                        {isExpanded ? (
                                            <>
                                                Show Less <ChevronUp size={14} />
                                            </>
                                        ) : (
                                            <>
                                                Read More <ChevronDown size={14} />
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>

                            <div className="flex items-center justify-start gap-4">
                                <button
                                    onClick={() => { toggleLike.mutate({ commentId: comment.id }); }
                                    }
                                    className={`flex items-center gap-1.5 transition-colors hover:text-pink-400 ${isLiked ? "text-pink-500" : "text-slate-500"
                                        }`}
                                >
                                    <Heart
                                        size={14}
                                        fill={isLiked ? "currentColor" : "none"}
                                    />
                                    <span className="text-xs font-bold">{likes}</span>
                                </button>

                                {status === "authenticated" && (
                                    <button
                                        onClick={() => { setIsReplying(!isReplying); }}
                                        className="text-xs font-bold text-slate-500 hover:text-purple-400 transition-colors cursor-pointer p-0 border-none bg-transparent"
                                    >
                                        {isReplying ? "Cancel Reply" : "Reply"}
                                    </button>
                                )}
                            </div>

                            {isReplying && (
                                <div className="mt-4 text-left">
                                    <CommentForm
                                        postId={comment.postId}
                                        parentId={comment.id}
                                        onCommentAdded={() => {
                                            setIsReplying(false);
                                            onUpdate();
                                        }}
                                        onCancel={() => { setIsReplying(false); }}
                                    />
                                </div>
                            )}

                            {replies.length > 0 && (
                                <div
                                    className={`mt-6 space-y-4 border-white/5
                                        ${depth < 1
                                            ? "border-l md:border-l-2 pl-1.5 md:pl-6 ml-1 md:ml-2"
                                            : depth < 5
                                                ? "border-l md:border-l-2 pl-3 md:pl-6 ml-0 md:ml-2"
                                                : "border-l-0 md:border-l-2 pl-0 md:pl-6 ml-0 md:ml-2"
                                        }
                                    `}
                                >
                                    {displayedReplies.map((reply) => (
                                        <CommentItem
                                            key={reply.id}
                                            comment={reply}
                                            replies={reply.replies}
                                            postAuthorId={postAuthorId}
                                            onDelete={onDelete}
                                            onUpdate={onUpdate}
                                            depth={depth + 1}
                                        />
                                    ))}

                                    <div className="flex gap-3 items-center mt-4 pt-2">
                                        {hasMoreReplies && (
                                            <button
                                                onClick={() => { setVisibleRepliesCount((prev) => prev + 5); }
                                                }
                                                className="text-[11px] font-bold text-purple-400 hover:text-white transition-all cursor-pointer bg-purple-500/10 hover:bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/20"
                                            >
                                                Read Thread (
                                                {replies.length - visibleRepliesCount} more)
                                            </button>
                                        )}
                                        {visibleRepliesCount > 5 && (
                                            <button
                                                onClick={() => { setVisibleRepliesCount(5); }}
                                                className="text-[11px] font-bold text-slate-400 hover:text-white transition-all cursor-pointer bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg border border-white/10"
                                            >
                                                Close Thread
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {!isEditing && canDelete && (
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 absolute top-5 right-5">
                        {canEdit && (
                            <button
                                onClick={() => { setIsEditing(true); }}
                                className="p-2 text-slate-500 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all cursor-pointer"
                                title="Edit comment"
                            >
                                <Edit3 size={16} />
                            </button>
                        )}
                        <button
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all cursor-pointer"
                            title="Delete comment"
                        >
                            {isDeleting ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <Trash2 size={16} />
                            )}
                        </button>
                    </div>
                )}
            </div>

            <DeleteConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => { setShowDeleteModal(false); }}
                onConfirm={confirmDelete}
                title="Delete Comment"
                description="Are you sure you want to delete this comment? This action cannot be undone."
                isDeleting={isDeleting}
            />
        </div>
    );
}