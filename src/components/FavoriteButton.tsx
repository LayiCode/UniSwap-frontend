"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

// Heart toggle for a listing. Logged-in users get an optimistic toggle that
// rolls back if the request fails; anonymous users are sent to /login with a
// redirect back to where they clicked. The internal state starts from the
// product's server-provided `favorited` flag, so callers that swap products
// (e.g. a detail page refetch) should key this component by product id.
export default function FavoriteButton({
  productId,
  favorited: initiallyFavorited = false,
  className = "",
  onFavoritedChange,
}: {
  productId: number;
  favorited?: boolean;
  className?: string;
  onFavoritedChange?: (favorited: boolean) => void;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    if (!user) {
      router.push(
        `/login?redirect=${encodeURIComponent(window.location.pathname)}`
      );
      return;
    }
    const next = !favorited;
    setBusy(true);
    setFavorited(next);
    onFavoritedChange?.(next);
    try {
      if (next) {
        await api.addFavorite(productId);
      } else {
        await api.removeFavorite(productId);
      }
    } catch {
      setFavorited(!next);
      onFavoritedChange?.(!next);
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-label={favorited ? "Remove from favorites" : "Save to favorites"}
      aria-pressed={favorited}
      className={`grid size-11 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white disabled:opacity-60 ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        aria-hidden="true"
        className={`size-5 transition-colors ${
          favorited ? "fill-brand-600 text-brand-600" : "fill-none text-neutral-600"
        }`}
      >
        <path
          d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
