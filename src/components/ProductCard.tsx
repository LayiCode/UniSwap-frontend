"use client";

import Image from "next/image";
import Link from "next/link";
import { formatPrice, imageUrl } from "@/lib/api";
import type { Product } from "@/lib/types";
import FavoriteButton from "@/components/FavoriteButton";
import Avatar from "@/components/Avatar";

export default function ProductCard({
  product,
  onFavoritedChange,
}: {
  product: Product;
  onFavoritedChange?: (productId: number, favorited: boolean) => void;
}) {
  const img = imageUrl(product.imageUrl);

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white transition-shadow hover:shadow-md">
      {/* Sibling of the Link (not nested inside it), so clicking the heart
          never triggers navigation to the product page. */}
      <FavoriteButton
        productId={product.id}
        favorited={product.favorited}
        size={8}
        className="absolute right-1.5 top-1.5 z-10"
        onFavoritedChange={(favorited) => onFavoritedChange?.(product.id, favorited)}
      />
      <Link
        href={`/products/${product.id}`}
        className="flex flex-1 flex-col"
      >
        <div className="relative aspect-[1/1] w-full overflow-hidden bg-neutral-100">
          {img ? (
            <Image
              src={img}
              alt={product.title}
              fill
              sizes="(min-width: 1024px) 20vw, (min-width: 640px) 25vw, 100vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="grid size-full place-items-center text-4xl text-neutral-300">
              📦
            </div>
          )}
          {product.status === "SOLD" && (
            <span className="absolute left-1.5 top-1.5 rounded bg-neutral-900 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              SOLD
            </span>
          )}
          {product.status === "REMOVED" && (
            <span className="absolute left-1.5 top-1.5 rounded bg-red-700 px-1.5 py-0.5 text-[10px] font-semibold text-white">
              REMOVED
            </span>
          )}
          {product.location && (
            <span className="absolute bottom-1.5 left-1.5 flex max-w-[85%] items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-medium text-neutral-700 backdrop-blur">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-3 shrink-0 text-brand-600"
                aria-hidden="true"
              >
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="truncate">{product.location}</span>
            </span>
          )}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="truncate text-[11px] font-medium text-neutral-500">
              {product.category}
            </span>
            <span className="shrink-0 rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] text-neutral-600">
              {product.itemCondition}
            </span>
          </div>
          <h3 className="line-clamp-2 text-sm font-medium text-neutral-900">
            {product.title}
          </h3>
          <p className="mt-auto pt-1.5 text-base font-semibold text-brand-700">
            {formatPrice(product.price)}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-neutral-500">
            <Avatar
              src={product.sellerAvatarUrl}
              name={product.sellerDisplayName}
              size={16}
            />
            <span className="truncate">
              by {product.sellerDisplayName || product.sellerUsername}
            </span>
          </div>
        </div>
      </Link>
    </div>
  );
}
