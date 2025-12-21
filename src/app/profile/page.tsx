"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProfilePage() {
    const { data: session, status } = useSession();
    const router = useRouter();

    useEffect(() => {
        if (status !== 'loading') {
            if (session?.user?.username) {
                router.replace(`/profile/${session.user.username}`);
            } else if (session?.user) {
                // User is logged in but has no username, redirect to home
                router.replace("/");
            } else {
                // Not logged in
                router.replace("/");
            }
        }
    }, [status, session, router]);

    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
    );
}
