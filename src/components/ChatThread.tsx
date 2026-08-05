"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { ChatMessage } from "@/lib/types";
import { Loading } from "@/components/RequireAuth";
import { useAuth } from "@/context/AuthContext";

export default function ChatThread() {
  const params = useParams<{ userId: string }>();
  const searchParams = useSearchParams();
  const otherId = Number(params.userId);
  const otherName = searchParams.get("name") ?? "User";
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    const msgs = await api.getMessages(otherId).catch(() => [] as ChatMessage[]);
    setMessages(msgs);
  }, [otherId]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const msgs = await api
        .getMessages(otherId)
        .catch(() => [] as ChatMessage[]);
      if (!cancelled) setMessages(msgs);
    })();
    const interval = setInterval(() => {
      load();
    }, 3000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [otherId, load]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await api.sendMessage({ receiverId: otherId, message: text });
      setDraft("");
      await load();
    } finally {
      setSending(false);
    }
  };

  if (messages === null) return <Loading label="Loading thread..." />;

  return (
    <div className="mx-auto flex max-w-2xl flex-col">
      <div className="mb-4 flex items-center gap-3">
        <Link
          href="/messages"
          className="text-sm text-neutral-500 transition-colors hover:text-neutral-900"
        >
          &larr; All messages
        </Link>
        <h1 className="text-lg font-semibold">{otherName}</h1>
      </div>

      <div className="flex h-[60vh] flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-400">
              No messages yet. Say hi!
            </p>
          )}
          {messages.map((m) => {
            const mine = m.senderId === user?.id;
            return (
              <div
                key={m.id}
                className={`flex ${mine ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                    mine
                      ? "rounded-br-sm bg-brand-600 text-white"
                      : "rounded-bl-sm bg-neutral-100 text-neutral-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.message}</p>
                  <p
                    className={`mt-1 text-[10px] ${
                      mine ? "text-brand-100" : "text-neutral-400"
                    }`}
                  >
                    {new Date(m.createdAt).toLocaleTimeString("en-NG", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex items-center gap-2 border-t border-neutral-200 p-3"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message..."
            maxLength={2000}
            className="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none transition-colors focus:border-brand-600 focus:ring-2 focus:ring-brand-600/20"
          />
          <button
            type="submit"
            disabled={!draft.trim() || sending}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
