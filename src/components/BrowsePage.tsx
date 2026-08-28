"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { api } from "@/lib/api";
import { CATEGORIES, CONDITIONS, PAGE_SIZE } from "@/lib/constants";
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
  const condition = searchParams.get("condition") ?? "";
  const sort = searchParams.get("sort") ?? "newest";
  const minPrice = searchParams.get("minPrice") ?? "";
  const maxPrice = searchParams.get("maxPrice") ?? "";
  const queryKey = `${search}|${category}|${condition}|${minPrice}|${maxPrice}|${sort}|${page}`;

  // Price inputs are typed locally and only applied on "Apply" (or Enter), so
  // every keystroke doesn't push a new URL entry. They re-sync when the URL
  // changes from outside (e.g. browser back/forward) — using React's
  // "adjust state during render" pattern instead of an effect.
  const [priceInput, setPriceInput] = useState({ min: minPrice, max: maxPrice });
  const [priceKey, setPriceKey] = useState(`${minPrice}|${maxPrice}`);
  if (priceKey !== `${minPrice}|${maxPrice}`) {
    setPriceKey(`${minPrice}|${maxPrice}`);
    setPriceInput({ min: minPrice, max: maxPrice });
  }

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
      .getProducts({
        search,
        category,
        condition,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        sort: (sort || "newest") as "newest" | "price_asc" | "price_desc",
        page,
        size: PAGE_SIZE,
      })
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
  }, [search, category, condition, minPrice, maxPrice, sort, page, queryKey]);

  const navigate = useCallback(
    (params: Record<string, string | null>) => {
      const next = new URLSearchParams();
      const merged = {
        search,
        category,
        condition,
        sort,
        minPrice,
        maxPrice,
        page: String(page),
        ...params,
      };
      for (const [key, value] of Object.entries(merged)) {
        if (!value) continue;
        // "newest" is the backend default — keep the URL clean without it.
        if (key === "sort" && value === "newest") continue;
        next.set(key, value);
      }
      const qs = next.toString();
      router.push(qs ? `/?${qs}` : "/");
    },
    [search, category, condition, sort, minPrice, maxPrice, page, router]
  );

  const submitSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = new FormData(e.currentTarget).get("search") as string;
    navigate({ search: value.trim() || null, page: null });
  };

  const selectCategory = (c: string | null) => {
    navigate({ category: c, page: null });
  };

  const selectCondition = (c: string) => {
    navigate({ condition: c || null, page: null });
  };

  const selectSort = (s: string) => {
    navigate({ sort: s || null, page: null });
  };

  const applyPrice = () => {
    navigate({
      minPrice: priceInput.min || null,
      maxPrice: priceInput.max || null,
      page: null,
    });
  };

  const clearFilters = () => {
    setPriceInput({ min: "", max: "" });
    navigate({
      condition: null,
      minPrice: null,
      maxPrice: null,
      sort: null,
      page: null,
    });
  };

  const hasFilters = Boolean(condition || minPrice || maxPrice || sort !== "newest");

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
              className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-neutral-900 px-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Search
            </button>
          </form>
        </div>

        <div className="flex flex-wrap items-center gap-2 border-t border-neutral-200 pt-4">
          <select
            value={category}
            onChange={(e) => selectCategory(e.target.value || null)}
            aria-label="Filter by category"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          >
            <option value="">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={condition}
            onChange={(e) => selectCondition(e.target.value)}
            aria-label="Filter by condition"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          >
            <option value="">All conditions</option>
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={sort}
            onChange={(e) => selectSort(e.target.value)}
            aria-label="Sort listings"
            className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          >
            <option value="newest">Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Min ₦"
              value={priceInput.min}
              onChange={(e) =>
                setPriceInput({ ...priceInput, min: e.target.value })
              }
              aria-label="Minimum price"
              className="w-28 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
            <span className="text-neutral-400">–</span>
            <input
              type="number"
              min="0"
              step="100"
              placeholder="Max ₦"
              value={priceInput.max}
              onChange={(e) =>
                setPriceInput({ ...priceInput, max: e.target.value })
              }
              aria-label="Maximum price"
              className="w-28 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
            />
            <button
              onClick={applyPrice}
              className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-100"
            >
              Apply
            </button>
          </div>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-sm font-medium text-brand-600 hover:underline"
            >
              Clear filters
            </button>
          )}
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
