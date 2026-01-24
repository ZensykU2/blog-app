"use client";

import { Modal } from "../Shared/Modal";
import Link from "next/link";
import Image from "next/image";
import { User } from "lucide-react";
import { useSession } from "next-auth/react";
import { api } from "~/trpc/react";
import { FollowButton } from "./FollowButton";

interface FollowListModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "followers" | "following";
    userId: string;
    username: string;
}

export function FollowListModal({ isOpen, onClose, type, userId, username }: FollowListModalProps) {
    const { data: session } = useSession();
    const { data: users, isLoading } = type === "followers"
        ? api.user.getFollowers.useQuery({ userId }, { enabled: isOpen })
        : api.user.getFollowing.useQuery({ userId }, { enabled: isOpen });

    const title = type === "followers" ? "Followers" : "Following";
    const description = type === "followers"
        ? `People following @${username}`
        : `People @${username} follows`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={title}
            description={description}
        >
            <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {isLoading ? (
                    <div className="flex flex-col gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="flex items-center gap-3 animate-pulse">
                                <div className="w-12 h-12 rounded-full bg-white/5" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-32 h-4 bg-white/5 rounded" />
                                    <div className="w-20 h-3 bg-white/5 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : users?.length === 0 ? (
                    <div className="text-center py-8 text-slate-500 italic">
                        No users found.
                    </div>
                ) : (
                    users?.map((user) => (
                        <div key={user.id} className="flex items-center justify-between gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors group">
                            <Link href={`/profile/${user.username}`} className="flex items-center gap-3 flex-1 min-w-0" onClick={onClose}>
                                <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-slate-800 shrink-0 border border-white/10">
                                    {user.profileImage || user.image ? (
                                        <Image
                                            src={user.profileImage ?? user.image ?? ""}
                                            alt={user.username ?? "User"}
                                            fill
                                            className="object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <User size={20} className="text-slate-500" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0">
                                    <span className="text-white font-bold truncate group-hover:text-purple-400 transition-colors">
                                        {user.displayName ?? user.username}
                                    </span>
                                    <span className="text-slate-500 text-xs truncate">
                                        @{user.username}
                                    </span>
                                </div>
                            </Link>

                            {/* Pass userId/username from the user in the list, not the profile owner */}
                            {user.id !== userId && session?.user.id !== user.id && (
                                <div className="transform scale-90 origin-right">
                                    <FollowButton targetUserId={user.id} targetUsername={user.username ?? ""} />
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </Modal>
    );
}
