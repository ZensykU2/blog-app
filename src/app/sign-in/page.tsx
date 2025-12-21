"use client";

import { Suspense } from "react";
import { SignInForm } from "./SignInForm";

export default function SignInPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen flex items-center justify-center p-4">
                    <div className="glass-panel rounded-3xl p-10 w-full max-w-md">
                        <div className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto" />
                    </div>
                </main>
            }
        >
            <SignInForm />
        </Suspense>
    );
}