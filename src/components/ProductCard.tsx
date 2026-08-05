"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, imageUrl } from "@/lib/api";
import type { Product } from "@/lib/types";

export default function ProductCard({ product }: { product: Product }) {
  const img = imageUrl(product.imageUrl);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-neutral-100">
        {img ? (
          <Image
            src={img}
            alt={product.title}
            fill
            sizes="(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 100vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="grid size-full place-items-center text-4xl text-neutral-300">
            📦
          </div>
        )}
        {product.status === "SOLD" && (
          <span className="absolute left-2 top-2 rounded bg-neutral-900 px-2 py-0.5 text-xs font-semibold text-white">
            SOLD
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs font-medium text-neutral-500">
            {product.category}
          </span>
          <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">
            {product.itemCondition}
          </span>
        </div>
        <h3 className="line-clamp-2 font-medium text-neutral-900">
          {product.title}
        </h3>
        <p className="mt-auto pt-2 text-lg font-semibold text-brand-700">
          {formatPrice(product.price)}
        </p>
        <p className="text-xs text-neutral-500">by {product.sellerUsername}</p>
      </div>
    </Link>
  );
}
