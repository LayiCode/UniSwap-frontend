"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { api, setToken } from "@/lib/api";
import { safeRedirect } from "@/lib/redirect";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      router.replace("/login?error=oauth");
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        setToken(token);
        await api.getMe(); // throws if the token is invalid
        if (!cancelled) router.replace(safeRedirect(searchParams.get("redirect")));
      } catch {
        if (!cancelled) router.replace("/login?error=oauth");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return (
    <p className="py-16 text-center text-sm text-neutral-500">
      Signing you in…
    </p>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-neutral-500">Loading…</p>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
