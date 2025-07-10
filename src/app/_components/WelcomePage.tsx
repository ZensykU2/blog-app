import { SignInButton, SignUpButton } from "@clerk/nextjs";

export function WelcomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-6xl font-extrabold tracking-tight sm:text-[6rem]">
          Welcome to <span className="text-[hsl(280,100%,70%)]">Blog</span>
        </h1>
        
        <p className="text-xl text-white/80 text-center max-w-2xl">
          Discover amazing stories, share your thoughts, and connect with writers from around the world.
        </p>

        <div className="flex items-center gap-6">
          <SignInButton>
            <button className="rounded-full bg-white/10 px-8 py-4 text-lg font-semibold hover:bg-white/20 transition">
              Sign In
            </button>
          </SignInButton>
          
          <SignUpButton>
            <button className="rounded-full bg-purple-600 px-8 py-4 text-lg font-semibold hover:bg-purple-700 transition">
              Get Started
            </button>
          </SignUpButton>
        </div>
      </div>
    </main>
  );
}