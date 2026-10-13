import type { Article, ArticleQuery, ArticleSearchResult } from "../../shared/article.ts";
import { SAMPLE_ARTICLES } from "./sample-articles.ts";
import type { NewsSource } from "./sources/news-source.ts";

const CACHE_TTL_MS = 60_000;
const cache = new Map<string, { expiresAt: number; value: ArticleSearchResult }>();

export async function searchArticles(
  sources: NewsSource[],
  query: ArticleQuery,
  cacheSalt = "",
): Promise<ArticleSearchResult> {
  if (query.from && query.to && query.from > query.to) {
    return {
      articles: [],
      errors: [{ source: "query", message: "The start date is after the end date." }],
    };
  }

  const selected = query.sources.length
    ? sources.filter((source) => query.sources.includes(source.id))
    : sources;
  const configured = selected.filter((source) => source.isConfigured());
  const unconfigured = selected.filter((source) => !source.isConfigured());

  if (configured.length === 0) {
    const noneConfigured = sources.every((source) => !source.isConfigured());
    return {
      articles: filterArticles(SAMPLE_ARTICLES, query),
      errors: [
        {
          source: "config",
          message: noneConfigured
            ? "No API keys are configured, so these are sample articles. Open Settings to add keys."
            : "The selected sources have no API keys, so these are sample articles.",
        },
      ],
    };
  }

  const cacheKey = JSON.stringify({
    salt: cacheSalt,
    q: query.q ?? "",
    sources: configured.map((source) => source.id).sort(),
    categories: [...query.categories].sort(),
    from: query.from ?? "",
    to: query.to ?? "",
    authors: [...query.authors].sort(),
  });
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value;
  }

  const settled = await Promise.allSettled(configured.map((source) => source.search(query)));
  const articles: Article[] = [];
  const errors: ArticleSearchResult["errors"] = [];

  for (const source of unconfigured) {
    errors.push({
      source: source.id,
      message: `${source.name} was skipped because its API key is missing.`,
    });
  }

  settled.forEach((result, index) => {
    const source = configured[index];
    if (result.status === "fulfilled") {
      articles.push(...result.value);
      return;
    }
    const message = result.reason instanceof Error ? result.reason.message : "Request failed.";
    errors.push({ source: source.id, message });
  });

  const value = { articles: finalize(articles, query), errors };
  cache.set(cacheKey, { expiresAt: Date.now() + CACHE_TTL_MS, value });
  return value;
}

export function clearSearchCache(): void {
  cache.clear();
}

export function filterArticles(articles: Article[], query: ArticleQuery): Article[] {
  const words = query.q?.toLowerCase().split(/\s+/).filter(Boolean) ?? [];
  const filtered = articles.filter((article) => {
    if (query.sources.length > 0 && !query.sources.includes(article.sourceId)) return false;
    if (query.categories.length > 0 && (!article.category || !query.categories.includes(article.category))) {
      return false;
    }
    if (!withinDates(article, query) || !matchesAuthor(article.author, query.authors)) return false;
    if (words.length === 0) return true;
    const haystack = `${article.title} ${article.description} ${article.author ?? ""} ${article.sourceName}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
  return sortByDate(dedupe(filtered));
}

function finalize(articles: Article[], query: ArticleQuery): Article[] {
  const filtered = dedupe(articles).filter(
    (article) => withinDates(article, query) && matchesAuthor(article.author, query.authors),
  );
  return sortByDate(filtered);
}

function dedupe(articles: Article[]): Article[] {
  const byUrl = new Map<string, Article>();
  for (const article of articles) {
    const key = article.url.toLowerCase();
    const existing = byUrl.get(key);
    if (!existing || article.publishedAt > existing.publishedAt) byUrl.set(key, article);
  }
  return [...byUrl.values()];
}

function withinDates(article: Article, query: ArticleQuery): boolean {
  const day = article.publishedAt.slice(0, 10);
  if (query.from && day < query.from) return false;
  if (query.to && day > query.to) return false;
  return true;
}

function matchesAuthor(author: string | null, wanted: string[]): boolean {
  if (wanted.length === 0) return true;
  if (!author) return false;
  const haystack = author.toLowerCase();
  return wanted.some((name) => haystack.includes(name.trim().toLowerCase()));
}

function sortByDate(articles: Article[]): Article[] {
  return [...articles].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}
