"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, formatDate, formatPrice, imageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/lib/types";
import { Loading } from "@/components/RequireAuth";

export default function ProductDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const loading = product === null && error === null;

  useEffect(() => {
    let cancelled = false;
    api
      .getProduct(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch((err) => {
        if (!cancelled)
          setError(
            err instanceof Error
              ? err.message
              : "This listing could not be found."
          );
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  const isOwner = !!user && product?.sellerId === user.id;
  const img = imageUrl(product?.imageUrl);

  const markSold = async () => {
    if (!product || !window.confirm("Mark this listing as sold?")) return;
    setBusy(true);
    try {
      const updated = await api.markSold(product.id);
      setProduct(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update listing");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!product || !window.confirm("Delete this listing permanently?")) return;
    setBusy(true);
    try {
      await api.deleteProduct(product.id);
      router.push("/my-listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete listing");
      setBusy(false);
    }
  };

  if (loading) return <Loading />;

  if (error || !product) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-4xl">🫥</p>
        <h1 className="mt-4 text-xl font-semibold">Listing not found</h1>
        <p className="mt-2 text-sm text-neutral-500">{error}</p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Back to listings
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-6xl text-neutral-300">
            📦
          </div>
        )}
        {product.status === "SOLD" && (
          <span className="absolute left-3 top-3 rounded-lg bg-neutral-900 px-3 py-1 text-sm font-semibold text-white">
            SOLD
          </span>
        )}
      </div>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">
            {product.category}
          </span>
          <span className="rounded-full bg-neutral-100 px-3 py-1 text-neutral-600">
            {product.itemCondition}
          </span>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight">
          {product.title}
        </h1>
        <p className="text-3xl font-bold text-brand-700">
          {formatPrice(product.price)}
        </p>

        <div className="border-t border-neutral-200 pt-4 text-sm text-neutral-600">
          <p>
            Seller:{" "}
            <span className="font-medium text-neutral-900">
              {product.sellerUsername}
            </span>
          </p>
          <p className="mt-1">
            Listed on {formatDate(product.createdAt)}
          </p>
        </div>

        {user && !isOwner && (
          <Link
            href={`/messages/${product.sellerId}?name=${encodeURIComponent(product.sellerUsername)}`}
            className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
          >
            Message seller
          </Link>
        )}

        {product.description && (
          <div className="border-t border-neutral-200 pt-4">
            <h2 className="text-sm font-semibold text-neutral-900">
              Description
            </h2>
            <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-neutral-600">
              {product.description}
            </p>
          </div>
        )}

        {isOwner && (
          <div className="mt-auto flex flex-col gap-3 border-t border-neutral-200 pt-4">
            <p className="text-sm font-medium text-neutral-600">
              This is your listing.
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/products/${product.id}/edit`}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
              >
                Edit listing
              </Link>
              {product.status !== "SOLD" && (
                <button
                  onClick={markSold}
                  disabled={busy}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                >
                  Mark as sold
                </button>
              )}
              <button
                onClick={remove}
                disabled={busy}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        {!user && (
          <p className="mt-auto border-t border-neutral-200 pt-4 text-sm text-neutral-500">
            Want to sell or buy like this?{" "}
            <Link href="/login" className="font-medium text-brand-700 hover:underline">
              Log in
            </Link>{" "}
            or{" "}
            <Link href="/register" className="font-medium text-brand-700 hover:underline">
              sign up
            </Link>
            .
          </p>
        )}
      </div>
    </div>
  );
}
