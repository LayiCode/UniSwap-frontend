"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api, formatDate, formatPrice, imageUrl } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Product, ReportReason } from "@/lib/types";
import { Loading } from "@/components/RequireAuth";
import FavoriteButton from "@/components/FavoriteButton";
import ConfirmDialog from "@/components/ConfirmDialog";
import Avatar from "@/components/Avatar";

export default function ProductDetail({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  // Selected photo in the gallery; reset whenever a listing loads.
  const [imgIndex, setImgIndex] = useState(0);

  // This listing about to be marked sold or deleted, awaiting confirmation.
  const [confirming, setConfirming] = useState<"sold" | "delete" | null>(null);

  // Request-to-buy state
  const [buyMessage, setBuyMessage] = useState("");
  const [buyBusy, setBuyBusy] = useState(false);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [buyDone, setBuyDone] = useState(false);

  // Report state
  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState<ReportReason>("SPAM");
  const [reportDetails, setReportDetails] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportDone, setReportDone] = useState(false);

  const loading = product === null && error === null;

  useEffect(() => {
    let cancelled = false;
    api
      .getProduct(id)
      .then((p) => {
        if (!cancelled) {
          setImgIndex(0);
          setProduct(p);
        }
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
  const gallery: string[] = product?.imageUrls?.length
    ? product.imageUrls
    : product?.imageUrl
      ? [product.imageUrl]
      : [];
  const activeImg = imageUrl(gallery[Math.min(imgIndex, gallery.length - 1)]);

  const markSold = async () => {
    if (!product) return;
    setBusy(true);
    try {
      const updated = await api.markSold(product.id);
      setProduct(updated);
      setConfirming(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update listing");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    if (!product) return;
    setBusy(true);
    try {
      await api.deleteProduct(product.id);
      router.push("/my-listings");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete listing");
      setBusy(false);
      setConfirming(null);
    }
  };

  const requestToBuy = async () => {
    if (!product) return;
    setBuyBusy(true);
    setBuyError(null);
    try {
      await api.createPurchaseRequest({
        productId: product.id,
        message: buyMessage.trim() || undefined,
      });
      setBuyMessage("");
      setBuyDone(true);
      setProduct((prev) => (prev ? { ...prev, purchaseRequested: true } : prev));
    } catch (err) {
      setBuyError(err instanceof Error ? err.message : "Could not send request");
    } finally {
      setBuyBusy(false);
    }
  };

  const submitReport = async () => {
    if (!product) return;
    setReportBusy(true);
    setReportError(null);
    try {
      await api.createReport({
        productId: product.id,
        reason: reportReason,
        details: reportDetails.trim() || undefined,
      });
      setReportOpen(false);
      setReportDetails("");
      setReportDone(true);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Could not submit report");
    } finally {
      setReportBusy(false);
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
      <div>
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-neutral-200 bg-neutral-100">
          {activeImg ? (
            <Image
              src={activeImg}
              alt={gallery.length > 1 ? `${product.title} (photo ${imgIndex + 1} of ${gallery.length})` : product.title}
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
          {product.status === "REMOVED" && (
            <span className="absolute left-3 top-3 rounded-lg bg-red-700 px-3 py-1 text-sm font-semibold text-white">
              REMOVED
            </span>
          )}
          <FavoriteButton
            productId={product.id}
            favorited={product.favorited}
            className="absolute right-3 top-3 z-10"
          />
        </div>

        {gallery.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {gallery.map((src, i) => {
              const thumb = imageUrl(src);
              if (!thumb) return null;
              return (
                <button
                  key={src}
                  type="button"
                  onClick={() => setImgIndex(i)}
                  aria-label={`Show photo ${i + 1}`}
                  className={`relative h-16 w-16 overflow-hidden rounded-lg border-2 transition-colors ${
                    i === imgIndex
                      ? "border-brand-600"
                      : "border-neutral-200 opacity-70 hover:opacity-100"
                  }`}
                >
                  <Image
                    src={thumb}
                    alt=""
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </button>
              );
            })}
          </div>
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
          <Link
            href={`/users/${product.sellerId}`}
            className="flex items-center gap-2 font-medium text-neutral-900 hover:underline"
          >
            <Avatar
              src={product.sellerAvatarUrl}
              name={product.sellerDisplayName || product.sellerUsername}
              size={28}
            />
            <span>
              {product.sellerDisplayName || product.sellerUsername}
            </span>
          </Link>
          {product.location && (
            <p className="mt-1 flex items-center gap-1.5">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3.5 shrink-0"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{product.location}</span>
            </p>
          )}
          <p className="mt-1">Listed on {formatDate(product.createdAt)}</p>
        </div>

        {user && !isOwner && (
          <div className="flex flex-col gap-3 border-t border-neutral-200 pt-4">
            <Link
              href={`/messages/${product.sellerId}?name=${encodeURIComponent(product.sellerUsername)}`}
              className="inline-flex items-center justify-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700"
            >
              Message seller
            </Link>

            {product.status === "AVAILABLE" && !product.purchaseRequested && (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50/50 p-4">
                <h2 className="text-sm font-semibold text-neutral-900">
                  Request to buy
                </h2>
                <p className="mt-1 text-xs text-neutral-500">
                  Send the seller a request. If they accept, this listing is
                  marked as sold.
                </p>
                <textarea
                  value={buyMessage}
                  onChange={(e) => setBuyMessage(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Optional note for the seller (e.g. a pickup time that suits you)"
                  className="mt-3 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-brand-600 focus:outline-none"
                />
                {buyError && (
                  <p className="mt-2 text-sm text-red-600">{buyError}</p>
                )}
                <button
                  onClick={requestToBuy}
                  disabled={buyBusy}
                  className="mt-3 w-full rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:opacity-50"
                >
                  {buyBusy ? "Sending…" : "Request to buy"}
                </button>
                {buyDone && (
                  <p className="mt-2 text-sm text-green-700">
                    Request sent — the seller will review it in Purchases.
                  </p>
                )}
              </div>
            )}

            {product.status === "AVAILABLE" && product.purchaseRequested && (
              <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                You&apos;ve already sent a request to buy this listing. The
                seller will review it in Purchases.
              </p>
            )}

            {reportDone ? (
              <p className="text-sm text-green-700">
                Thanks — a moderator will review this report.
              </p>
            ) : reportOpen ? (
              <div className="rounded-xl border border-red-200 bg-red-50/60 p-4">
                <h2 className="text-sm font-semibold text-red-900">
                  Report this listing
                </h2>
                <p className="mt-1 text-xs text-red-800/70">
                  Tell us what&apos;s wrong and our moderators will take a look.
                </p>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value as ReportReason)}
                  className="mt-3 w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                >
                  <option value="SPAM">Spam</option>
                  <option value="INAPPROPRIATE">Inappropriate</option>
                  <option value="SCAM">Scam</option>
                  <option value="DUPLICATE">Duplicate</option>
                  <option value="OTHER">Other</option>
                </select>
                <textarea
                  value={reportDetails}
                  onChange={(e) => setReportDetails(e.target.value)}
                  maxLength={2000}
                  rows={3}
                  placeholder="Optional details"
                  className="mt-2 w-full resize-none rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
                />
                {reportError && (
                  <p className="mt-2 text-sm text-red-600">{reportError}</p>
                )}
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={submitReport}
                    disabled={reportBusy}
                    className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
                  >
                    {reportBusy ? "Submitting…" : "Submit report"}
                  </button>
                  <button
                    onClick={() => {
                      setReportOpen(false);
                      setReportError(null);
                    }}
                    className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setReportOpen(true)}
                className="self-start text-xs font-medium text-neutral-400 underline-offset-2 hover:text-red-600 hover:underline"
              >
                Report this listing
              </button>
            )}
          </div>
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
                  onClick={() => setConfirming("sold")}
                  disabled={busy}
                  className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
                >
                  Mark as sold
                </button>
              )}
              <button
                onClick={() => setConfirming("delete")}
                disabled={busy}
                className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        )}

        <ConfirmDialog
          open={confirming === "sold"}
          title="Mark as sold"
          message="Mark this listing as sold? This can't be undone."
          confirmLabel={busy ? "Marking…" : "Mark as sold"}
          busy={busy}
          onConfirm={markSold}
          onCancel={() => setConfirming(null)}
        />
        <ConfirmDialog
          open={confirming === "delete"}
          title="Delete listing"
          message="Delete this listing permanently? This can't be undone."
          confirmLabel={busy ? "Deleting…" : "Delete"}
          busy={busy}
          danger
          onConfirm={remove}
          onCancel={() => setConfirming(null)}
        />

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
