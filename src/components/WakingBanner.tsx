"use client";

import { useEffect, useState } from "react";
import { isWakingServer, subscribeWakingServer } from "@/lib/wakingServer";

// Shown only while the API client is retrying a request after the (free-tier)
// backend woke from sleep — i.e. very rarely, and mostly on a cold first load
// after the server idled. Renders as a slim, non-blocking pill floating just
// below the sticky navbar and auto-dismisses when the retry succeeds.
export default function WakingBanner() {
  const [waking, setWaking] = useState(isWakingServer());

  useEffect(() => subscribeWakingServer(setWaking), []);

  if (!waking) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed left-1/2 top-20 z-30 -translate-x-1/2"
    >
      <div className="flex items-center gap-2.5 rounded-full border border-neutral-200 bg-white/95 px-4 py-2 text-sm text-neutral-700 shadow-lg backdrop-blur">
        <span className="size-4 animate-spin rounded-full border-2 border-neutral-300 border-t-brand-600" />
        <span>Waking UniSwap up… one moment</span>
      </div>
    </div>
  );
}
