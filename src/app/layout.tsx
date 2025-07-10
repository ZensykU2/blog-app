import "~/styles/globals.css";
import { dark } from "@clerk/themes";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider, SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import Link from "next/link";

import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Blog App",
  description: "Modern Blog with Next.js and Clerk",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider
  appearance={{
    baseTheme: dark,
    variables: {
      colorPrimary: "hsl(280,100%,70%)",
      colorBackground: "#0f172a",
      colorInputBackground: "#1e293b",
      colorInputText: "#ffffff",
      colorText: "#ffffff",
      colorTextSecondary: "rgba(255,255,255,0.7)",
      colorTextOnPrimaryBackground: "#ffffff",
      borderRadius: "0.75rem",
    }
  }}
>
  <html lang="en" className={`${geist.variable}`}>
    <body>
      <TRPCReactProvider>
        <header className="sticky top-0 z-50 border-b border-white/10 bg-gradient-to-r from-[#2e026d] to-[#15162c] backdrop-blur-sm">
          <div className="container mx-auto flex items-center justify-between px-4 py-3">
            <Link href="/" className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white hover:text-[hsl(280,100%,70%)] transition">
                My <span className="text-[hsl(280,100%,70%)]">Blog</span>
              </h1>
            </Link>
            
            <div className="flex items-center gap-4">
              <SignedIn>
                <Link href="/my-posts">
                  <button className="rounded-full bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20 transition">
                    My Posts
                  </button>
                </Link>
                <Link href="/create">
                  <button className="rounded-full bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 transition">
                    New Post
                  </button>
                </Link>
              </SignedIn>
              <SignedOut>
                <SignInButton>
                  <button className="rounded-full bg-white/10 px-4 py-2 font-semibold text-white hover:bg-white/20 transition">
                    Sign In
                  </button>
                </SignInButton>
                <SignUpButton>
                  <button className="rounded-full bg-purple-600 px-4 py-2 font-semibold text-white hover:bg-purple-700 transition">
                    Sign Up
                  </button>
                </SignUpButton>
              </SignedOut>
              
              <SignedIn>
                <UserButton 
                  appearance={{
                    elements: {
                      avatarBox: "h-8 w-8",
                      userButtonPopoverCard: "bg-slate-900 border-slate-700 shadow-2xl",
                      userButtonPopoverActionButton__signOut: "!text-red-400 hover:bg-red-900/20",
                    }
                  }}
                />
              </SignedIn>
            </div>
          </div>
        </header>
        {children}
      </TRPCReactProvider>
    </body>
  </html>
</ClerkProvider>
  );
}