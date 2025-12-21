"use client";

import { useState, useEffect } from "react";
import { useUser, useClerk } from "@clerk/nextjs";
import Image from "next/image";
import { Edit2, Check, X, Camera, Settings } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";

interface ProfileHeaderProps {
    username: string;
}

export function ProfileHeader({ username }: ProfileHeaderProps) {
    const { user: currentUser, isLoaded: isCurrentUserLoaded } = useUser();
    const { openUserProfile } = useClerk();
    const [isEditingBio, setIsEditingBio] = useState(false);

    // Fetch the target user's profile from our DB
    const { data: dbUser, refetch, isLoading: isProfileLoading } = api.user.getProfile.useQuery({
        username,
    });

    const isOwner = isCurrentUserLoaded && currentUser?.username === username;

    const [bio, setBio] = useState("");

    // Sync local bio state when dbUser is loaded
    useEffect(() => {
        if (dbUser?.bio) {
            setBio(dbUser.bio);
        }
    }, [dbUser]);

    const updateBio = api.user.updateBio.useMutation({
        onSuccess: () => {
            toast.success("Bio updated!");
            setIsEditingBio(false);
            void refetch();
        },
        onError: (err) => {
            toast.error(err.message ?? "Failed to update bio");
        },
    });

    if (isProfileLoading || !isCurrentUserLoaded || !dbUser) {
        return (
            <div className="glass-panel p-8 rounded-2xl animate-pulse mb-8">
                <div className="flex flex-col md:flex-row items-center gap-8">
                    <div className="w-32 h-32 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-4">
                        <div className="h-8 w-48 bg-white/10 rounded" />
                        <div className="h-4 w-32 bg-white/10 rounded" />
                        <div className="h-16 w-full bg-white/5 rounded" />
                    </div>
                </div>
            </div>
        );
    }

    const handleSaveBio = () => {
        updateBio.mutate({ bio });
    };

    return (
        <div className="glass-panel p-8 rounded-2xl mb-8 relative overflow-hidden group">
            {/* Decorative background blur */}
            <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full transition-all group-hover:bg-purple-500/20" />

            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative">
                    <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl relative group/avatar">
                        <Image
                            src={dbUser.profileImage ?? ""}
                            alt={dbUser.displayName ?? dbUser.username ?? "Profile"}
                            width={128}
                            height={128}
                            className="object-cover w-full h-full transition-transform duration-500 group-hover/avatar:scale-110"
                        />
                        {isOwner && (
                            <div
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer"
                                onClick={() => {
                                    openUserProfile({
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
                                                },
                                                userProfilePopoverFooter: "hidden"
                                            }
                                        }
                                    });
                                }}
                            >
                                <Camera className="text-white" size={24} />
                            </div>
                        )}
                    </div>
                    {isOwner && (
                        <div className="absolute -bottom-2 -right-2 p-2 rounded-full bg-purple-600 text-white shadow-lg shadow-purple-500/20">
                            <Settings size={14} />
                        </div>
                    )}
                </div>

                <div className="flex-1 text-center md:text-left">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div>
                            <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                                {dbUser.displayName ?? dbUser.username}
                            </h1>
                            <p className="text-purple-400 font-medium tracking-wide">
                                @{dbUser.username}
                            </p>
                        </div>

                        {isOwner && (
                            <button
                                onClick={() => {
                                    openUserProfile({
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
                                                },
                                                userProfilePopoverFooter: "hidden"
                                            }
                                        }
                                    });
                                }}
                                className="px-6 py-2 rounded-full glass-button text-sm font-bold text-slate-200 hover:text-white transition-all cursor-pointer border border-white/10"
                            >
                                Manage Account
                            </button>
                        )}
                    </div>

                    <div className="space-y-4">
                        {isEditingBio && isOwner ? (
                            <div className="space-y-3 animate-fade-in">
                                <TextareaAutosize
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    placeholder="Tell us about yourself..."
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all min-h-[100px] resize-none"
                                    autoFocus
                                />
                                <div className="flex justify-end gap-2">
                                    <button
                                        onClick={() => {
                                            setBio(dbUser?.bio ?? "");
                                            setIsEditingBio(false);
                                        }}
                                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={handleSaveBio}
                                        disabled={updateBio.isPending}
                                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-500 text-white font-bold hover:bg-purple-600 transition-colors disabled:opacity-50"
                                    >
                                        {updateBio.isPending ? (
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            <><Check size={18} /> Save Bio</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div
                                className={`group/bio p-4 rounded-xl transition-all relative ${isOwner ? 'hover:bg-white/5 cursor-pointer' : ''}`}
                                onClick={() => {
                                    if (isOwner) setIsEditingBio(true);
                                }}
                            >
                                <div className="flex items-center gap-2 text-slate-500 mb-1">
                                    <span className="text-xs font-bold uppercase tracking-widest">About Me</span>
                                    {isOwner && <Edit2 size={12} className="opacity-0 group-hover/bio:opacity-100 transition-opacity" />}
                                </div>
                                <p className="text-slate-300 leading-relaxed max-w-2xl italic">
                                    {dbUser.bio || (isOwner ? "No bio added yet. Click here to add one!" : "No bio added yet.")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
