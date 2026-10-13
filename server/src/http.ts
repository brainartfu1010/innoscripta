export function redact(message: string, secret: string | undefined): string {
  if (!secret) return message;
  return message.split(secret).join("[redacted]");
}

export function stripHtml(value: string): string {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function cleanByline(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = stripHtml(value).replace(/^by\s+/i, "").trim();
  return cleaned || null;
}

export function safeHttpUrl(value: string | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

export async function getJson<T>(url: string, sourceName: string, secret?: string): Promise<T> {
  try {
    const response = await fetch(url, {
      headers: {
        accept: "application/json",
        "user-agent": "news-aggregator",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) {
      throw new Error(`${sourceName} returned HTTP ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error(`${sourceName} timed out`);
    }
    if (error instanceof Error && error.message.startsWith(`${sourceName} returned HTTP`)) {
      throw error;
    }
    const message = error instanceof Error ? error.message : `${sourceName} request failed`;
    throw new Error(redact(message, secret));
  }
}
