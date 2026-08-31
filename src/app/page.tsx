import { Suspense } from "react";
import BrowsePage from "@/components/BrowsePage";

export default function Home() {
  return (
    <div className="space-y-8">
      <section className="rounded-2xl bg-brand-600 px-6 py-8 text-white">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          What&apos;s for sale near you?
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/90">
          New and second-hand finds from students around campus. Browse a
          listing, message the seller, and arrange a pickup nearby.
        </p>
      </section>
      <Suspense fallback={<p className="py-16 text-center text-sm text-neutral-500">Loading…</p>}>
        <BrowsePage />
      </Suspense>
    </div>
  );
}
