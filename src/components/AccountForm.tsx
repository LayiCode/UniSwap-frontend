"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { inputClass } from "@/components/ProductForm";
import Avatar from "@/components/Avatar";
import ApiErrorBox from "@/components/ApiErrorBox";

export default function AccountForm() {
  const { user, refreshUser } = useAuth();
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Seed the editable fields from the loaded user. Reset when the user changes.
  useEffect(() => {
    if (!user) return;
    setDisplayName(user.displayName ?? "");
    setBio(user.bio ?? "");
    setLocation(user.location ?? "");
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
        displayName: displayName.trim(),
        bio: bio.trim(),
        location: location.trim(),
      });
      await refreshUser();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err : "Could not save profile");
    } finally {
      setSaving(false);
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
            value={user.phoneNumber}
            readOnly
            className={`${inputClass} bg-neutral-100 text-neutral-500`}
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
    </div>
  );
}
