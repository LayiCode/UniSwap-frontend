"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import Avatar from "@/components/Avatar";
import ConfirmDialog from "@/components/ConfirmDialog";
import logo from "@/app/icon.png";

function Icon({ children, className = "size-6" }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

function HomeIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V21h14V9.5" />
    </Icon>
  );
}

function MessagesIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5c-1.08 0-2.13-.2-3.08-.55L3 21l1.55-5.9A8.38 8.38 0 0 1 4 11.5a8.38 8.38 0 0 1 9-8.5 8.38 8.38 0 0 1 8 8.5Z" />
    </Icon>
  );
}

function FavoritesIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </Icon>
  );
}

function ProfileIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c.5-4 3.8-6 8-6s7.5 2 8 6" />
    </Icon>
  );
}

function SellIcon(props: { className?: string }) {
  return (
    <Icon {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </Icon>
  );
}

export default function Navbar() {
  const { user, loading, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const [confirmLogout, setConfirmLogout] = useState(false);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const fetchCount = () =>
      api
        .getUnreadCount()
        .then((r) => {
          if (!cancelled) setUnread(r.count);
        })
        .catch(() => {});
    fetchCount();
    const interval = setInterval(fetchCount, 15000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    setConfirmLogout(false);
    setMenuOpen(false);
    logout();
    router.push("/");
  };

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname?.startsWith(href);

  const bottomLink = (href: string) =>
    `flex flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium transition-colors ${
      isActive(href)
        ? "text-brand-700"
        : "text-neutral-500 hover:text-neutral-900"
    }`;

  const iconWrap = (active: boolean) =>
    `relative grid size-10 place-items-center rounded-full transition-colors ${
      active
        ? "bg-brand-100 text-brand-700"
        : "text-neutral-500"
    }`;

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
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

          <div className="hidden items-center gap-1 md:flex">
            {user && (
              <Link href="/my-listings" className={linkStyles("/my-listings", isActive("/my-listings"))}>
                My Listings
              </Link>
            )}
            {user && (
              <Link href="/purchases" className={linkStyles("/purchases", isActive("/purchases"))}>
                Purchases
              </Link>
            )}
            {user?.admin && (
              <Link href="/moderation" className={linkStyles("/moderation", isActive("/moderation"))}>
                Moderation
              </Link>
            )}
          </div>

          <div className="flex items-center gap-2">
            {loading ? null : user ? (
              <>
                <Link
                  href="/products/new"
                  onClick={() => setMenuOpen(false)}
                  className="hidden items-center rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700 md:inline-flex"
                >
                  Sell Item
                </Link>
                <Link
                  href={`/users/${user.id}`}
                  className="hidden items-center gap-2 rounded-md px-2 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:flex"
                >
                  <Avatar
                    src={user.avatarUrl}
                    name={user.displayName || user.username}
                    size={28}
                  />
                  <span className="max-w-32 truncate">
                    {user.displayName || user.username}
                  </span>
                </Link>
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="hidden rounded-md px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900 md:block"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="hidden rounded-md px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 hover:text-neutral-900 sm:block"
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  className="hidden rounded-lg bg-neutral-900 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 sm:block"
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
              className="grid size-10 place-items-center rounded-lg text-neutral-700 transition-colors hover:bg-neutral-100 md:hidden"
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
            className="flex flex-col gap-1 border-t border-neutral-200 bg-white px-4 pb-4 pt-2 md:hidden"
          >
            {user ? (
              <>
                <Link
                  href="/products/new"
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg bg-brand-600 px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
                >
                  Sell Item
                </Link>
                {["/my-listings", "/purchases"].map((href) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMenuOpen(false)}
                    className={linkStyles(href, isActive(href))}
                  >
                    {href === "/my-listings" ? "My Listings" : "Purchases"}
                  </Link>
                ))}
                {user.admin && (
                  <Link
                    href="/moderation"
                    onClick={() => setMenuOpen(false)}
                    className={linkStyles("/moderation", isActive("/moderation"))}
                  >
                    Moderation
                  </Link>
                )}
                <button
                  onClick={() => setConfirmLogout(true)}
                  className="rounded-md px-3 py-2.5 text-left text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className={linkStyles("/login", isActive("/login"))}
                >
                  Log in
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className={linkStyles("/register", isActive("/register"))}
                >
                  Sign up
                </Link>
              </>
            )}
          </nav>
        )}
      </header>

      {/* Bottom navigation (Nextdoor-style) */}
      <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
          <Link href="/" className={`${bottomLink("/")} flex-1`}>
            <span className={iconWrap(isActive("/"))}>
              <HomeIcon className="size-6" />
            </span>
            Home
          </Link>

          {user && (
            <Link href="/messages" className={`${bottomLink("/messages")} flex-1`}>
              <span className={iconWrap(isActive("/messages"))}>
                <MessagesIcon className="size-6" />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid size-4 place-items-center rounded-full bg-brand-600 text-[9px] font-bold leading-none text-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </span>
              Messages
            </Link>
          )}

          <Link
            href="/products/new"
            className={`flex flex-1 flex-col items-center gap-0.5 rounded-xl px-2 py-1 text-[10px] font-medium text-neutral-500 transition-colors hover:text-neutral-900`}
          >
            <span className="grid size-11 -translate-y-3 place-items-center rounded-full bg-brand-600 text-white shadow-lg transition-colors hover:bg-brand-700">
              <SellIcon className="size-6" />
            </span>
            Sell
          </Link>

          {user && (
            <Link href="/favorites" className={`${bottomLink("/favorites")} flex-1`}>
              <span className={iconWrap(isActive("/favorites"))}>
                <FavoritesIcon className="size-6" />
              </span>
              Favorites
            </Link>
          )}

          <Link
            href={user ? `/users/${user.id}` : "/login"}
            className={`${bottomLink(user ? `/users/${user.id}` : "/login")} flex-1`}
          >
            <span className={iconWrap(isActive(user ? `/users/${user.id}` : "/login"))}>
              <ProfileIcon className="size-6" />
            </span>
            Profile
          </Link>
        </div>
      </nav>

      <ConfirmDialog
        open={confirmLogout}
        title="Log out?"
        message="You'll need an account code to sign back in on this device. Log out anyway?"
        confirmLabel="Log out"
        onConfirm={handleLogout}
        onCancel={() => setConfirmLogout(false)}
      />
    </>
  );
}

function linkStyles(href: string, active: boolean) {
  return `rounded-md px-3 py-2.5 text-sm font-medium transition-colors ${
    active
      ? "bg-neutral-900 text-white"
      : "text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900"
  }`;
}