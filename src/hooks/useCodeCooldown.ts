"use client";

import { useEffect, useRef, useState } from "react";
import { ApiError } from "@/lib/api";

const DEFAULT_COOLDOWN = 30;

// Countdown used to throttle verification-code resends. After a successful
// send the button is disabled for DEFAULT_COOLDOWN seconds; if the server
// rejects the request with a 429 it tells us the exact remaining wait via
// retryAfterSeconds, and we sync to that so the UI matches the backend.
export default function useCodeCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);
  const endAtRef = useRef(0);

  useEffect(() => {
    const tick = () => {
      const remaining = Math.ceil((endAtRef.current - Date.now()) / 1000);
      setSecondsLeft(remaining > 0 ? remaining : 0);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, []);

  // Always keeps ticking; clear the active countdown (endAtRef 0 → 0 left).
  useEffect(() => {
    if (secondsLeft === 0) endAtRef.current = 0;
  }, [secondsLeft]);

  // Start (or restart) a fresh cooldown tick.
  function start(duration = DEFAULT_COOLDOWN) {
    endAtRef.current = Date.now() + duration * 1000;
    setSecondsLeft(duration);
  }

  // Register a server error: if it's a 429 with retryAfterSeconds, sync the
  // countdown to the server's remaining time. Returns true if the error was a
  // cooldown rejection so callers can branch (e.g. show a wait message).
  function handleSendError(err: unknown): boolean {
    if (err instanceof ApiError && err.status === 429) {
      const seconds = err.retryAfterSeconds ?? DEFAULT_COOLDOWN;
      endAtRef.current = Date.now() + seconds * 1000;
      setSecondsLeft(seconds);
      return true;
    }
    return false;
  }

  function clear() {
    endAtRef.current = 0;
    setSecondsLeft(0);
  }

  return { secondsLeft, start, handleSendError, clear };
}
