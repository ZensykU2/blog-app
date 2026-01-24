"use client";

import { useSession, signIn } from "next-auth/react";
import Link from "next/link";
import { UserMenu } from "./UserMenu";
import { Button } from "./Button";

export function Header() {
    const { data: session, status } = useSession();
    const isLoading = status === "loading";

    return (
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0f172a]/60 min-h-[73px] w-full">
            <div className="container mx-auto flex items-center justify-between px-4 py-4">
                {/* Logo */}
                <Link
                    href="/"
                    className="group flex items-center gap-2 transition-transform hover:scale-105"
                >
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20" />
                    <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                        Ink <span className="text-purple-400">well</span>
                    </h1>
                </Link>

                <div className="flex items-center gap-4">
                    {!isLoading && (
                        <>
                            {session ? (
                                <>
                                    {session.user.role === "admin" && (
                                        <Link href="/admin">
                                            <button className="relative overflow-hidden rounded-full bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 md:px-6 md:py-2 text-xs md:text-sm font-bold text-white shadow-lg shadow-amber-500/25 transition-all duration-300 hover:shadow-amber-500/40 hover:scale-105 active:scale-95 cursor-pointer">
                                                <span className="relative z-10">Admin</span>
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1s_infinite]" />
                                            </button>
                                        </Link>
                                    )}

                                    <Link href="/create">
                                        <button className="relative overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 md:px-6 md:py-2 text-xs md:text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105 active:scale-95 cursor-pointer">
                                            <span className="relative z-10">New Post</span>
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1s_infinite]" />
                                        </button>
                                    </Link>

                                    <UserMenu />
                                </>
                            ) : (
                                <>
                                    <Button
                                        onClick={() => signIn("google")}
                                        variant="glass"
                                        className="rounded-full"
                                    >
                                        Sign In
                                    </Button>
                                    <Button
                                        onClick={() => signIn("google")}
                                        variant="secondary"
                                        className="rounded-full"
                                        rightIcon={<span className="inline-block transition-transform group-hover:translate-x-1">→</span>}
                                    >
                                        Get Started
                                    </Button>
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