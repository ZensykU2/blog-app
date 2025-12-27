"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { User, LogOut, ChevronDown } from "lucide-react";
import { api } from "~/trpc/react";

export function UserMenu() {
    const { data: session } = useSession();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Fetch actual user data from database to get profileImage
    const { data: dbUser } = api.user.getCurrentUser.useQuery(undefined, {
        enabled: !!session?.user,
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    if (!session?.user) return null;

    // Use database profile image, fall back to OAuth image
    const profileImage = dbUser?.profileImage ?? session.user.image;
    const displayName = dbUser?.displayName ?? session.user.name;

    return (
        <div className="relative pl-2 border-l border-white/10" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 group focus:outline-none cursor-pointer"
            >
                <div className="h-9 w-9 rounded-full ring-2 ring-white/10 transition-all group-hover:ring-purple-500/50 overflow-hidden relative">
                    {profileImage ? (
                        <Image
                            src={profileImage}
                            alt={displayName ?? "User"}
                            fill
                            className="object-cover"
                        />
                    ) : (
                        <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                            <User size={18} className="text-slate-400" />
                        </div>
                    )}
                </div>
                <ChevronDown
                    size={14}
                    className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-56 rounded-xl bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200 z-50">
                    <div className="p-4 border-b border-white/5 bg-white/5">
                        <p className="text-sm font-bold text-white truncate">{displayName}</p>
                        <p className="text-xs text-slate-400 truncate mt-0.5">{session.user.email}</p>
                    </div>

                    <div className="p-1.5">
                        <Link
                            href="/profile"
                            onClick={() => setIsOpen(false)}
                            className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors group"
                        >
                            <User size={16} className="text-slate-400 group-hover:text-purple-400 transition-colors" />
                            My Profile
                        </Link>
                    </div>

                    <div className="p-1.5 border-t border-white/5 bg-slate-950/30">
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors group cursor-pointer"
                        >
                            <LogOut size={16} className="text-red-500/60 group-hover:text-red-400 transition-colors" />
                            Sign Out
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
