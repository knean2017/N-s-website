import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Returns the URL only when it is a plain http(s) link, otherwise null.
 *
 * Organization websites are self-submitted, so a stored value can carry a
 * `javascript:` or `data:` scheme. Rendering one into an href would run it in
 * the viewer's session — including an admin's. Callers must treat null as
 * "render no link at all" rather than falling back to the raw value.
 */
export function safeExternalUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Normalizes a bank card number to digit groups of four, e.g. "4169 7388 1234 5678".
 * Returns null for empty input so the column stays empty instead of "".
 */
export function formatCardNumber(value: string | null | undefined): string | null {
  const digits = value?.replace(/\D/g, "") ?? "";
  return digits ? digits.replace(/(\d{4})(?=\d)/g, "$1 ") : null;
}
