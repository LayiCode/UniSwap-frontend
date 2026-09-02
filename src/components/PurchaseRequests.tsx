"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate, formatPrice } from "@/lib/api";
import type { PageResponse, PurchaseRequest, PurchaseRequestStatus } from "@/lib/types";
import Pagination from "@/components/Pagination";
import { Loading } from "@/components/RequireAuth";

const statusStyles: Record<PurchaseRequestStatus, string> = {
  PENDING: "bg-amber-100 text-amber-800",
  ACCEPTED: "bg-green-100 text-green-800",
  DECLINED: "bg-red-100 text-red-800",
  CANCELLED: "bg-neutral-100 text-neutral-600",
};

const statusLabels: Record<PurchaseRequestStatus, string> = {
  PENDING: "Pending",
  ACCEPTED: "Accepted",
  DECLINED: "Declined",
  CANCELLED: "Cancelled",
};

export default function PurchaseRequests() {
  const [scope, setScope] = useState<"received" | "sent">("received");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: PageResponse<PurchaseRequest>;
  } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const key = `${scope}-${page}`;
  const loading = result?.key !== key && error?.key !== key;
  const shownError = error?.key === key ? error.message : null;

  useEffect(() => {
    let cancelled = false;
    api
      .getPurchaseRequests(scope, page)
      .then((res) => {
        if (!cancelled) {
          setError(null);
          setResult({ key, data: res });
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError({
            key,
            message:
              err instanceof Error ? err.message : "Failed to load requests",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [scope, page, key]);

  const switchScope = (next: "received" | "sent") => {
    setScope(next);
    setPage(0);
    setActionError(null);
  };

  const decide = async (id: number, action: "accept" | "decline" | "cancel") => {
    setBusyId(id);
    setActionError(null);
    try {
      const updated =
        action === "accept"
          ? await api.acceptPurchaseRequest(id)
          : action === "decline"
            ? await api.declinePurchaseRequest(id)
            : await api.cancelPurchaseRequest(id);
      setResult((prev) =>
        prev
          ? {
              ...prev,
              data: {
                ...prev.data,
                content: prev.data.content.map((r) =>
                  r.id === updated.id ? updated : r
                ),
              },
            }
          : prev
      );
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "That action could not be completed"
      );
    } finally {
      setBusyId(null);
    }
  };

  const tabClass = (active: boolean) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      active
        ? "bg-neutral-900 text-white"
        : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
    }`;

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Purchases</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Buy requests you&apos;ve received on your listings, and the ones
          you&apos;ve sent.
        </p>
      </div>

      <div className="mb-6 flex gap-2">
        <button className={`${tabClass(scope === "received")} btn-touch`} onClick={() => switchScope("received")}>
          Received
        </button>
        <button className={`${tabClass(scope === "sent")} btn-touch`} onClick={() => switchScope("sent")}>
          Sent
        </button>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {loading ? (
        <Loading />
      ) : shownError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {shownError}
        </p>
      ) : result && result.data.content.length > 0 ? (
        <>
          <ul className="flex flex-col gap-4">
            {result.data.content.map((req) => (
              <li
                key={req.id}
                className="rounded-xl border border-neutral-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${req.productId}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {req.productTitle}
                    </Link>
                    <p className="mt-0.5 text-sm font-semibold text-brand-700">
                      {formatPrice(req.productPrice)}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[req.status]}`}
                  >
                    {statusLabels[req.status]}
                  </span>
                </div>

                <div className="mt-3 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
                  <p>
                    {scope === "received" ? "Buyer" : "Seller"}:{" "}
                    <span className="font-medium text-neutral-900">
                      {scope === "received" ? req.buyerUsername : req.sellerUsername}
                    </span>{" "}
                    · {formatDate(req.createdAt)}
                  </p>
                  {req.message && (
                    <p className="mt-2 whitespace-pre-wrap text-neutral-500">
                      “{req.message}”
                    </p>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {req.status === "PENDING" && scope === "received" && (
                    <>
                      <button
                        onClick={() => decide(req.id, "accept")}
                        disabled={busyId === req.id}
                        className="rounded-lg bg-green-700 px-4 py-2 btn-touch text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-50"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => decide(req.id, "decline")}
                        disabled={busyId === req.id}
                        className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 btn-touch text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </>
                  )}
                  {req.status === "PENDING" && scope === "sent" && (
                    <button
                      onClick={() => decide(req.id, "cancel")}
                      disabled={busyId === req.id}
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 btn-touch text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                    >
                      Cancel request
                    </button>
                  )}
                  {req.status === "ACCEPTED" && (
                    <p className="text-sm text-green-700">
                      You can meet up to exchange this item.
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <Pagination
              page={result.data.page}
              totalPages={result.data.totalPages}
              onPageChange={setPage}
            />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-20 text-center">
          <p className="text-4xl">🤝</p>
          <p className="mt-3 font-medium text-neutral-900">
            {scope === "received"
              ? "No requests on your listings yet"
              : "You haven&apos;t requested to buy anything yet"}
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            {scope === "received"
              ? "When a buyer requests one of your items, it shows up here."
              : "Find something you like and send the seller a request."}
          </p>
          {scope === "sent" && (
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Browse listings
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
