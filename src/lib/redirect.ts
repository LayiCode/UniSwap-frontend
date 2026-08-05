// Only ever allow navigation to internal paths. Login/register pages take a
// `?redirect=` hint so a visitor can be sent back where they were heading;
// without this guard, that value could be any URL an attacker injects, turning
// the redirect into an open redirector.
export function safeRedirect(
  value: string | null | undefined,
  fallback = "/"
): string {
  if (!value) return fallback;
  // Must be a same-site absolute path: starts with "/" but not "//" (protocol-
  // relative external) and not "/\" (backslash obfuscation used to dodge it).
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) {
    return fallback;
  }
  return value;
}
