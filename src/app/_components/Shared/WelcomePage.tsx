import Link from "next/link";
import { Button } from "./Button";

export function WelcomePage() {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-20 left-20 h-72 w-72 rounded-full bg-purple-600/30 blur-[100px] animate-pulse"></div>
      <div className="absolute bottom-20 right-20 h-96 w-96 rounded-full bg-indigo-600/20 blur-[120px] animate-pulse delay-700"></div>

      <div className="container relative z-10 flex flex-col items-center justify-center gap-8 px-4 py-16 text-center">
        <div className="animate-float">
          <h1 className="text-6xl font-black tracking-tight sm:text-[7rem] leading-tight">
            <span className="bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Share Your
            </span>
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent text-glow">
              Story
            </span>
          </h1>
        </div>

        <p className="max-w-2xl text-xl text-slate-300/90 font-light leading-relaxed animate-fade-in [animation-delay:200ms]">
          A beautiful space to discover amazing stories, share your thoughts, and connect with a community of passionate writers.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-6 mt-8">
          <div className="animate-slide-up [animation-delay:400ms] opacity-0">
            <Link href="/sign-in">
              <Button
                variant="glass"
                size="lg"
                className="rounded-full min-w-[160px] text-lg font-semibold"
              >
                Sign In
              </Button>
            </Link>
          </div>

          <div className="animate-slide-up [animation-delay:600ms] opacity-0">
            <Link href="/sign-up">
              <Button
                variant="secondary"
                size="lg"
                className="rounded-full min-w-[160px] text-lg font-bold hover:shadow-[0_0_40px_-10px_rgba(255,255,255,0.7)]"
              >
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}