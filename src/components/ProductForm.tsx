"use client";

import Image from "next/image";
import { useState, type FormEvent } from "react";
import { api, imageUrl } from "@/lib/api";
import { CATEGORIES, CONDITIONS } from "@/lib/constants";
import type { Product, ProductInput } from "@/lib/types";

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
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const preview = file ? URL.createObjectURL(file) : null;
  const existingImage = imageUrl(product?.imageUrl);

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
        if (file) saved = await api.uploadImage(product.id, file);
      } else {
        saved = await api.createProduct(payload);
        if (file) saved = await api.uploadImage(saved.id, file);
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
      {(preview || existingImage) && (
        <div className="relative aspect-[4/3] w-full max-w-sm overflow-hidden rounded-xl border border-neutral-200 bg-neutral-100">
          <Image
            src={preview ?? existingImage!}
            alt="Listing preview"
            fill
            sizes="(max-width: 640px) 100vw, 384px"
            className="object-cover"
          />
        </div>
      )}

      <Field label="Image" required={!existingImage}>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="mt-1 block w-full text-sm text-neutral-500 file:mr-3 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-700"
        />
        <p className="mt-1 text-xs text-neutral-400">
          JPEG, PNG or WEBP up to 5MB{existingImage && " — a new file replaces the current image"}
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
