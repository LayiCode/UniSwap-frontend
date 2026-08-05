"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import type { Conversation } from "@/lib/types";
import { Loading } from "@/components/RequireAuth";

export default function ChatList() {
  const [conversations, setConversations] = useState<Conversation[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getConversations()
      .then((list) => {
        if (!cancelled) setConversations(list);
      })
      .catch(() => {
        if (!cancelled) setConversations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (conversations === null) return <Loading label="Loading conversations..." />;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-4 text-xl font-semibold">Messages</h1>

      {conversations.length === 0 ? (
        <p className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-10 text-center text-sm text-neutral-500">
          No conversations yet. Open a listing and message the seller to get
          started.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-200 overflow-hidden rounded-xl border border-neutral-200 bg-white">
          {conversations.map((c) => (
            <li key={c.otherUserId}>
              <Link
                href={`/messages/${c.otherUserId}?name=${encodeURIComponent(c.otherUsername)}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-neutral-50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                  {c.otherUsername.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-medium text-neutral-900">
                      {c.otherUsername}
                    </span>
                    <span className="shrink-0 text-xs text-neutral-400">
                      {c.lastMessageAt
                        ? new Date(c.lastMessageAt).toLocaleTimeString("en-NG", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : ""}
                    </span>
                  </span>
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-neutral-500">
                      {c.lastMessage}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand-600 text-[11px] font-semibold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
