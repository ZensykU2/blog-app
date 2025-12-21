"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-hot-toast";

export default function SignInPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const callbackUrl = searchParams.get("callbackUrl") ?? "/";

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailSignIn = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email || !password) {
            toast.error("Please fill in all fields");
            return;
        }

        setIsLoading(true);
        try {
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                toast.error("Invalid email or password");
            } else {
                router.push(callbackUrl);
                router.refresh();
            }
        } catch {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignIn = () => {
        void signIn("google", { callbackUrl });
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4">
            <div className="glass-panel rounded-3xl p-10 w-full max-w-md relative overflow-hidden">
                {/* Decorative blur */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-600/20 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

                <div className="relative z-10">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-black tracking-tight text-white mb-2">
                            Welcome back to <span className="bg-gradient-to-r from-purple-400 to-indigo-400 bg-clip-text text-transparent">Inkwell</span>
                        </h1>
                        <p className="text-slate-400">Sign in to continue your writing journey</p>
                    </div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleEmailSignIn} className="space-y-4 mb-6">
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                            />
                        </div>

                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-white/5 border border-white/10 rounded-xl py-4 pl-12 pr-12 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold py-4 px-6 rounded-xl hover:from-purple-600 hover:to-indigo-600 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" />
                            ) : (
                                "Sign In"
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-4 my-6">
                        <div className="flex-1 h-px bg-white/10"></div>
                        <span className="text-slate-500 text-sm">or continue with</span>
                        <div className="flex-1 h-px bg-white/10"></div>
                    </div>

                    {/* Google Sign In */}
                    <button
                        onClick={handleGoogleSignIn}
                        className="w-full flex items-center justify-center gap-3 bg-white text-slate-900 font-bold py-4 px-6 rounded-xl hover:bg-slate-100 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-white/10 cursor-pointer"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Continue with Google
                    </button>

                    {/* Sign Up Link */}
                    <p className="text-center text-slate-400 mt-6">
                        Don&apos;t have an account?{" "}
                        <Link href="/sign-up" className="text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            Sign up
                        </Link>
                    </p>

                    <div className="mt-6 pt-6 border-t border-white/10 text-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group">
                            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                            Back to Home
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
