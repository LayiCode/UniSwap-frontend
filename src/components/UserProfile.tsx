"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api, formatDate } from "@/lib/api";
import type { PageResponse, Product, PublicUser } from "@/lib/types";
import { Loading } from "@/components/RequireAuth";
import Avatar from "@/components/Avatar";
import ProductCard from "@/components/ProductCard";
import Pagination from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";

export default function UserProfile({ id }: { id: string }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [profErr, setProfErr] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [result, setResult] = useState<{
    key: string;
    data: PageResponse<Product>;
  } | null>(null);
  const [listErr, setListErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getPublicUser(id)
      .then((p) => {
        if (!cancelled) setProfile(p);
      })
      .catch((err) => {
        if (!cancelled)
          setProfErr(err instanceof Error ? err.message : "Could not load profile");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    api
      .getUserProducts(id, page)
      .then((res) => {
        if (!cancelled) {
          setListErr(null);
          setResult({ key: `u-${id}-${page}`, data: res });
        }
      })
      .catch((err) => {
        if (!cancelled)
          setListErr(
            err instanceof Error ? err.message : "Could not load listings"
          );
      });
    return () => {
      cancelled = true;
    };
  }, [id, page]);

  if (profErr) {
    return (
      <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
        {profErr}
      </p>
    );
  }

  if (!profile) return <Loading />;

  const displayName = profile.displayName || profile.username;

  return (
    <div>
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <Avatar
          src={profile.avatarUrl}
          name={displayName}
          size={96}
          className="text-3xl"
        />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {displayName}
          </h1>
          <p className="text-sm text-neutral-500">@{profile.username}</p>
          <p className="mt-1 text-sm text-neutral-500">
            Member since {formatDate(profile.createdAt)}
          </p>
        </div>
        {user && String(user.id) === id && (
          <Link
            href="/account"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 sm:ml-auto"
          >
            Edit account
          </Link>
        )}
      </div>

      {(profile.location || profile.bio) && (
        <div className="mt-6 space-y-2 text-sm text-neutral-700">
          {profile.location && (
            <p className="flex items-center gap-2">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-4 shrink-0 text-neutral-400"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span>{profile.location}</span>
            </p>
          )}
          {profile.bio && <p>{profile.bio}</p>}
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-lg font-semibold tracking-tight">
          Active listings
          <span className="ml-2 text-sm font-normal text-neutral-400">
            {profile.activeListingsCount}
          </span>
        </h2>

        {listErr ? (
          <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {listErr}
          </p>
        ) : !result ? (
          <div className="mt-4">
            <Loading label="Loading listings…" />
          </div>
        ) : result.data.content.length > 0 ? (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {result.data.content.map((p) => (
                <ProductCard key={p.id} product={p} />
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
          <p className="mt-4 rounded-xl border border-dashed border-neutral-300 bg-white py-12 text-center text-sm text-neutral-500">
            No active listings right now.
          </p>
        )}
      </div>
    </div>
  );
}
