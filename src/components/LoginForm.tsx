"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { inputClass } from "@/components/ProductForm";
import PasswordInput from "@/components/PasswordInput";
import { safeRedirect } from "@/lib/redirect";
import GoogleButton from "@/components/GoogleButton";
import ApiErrorBox from "@/components/ApiErrorBox";
import OtpInput from "@/components/OtpInput";
import useCodeCooldown from "@/hooks/useCodeCooldown";

type LoginMode = "password" | "code";

export default function LoginForm() {
  const { login, requestLoginCode, loginWithCode } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = safeRedirect(searchParams.get("redirect"));

  const [mode, setMode] = useState<LoginMode>("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [fallbackCode, setFallbackCode] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<unknown>(
    searchParams.get("error") === "oauth"
      ? new Error("Google sign-in didn't complete. Please try again.")
      : null
  );
  const [submitting, setSubmitting] = useState(false);
  const cooldown = useCodeCooldown();

  async function submitPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      router.push(redirect);
    } catch (err) {
      setError(err instanceof Error ? err : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const res = await requestLoginCode(email.trim());
      setFallbackCode(res.verificationCode ?? null);
      setCodeSent(true);
      cooldown.start();
    } catch (err) {
      if (!cooldown.handleSendError(err)) {
        setError(err instanceof Error ? err : "Failed to send code");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await loginWithCode(email.trim(), code.trim());
      router.push(redirect);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Verification failed";
      // Backend's 401 for a valid-but-unverified account — point them at the
      // email verification page instead of a dead end.
      setError(
        message.includes("Email not verified")
          ? new Error(
              "Your email isn't verified yet. Check your inbox for the signup code, or verify it now."
            )
          : err instanceof Error
            ? err
            : "Verification failed"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setError(null);
    setPassword("");
    setCode("");
    setCodeSent(false);
    setFallbackCode(null);
    cooldown.clear();
  }

  async function resendCode() {
    setError(null);
    setResending(true);
    try {
      await requestLoginCode(email.trim());
      setCode("");
      cooldown.start();
    } catch (err) {
      if (!cooldown.handleSendError(err)) {
        setError(err instanceof Error ? err : "Failed to resend code");
      }
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Log in with your password, or request a one-time code instead.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-1 rounded-lg bg-neutral-100 p-1">
        <button
          type="button"
          onClick={() => switchMode("password")}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            mode === "password"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Password
        </button>
        <button
          type="button"
          onClick={() => switchMode("code")}
          className={`rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
            mode === "code"
              ? "bg-white text-neutral-900 shadow-sm"
              : "text-neutral-500 hover:text-neutral-700"
          }`}
        >
          Email code
        </button>
      </div>

      {mode === "password" ? (
        <form onSubmit={submitPassword} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-neutral-700">
            Campus email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <label className="block text-sm font-medium text-neutral-700">
            Password
            <PasswordInput
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>

          <ApiErrorBox error={error} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>
      ) : !codeSent ? (
        <form onSubmit={requestCode} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-neutral-700">
            Campus email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
          </label>

          <ApiErrorBox error={error} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending code…" : "Send login code"}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="mt-8 space-y-5">
          <p className="text-sm text-neutral-500">
            We emailed a 6-digit code to <strong>{email.trim()}</strong>.
          </p>

          {fallbackCode && (
            <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
              We couldn&apos;t deliver that email, so here&apos;s your code:{" "}
              <strong className="tracking-widest">{fallbackCode}</strong>
            </p>
          )}

          <div>
            <span className="text-sm font-medium text-neutral-700">
              Verification code
            </span>
            <OtpInput value={code} onChange={setCode} disabled={submitting} />
          </div>

          <ApiErrorBox error={error} />

          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Signing in…" : "Verify and log in"}
          </button>

          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
            <button
              type="button"
              disabled={resending || cooldown.secondsLeft > 0}
              onClick={resendCode}
              className="font-medium text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
            >
              {cooldown.secondsLeft > 0
                ? `Resend in ${cooldown.secondsLeft}s…`
                : resending
                  ? "Resending…"
                  : "Resend code"}
            </button>
            <Link
              href={`/verify-email?email=${encodeURIComponent(email.trim())}`}
              className="font-medium text-neutral-500 hover:underline"
            >
              Didn&apos;t verify your email?
            </Link>
          </div>
        </form>
      )}

      <div className="my-6 flex items-center gap-3">
        <span className="h-px flex-1 bg-neutral-200" />
        <span className="text-xs text-neutral-400">or</span>
        <span className="h-px flex-1 bg-neutral-200" />
      </div>

      <GoogleButton />

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link
          href="/forgot-password"
          className="font-medium text-brand-700 hover:underline"
        >
          Forgot your password?
        </Link>
        <span className="mx-2 text-neutral-300">•</span>
        New to UniSwap?{" "}
        <Link
          href={`/register${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="font-medium text-brand-700 hover:underline"
        >
          Create an account
        </Link>
      </p>
    </div>
  );
}
