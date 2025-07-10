import { SignedIn, SignedOut } from "@clerk/nextjs";

import { WelcomePage } from "~/app/_components/WelcomePage";
import { MainFeed } from "~/app/_components/MainFeed";
import { HydrateClient } from "~/trpc/server";

export default function Home() {
  return (
    <HydrateClient>
      <SignedOut>
        <WelcomePage />
      </SignedOut>
      
      <SignedIn>
        <MainFeed />
      </SignedIn>
    </HydrateClient>
  );
}