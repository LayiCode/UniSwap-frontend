import { Suspense } from "react";
import VerifyEmailForm from "@/components/VerifyEmailForm";

export const metadata = { title: "Verify email" };

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-neutral-500">Loading…</p>
      }
    >
      <VerifyEmailForm />
    </Suspense>
  );
}
