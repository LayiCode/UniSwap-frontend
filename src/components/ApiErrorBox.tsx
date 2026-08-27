"use client";

import { ApiError } from "@/lib/api";

// Renders a server error. When the backend returned field-level validation
// details (the "details" array), show each one so the user knows exactly which
// field to fix instead of only the generic "One or more fields are invalid".
export default function ApiErrorBox({
  error,
  className = "",
}: {
  error: unknown;
  className?: string;
}) {
  if (!error) return null;

  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : "Something went wrong";
  const details =
    error instanceof ApiError && error.details && error.details.length > 0
      ? error.details
      : [];

  return (
    <div
      className={`rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 ${className}`}
    >
      {details.length > 0 ? (
        <ul className="list-inside list-disc space-y-1">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      ) : (
        <p>{message}</p>
      )}
    </div>
  );
}
