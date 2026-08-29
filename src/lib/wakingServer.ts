// Tiny module-level store + subscription used to tell the UI when the API
// client is retrying a request after the (Render free-tier) backend woke up
// from sleep. Kept as a plain module so api.ts can set the flag and the
// WakingBanner can subscribe without prop-drilling through every page.

type Listener = (waking: boolean) => void;

let waking = false;
const listeners = new Set<Listener>();

export function setWakingServer(value: boolean): void {
  if (waking === value) return;
  waking = value;
  listeners.forEach((l) => l(waking));
}

export function isWakingServer(): boolean {
  return waking;
}

export function subscribeWakingServer(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
