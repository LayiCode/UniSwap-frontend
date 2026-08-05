"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PageResponse, Product } from "@/lib/types";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import { Loading } from "@/components/RequireAuth";

export default function MyListings() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: PageResponse<Product>;
  } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(
    null
  );
  // A query is "done" once the current key has either loaded or failed. Without
  // the key on the error, a bare `result?.key !== ...` would keep the spinner
  // spinning forever when a request fails.
  const loading = result?.key !== `my-${page}` && error?.key !== `my-${page}`;
  const shownError = error?.key === `my-${page}` ? error.message : null;

  useEffect(() => {
    let cancelled = false;
    api
      .getMyListings(page)
      .then((res) => {
        if (!cancelled) {
          setError(null);
          setResult({ key: `my-${page}`, data: res });
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError({
            key: `my-${page}`,
            message:
              err instanceof Error ? err.message : "Failed to load your listings",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Listings</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Everything you&apos;re selling, available and sold.
          </p>
        </div>
        <Link
          href="/products/new"
          className="rounded-lg bg-emerald-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
        >
          + Sell an item
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : shownError ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {shownError}
        </p>
      ) : result && result.data.content.length > 0 ? (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {result.data.content.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
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
          <p className="text-4xl">🛍️</p>
          <p className="mt-3 font-medium text-neutral-900">
            You haven&apos;t listed anything yet
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Sell your first item and start making deals on campus.
          </p>
          <Link
            href="/products/new"
            className="mt-6 inline-block rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Sell an item
          </Link>
        </div>
      )}
    </div>
  );
}
