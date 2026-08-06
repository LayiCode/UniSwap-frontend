"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { PageResponse, Product } from "@/lib/types";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import { Loading } from "@/components/RequireAuth";

export default function Favorites() {
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: PageResponse<Product>;
  } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(
    null
  );
  const loading = result?.key !== `fav-${page}` && error?.key !== `fav-${page}`;
  const shownError = error?.key === `fav-${page}` ? error.message : null;

  useEffect(() => {
    let cancelled = false;
    api
      .getFavorites(page)
      .then((res) => {
        if (!cancelled) {
          setError(null);
          setResult({ key: `fav-${page}`, data: res });
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError({
            key: `fav-${page}`,
            message:
              err instanceof Error ? err.message : "Failed to load favorites",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [page]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">Favorites</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Listings you&apos;ve saved — tap the heart to come back to them later.
        </p>
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
              <ProductCard
                key={product.id}
                product={product}
                onFavoritedChange={(productId, favorited) => {
                  if (!favorited) {
                    setResult((prev) =>
                      prev
                        ? {
                            ...prev,
                            data: {
                              ...prev.data,
                              content: prev.data.content.filter(
                                (p) => p.id !== productId
                              ),
                              totalElements: prev.data.totalElements - 1,
                            },
                          }
                        : prev
                    );
                  }
                }}
              />
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
          <p className="mt-3 font-medium text-neutral-900">
            You haven&apos;t saved any listings yet
          </p>
          <p className="mt-1 text-sm text-neutral-500">
            Tap the heart on anything you like to keep it here.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            Browse listings
          </Link>
        </div>
      )}
    </div>
  );
}
