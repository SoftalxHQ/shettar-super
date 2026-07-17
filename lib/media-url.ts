const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000").replace(
  /\/$/,
  ""
);

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

/**
 * Make ActiveStorage / media URLs usable from shettar-super (different origin).
 * - Prefixes relative `/rails/active_storage/...` paths with the API host
 * - Rewrites localhost blob hosts to NEXT_PUBLIC_API_URL
 */
export function normalizeApiMediaUrl(url: string | undefined | null): string {
  if (!url) return "";

  try {
    const api = new URL(API_BASE_URL);

    if (url.startsWith("/")) {
      return `${api.origin}${url}`;
    }

    const parsed = new URL(url);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      parsed.protocol = api.protocol;
      parsed.hostname = api.hostname;
      parsed.port = api.port;
      return parsed.toString();
    }

    return url;
  } catch {
    return url;
  }
}

export function normalizeApiMediaUrls(urls: string[] | undefined | null): string[] {
  return (urls || []).map(normalizeApiMediaUrl).filter(Boolean);
}
