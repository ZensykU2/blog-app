import "~/styles/globals.css";
import { type Metadata } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { Header } from "./_components/Shared/Header";
import { AuthProvider } from "./_components/Shared/AuthProvider";
import { TRPCReactProvider } from "~/trpc/react";

export const metadata: Metadata = {
  title: "Blog App",
  description: "Modern Blog with Next.js",
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
    <html lang="en" className={geist.variable}>
      <body>
        <AuthProvider>
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
            <main className="pt-[73px]">
              {children}
            </main>
          </TRPCReactProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
