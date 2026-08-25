"use client";

import Image from "next/image";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { api, imageUrl } from "@/lib/api";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import type { Product, ProductInput } from "@/lib/types";

const MAX_IMAGES = 5;

export const inputClass =
  "mt-1 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20";

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      {label}
      {required && <span className="text-red-500"> *</span>}
      {children}
    </label>
  );
}

interface ProductFormProps {
  product?: Product;
  submitLabel?: string;
  onSaved: (product: Product) => void;
}

export default function ProductForm({
  product,
  submitLabel = "Publish Listing",
  onSaved,
}: ProductFormProps) {
  const [title, setTitle] = useState(product?.title ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(product ? String(product.price) : "");
  const [category, setCategory] = useState(product?.category ?? "");
  const [itemCondition, setItemCondition] = useState(
    product?.itemCondition ?? ""
  );
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Object URLs for the newly picked files; revoked whenever the selection
  // changes or the form unmounts so blobs don't leak.
  const newPreviews = useMemo(
    () =>
      files.map((f) => ({
        name: f.name,
        url: URL.createObjectURL(f),
      })),
    [files]
  );
  useEffect(
    () => () => {
      newPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    },
    [newPreviews]
  );

  // Photos already stored on the server (edit mode only).
  const existingImages: string[] = useMemo(() => {
    if (!product) return [];
    if (product.imageUrls && product.imageUrls.length > 0)
      return product.imageUrls;
    return product.imageUrl ? [product.imageUrl] : [];
  }, [product]);

  function addFiles(selected: FileList | null) {
    if (!selected) return;
    const combined = [...files, ...Array.from(selected)];
    if (combined.length > MAX_IMAGES) {
      setError(`A listing can have at most ${MAX_IMAGES} images`);
      return;
    }
    setError(null);
    setFiles(combined);
  }

  function removeNewFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const payload: ProductInput = {
      title: title.trim(),
      description: description.trim() || null,
      price: Number(price),
      category,
      itemCondition,
    };

    if (!payload.title) return setError("Title is required");
    if (!payload.price || payload.price <= 0)
      return setError("Price must be greater than zero");
    if (!payload.category) return setError("Choose a category");
    if (!payload.itemCondition) return setError("Choose a condition");

    setSubmitting(true);
    try {
      let saved: Product;
      if (product) {
        saved = await api.updateProduct(product.id, payload);
        if (files.length > 0) saved = await api.uploadImages(product.id, files);
      } else {
        saved = await api.createProduct(payload);
        if (files.length > 0) saved = await api.uploadImages(saved.id, files);
      }
      onSaved(saved);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong, try again"
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {existingImages.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
            Current photos
          </p>
          <div className="flex flex-wrap gap-3">
            {existingImages.map((src, i) => (
              <div
                key={src}
                className="relative h-24 w-24 overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100"
              >
                <Image
                  src={imageUrl(src) ?? ""}
                  alt={i === 0 ? "Cover photo" : `Photo ${i + 1}`}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {newPreviews.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-neutral-400">
            New photos
          </p>
          <div className="flex flex-wrap gap-3">
            {newPreviews.map((p, i) => (
              <div
                key={p.url}
                className="relative h-24 w-24 overflow-hidden rounded-lg border border-brand-300 bg-neutral-100"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.url}
                  alt={p.name}
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeNewFile(i)}
                  aria-label={`Remove ${p.name}`}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs font-bold text-white hover:bg-red-600"
                >
                  ×
                </button>
                {existingImages.length === 0 && i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-black/60 px-1 py-0.5 text-center text-[10px] font-medium text-white">
                    Cover
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <Field label={`Photos (up to ${MAX_IMAGES})`} required={existingImages.length + files.length === 0}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          onChange={(e) => {
            addFiles(e.target.files);
            e.target.value = "";
          }}
          disabled={existingImages.length + files.length >= MAX_IMAGES}
          className="mt-1 block w-full text-sm text-neutral-500 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-700"
        />
        <p className="mt-1 text-xs text-neutral-400">
          JPEG, PNG or WEBP up to 5MB each.
          {product &&
            " Uploading new photos replaces ALL current photos on this listing."}
        </p>
      </Field>

      <Field label="Title" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={255}
          placeholder="e.g. Used HP EliteBook 840 G3"
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Price (₦)" required>
          <input
            type="number"
            min="0"
            step="any"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="e.g. 85000"
            className={inputClass}
          />
        </Field>

        <Field label="Condition" required>
          <select
            value={itemCondition}
            onChange={(e) => setItemCondition(e.target.value)}
            className={inputClass}
          >
            <option value="" disabled>
              Select condition
            </option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Category" required>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        >
          <option value="" disabled>
            Select category
          </option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Description">
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={5}
          placeholder="Condition details, specs, pickup location…"
          className={`${inputClass} resize-y`}
        />
      </Field>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-600 px-4 py-3 font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
