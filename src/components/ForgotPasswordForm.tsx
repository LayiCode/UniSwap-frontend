"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { inputClass } from "@/components/ProductForm";
import PasswordInput from "@/components/PasswordInput";
import ApiErrorBox from "@/components/ApiErrorBox";
import OtpInput from "@/components/OtpInput";
import useCodeCooldown from "@/hooks/useCodeCooldown";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const cooldown = useCodeCooldown();

  async function requestCode(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);
    setSubmitting(true);
    try {
      await api.forgotPassword(email.trim());
      setCodeSent(true);
      setMessage(
        "If that email belongs to an account, a reset code is on its way."
      );
      cooldown.start();
    } catch (err) {
      if (!cooldown.handleSendError(err)) {
        setError(err instanceof Error ? err : "Failed to send reset code");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function resendCode() {
    setError(null);
    setMessage(null);
    setResending(true);
    try {
      await api.forgotPassword(email.trim());
      setMessage("A new reset code is on its way. Check your email.");
      cooldown.start();
    } catch (err) {
      if (!cooldown.handleSendError(err)) {
        setError(err instanceof Error ? err : "Failed to resend code");
      }
    } finally {
      setResending(false);
    }
  }

  async function resetPassword(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (newPassword !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setSubmitting(true);
    try {
      await api.resetPassword(email.trim(), code.trim(), newPassword);
      setMessage("Password reset! You can now log in with a code.");
    } catch (err) {
      setError(err instanceof Error ? err : "Failed to reset password");
    } finally {
      setSubmitting(false);
    }
  }

  const done = message?.includes("Password reset");

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">
        Forgot your password?
      </h1>
      <p className="mt-1 text-sm text-neutral-500">
        {codeSent
          ? "Enter the reset code we emailed you, then set a new password."
          : "We&apos;ll email you a one-time code to reset it."}
      </p>

      {!codeSent ? (
        <form onSubmit={requestCode} className="mt-8 space-y-5">
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

          <ApiErrorBox error={error} />

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting ? "Sending code…" : "Send reset code"}
          </button>
        </form>
      ) : (
        <form onSubmit={resetPassword} className="mt-8 space-y-5">
          <div>
            <span className="text-sm font-medium text-neutral-700">
              Verification code
            </span>
            <OtpInput value={code} onChange={setCode} disabled={submitting} />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-neutral-700">
              New password
              <PasswordInput
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Confirm new password
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

          {message && (
            <p className="rounded-lg border border-brand-200 bg-brand-50 px-3 py-2 text-sm text-brand-700">
              {message}
            </p>
          )}
          <ApiErrorBox error={error} />

          {!done && (
            <button
              type="submit"
              disabled={submitting || code.length !== 6}
              className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Resetting…" : "Reset password"}
            </button>
          )}

          {!done && (
            <div className="text-center text-sm">
              <button
                type="button"
                disabled={resending || cooldown.secondsLeft > 0}
                onClick={resendCode}
                className="font-medium text-brand-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {cooldown.secondsLeft > 0
                  ? `Resend code in ${cooldown.secondsLeft}s…`
                  : resending
                    ? "Resending…"
                    : "Resend code"}
              </button>
            </div>
          )}
        </form>
      )}

      {done && (
        <Link
          href="/login"
          className="mt-6 block w-full rounded-lg bg-neutral-900 px-4 py-3 text-center font-semibold text-white transition-colors hover:bg-neutral-700"
        >
          Log in
        </Link>
      )}

      <p className="mt-6 text-center text-sm text-neutral-500">
        <Link
          href="/login"
          className="font-medium text-brand-700 hover:underline"
        >
          Back to login
        </Link>
      </p>
    </div>
  );
}
