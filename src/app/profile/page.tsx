"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
    const { user, isLoaded, isSignedIn } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (isLoaded) {
            if (isSignedIn && user?.username) {
                router.replace(`/profile/${user.username}`);
            } else if (isSignedIn && !user?.username) {
                // Fallback for users without usernames (rare in Clerk if configured)
                router.replace("/");
            } else if (!isSignedIn) {
                router.replace("/");
            }
        }
    }, [isLoaded, isSignedIn, user, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
    );
}
