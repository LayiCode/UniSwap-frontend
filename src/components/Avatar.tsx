"use client";

import Image from "next/image";
import { imageUrl } from "@/lib/api";

// Renders a user avatar as a circular image when one exists, otherwise a
// neutral circle with the user's initial. `src` should already be a raw URL
// (Supabase or backend); it's passed through imageUrl() so backend-hosted
// avatars rewrite through the same-origin proxy.
export default function Avatar({
  src,
  name,
  size = 40,
  className = "",
}: {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
}) {
  const url = imageUrl(src);
  const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
  if (url) {
    return (
      <Image
        src={url}
        alt={name || "User"}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <div
      className={`grid shrink-0 select-none place-items-center rounded-full bg-brand-600 font-semibold text-white ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}
