"use client";

import { useState, useEffect, useRef } from "react";
import { Bell } from "lucide-react";
import { api } from "~/trpc/react";
import { pusherClient } from "~/app/_lib/pusher-client";
import { useSession } from "next-auth/react";
import { NotificationList } from "./NotificationList";
import { toast } from "react-hot-toast";

export function NotificationBell() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const { data: unreadCount, refetch: refetchCount } = api.notification.getUnreadCount.useQuery(
        undefined,
        { enabled: !!session }
    );

    const markAllAsRead = api.notification.markAllAsRead.useMutation();
    const utils = api.useUtils();

    const handleToggle = async () => {
        const nextState = !isOpen;
        setIsOpen(nextState);

        if (nextState && unreadCount && unreadCount > 0) {
            await markAllAsRead.mutateAsync();
            void utils.notification.invalidate();
        }
    };

    useEffect(() => {
        if (!session?.user.id) return;

        const channel = pusherClient.subscribe(`user-${session.user.id}`);
        channel.bind("new-notification", (data: { title: string }) => {
            void refetchCount();
            void utils.notification.getMany.invalidate();

            // Show a toast if the dropdown is not open
            if (!isOpen) {
                toast.success(`New notification: ${data.title}`, {
                    icon: "🔔",
                    style: {
                        borderRadius: "10px",
                        background: "#0f172a",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.1)",
                    },
                });
            }
        });

        return () => {
            pusherClient.unsubscribe(`user-${session.user.id}`);
        };
    }, [session?.user.id, refetchCount, utils, isOpen]);

    // Handle click outside to close
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => { document.removeEventListener("mousedown", handleClickOutside); };
    }, []);

    if (!session) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={handleToggle}
                className={`relative p-2 transition-all duration-300 rounded-full hover:bg-white/10 group ${isOpen ? "bg-white/15 text-white ring-2 ring-purple-500/20" : "text-white/70 hover:text-white"
                    }`}
            >
                <div className="relative">
                    <Bell
                        className={`h-5 w-5 md:h-6 md:w-6 transition-all duration-500 group-hover:rotate-[15deg] group-hover:scale-110 ${(unreadCount ?? 0) > 0 ? "text-purple-400" : ""
                            }`}
                    />
                    {(unreadCount ?? 0) > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                    )}
                </div>
                {(unreadCount ?? 0) > 0 ? (
                    <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-gradient-to-tr from-purple-500 to-pink-500 text-[10px] font-bold text-white shadow-[0_0_10px_rgba(168,85,247,0.5)] md:right-0 md:top-0 animate-in zoom-in duration-500">
                        {(unreadCount ?? 0) > 9 ? "9+" : unreadCount}
                    </span>
                ) : null}
            </button>

            {isOpen && (
                <div className="fixed inset-x-4 top-[73px] mt-2 sm:absolute sm:inset-auto sm:right-0 sm:top-full sm:mt-4 w-auto sm:w-[400px] rounded-2xl border border-white/10 bg-[#0f172a]/90 backdrop-blur-2xl p-1.5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border-t-white/20 animate-in fade-in slide-in-from-top-4 duration-500 z-[60]">
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent pointer-events-none rounded-2xl" />
                    <NotificationList onClose={() => { setIsOpen(false); }} />
                </div>
            )}
        </div>
    );
}
