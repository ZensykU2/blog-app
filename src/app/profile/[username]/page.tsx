"use client";

import { useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useParams } from "next/navigation";
import {
    BookOpen,
    MessageSquare,
    Heart,
    Bookmark,
    User as UserIcon,
    Loader2
} from "lucide-react";

import { ProfileHeader } from "../../_components/ProfileHeader";
import { PostGrid } from "../../_components/PostGrid";
import { UserComments } from "../../_components/UserComments";
import { api } from "~/trpc/react";

type TabType = "posts" | "comments" | "liked" | "bookmarked";

export default function UserProfilePage() {
    const params = useParams();
    const username = params.username as string;
    const { user: currentUser, isLoaded: isUserLoaded } = useUser();
    const [activeTab, setActiveTab] = useState<TabType>("posts");

    const { data: profileUser, isLoading: isProfileLoading } = api.user.getProfile.useQuery({
        username
    });

    const isOwner = isUserLoaded && currentUser?.username === username;

    if (isProfileLoading || !isUserLoaded) {
        return (
            <main className="container mx-auto px-4 py-8">
                <div className="h-64 glass-panel rounded-2xl animate-pulse mb-8" />
                <div className="h-12 w-full glass-panel rounded-xl animate-pulse mb-8" />
            </main>
        );
    }

    if (!profileUser) {
        return (
            <main className="container mx-auto px-4 py-20 text-center">
                <UserIcon size={64} className="mx-auto text-slate-700 mb-6" />
                <h1 className="text-3xl font-black text-white mb-2">User not found</h1>
                <p className="text-slate-400">The profile you are looking for doesn't exist.</p>
            </main>
        );
    }

    const tabs = [
        { id: "posts", label: isOwner ? "My Posts" : "Posts", icon: BookOpen },
        { id: "comments", label: "Comments", icon: MessageSquare },
        { id: "liked", label: "Liked", icon: Heart },
        ...(isOwner ? [{ id: "bookmarked", label: "Bookmarked", icon: Bookmark }] : []),
    ] as const;

    const visibleTabs = tabs;

    return (
        <main className="container mx-auto px-4 py-8 max-w-7xl animate-slide-up">
            <ProfileHeader username={username} />

            {/* Tabs Navigation */}
            <div className="flex flex-wrap items-center gap-2 mb-8 p-1.5 glass-panel rounded-2xl w-fit">
                {visibleTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TabType)}
                            className={`
                flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all cursor-pointer
                ${isActive
                                    ? "bg-purple-500 text-white shadow-lg shadow-purple-500/20 scale-105"
                                    : "text-slate-400 hover:text-slate-200 hover:bg-white/5"}
              `}
                        >
                            <Icon size={18} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === "posts" && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                            <BookOpen className="text-purple-400" size={24} />
                            <h2 className="text-2xl font-black text-white">
                                {isOwner ? "My Stories" : `${profileUser.displayName ?? profileUser.username}'s Stories`}
                            </h2>
                        </div>
                        <PostGrid type="user" userId={profileUser.clerkId} />
                    </div>
                )}

                {activeTab === "comments" && (
                    <div className="animate-fade-in max-w-4xl">
                        <div className="flex items-center gap-3 mb-6">
                            <MessageSquare className="text-purple-400" size={24} />
                            <h2 className="text-2xl font-black text-white">Comment History</h2>
                        </div>
                        <UserComments userId={profileUser.clerkId} />
                    </div>
                )}

                {activeTab === "liked" && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                            <Heart className="text-pink-400" size={24} />
                            <h2 className="text-2xl font-black text-white">Liked Posts</h2>
                        </div>
                        <PostGrid type="liked" userId={profileUser.clerkId} />
                    </div>
                )}

                {activeTab === "bookmarked" && isOwner && (
                    <div className="animate-fade-in">
                        <div className="flex items-center gap-3 mb-6">
                            <Bookmark className="text-yellow-400" size={24} />
                            <h2 className="text-2xl font-black text-white">Saved for Later</h2>
                        </div>
                        <PostGrid type="bookmarked" userId={profileUser.clerkId} />
                    </div>
                )}
            </div>
        </main>
    );
}
