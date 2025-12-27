import { auth } from "~/server/auth";

import { WelcomePage } from "~/app/_components/Shared/WelcomePage";
import { MainFeed } from "~/app/_components/Posts/MainFeed";
import { HydrateClient } from "~/trpc/server";

export const dynamic = 'force-dynamic';

export default async function Home() {
  const session = await auth();

  return (
    <HydrateClient>
      <main className="min-h-screen">
        {!session?.user ? (
          <div className="relative z-10 transition-all duration-500">
            <WelcomePage />
          </div>
        ) : (
          <div className="container mx-auto px-4 py-8 animate-slide-up">
            <MainFeed />
          </div>
        )}
      </main>
    </HydrateClient>
  );
}