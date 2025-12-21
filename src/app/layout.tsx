import "~/styles/globals.css";
import { dark } from "@clerk/themes";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "react-hot-toast";
import { Header } from "./_components/Header";

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
            <Toaster position="bottom-right" toastOptions={{
              style: {
                background: '#1e293b',
                color: '#fff',
                border: '1px solid rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
              }
            }} />
            <Header />
            {children}
          </TRPCReactProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
