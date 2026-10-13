import type { Request } from "express";

const HEADER_KEYS = {
  GUARDIAN_API_KEY: "x-api-key-guardian",
  NYT_API_KEY: "x-api-key-nyt",
  NEWSAPI_API_KEY: "x-api-key-newsapi",
} as const;

export type ApiKeyEnv = Pick<
  NodeJS.ProcessEnv,
  "GUARDIAN_API_KEY" | "NYT_API_KEY" | "NEWSAPI_API_KEY"
>;

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function headerValue(req: Request, name: string): string | undefined {
  const raw = req.header(name);
  return clean(typeof raw === "string" ? raw : undefined);
}

/**
 * Prefer keys sent by the browser Settings panel; fall back to server .env.
 */
export function resolveApiKeys(req: Request, env: NodeJS.ProcessEnv = process.env): ApiKeyEnv {
  return {
    GUARDIAN_API_KEY: headerValue(req, HEADER_KEYS.GUARDIAN_API_KEY) ?? clean(env.GUARDIAN_API_KEY),
    NYT_API_KEY: headerValue(req, HEADER_KEYS.NYT_API_KEY) ?? clean(env.NYT_API_KEY),
    NEWSAPI_API_KEY: headerValue(req, HEADER_KEYS.NEWSAPI_API_KEY) ?? clean(env.NEWSAPI_API_KEY),
  };
}

export function apiKeyCacheSalt(keys: ApiKeyEnv): string {
  return [keys.GUARDIAN_API_KEY, keys.NYT_API_KEY, keys.NEWSAPI_API_KEY]
    .map((key) => (key ? `${key.length}:${key.slice(0, 2)}:${key.slice(-2)}` : "0"))
    .join("|");
}
