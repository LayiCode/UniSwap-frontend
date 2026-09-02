"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { inputClass } from "@/components/ProductForm";
import Avatar from "@/components/Avatar";
import PasswordInput from "@/components/PasswordInput";
import ApiErrorBox from "@/components/ApiErrorBox";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function AccountForm() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [username, setUsername] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<unknown>(null);
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Seed the editable fields from the loaded user. Reset when the user changes.
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    setBio(user.bio ?? "");
    setLocation(user.location ?? "");
    setUsername(user.username ?? "");
    setPhoneNumber(user.phoneNumber ?? "");
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!user) return null;

  const avatarSrc = avatarFile
    ? URL.createObjectURL(avatarFile)
    : user.avatarUrl;

  async function handleAvatar(file: File) {
    setAvatarBusy(true);
    setError(null);
    try {
      await api.uploadAvatar(file);
      setAvatarFile(null);
      if (fileRef.current) fileRef.current.value = "";
      await refreshUser();
    } catch (err) {
      setError(err instanceof Error ? err : "Could not upload avatar");
    } finally {
      setAvatarBusy(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api.updateProfile({
        displayName: displayName.trim() || undefined,
        bio: bio.trim() || undefined,
        location: location.trim() || undefined,
        username: username.trim() || undefined,
        phoneNumber: phoneNumber.trim() || undefined,
      });
      await refreshUser();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err : "Could not save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e: FormEvent) {
    e.preventDefault();
    setPasswordError(null);
    setPasswordNotice(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordError("New passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      await api.changePassword({
        currentPassword,
        newPassword,
      });
      setPasswordNotice("Password updated.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      setPasswordError(err instanceof Error ? err : "Could not change password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleDeleteAccount() {
    setDeleting(true);
    setError(null);
    try {
      await api.deleteAccount();
      setConfirmDelete(false);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err : "Could not delete account");
      setConfirmDelete(false);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="mx-auto max-w-xl">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Manage how you appear on UniSwap and your default pickup location.
      </p>

      {/* Avatar */}
      <div className="mt-8 flex items-center gap-4">
        <label
          className="relative cursor-pointer"
          title="Change avatar"
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleAvatar(f);
            }}
          />
          <Avatar src={avatarSrc} name={displayName || user.username} size={72} />
          <span className="absolute -bottom-1 -right-1 grid size-7 place-items-center rounded-full bg-neutral-900 text-sm text-white">
            {avatarBusy ? (
              <span className="size-3 animate-spin rounded-full border-2 border-transparent border-t-white" />
            ) : (
              "✎"
            )}
          </span>
        </label>
        <div className="text-sm text-neutral-500">
          <p className="font-medium text-neutral-900">Profile photo</p>
          <p className="mt-0.5">
            JPEG, PNG or WEBP. {avatarBusy ? "Uploading…" : "Click to change."}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <label className="block text-sm font-medium text-neutral-700">
          Username
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={30}
            autoComplete="username"
            placeholder="Optional — keep your current one"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-neutral-400">
            Leave blank to keep your current username.
          </span>
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Display name
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={60}
            autoComplete="name"
            placeholder={user.username}
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Phone number
          <input
            type="text"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            maxLength={20}
            autoComplete="tel"
            className={inputClass}
          />
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Default pickup location
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            maxLength={120}
            placeholder="e.g. North Gate, LAUTECH"
            className={inputClass}
          />
          <span className="mt-1 block text-xs text-neutral-400">
            Prefills new listings you create.
          </span>
        </label>

        <label className="block text-sm font-medium text-neutral-700">
          Bio
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="A short line about you or what you sell…"
            className={`${inputClass} resize-y`}
          />
        </label>

        <ApiErrorBox error={error} />

        <button
          type="submit"
          disabled={saving}
          className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save changes"}
        </button>
      </form>

      {/* Change password: requires the current password. */}
      <section className="mt-10 border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Change password</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Set a new password for your account.
        </p>
        <form onSubmit={handleChangePassword} className="mt-4 space-y-5">
          <label className="block text-sm font-medium text-neutral-700">
            Current password
            <PasswordInput
              required
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block text-sm font-medium text-neutral-700">
              New password
              <PasswordInput
                required
                minLength={8}
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </label>

            <label className="block text-sm font-medium text-neutral-700">
              Confirm new password
              <PasswordInput
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
              />
            </label>
          </div>

          <ApiErrorBox error={passwordError} />
          {passwordNotice && (
            <p className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {passwordNotice}
            </p>
          )}

          <div className="flex items-center justify-between">
            <Link
              href="/forgot-password"
              className="text-sm font-medium text-brand-700 hover:underline"
            >
              Forgot your password?
            </Link>
            <button
              type="submit"
              disabled={changingPassword}
              className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {changingPassword ? "Updating…" : "Update password"}
            </button>
          </div>
        </form>
      </section>

      {/* Danger zone: deleting an account is irreversible. */}
      <section className="mt-10 border-t border-neutral-200 pt-6">
        <h2 className="text-lg font-semibold text-neutral-900">Danger zone</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Permanently remove your profile and listings from UniSwap.
        </p>
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="mt-4 rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 transition-colors hover:bg-red-50"
        >
          Delete account
        </button>
      </section>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete account?"
        message="This permanently hides your listings and signs you out. Your chat and purchase history is kept for the other people involved, but your profile is removed and you can no longer sign in with this account. This can't be undone — continue?"
        confirmLabel={deleting ? "Deleting…" : "Delete account"}
        danger
        busy={deleting}
        onConfirm={handleDeleteAccount}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}
