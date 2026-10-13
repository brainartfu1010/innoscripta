import type { Article, ArticleQuery } from "../../../shared/article.ts";
import type { CategoryId } from "../../../shared/catalog.ts";
import { categoryLabel, sourceName } from "../../../shared/catalog.ts";
import { cleanByline, getJson, safeHttpUrl, stripHtml } from "../http.ts";
import { MissingApiKeyError, type NewsSource } from "./news-source.ts";

const NEWSAPI_CATEGORY: Record<CategoryId, string> = {
  world: "general",
  politics: "general",
  business: "business",
  technology: "technology",
  science: "science",
  sports: "sports",
  culture: "entertainment",
  health: "health",
};

interface NewsApiArticle {
  title?: string;
  description?: string;
  url?: string;
  urlToImage?: string;
  publishedAt?: string;
  author?: string;
  source?: { name?: string };
}

interface NewsApiResponse {
  status?: string;
  message?: string;
  articles?: NewsApiArticle[];
}

export class NewsApiSource implements NewsSource {
  readonly id = "newsapi" as const;
  readonly name = sourceName("newsapi");

  constructor(private readonly apiKey: string | undefined) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async search(query: ArticleQuery): Promise<Article[]> {
    if (!this.apiKey) throw new MissingApiKeyError(this.name, "NEWSAPI_API_KEY");
    if (query.q || query.from || query.to) return this.searchArchive(query);
    return this.searchHeadlines(query.categories);
  }

  private async searchHeadlines(categories: CategoryId[]): Promise<Article[]> {
    const groups = groupCategories(categories);
    const settled = await Promise.allSettled(
      groups.map((group) => this.fetchPath("top-headlines", group.category, group.label, undefined, undefined)),
    );
    return unwrap(settled, this.name);
  }

  private async searchArchive(query: ArticleQuery): Promise<Article[]> {
    // /everything requires a keyword. A date-only search uses "the" so the window still applies.
    const q = buildArchiveQuery(query) || "the";
    const articles = await this.fetchPath("everything", undefined, null, q, query);
    return articles;
  }

  private async fetchPath(
    path: "top-headlines" | "everything",
    category: string | undefined,
    label: CategoryId | null,
    q: string | undefined,
    query: ArticleQuery | undefined,
  ): Promise<Article[]> {
    const params = new URLSearchParams({
      apiKey: this.apiKey ?? "",
      pageSize: "15",
    });
    if (path === "everything") {
      params.set("language", "en");
      params.set("sortBy", "publishedAt");
    }
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (path === "top-headlines" && !category && !q) params.set("country", "us");
    if (query?.from) params.set("from", query.from);
    if (query?.to) params.set("to", query.to);

    const body = await getJson<NewsApiResponse>(`https://newsapi.org/v2/${path}?${params}`, this.name, this.apiKey);
    if (body.status === "error") {
      throw new Error(body.message || `${this.name} request failed`);
    }
    return (body.articles ?? []).flatMap((item) => {
      const article = mapArticle(item, label);
      return article ? [article] : [];
    });
  }
}

function groupCategories(categories: CategoryId[]): Array<{ category?: string; label: CategoryId | null }> {
  if (categories.length === 0) return [{ label: null }];
  const groups = new Map<string, CategoryId[]>();
  for (const id of categories) {
    const mapped = NEWSAPI_CATEGORY[id];
    groups.set(mapped, [...(groups.get(mapped) ?? []), id]);
  }
  return [...groups.entries()].map(([category, ids]) => ({
    category,
    label: ids.length === 1 ? ids[0] : null,
  }));
}

function buildArchiveQuery(query: ArticleQuery): string {
  const labels = query.categories.map((id) => categoryLabel(id));
  if (labels.length === 0) return query.q ?? "";
  const group = labels.join(" OR ");
  return query.q ? `${query.q} AND (${group})` : group;
}

function unwrap(settled: PromiseSettledResult<Article[]>[], sourceName: string): Article[] {
  const articles: Article[] = [];
  const failures: string[] = [];
  for (const result of settled) {
    if (result.status === "fulfilled") articles.push(...result.value);
    else failures.push(result.reason instanceof Error ? result.reason.message : "Request failed");
  }
  if (articles.length === 0 && failures.length > 0) {
    throw new Error(failures[0] || `${sourceName} request failed`);
  }
  return articles;
}

function mapArticle(item: NewsApiArticle, category: CategoryId | null): Article | null {
  const title = item.title?.trim();
  const url = safeHttpUrl(item.url);
  if (!title || title === "[Removed]" || !url) return null;
  const outlet = item.source?.name?.trim();
  return {
    id: `newsapi:${url}`,
    title: stripHtml(title),
    description: stripHtml(item.description ?? ""),
    url,
    imageUrl: safeHttpUrl(item.urlToImage),
    sourceId: "newsapi",
    sourceName: outlet ? `${outlet} via NewsAPI` : sourceName("newsapi"),
    author: cleanByline(item.author),
    category,
    publishedAt: item.publishedAt ?? "",
  };
}
