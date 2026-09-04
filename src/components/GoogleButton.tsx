"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// Renders the Google sign-in button only when the backend reports a Google
// client is configured (dev environments don't have one). Clicking leaves the
// frontend and starts the OAuth dance on the backend origin; the browser comes
// back to /auth/callback?token=... on success.
//
// The Render free tier sleeps after inactivity, so the auth config request can
// fail transiently on a cold start. To avoid the button appearing only after a
// long delay, we render it immediately on first paint and make it tappable as
// soon as the URL arrives. The only case that hides it is a definitive
// "Google not configured" response (local dev).
const MAX_ATTEMPTS = 5;
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export default function GoogleButton() {
  const [url, setUrl] = useState<string | null>(null);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (let attempt = 0; attempt < MAX_ATTEMPTS && !cancelled; attempt++) {
        try {
          const config = await api.getAuthConfig();
          if (cancelled) return;
          if (config.googleEnabled) {
            setUrl(config.googleAuthorizationUrl);
          } else {
            // Only a definitive response hides the button.
            setHidden(true);
          }
          return;
        } catch {
          if (cancelled) return;
          // Network/cold-start failures never hide the button; keep retrying,
          // and if the backend stays down leave it rendered but inert.
          if (attempt >= MAX_ATTEMPTS - 1) return;
          await wait(1000 * Math.pow(2, attempt));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (hidden) return null;

  const active = !!url;

  return (
    <a
      href={active ? url : undefined}
      onClick={(e) => {
        if (!active) e.preventDefault();
      }}
      aria-disabled={!active}
      aria-busy={!active}
      className={`flex w-full items-center justify-center gap-3 rounded-lg border border-neutral-300 bg-white px-4 py-3 font-semibold text-neutral-700 transition-colors ${
        active
          ? "cursor-pointer hover:bg-neutral-50"
          : "cursor-not-allowed opacity-80"
      }`}
    >
      <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.57 5.57 0 0 1-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
        />
        <path
          fill="#34A853"
          d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z"
        />
        <path
          fill="#FBBC05"
          d="M5.27 14.29a7.2 7.2 0 0 1 0-4.58V6.62H1.29a12 12 0 0 0 0 10.76l3.98-3.09z"
        />
        <path
          fill="#EA4335"
          d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
        />
      </svg>
      Continue with Google
    </a>
  );
}
