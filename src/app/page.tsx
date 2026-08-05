import { Suspense } from "react";
import BrowsePage from "@/components/BrowsePage";

export default function Home() {
  return (
    <Suspense fallback={<p className="py-16 text-center text-sm text-neutral-500">Loading…</p>}>
      <BrowsePage />
    </Suspense>
  );
}
