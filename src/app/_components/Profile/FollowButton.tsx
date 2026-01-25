"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { UserPlus, UserCheck } from "lucide-react";

interface FollowButtonProps {
    targetUserId: string;
    targetUsername: string;
}

export function FollowButton({ targetUserId, targetUsername }: FollowButtonProps) {
    const utils = api.useUtils();

    // Get initial state
    const { data: isFollowing, isLoading } = api.user.isFollowing.useQuery(
        { targetUserId },
        { enabled: !!targetUserId }
    );

    const [isPending, setIsPending] = useState(false);

    const followMutation = api.user.follow.useMutation({
        onMutate: async () => {
            await utils.user.isFollowing.cancel({ targetUserId });
            const previousState = utils.user.isFollowing.getData({ targetUserId });
            utils.user.isFollowing.setData({ targetUserId }, true);
            return { previousState };
        },
        onError: (err, _newTodo, context) => {
            utils.user.isFollowing.setData({ targetUserId }, context?.previousState);
            toast.error(err.message);
        },
        onSettled: () => {
            void utils.user.isFollowing.invalidate({ targetUserId });
            void utils.user.getFollowCounts.invalidate({ userId: targetUserId });
            void utils.user.getFollowers.invalidate({ userId: targetUserId });
        },
    });

    const unfollowMutation = api.user.unfollow.useMutation({
        onMutate: async () => {
            await utils.user.isFollowing.cancel({ targetUserId });
            const previousState = utils.user.isFollowing.getData({ targetUserId });
            utils.user.isFollowing.setData({ targetUserId }, false);
            return { previousState };
        },
        onError: (err, _newTodo, context) => {
            utils.user.isFollowing.setData({ targetUserId }, context?.previousState);
            toast.error(err.message);
        },
        onSettled: () => {
            void utils.user.isFollowing.invalidate({ targetUserId });
            void utils.user.getFollowCounts.invalidate({ userId: targetUserId });
            void utils.user.getFollowers.invalidate({ userId: targetUserId });
        },
    });

    const handleToggleFollow = async () => {
        setIsPending(true);
        try {
            if (isFollowing) {
                await unfollowMutation.mutateAsync({ targetUserId });
                toast.success(`Unfollowed @${targetUsername}`);
            } else {
                await followMutation.mutateAsync({ targetUserId });
                toast.success(`Following @${targetUsername}`);
            }
        } catch {
            // Error handled in mutation
        } finally {
            setIsPending(false);
        }
    };

    if (isLoading) {
        return <div className="w-24 h-10 bg-white/5 rounded-2xl animate-pulse" />;
    }

    return (
        <button
            onClick={handleToggleFollow}
            disabled={isPending}
            className={`
                group/button relative flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl 
                font-bold text-sm tracking-wide transition-all duration-300 w-full sm:w-auto min-w-[140px]
                ${isFollowing
                    ? "bg-white/5 text-slate-300 hover:bg-red-500/10 hover:text-red-400 border border-white/10 hover:border-red-500/20"
                    : "bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 border border-transparent"
                }
            `}
        >
            {isFollowing ? (
                <>
                    <UserCheck size={18} className="group-hover/button:hidden" />
                    <UserPlus size={18} className="hidden group-hover/button:block rotate-45" />
                    <span className="group-hover/button:hidden">Following</span>
                    <span className="hidden group-hover/button:inline">Unfollow</span>
                </>
            ) : (
                <>
                    <UserPlus size={18} />
                    <span>Follow</span>
                </>
            )}
        </button>
    );
}
