"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Edit2, Check, X, User, Camera, Settings } from "lucide-react";
import TextareaAutosize from "react-textarea-autosize";
import { api } from "~/trpc/react";
import { toast } from "react-hot-toast";
import { CropperModal } from "./CropperModal";

interface ProfileHeaderProps {
    username: string;
}

export function ProfileHeader({ username }: ProfileHeaderProps) {
    const { data: session, status: sessionStatus } = useSession();
    const isSessionLoaded = sessionStatus !== "loading";
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isUpdatingImage, setIsUpdatingImage] = useState(false);
    const [cropperImage, setCropperImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const utils = api.useUtils();

    const {
        data: dbUser,
        refetch,
        isLoading: isProfileLoading,
    } = api.user.getProfile.useQuery({
        username,
    });

    const isOwner =
        isSessionLoaded && session?.user && dbUser?.id === session.user.id;

    const [bio, setBio] = useState("");
    const [displayName, setDisplayName] = useState("");

    useEffect(() => {
        if (dbUser?.bio) {
            setBio(dbUser.bio);
        }
        if (dbUser?.displayName) {
            setDisplayName(dbUser.displayName);
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

    const handleImageClick = () => {
        if (isOwner && fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input so same file can be selected again
        e.target.value = "";

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be less than 10MB");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setCropperImage(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleCropComplete = async (croppedImage: string) => {
        setCropperImage(null);
        setIsUpdatingImage(true);

        try {
            const response = await fetch("/api/auth/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ profileImage: croppedImage }),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile image");
            }

            toast.success("Profile picture updated!");
            void refetch();
            void utils.user.getCurrentUser.invalidate();
            void utils.user.getProfile.invalidate();
            void utils.post.invalidate();
        } catch {
            toast.error("Failed to update profile picture");
        } finally {
            setIsUpdatingImage(false);
        }
    };

    const handleSaveProfile = async () => {
        try {
            const response = await fetch("/api/auth/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ displayName }),
            });

            if (!response.ok) {
                throw new Error("Failed to update profile");
            }

            toast.success("Profile updated!");
            setIsEditingProfile(false);
            void refetch();
            void utils.user.getCurrentUser.invalidate();
        } catch {
            toast.error("Failed to update profile");
        }
    };

    if (isProfileLoading || !isSessionLoaded || !dbUser) {
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
        <>
            {/* Cropper Modal */}
            {cropperImage && (
                <CropperModal
                    imageSrc={cropperImage}
                    onClose={() => setCropperImage(null)}
                    onCropComplete={handleCropComplete}
                />
            )}

            <div className="glass-panel p-8 rounded-2xl mb-8 relative overflow-hidden group">
                {/* Decorative background blur */}
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-purple-500/10 blur-[100px] rounded-full transition-all group-hover:bg-purple-500/20" />

                {/* Hidden file input */}
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-8">
                    {/* Profile Image */}
                    <div className="relative">
                        <div
                            className={`w-32 h-32 rounded-full overflow-hidden ring-4 ring-white/10 shadow-2xl relative group/avatar ${isOwner ? "cursor-pointer" : ""}`}
                            onClick={handleImageClick}
                        >
                            {isUpdatingImage ? (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
                                </div>
                            ) : dbUser.profileImage ?? dbUser.image ? (
                                <Image
                                    src={(dbUser.profileImage ?? dbUser.image)!}
                                    alt={
                                        dbUser.displayName ??
                                        dbUser.username ??
                                        "Profile"
                                    }
                                    width={128}
                                    height={128}
                                    className="object-cover w-full h-full transition-transform duration-500 group-hover/avatar:scale-110"
                                />
                            ) : (
                                <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                    <User size={48} className="text-slate-600" />
                                </div>
                            )}

                            {isOwner && !isUpdatingImage && (
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity">
                                    <Camera size={24} className="text-white" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                            <div>
                                {isEditingProfile ? (
                                    <div className="flex items-center gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={displayName}
                                            onChange={(e) =>
                                                setDisplayName(e.target.value)
                                            }
                                            placeholder="Display Name"
                                            className="text-2xl font-black text-white bg-white/5 border border-white/10 rounded-lg px-3 py-1 focus:outline-none focus:border-purple-500/50"
                                        />
                                        <button
                                            onClick={handleSaveProfile}
                                            className="p-2 rounded-lg bg-purple-500 text-white hover:bg-purple-600 transition-colors"
                                        >
                                            <Check size={18} />
                                        </button>
                                        <button
                                            onClick={() => {
                                                setDisplayName(
                                                    dbUser.displayName ?? ""
                                                );
                                                setIsEditingProfile(false);
                                            }}
                                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 transition-colors"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <h1 className="text-3xl font-black text-white tracking-tight leading-tight">
                                        {dbUser.displayName ?? dbUser.username}
                                    </h1>
                                )}
                                <p className="text-purple-400 font-medium tracking-wide">
                                    @{dbUser.username}
                                </p>
                            </div>

                            {isOwner && !isEditingProfile && (
                                <button
                                    onClick={() => setIsEditingProfile(true)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-colors border border-white/10"
                                >
                                    <Settings size={16} />
                                    <span className="text-sm font-medium">
                                        Edit Profile
                                    </span>
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
                                                <>
                                                    <Check size={18} /> Save Bio
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={`group/bio p-4 rounded-xl transition-all relative ${isOwner ? "hover:bg-white/5 cursor-pointer" : ""}`}
                                    onClick={() => {
                                        if (isOwner) setIsEditingBio(true);
                                    }}
                                >
                                    <div className="flex items-center gap-2 text-slate-500 mb-1">
                                        <span className="text-xs font-bold uppercase tracking-widest">
                                            About Me
                                        </span>
                                        {isOwner && (
                                            <Edit2
                                                size={12}
                                                className="opacity-0 group-hover/bio:opacity-100 transition-opacity"
                                            />
                                        )}
                                    </div>
                                    <p className="text-slate-300 leading-relaxed max-w-2xl italic">
                                        {dbUser.bio ??
                                            (isOwner
                                                ? "No bio added yet. Click here to add one!"
                                                : "No bio added yet.")}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}