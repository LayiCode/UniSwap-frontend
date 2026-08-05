import { Suspense } from "react";
import LoginForm from "@/components/LoginForm";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <p className="py-16 text-center text-sm text-neutral-500">Loading…</p>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
