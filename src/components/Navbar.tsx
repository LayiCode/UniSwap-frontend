"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import logo from "@/app/icon.png";

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const linkClass = (href: string) =>
    `rounded-md px-3 py-2 text-sm font-medium transition-colors ${
      pathname === href
        ? "bg-neutral-900 text-white"
        : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
    }`;

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src={logo}
              alt="UniSwap logo"
              width={32}
              height={32}
              className="size-8 rounded-lg object-cover"
              priority
            />
            <span className="text-lg font-semibold tracking-tight">
              UniSwap
            </span>
          </Link>
          <div className="hidden items-center gap-1 sm:flex">
            <Link href="/" className={linkClass("/")}>
              Browse
            </Link>
            {user && (
              <Link href="/my-listings" className={linkClass("/my-listings")}>
                My Listings
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {loading ? null : user ? (
            <>
              <Link
                href="/products/new"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
              >
                Sell Item
              </Link>
              <span className="hidden max-w-32 truncate text-sm font-medium text-neutral-600 md:block">
                {user.username}
              </span>
              <button
                onClick={handleLogout}
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:block"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden rounded-md px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:block"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="hidden rounded-lg bg-neutral-900 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 sm:block"
              >
                Sign up
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            className="grid size-10 place-items-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 sm:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              className="size-5"
              aria-hidden="true"
            >
              {menuOpen ? (
                <>
                  <path d="M6 6l12 12" />
                  <path d="M18 6L6 18" />
                </>
              ) : (
                <>
                  <path d="M4 6h16" />
                  <path d="M4 12h16" />
                  <path d="M4 18h16" />
                </>
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav
          id="mobile-nav"
          className="flex flex-col gap-1 border-t border-neutral-200 bg-white px-4 pb-4 pt-2 sm:hidden"
        >
          <Link
            href="/"
            onClick={() => setMenuOpen(false)}
            className={linkClass("/")}
          >
            Browse
          </Link>
          {user ? (
            <>
              <Link
                href="/my-listings"
                onClick={() => setMenuOpen(false)}
                className={linkClass("/my-listings")}
              >
                My Listings
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md px-3 py-2 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
              >
                Log out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setMenuOpen(false)}
                className={linkClass("/login")}
              >
                Log in
              </Link>
              <Link
                href="/register"
                onClick={() => setMenuOpen(false)}
                className={linkClass("/register")}
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      )}
    </header>
  );
}
