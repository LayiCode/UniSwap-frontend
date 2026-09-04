import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
import WakingBanner from "@/components/WakingBanner";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "UniSwap — Campus Marketplace",
    template: "%s · UniSwap",
  },
  description:
    "Buy and sell with students on your campus. List items, browse listings, and find deals.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>
          <Navbar />
          <WakingBanner />
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 pb-24 pt-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <footer className="border-t border-neutral-200 py-6 pb-24">
            <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-xs text-neutral-400 sm:flex-row">
              <p>UniSwap — a campus marketplace for students</p>
              <div className="flex items-center gap-4">
                <Link href="/terms" className="transition-colors hover:text-neutral-600">
                  Terms of Use
                </Link>
                <Link href="/privacy" className="transition-colors hover:text-neutral-600">
                  Privacy Policy
                </Link>
              </div>
            </div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
