"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CATEGORIES, PAGE_SIZE } from "@/lib/constants";
import type { PageResponse, Product } from "@/lib/types";
import Pagination from "@/components/Pagination";
import ProductCard from "@/components/ProductCard";
import { Loading } from "@/components/RequireAuth";

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const page = Math.max(parseInt(searchParams.get("page") ?? "0", 10) || 0, 0);
  const search = searchParams.get("search") ?? "";
  const category = searchParams.get("category") ?? "";
  const queryKey = `${search}|${category}|${page}`;

  const [result, setResult] = useState<{
    key: string;
    data: PageResponse<Product>;
  } | null>(null);
  const [error, setError] = useState<{ key: string; message: string } | null>(
    null
  );
  // A query is "done" once the current key has either loaded or failed. Without
  // the key on the error, a bare `result?.key !== queryKey` would keep the
  // spinner spinning forever when a request fails.
  const loading =
    result?.key !== queryKey && error?.key !== queryKey;
  const shownError = error?.key === queryKey ? error.message : null;

  useEffect(() => {
    let cancelled = false;
    api
      .getProducts({ search, category, page, size: PAGE_SIZE })
      .then((res) => {
        if (!cancelled) {
          setError(null);
          setResult({ key: queryKey, data: res });
        }
      })
      .catch((err) => {
        if (!cancelled)
          setError({
            key: queryKey,
            message:
              err instanceof Error ? err.message : "Failed to load listings",
          });
      });
    return () => {
      cancelled = true;
    };
  }, [search, category, page, queryKey]);

  const navigate = useCallback(
    (params: Record<string, string | null>) => {
      const next = new URLSearchParams();
      const merged = {
        search,
        category,
        page: String(page),
        ...params,
      };
      for (const [key, value] of Object.entries(merged)) {
        if (value) next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [search, category, page, router]
  );

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("search") as string;
    navigate({ search: value.trim() || null, page: null });
  };

  const selectCategory = (c: string | null) => {
    navigate({ category: c, page: null });
  };

  return (
    <div>
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {search
              ? `Results for “${search}”`
              : category
                ? category
                : "Browse listings"}
          </h1>
          <form onSubmit={submitSearch} className="flex w-full max-w-sm gap-2">
            <input
              name="search"
              type="search"
              defaultValue={search}
              aria-label="Search listings"
              placeholder="Search by title…"
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600/20"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => selectCategory(null)}
            className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
              !category
                ? "border-emerald-600 bg-emerald-600 text-white"
                : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
            }`}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => selectCategory(c)}
              className={`rounded-full border px-3 py-1.5 text-sm transition-colors ${
                category === c
                  ? "border-emerald-600 bg-emerald-600 text-white"
                  : "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
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
              onPageChange={(p) => navigate({ page: String(p) })}
            />
          </div>
        </>
      ) : (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white py-20 text-center">
          <p className="text-4xl">🔍</p>
          <p className="mt-3 font-medium text-neutral-900">No listings found</p>
          <p className="mt-1 text-sm text-neutral-500">
            Try a different search term or category.
          </p>
        </div>
      )}
    </div>
  );
}
