"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { inputClass } from "@/components/ProductForm";
import PasswordInput from "@/components/PasswordInput";
import { safeRedirect } from "@/lib/redirect";
import GoogleButton from "@/components/GoogleButton";

// Mirrors the backend's rule so users get instant feedback instead of a
// round-trip: the password must not equal, contain, or closely resemble the
// username.
function isPasswordSimilarToUsername(username: string, password: string): boolean {
  const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, "");
  const u = normalize(username);
  const p = normalize(password);
  if (!u || !p) return false;
  return u === p || p.includes(u) || u.includes(p);
}

type UsernameStatus = "available" | "taken";

interface UsernameCheck {
  username: string;
  status: UsernameStatus;
}

export default function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // The result of the most recent live availability check, tagged with the
  // username it was for so a stale result is never shown against new input.
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheck | null>(null);

  // Debounced live availability check: fires ~400ms after the user stops
  // typing, so the backend isn't hammered on every keystroke. setState calls
  // happen only inside the async timeout callback, never in the effect body.
  useEffect(() => {
    const trimmed = username.trim();
    if (trimmed.length < 3) return;
    const handle = window.setTimeout(async () => {
      try {
        const res = await api.checkUsername(trimmed);
        setUsernameCheck({
          username: trimmed,
          status: res.available ? "available" : "taken",
        });
      } catch {
        // Network hiccup — don't block signup on the availability check.
        setUsernameCheck(null);
      }
    }, 400);
    return () => window.clearTimeout(handle);
  }, [username]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (
      usernameCheck &&
      usernameCheck.username === trimmedUsername &&
      usernameCheck.status === "taken"
    ) {
      setError("That username is already taken. Try another one.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (isPasswordSimilarToUsername(username, password)) {
      setError("Password must not be the same as or too similar to your username");
      return;
    }

    setSubmitting(true);
    try {
      await api.register({
        username: username.trim(),
        email: email.trim(),
        phoneNumber: phoneNumber.trim(),
        password,
      });
      // No session yet — the account must be email-verified first.
      router.push(
        `/verify-email?email=${encodeURIComponent(email.trim())}${redirect !== "/" ? `&redirect=${encodeURIComponent(redirect)}` : ""}`
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  function usernameHint(): { text: string; className: string } | null {
    const trimmed = username.trim();
    if (trimmed.length === 0) return null;
    if (trimmed.length < 3) {
      return { text: "At least 3 characters", className: "text-neutral-500" };
    }
    if (usernameCheck && usernameCheck.username === trimmed) {
      return usernameCheck.status === "available"
        ? { text: "Username available", className: "text-emerald-600" }
        : { text: "Username is already taken", className: "text-red-600" };
    }
    return { text: "Checking availability…", className: "text-neutral-500" };
  }

  const hint = usernameHint();

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Join your campus marketplace in a minute.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block text-sm font-medium text-neutral-700">
          Username
          <input
            type="text"
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Choose a unique username"
            className={inputClass}
          />
          {hint && (
            <span className={`mt-1 block text-xs ${hint.className}`}>{hint.text}</span>
          )}
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Email
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Your campus email"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Phone number
          <input
            type="tel"
            required
            autoComplete="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Your phone number"
            className={inputClass}
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-medium text-neutral-700">
            Password
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Confirm password
            <PasswordInput
              required
              minLength={8}
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repeat your password"
            />
          </label>
        </div>

        {error && (
          <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-emerald-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">or</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already have an account?{" "}
        <Link
          href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="font-medium text-emerald-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
