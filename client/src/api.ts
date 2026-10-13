import type { ArticleQuery, ArticleSearchResult } from "@shared/article";
import type { SourceId } from "@shared/catalog";
import { apiKeyHeaders, type ApiKeys } from "./apiKeys";

export interface SourceInfo {
  id: SourceId;
  name: string;
  configured: boolean;
}

export async function fetchArticles(
  query: ArticleQuery,
  signal: AbortSignal,
  keys: ApiKeys,
): Promise<ArticleSearchResult> {
  const params = new URLSearchParams();
  if (query.q) params.set("q", query.q);
  if (query.sources.length > 0) params.set("sources", query.sources.join("|"));
  if (query.categories.length > 0) params.set("categories", query.categories.join("|"));
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.authors.length > 0) params.set("authors", query.authors.join("|"));

  const response = await fetch(`/api/articles?${params}`, {
    signal,
    headers: apiKeyHeaders(keys),
  });
  if (!response.ok) throw new Error(`Search failed with HTTP ${response.status}`);
  return response.json() as Promise<ArticleSearchResult>;
}

export async function fetchSources(signal: AbortSignal, keys: ApiKeys): Promise<SourceInfo[]> {
  const response = await fetch("/api/meta", {
    signal,
    headers: apiKeyHeaders(keys),
  });
  if (!response.ok) throw new Error(`Meta failed with HTTP ${response.status}`);
  const body = (await response.json()) as { sources?: SourceInfo[] };
  return body.sources ?? [];
}
