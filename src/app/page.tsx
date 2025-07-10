import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

import { LatestPost } from "~/app/_components/post";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const hello = await api.post.hello({ text: "from tRPC" });

  void api.post.getLatest.prefetch();

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          
          {/* Auth Section */}
          <div className="flex items-center gap-4">
            <SignedOut>
              <SignInButton>
                <button className="rounded-full bg-white/10 px-10 py-3 font-semibold hover:bg-white/20">
                  Sign In
                </button>
              </SignInButton>
              <SignUpButton>
                <button className="rounded-full bg-purple-600 px-10 py-3 font-semibold hover:bg-purple-700">
                  Sign Up
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <UserButton 
                appearance={{
                  elements: {
                    avatarBox: "h-10 w-10"
                  }
                }}
              />
            </SignedIn>
          </div>

          <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem]">
            My <span className="text-[hsl(280,100%,70%)]">Blog</span> App
          </h1>

          <div className="flex flex-col items-center gap-2">
            <p className="text-2xl text-white">
              {hello ? hello.greeting : "Loading tRPC query..."}
            </p>
          </div>

          <LatestPost />
        </div>
      </main>
    </HydrateClient>
  );
}