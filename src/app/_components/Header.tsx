"use client";

import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { User } from "lucide-react";

export function Header() {
    return (
        <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0f172a]/80 backdrop-blur-xl supports-[backdrop-filter]:bg-[#0f172a]/60">
            <div className="container mx-auto flex items-center justify-between px-4 py-4">
                <Link href="/" className="group flex items-center gap-2 transition-transform hover:scale-105">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 shadow-lg shadow-purple-500/20"></div>
                    <h1 className="text-xl font-bold tracking-tight text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-pink-400 transition-all duration-300">
                        My <span className="text-purple-400">Blog</span>
                    </h1>
                </Link>

                <div className="flex items-center gap-4">
                    <SignedIn>
                        <Link href="/create">
                            <button className="relative overflow-hidden rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-lg shadow-purple-500/25 transition-all duration-300 hover:shadow-purple-500/40 hover:scale-105 active:scale-95">
                                <span className="relative z-10">New Post</span>
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-[shimmer_1s_infinite]"></div>
                            </button>
                        </Link>
                    </SignedIn>
                    <SignedOut>
                        <Link href="/sign-in">
                            <button className="glass-button rounded-full px-6 py-2 text-sm font-medium text-slate-200 cursor-pointer">
                                Sign In
                            </button>
                        </Link>
                        <Link href="/sign-up">
                            <button className="group relative rounded-full bg-white text-slate-900 px-6 py-2 text-sm font-bold transition-all hover:bg-slate-200 cursor-pointer">
                                Get Started
                                <span className="ml-2 inline-block transition-transform group-hover:translate-x-1">→</span>
                            </button>
                        </Link>
                    </SignedOut>

                    <SignedIn>
                        <div className="pl-2 border-l border-white/10">
                            <UserButton
                                appearance={{
                                    elements: {
                                        avatarBox: "h-9 w-9 ring-2 ring-white/10 transition-all hover:ring-purple-500/50",
                                        userButtonPopoverCard: "bg-slate-900/95 backdrop-blur-xl border border-white/10 shadow-2xl",
                                        userButtonPopoverActionButton__signOut: "text-red-400 hover:bg-red-500/10 hover:text-red-300",
                                        userButtonPopoverActionButtonText: "text-slate-200",
                                        userButtonPopoverFooter: "hidden",
                                        userButtonMenuItems__manageAccount: "hidden"
                                    }
                                }}
                                userProfileProps={{
                                    appearance: {
                                        elements: {
                                            navbarButton__security: "hidden",
                                            profileSection__emailAddresses: {
                                                "& .cl-profileSectionSecondaryButton": {
                                                    display: "none"
                                                }
                                            },
                                            profileSection__connectedAccounts: {
                                                "& .cl-profileSectionSecondaryButton": {
                                                    display: "none"
                                                }
                                            }
                                        }
                                    }
                                }}
                            >
                                <UserButton.MenuItems>
                                    <UserButton.Link
                                        label="My Profile"
                                        href="/profile"
                                        labelIcon={<User size={16} />}
                                    />
                                </UserButton.MenuItems>
                            </UserButton>
                        </div>
                    </SignedIn>
                </div>
            </div>
        </header>
    );
}
