import type { Article, ArticleQuery } from "../../../shared/article.ts";
import type { CategoryId } from "../../../shared/catalog.ts";
import { sourceName } from "../../../shared/catalog.ts";
import { cleanByline, getJson, safeHttpUrl, stripHtml } from "../http.ts";
import { MissingApiKeyError, type NewsSource } from "./news-source.ts";

const DESK: Record<CategoryId, string> = {
  world: "Foreign",
  politics: "Politics",
  business: "Business",
  technology: "Technology",
  science: "Science",
  sports: "Sports",
  culture: "Culture",
  health: "Health",
};

const DESK_TO_CATEGORY: Record<string, CategoryId> = {
  Foreign: "world",
  Politics: "politics",
  Business: "business",
  Technology: "technology",
  Science: "science",
  Sports: "sports",
  Culture: "culture",
  Health: "health",
};

interface NytDoc {
  _id?: string;
  web_url?: string;
  abstract?: string;
  snippet?: string;
  pub_date?: string;
  news_desk?: string;
  headline?: { main?: string };
  byline?: { original?: string };
  multimedia?: unknown;
}

interface NytResponse {
  response?: { docs?: NytDoc[] };
}

export class NytSource implements NewsSource {
  readonly id = "nyt" as const;
  readonly name = sourceName("nyt");

  constructor(private readonly apiKey: string | undefined) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async search(query: ArticleQuery): Promise<Article[]> {
    if (!this.apiKey) throw new MissingApiKeyError(this.name, "NYT_API_KEY");

    const params = new URLSearchParams({
      "api-key": this.apiKey,
      sort: "newest",
    });
    if (query.q) params.set("q", query.q);
    if (query.from) params.set("begin_date", query.from.replaceAll("-", ""));
    if (query.to) params.set("end_date", query.to.replaceAll("-", ""));
    if (query.categories.length > 0) {
      const desks = query.categories.map((id) => `"${DESK[id]}"`).join(" ");
      params.set("fq", `news_desk:(${desks})`);
    }

    const body = await getJson<NytResponse>(
      `https://api.nytimes.com/svc/search/v2/articlesearch.json?${params}`,
      this.name,
      this.apiKey,
    );
    const fallback = query.categories.length === 1 ? query.categories[0] : null;
    return (body.response?.docs ?? []).flatMap((doc) => {
      const article = mapDoc(doc, fallback);
      return article ? [article] : [];
    });
  }
}

function mapDoc(doc: NytDoc, fallback: CategoryId | null): Article | null {
  const url = safeHttpUrl(doc.web_url);
  const title = doc.headline?.main?.trim();
  if (!url || !title) return null;
  return {
    id: `nyt:${doc._id ?? url}`,
    title: stripHtml(title),
    description: stripHtml(doc.abstract || doc.snippet || ""),
    url,
    imageUrl: nytImage(doc.multimedia),
    sourceId: "nyt",
    sourceName: sourceName("nyt"),
    author: cleanByline(doc.byline?.original),
    category: (doc.news_desk && DESK_TO_CATEGORY[doc.news_desk]) || fallback,
    publishedAt: doc.pub_date ?? "",
  };
}

function nytImage(multimedia: unknown): string | null {
  if (Array.isArray(multimedia)) {
    const withUrl = multimedia.find(
      (item): item is { url: string } =>
        typeof item === "object" && item !== null && "url" in item && typeof item.url === "string",
    );
    return absolutize(withUrl?.url);
  }
  if (typeof multimedia === "object" && multimedia !== null && "default" in multimedia) {
    const url = (multimedia as { default?: { url?: string } }).default?.url;
    return absolutize(url);
  }
  return null;
}

function absolutize(url: string | undefined): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return safeHttpUrl(url);
  return safeHttpUrl(`https://www.nytimes.com/${url.replace(/^\/+/, "")}`);
}
