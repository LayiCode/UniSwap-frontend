import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import Navbar from "@/components/Navbar";
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
          <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
            <ErrorBoundary>{children}</ErrorBoundary>
          </main>
          <footer className="border-t border-neutral-200 py-6 text-center text-xs text-neutral-400">
            UniSwap — a campus marketplace for students
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
