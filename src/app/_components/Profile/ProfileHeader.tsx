"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
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
    const [pendingDisplayName, setPendingDisplayName] = useState("");
    const [pendingUsername, setPendingUsername] = useState("");
    const [pendingBio, setPendingBio] = useState("");
    const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
    const [pendingBanner, setPendingBanner] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const bannerInputRef = useRef<HTMLInputElement>(null);
    const utils = api.useUtils();
    const router = useRouter();

    const {
        data: dbUser,
        refetch,
        isLoading: isProfileLoading,
    } = api.user.getProfile.useQuery({
        username,
    });

    const isOwner =
        isSessionLoaded && session?.user && dbUser?.id === session.user.id;


    const [isEditingProfile, setIsEditingProfile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [cropperImage, setCropperImage] = useState<string | null>(null);
    const [croppingMode, setCroppingMode] = useState<"avatar" | "banner">("avatar");
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (previewImage) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [previewImage]);

    useEffect(() => {
        if (dbUser) {
            setPendingBio(dbUser.bio ?? "");
            setPendingDisplayName(dbUser.displayName ?? "");
            setPendingUsername(dbUser.username ?? "");
            setPendingAvatar(null);
            setPendingBanner(null);
        }
    }, [dbUser]);


    const handleAvatarClick = () => {
        if (isOwner && isEditingProfile && fileInputRef.current) {
            setCroppingMode("avatar");
            fileInputRef.current.click();
        }
    };

    const handleBannerClick = () => {
        if (isOwner && isEditingProfile && bannerInputRef.current) {
            setCroppingMode("banner");
            bannerInputRef.current.click();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Reset input
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
        if (croppingMode === "avatar") {
            setPendingAvatar(croppedImage);
        } else {
            setPendingBanner(croppedImage);
        }
    };

    const handleSaveProfile = async () => {
        if (!dbUser) return;
        setIsSaving(true);
        try {
            const hasUsernameChanged = pendingUsername !== dbUser.username;

            // Only send changed fields to the API
            const updateBody: any = {};
            if (pendingDisplayName !== (dbUser.displayName ?? "")) updateBody.displayName = pendingDisplayName;
            if (hasUsernameChanged) updateBody.username = pendingUsername;
            if (pendingBio !== (dbUser.bio ?? "")) updateBody.bio = pendingBio;
            if (pendingAvatar) updateBody.profileImage = pendingAvatar;
            if (pendingBanner) updateBody.bannerImage = pendingBanner;

            // If nothing changed, just exit edit mode
            if (Object.keys(updateBody).length === 0) {
                setIsEditingProfile(false);
                return;
            }

            const response = await fetch("/api/auth/profile", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(updateBody),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || "Failed to update profile");
            }

            toast.success("Profile updated successfully!");

            // Optimistically update the cache to prevent "reloading" flicker
            const updatedProfile = {
                ...dbUser,
                displayName: pendingDisplayName,
                username: pendingUsername,
                bio: pendingBio,
                profileImage: pendingAvatar ?? dbUser.profileImage,
                bannerImage: pendingBanner ?? dbUser.bannerImage,
            };

            utils.user.getProfile.setData({ username: username as string }, updatedProfile as any);
            if (hasUsernameChanged) {
                utils.user.getProfile.setData({ username: pendingUsername as string }, updatedProfile as any);
            }

            if (hasUsernameChanged) {
                // Navigate to the new username URL
                setIsEditingProfile(false);
                setPendingAvatar(null);
                setPendingBanner(null);
                router.push(`/profile/${pendingUsername}`);
            } else {
                // If username didn't change, we can be more smooth
                await refetch();
                setIsEditingProfile(false);
                setPendingAvatar(null);
                setPendingBanner(null);
            }

            void utils.user.getCurrentUser.invalidate();
            void utils.post.invalidate();
        } catch (error: any) {
            toast.error(error.message || "Failed to update profile");
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (dbUser) {
            setPendingBio(dbUser.bio ?? "");
            setPendingDisplayName(dbUser.displayName ?? "");
            setPendingUsername(dbUser.username ?? "");
            setPendingAvatar(null);
            setPendingBanner(null);
        }
        setIsEditingProfile(false);
    };

    if (isProfileLoading || !isSessionLoaded || !dbUser) {
        return (
            <div className="glass-panel rounded-2xl animate-pulse mb-8 overflow-hidden">
                <div className="h-48 md:h-64 bg-white/5" />
                <div className="p-4 md:p-8 -mt-16 md:-mt-20 relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6">
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-white/10 border-4 border-[#0f172a]" />
                        <div className="flex-1 space-y-4 pb-2">
                            <div className="h-8 w-48 bg-white/10 rounded mx-auto md:mx-0" />
                            <div className="h-4 w-32 bg-white/10 rounded mx-auto md:mx-0" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Cropper Modal */}
            {cropperImage && (
                <CropperModal
                    imageSrc={cropperImage}
                    onClose={() => setCropperImage(null)}
                    onCropComplete={handleCropComplete}
                    aspect={croppingMode === "avatar" ? 1 : 21 / 9}
                    cropShape={croppingMode === "avatar" ? "round" : "rect"}
                    title={croppingMode === "avatar" ? "Adjust Profile Picture" : "Adjust Profile Banner"}
                />
            )}

            <div className="glass-panel rounded-3xl mb-12 relative overflow-hidden group shadow-2xl">
                {/* Banner Image Container */}
                <div
                    className={`h-48 md:h-80 relative group/banner overflow-hidden ${isOwner ? "cursor-pointer" : ""}`}
                    onClick={() => {
                        if (isEditingProfile) {
                            handleBannerClick();
                        } else {
                            setPreviewImage(pendingBanner ?? dbUser.bannerImage ?? null);
                        }
                    }}
                >
                    {(pendingBanner ?? dbUser.bannerImage) ? (
                        <Image
                            src={pendingBanner ?? dbUser.bannerImage!}
                            alt="Profile Banner"
                            fill
                            className="object-cover transition-transform duration-700 group-hover/banner:scale-105"
                            priority
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/40 via-purple-900/40 to-slate-900/40" />
                    )}

                    {isOwner && isEditingProfile && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-all backdrop-blur-sm z-10">
                            <div className="flex flex-col items-center gap-2">
                                <Camera size={32} className="text-white" />
                                <span className="text-white font-bold text-sm uppercase tracking-widest">Update Banner</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Hidden file inputs */}
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
                <input ref={bannerInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />

                <div className="p-6 md:p-10 relative z-10 -mt-16 md:-mt-20 pointer-events-none">
                    <div className="flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-10 pointer-events-auto">
                        <div className="relative pointer-events-auto">
                            <div
                                className={`w-32 h-32 md:w-44 md:h-44 rounded-full overflow-hidden ring-8 ring-[#0f172a]/80 shadow-2xl relative group/avatar ${isOwner ? "cursor-pointer" : ""}`}
                                onClick={() => {
                                    if (isEditingProfile) {
                                        handleAvatarClick();
                                    } else {
                                        setPreviewImage(pendingAvatar ?? dbUser.profileImage ?? dbUser.image ?? null);
                                    }
                                }}
                            >
                                {(pendingAvatar ?? dbUser.profileImage ?? dbUser.image) ? (
                                    <Image
                                        src={(pendingAvatar ?? dbUser.profileImage ?? dbUser.image)!}
                                        alt={pendingDisplayName ?? dbUser.username ?? "Profile"}
                                        width={176}
                                        height={176}
                                        className="object-cover w-full h-full transition-transform duration-500 group-hover/avatar:scale-110"
                                    />
                                ) : (
                                    <div className="w-full h-full bg-slate-800 flex items-center justify-center">
                                        <User size={64} className="text-slate-600" />
                                    </div>
                                )}

                                {isOwner && isEditingProfile && (
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity backdrop-blur-[2px] rounded-full">
                                        <Camera size={24} className="text-white" />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Profile Info Row */}
                        <div className="flex-1 flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 w-full">
                            <div className="text-center md:text-left">
                                {isEditingProfile ? (
                                    <div className="space-y-3">
                                        <input
                                            type="text"
                                            value={pendingDisplayName}
                                            onChange={(e) => setPendingDisplayName(e.target.value)}
                                            placeholder="Display Name"
                                            className="text-2xl md:text-3xl font-black text-white bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-purple-500/50 w-full"
                                            autoFocus
                                        />
                                        <div className="flex items-center bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus-within:border-purple-500/50">
                                            <span className="text-purple-400 font-bold mr-1">@</span>
                                            <input
                                                type="text"
                                                value={pendingUsername}
                                                onChange={(e) => setPendingUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                                                placeholder="username"
                                                className="bg-transparent text-white font-bold tracking-wider outline-none w-full"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex-1">
                                        <div className="flex items-center justify-center md:justify-start gap-3 flex-wrap">
                                            <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                                                {dbUser.displayName ?? dbUser.username}
                                            </h1>
                                            {dbUser.isVerified && (
                                                <div className="bg-purple-500/20 text-purple-400 p-1 rounded-full border border-purple-500/20">
                                                    <Check size={16} />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-purple-400 font-bold tracking-[0.2em] text-xs md:text-sm uppercase mt-1">
                                            @{dbUser.username}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {isOwner && (
                                <div className="flex items-center justify-center md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0">
                                    {isEditingProfile ? (
                                        <div className="flex items-center justify-center gap-3 w-full sm:w-auto">
                                            <button
                                                onClick={handleCancel}
                                                disabled={isSaving}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10 cursor-pointer pointer-events-auto shadow-xl backdrop-blur-md"
                                            >
                                                <X size={18} />
                                                <span className="text-sm font-bold uppercase tracking-widest">Cancel</span>
                                            </button>
                                            <button
                                                onClick={handleSaveProfile}
                                                disabled={isSaving}
                                                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-purple-500 hover:bg-purple-600 text-white transition-all cursor-pointer pointer-events-auto shadow-xl shadow-purple-500/20"
                                            >
                                                {isSaving ? (
                                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                                ) : (
                                                    <>
                                                        <Check size={18} />
                                                        <span className="text-sm font-bold uppercase tracking-widest">Save</span>
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={() => setIsEditingProfile(true)}
                                            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all border border-white/10 cursor-pointer pointer-events-auto shadow-xl backdrop-blur-md w-full sm:w-auto"
                                        >
                                            <Settings size={18} />
                                            <span className="text-sm font-bold uppercase tracking-widest">Edit Profile</span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Bio Section */}
                    <div className="mt-8 md:mt-12 max-w-3xl mx-auto md:mx-0 pointer-events-auto">
                        {isEditingProfile && isOwner ? (
                            <div className="space-y-4 animate-fade-in bg-white/5 p-6 rounded-3xl border border-white/10 shadow-inner">
                                <TextareaAutosize
                                    value={pendingBio}
                                    onChange={(e) => setPendingBio(e.target.value)}
                                    placeholder="Tell the world your story..."
                                    className="w-full bg-transparent text-slate-200 placeholder-slate-500 focus:outline-none transition-all min-h-[120px] resize-none text-lg leading-relaxed text-center md:text-left"
                                />
                            </div>
                        ) : (
                            <div
                                className={`group/bio transition-all relative flex flex-col items-center md:items-start text-center md:text-left ${isOwner ? "hover:translate-x-1" : ""}`}
                            >
                                <div className="flex items-center gap-3 text-slate-500 mb-3">
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] bg-white/5 px-3 py-1 rounded-full border border-white/5">About the author</span>
                                </div>
                                <p className="text-slate-300 md:text-xl leading-relaxed italic font-light">
                                    {dbUser.bio ?? (isOwner ? "No story shared yet..." : "This author hasn't shared their story yet.")}
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Lightbox / Preview Overlay */}
            {previewImage && mounted && typeof document !== "undefined" && createPortal(
                <div
                    className="fixed inset-0 top-0 left-0 w-screen h-screen z-[999999] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 md:p-12 animate-fade-in"
                    style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}
                >
                    <div className="absolute inset-0 w-full h-full cursor-pointer" onClick={() => setPreviewImage(null)} />

                    <button
                        className="absolute top-6 right-6 p-4 text-white/50 hover:text-white transition-all z-[1000001] bg-white/5 hover:bg-white/10 rounded-full border border-white/10 backdrop-blur-md flex items-center justify-center cursor-pointer"
                        onClick={(e) => { e.stopPropagation(); setPreviewImage(null); }}
                    >
                        <X size={28} />
                    </button>

                    <div className="relative w-full h-full max-w-[95vw] max-h-[90vh] flex items-center justify-center pointer-events-none">
                        <div className="relative w-full h-full flex items-center justify-center pointer-events-auto">
                            <Image
                                src={previewImage}
                                alt="Preview"
                                fill
                                className="object-contain"
                                priority
                                sizes="95vw"
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
}
