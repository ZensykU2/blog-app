import { SignedIn, SignedOut } from "@clerk/nextjs";

import { WelcomePage } from "~/app/_components/WelcomePage";
import { MainFeed } from "~/app/_components/MainFeed";
import { HydrateClient } from "~/trpc/server";

export const dynamic = 'force-dynamic';

export default async function Home() {
  return (
    <HydrateClient>
      <main className="min-h-screen">
        <SignedOut>
          <div className="relative z-10 transition-all duration-500">
            <WelcomePage />
          </div>
        </SignedOut>

        <SignedIn>
          <div className="container mx-auto px-4 py-8 animate-slide-up">
            <MainFeed />
          </div>
        </SignedIn>
      </main>
    </HydrateClient>
  );
}