"use client";

interface PaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

function pageNumbers(page: number, totalPages: number): (number | "...")[] {
  const max = 7;
  if (totalPages <= max) {
    return Array.from({ length: totalPages }, (_, i) => i);
  }
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages - 2, start + 4);
  const pages: (number | "...")[] = [0];
  if (start > 1) pages.push("...");
  for (let i = start; i <= end; i++) pages.push(i);
  if (end < totalPages - 2) pages.push("...");
  pages.push(totalPages - 1);
  return pages;
}

export default function Pagination({
  page,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const btn =
    "grid h-11 min-w-11 place-items-center rounded-md border px-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40";

  return (
    <nav className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        className={btn}
        disabled={page === 0}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        ‹
      </button>
      {pageNumbers(page, totalPages).map((p, i) =>
        p === "..." ? (
          <span key={`e-${i}`} className="px-1 text-neutral-400">
            …
          </span>
        ) : (
          <button
            key={p}
            className={`${btn} ${
              p === page
                ? "border-neutral-900 bg-neutral-900 text-white"
                : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-100"
            }`}
            onClick={() => onPageChange(p)}
          >
            {p + 1}
          </button>
        )
      )}
      <button
        className={btn}
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        ›
      </button>
    </nav>
  );
}
