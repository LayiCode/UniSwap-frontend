export const dynamic = "force-dynamic";

// Vercel Cron hits this route every 5 minutes to keep the free-tier Render
// backend awake (Render spins a free web service down after ~15 min of no
// traffic and cold-starts it on the next request, which surfaces as a 502 to
// the first visitor). Pinging the health endpoint prevents most spin-downs.
//
// Deliberately NOT routed through the client's `request()` (no auth) — this
// runs server-side on Vercel and just touches the backend health check. The
// ping is best-effort: if the backend is slow or briefly down, we log nothing
// loud and simply return ok so the cron doesn't fail the invocation.
const BACKEND = "https://uniswap-api-g6t4.onrender.com";

export async function GET(): Promise<Response> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 20000);
    await fetch(`${BACKEND}/actuator/health`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timer);
  } catch {
    // best-effort — a skipped ping is harmless, the next scheduled run retries
  }
  return Response.json({ ok: true });
}
