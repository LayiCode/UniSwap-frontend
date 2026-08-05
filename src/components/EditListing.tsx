"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import type { Product } from "@/lib/types";
import ProductForm from "@/components/ProductForm";
import { Loading } from "@/components/RequireAuth";

export default function EditListing({ id }: { id: string }) {
  const { user } = useAuth();
  const router = useRouter();
  const [product, setProduct] = useState<Product | null>(null);
  const [status, setStatus] = useState<"loading" | "error" | "ready">("loading");

  useEffect(() => {
    let cancelled = false;
    api
      .getProduct(id)
      .then((p) => {
        if (!cancelled) {
          setProduct(p);
          setStatus("ready");
        }
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (status === "loading") return <Loading />;

  if (status === "error" || !product) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-4xl">🫥</p>
        <h1 className="mt-4 text-xl font-semibold">Listing not found</h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          Back to listings
        </Link>
      </div>
    );
  }

  if (user && product.sellerId !== user.id) {
    return (
      <div className="mx-auto max-w-lg py-16 text-center">
        <p className="text-4xl">🚫</p>
        <h1 className="mt-4 text-xl font-semibold">Not your listing</h1>
        <p className="mt-2 text-sm text-neutral-500">
          You can only edit listings you created.
        </p>
        <Link
          href={`/products/${product.id}`}
          className="mt-6 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700"
        >
          View listing
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Edit listing</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Update the details below and save when you&apos;re done.
      </p>
      <div className="mt-8">
        <ProductForm
          product={product}
          submitLabel="Save changes"
          onSaved={(updated) => router.push(`/products/${updated.id}`)}
        />
      </div>
    </div>
  );
}
