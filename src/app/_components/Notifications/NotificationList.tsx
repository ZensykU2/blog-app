"use client";

import { api, type RouterOutputs } from "~/trpc/react";
import { formatDistanceToNow } from "date-fns";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, MessageSquare, UserPlus, Bookmark, AtSign, Bell } from "lucide-react";
import { encodeId } from "~/lib/ids";

type Notification = RouterOutputs["notification"]["getMany"]["items"][number];

export function NotificationList({ onClose }: { onClose: () => void }) {
    const router = useRouter();
    const { data, isLoading, fetchNextPage, hasNextPage } = api.notification.getMany.useInfiniteQuery(
        { limit: 10 },
        { getNextPageParam: (lastPage) => lastPage.nextCursor }
    );

    const markAsRead = api.notification.markAsRead.useMutation();
    const utils = api.useUtils();

    const handleNotificationClick = async (notification: Notification) => {
        if (!notification.isRead) {
            await markAsRead.mutateAsync({ id: notification.id });
            void utils.notification.invalidate();
        }

        onClose();

        // Redirect logic
        if (notification.type === "new_follower") {
            if (notification.actor?.username) {
                router.push(`/profile/${notification.actor.username}`);
            }
        } else if (notification.relatedPostId) {
            router.push(`/post/${encodeId(notification.relatedPostId)}`);
        }
    };

    const notifications = data?.pages.flatMap((page) => page.items) ?? [];

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    if (notifications.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                <div className="relative mb-4">
                    <div className="absolute inset-0 bg-purple-500/20 blur-2xl rounded-full" />
                    <Bell className="relative h-12 w-12 text-white/20" />
                </div>
                <h4 className="text-lg font-semibold text-white/90 mb-1">All caught up!</h4>
                <p className="text-sm text-white/40 max-w-[200px]">
                    You don&apos;t have any new notifications at the moment.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col max-h-[500px] relative z-20">
            <div className="flex items-center justify-between border-b border-white/5 p-4 mb-2">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold tracking-tight text-white">Notifications</h3>
                    <span className="px-1.5 py-0.5 rounded-full bg-purple-500/10 text-[10px] font-bold text-purple-400 border border-purple-500/20">
                        {notifications.length}
                    </span>
                </div>
            </div>

            <div className="overflow-y-auto custom-scrollbar flex-1 px-2 pb-2 space-y-1">
                {notifications.map((notification) => (
                    <div
                        key={notification.id}
                        className={`group relative flex gap-4 p-3.5 rounded-xl transition-all duration-300 cursor-pointer overflow-hidden ${!notification.isRead
                            ? "bg-white/5 hover:bg-white/8"
                            : "hover:bg-white/5 opacity-80 hover:opacity-100"
                            }`}
                        onClick={() => handleNotificationClick(notification)}
                    >
                        {/* Type indicator accent */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1 transition-all duration-300 ${getTypeColor(notification.type)} ${!notification.isRead ? "opacity-100" : "opacity-0 group-hover:opacity-40"
                            }`} />

                        {/* Actor Image */}
                        <div
                            className="relative h-12 w-12 shrink-0 z-10"
                            onClick={(e) => { e.stopPropagation(); }}
                        >
                            <div className="relative h-full w-full">
                                {(() => {
                                    const actorImage = notification.actor?.profileImage ?? notification.actor?.image;
                                    const profileUrl = notification.actor?.username ? `/profile/${notification.actor.username}` : null;

                                    const ImageContent = (
                                        <div className="relative h-full w-full rounded-full ring-2 ring-white/5 group-hover:ring-white/20 transition-all duration-300 overflow-hidden shadow-xl">
                                            {actorImage ? (
                                                <Image
                                                    src={actorImage}
                                                    alt={notification.actor?.username ?? "User"}
                                                    fill
                                                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                                                />
                                            ) : (
                                                <div className="h-full w-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-white/40">
                                                        {notification.type === "post_bookmark" ? "?" : (notification.actor?.username?.[0]?.toUpperCase() ?? "?")}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    );

                                    return profileUrl ? (
                                        <Link href={profileUrl} onClick={() => { onClose(); }}>
                                            {ImageContent}
                                        </Link>
                                    ) : ImageContent;
                                })()}

                                {/* Status Icon */}
                                <div className={`absolute -bottom-1 -right-1 rounded-full p-1.5 shadow-lg ring-2 ring-[#0f172a] transition-transform duration-300 group-hover:scale-110 ${getTypeColor(notification.type)}`}>
                                    {getTypeIcon(notification.type)}
                                </div>
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="flex flex-col gap-1 min-w-0 pr-2">
                            <p className="text-sm text-white/80 leading-snug group-hover:text-white transition-colors">
                                {notification.type !== "post_bookmark" && (
                                    <span className="font-bold text-white tracking-tight">
                                        {notification.actor?.displayName ?? notification.actor?.username ?? "Someone"}
                                    </span>
                                )}{" "}
                                <span className="font-medium">{notification.message}</span>
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium text-white/30 group-hover:text-white/50 transition-colors">
                                    {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                                </span>
                                {!notification.isRead && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-purple-500 shadow-[0_0_5px_rgba(168,85,247,0.8)]" />
                                )}
                            </div>
                        </div>

                        {/* Hover arrow or indicator */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-40 transition-all duration-300">
                            <div className="h-1.5 w-1.5 border-t-2 border-r-2 border-white rotate-45" />
                        </div>
                    </div>
                ))}

                {hasNextPage && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            void fetchNextPage();
                        }}
                        className="w-full py-4 text-xs font-bold text-purple-400 hover:text-purple-300 transition-all hover:bg-white/5 rounded-xl border-t border-white/5"
                    >
                        Load more activity
                    </button>
                )}
            </div>
        </div>
    );
}

function getTypeIcon(type: string) {
    switch (type) {
        case "post_like":
        case "comment_like":
            return <Heart className="h-2 w-2 text-white" fill="currentColor" />;
        case "new_comment":
            return <MessageSquare className="h-2 w-2 text-white" />;
        case "new_follower":
            return <UserPlus className="h-2 w-2 text-white" />;
        case "post_bookmark":
            return <Bookmark className="h-2 w-2 text-white" />;
        case "mention":
            return <AtSign className="h-2 w-2 text-white" />;
        default:
            return null;
    }
}

function getTypeColor(type: string) {
    switch (type) {
        case "post_like":
        case "comment_like":
            return "bg-pink-500";
        case "new_comment":
            return "bg-blue-500";
        case "new_follower":
            return "bg-green-500";
        case "post_bookmark":
            return "bg-amber-500";
        case "mention":
            return "bg-purple-500";
        default:
            return "bg-gray-500";
    }
}
