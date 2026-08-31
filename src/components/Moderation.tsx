"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate, formatPrice } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { PageResponse, Report, ReportStatus } from "@/lib/types";
import Pagination from "@/components/Pagination";
import { Loading } from "@/components/RequireAuth";
import ConfirmDialog from "@/components/ConfirmDialog";

type Filter = "" | "OPEN" | "RESOLVED" | "DISMISSED";

const reasonLabels: Record<Report["reason"], string> = {
  SPAM: "Spam",
  INAPPROPRIATE: "Inappropriate",
  SCAM: "Scam",
  DUPLICATE: "Duplicate",
  OTHER: "Other",
};

const statusStyles: Record<ReportStatus, string> = {
  OPEN: "bg-amber-100 text-amber-800",
  RESOLVED: "bg-green-100 text-green-800",
  DISMISSED: "bg-neutral-100 text-neutral-600",
};

const statusLabels: Record<ReportStatus, string> = {
  OPEN: "Open",
  RESOLVED: "Resolved",
  DISMISSED: "Dismissed",
};

export default function Moderation() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>("OPEN");
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: PageResponse<Report>;
  } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(
    null
  );
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  // Report whose product is being removed (danger confirm).
  const [confirmRemove, setConfirmRemove] = useState<number | null>(null);

  const key = `${filter || "ALL"}-${page}`;
  const loading = result?.key !== key && error?.key !== key;
  const shownError = error?.key === key ? error.message : null;

  useEffect(() => {
    let cancelled = false;
    api
      .getReports(filter === "" ? undefined : filter, page)
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
              err instanceof Error ? err.message : "Failed to load reports",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [filter, page, key]);

  if (!user?.admin) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-4xl">🔒</p>
        <h1 className="mt-4 text-xl font-semibold">Staff only</h1>
        <p className="mt-2 text-sm text-neutral-500">
          You don&apos;t have permission to view the moderation queue.
        </p>
      </div>
    );
  }

  const switchFilter = (next: Filter) => {
    setFilter(next);
    setPage(0);
    setActionError(null);
  };

  const decide = async (id: number, status: ReportStatus, removeProduct: boolean) => {
    setBusyId(id);
    setActionError(null);
    try {
      const updated = await api.updateReportStatus(id, { status, removeProduct });
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

  const filterTab = (value: Filter, label: string) => (
    <button
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
        filter === value
          ? "bg-neutral-900 text-white"
          : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
      }`}
      onClick={() => switchFilter(value)}
    >
      {label}
    </button>
  );

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Moderation</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Review reports and take down listings that break the rules.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {filterTab("OPEN", "Open")}
        {filterTab("RESOLVED", "Resolved")}
        {filterTab("DISMISSED", "Dismissed")}
        {filterTab("", "All")}
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
            {result.data.content.map((report) => (
              <li
                key={report.id}
                className="rounded-xl border border-neutral-200 bg-white p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Link
                      href={`/products/${report.productId}`}
                      className="font-medium text-neutral-900 hover:underline"
                    >
                      {report.productTitle}
                    </Link>
                    <p className="mt-0.5 text-sm text-neutral-500">
                      {formatPrice(report.productPrice)} · {reasonLabels[report.reason]}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyles[report.status]}`}
                  >
                    {statusLabels[report.status]}
                  </span>
                </div>

                {report.details && (
                  <p className="mt-3 whitespace-pre-wrap rounded-lg bg-neutral-50 px-3 py-2 text-sm text-neutral-600">
                    “{report.details}”
                  </p>
                )}

                <div className="mt-3 border-t border-neutral-100 pt-3 text-sm text-neutral-600">
                  Reported by{" "}
                  <span className="font-medium text-neutral-900">
                    {report.reporterUsername}
                  </span>{" "}
                  · seller{" "}
                  <span className="font-medium text-neutral-900">
                    {report.sellerUsername}
                  </span>{" "}
                  · {formatDate(report.createdAt)} · listing status{" "}
                  <span className="font-medium uppercase text-neutral-900">
                    {report.productStatus}
                  </span>
                </div>

                {report.status === "OPEN" && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      onClick={() => decide(report.id, "RESOLVED", false)}
                      disabled={busyId === report.id}
                      className="rounded-lg bg-green-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800 disabled:opacity-50"
                    >
                      Resolve & keep listing
                    </button>
                    <button
                      onClick={() => setConfirmRemove(report.id)}
                      disabled={busyId === report.id}
                      className="rounded-lg bg-red-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-800 disabled:opacity-50"
                    >
                      Remove listing
                    </button>
                    <button
                      onClick={() => decide(report.id, "DISMISSED", false)}
                      disabled={busyId === report.id}
                      className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100 disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                  </div>
                )}
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
          <p className="text-4xl">📭</p>
          <p className="mt-3 font-medium text-neutral-900">All clear here</p>
          <p className="mt-1 text-sm text-neutral-500">
            No {filter === "" ? "" : `${statusLabels[filter].toLowerCase()} `}reports
            right now.
          </p>
        </div>
      )}

      <ConfirmDialog
        open={confirmRemove !== null}
        title="Remove listing?"
        message="Resolve this report by permanently deleting the listing. This can't be undone."
        confirmLabel="Remove listing"
        danger
        busy={confirmRemove !== null && busyId === confirmRemove}
        onConfirm={() => {
          if (confirmRemove !== null) decide(confirmRemove, "RESOLVED", true);
          setConfirmRemove(null);
        }}
        onCancel={() => setConfirmRemove(null)}
      />
    </div>
  );
}
