export interface ApiKeys {
  guardian: string;
  nyt: string;
  newsapi: string;
}

export const EMPTY_API_KEYS: ApiKeys = {
  guardian: "",
  nyt: "",
  newsapi: "",
};

export const API_KEY_HEADERS = {
  guardian: "x-api-key-guardian",
  nyt: "x-api-key-nyt",
  newsapi: "x-api-key-newsapi",
} as const;

const STORAGE_KEY = "news-aggregator-api-keys";

export function loadApiKeys(): ApiKeys {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY_API_KEYS;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY_API_KEYS;
    const record = parsed as Record<string, unknown>;
    return {
      guardian: readKey(record.guardian),
      nyt: readKey(record.nyt),
      newsapi: readKey(record.newsapi),
    };
  } catch {
    return EMPTY_API_KEYS;
  }
}

export function saveApiKeys(keys: ApiKeys): void {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      guardian: keys.guardian.trim(),
      nyt: keys.nyt.trim(),
      newsapi: keys.newsapi.trim(),
    }),
  );
}

export function apiKeyHeaders(keys: ApiKeys): HeadersInit {
  const headers: Record<string, string> = {};
  if (keys.guardian.trim()) headers[API_KEY_HEADERS.guardian] = keys.guardian.trim();
  if (keys.nyt.trim()) headers[API_KEY_HEADERS.nyt] = keys.nyt.trim();
  if (keys.newsapi.trim()) headers[API_KEY_HEADERS.newsapi] = keys.newsapi.trim();
  return headers;
}

export function hasAnyApiKey(keys: ApiKeys): boolean {
  return Boolean(keys.guardian.trim() || keys.nyt.trim() || keys.newsapi.trim());
}

function readKey(value: unknown): string {
  return typeof value === "string" ? value : "";
}
