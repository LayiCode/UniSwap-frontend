"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { safeRedirect } from "@/lib/redirect";
import ApiErrorBox from "@/components/ApiErrorBox";
import OtpInput from "@/components/OtpInput";
import useCodeCooldown from "@/hooks/useCodeCooldown";

export default function VerifyEmailForm() {
  const searchParams = useSearchParams();
  const initialEmail = searchParams.get("email") ?? "";
  const initialCode = searchParams.get("code") ?? "";
  const redirect = safeRedirect(searchParams.get("redirect"));

  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState(initialCode);
  const [fallbackCode, setFallbackCode] = useState<string | null>(
    initialCode || null
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const cooldown = useCodeCooldown();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await api.verifyEmail(email.trim(), code.trim());
      setMessage("Email verified! You can now log in.");
      setCode("");
    } catch (err) {
      setError(err instanceof Error ? err : "Verification failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    setError(null);
    setResending(true);
    try {
      const res = await api.resendVerificationCode(email.trim());
      setFallbackCode(res.verificationCode ?? null);
      setMessage("A new code is on its way. Check your email.");
      cooldown.start();
    } catch (err) {
      if (!cooldown.handleSendError(err)) {
        setError(err instanceof Error ? err : "Failed to resend code");
      }
    } finally {
      setResending(false);
    }
  }

  const verified = message?.includes("Email verified");

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        Verify your email
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        Enter the 6-digit code we emailed you to activate your account.
      </p>

      {fallbackCode && (
        <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          We couldn&apos;t deliver the email, so here&apos;s your code:{" "}
          <strong className="tracking-widest">{fallbackCode}</strong>
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block text-sm font-medium text-neutral-700">
          Email
          <p className="mt-1 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-700">
            {email.trim() || "Your campus email"}
          </p>
        </label>

        <div>
          <span className="text-sm font-medium text-neutral-700">
            Verification code
          </span>
          <OtpInput value={code} onChange={setCode} disabled={submitting} />
        </div>

        {message && (
          <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
            {message}
          </p>
        )}
        <ApiErrorBox error={error} />

        {!verified && (
          <button
            type="submit"
            disabled={submitting || code.length !== 6}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Verifying…" : "Verify email"}
          </button>
        )}
      </form>

      {verified ? (
        <div className="mt-6 space-y-3">
          <Link
            href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
            className="block w-full rounded-lg bg-neutral-900 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-neutral-700"
          >
            Log in
          </Link>
        </div>
      ) : (
        <button
          type="button"
          disabled={resending || cooldown.secondsLeft > 0}
          onClick={resendCode}
          className="mt-6 w-full text-center text-sm font-medium text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cooldown.secondsLeft > 0
            ? `Resend code in ${cooldown.secondsLeft}s…`
            : resending
              ? "Resending…"
              : "Resend code"}
        </button>
      )}

      <p className="mt-6 text-center text-sm text-neutral-500">
        Already verified?{" "}
        <Link
          href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
          className="font-medium text-brand-700 hover:underline"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}
