"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";

export function Header() {
    const { data: session, status } = useSession();
    const isLoading = status === "loading";

    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0f172a]/60">
            <div className="container mx-auto flex items-center justify-between px-4 py-4">
                <Link href="/" className="group flex items-center gap-2 transition-transform hover:scale-105">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20"></div>
                    <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                        Ink <span className="text-purple-400">well</span>
                    </h1>
                </Link>

                <div className="flex items-center gap-4">
                    {!isLoading && (
                        <>
                            {session ? (
                                <>
                                    <Link href="/create">
                                        <button className="relative overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105 active:scale-95">
                                            <span className="relative z-10">New Post</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1s_infinite]"></div>
                                        </button>
                                    </Link>
                                    <UserMenu />
                                </>
                            ) : (
                                <>
                                    <button
                                        onClick={() => signIn("google")}
                                        className="glass-button rounded-full px-6 py-2 text-sm font-medium text-slate-200 cursor-pointer"
                                    >
                                        Sign In
                                    </button>
                                    <button
                                        onClick={() => signIn("google")}
                                        className="group relative rounded-full bg-white text-slate-900 px-6 py-2 text-sm font-bold transition-all hover:bg-slate-200 cursor-pointer"
                                    >
                                        Get Started
                                        <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                                    </button>
                                </>
                            )}
                        </>
                    )}
                    {isLoading && (
                        <div className="h-9 w-9 rounded-full bg-white/5 animate-pulse" />
                    )}
                </div>
            </div>
        </header>
    );
}
