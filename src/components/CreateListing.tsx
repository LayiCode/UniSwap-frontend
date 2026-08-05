"use client";

import { useRouter } from "next/navigation";
import ProductForm from "@/components/ProductForm";

export default function CreateListing() {
  const router = useRouter();

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-semibold tracking-tight">Sell an item</h1>
      <p className="mt-1 text-sm text-neutral-500">
        Describe what you&apos;re selling — a good title and photo sell faster.
      </p>
      <div className="mt-8">
        <ProductForm
          onSaved={(product) => router.push(`/products/${product.id}`)}
        />
      </div>
    </div>
  );
}
