import type { Article, ArticleQuery } from "../../../shared/article.ts";
import type { CategoryId } from "../../../shared/catalog.ts";
import { sourceName } from "../../../shared/catalog.ts";
import { cleanByline, getJson, safeHttpUrl, stripHtml } from "../http.ts";
import { MissingApiKeyError, type NewsSource } from "./news-source.ts";

const SECTION: Record<CategoryId, string> = {
  world: "world",
  politics: "politics",
  business: "business",
  technology: "technology",
  science: "science",
  sports: "sport",
  culture: "culture",
  health: "lifeandstyle",
};

const SECTION_TO_CATEGORY: Record<string, CategoryId> = {
  world: "world",
  politics: "politics",
  business: "business",
  technology: "technology",
  science: "science",
  sport: "sports",
  culture: "culture",
  lifeandstyle: "health",
};

interface GuardianResult {
  id?: string;
  webTitle?: string;
  webUrl?: string;
  webPublicationDate?: string;
  sectionId?: string;
  fields?: {
    trailText?: string;
    thumbnail?: string;
    byline?: string;
  };
}

interface GuardianResponse {
  response?: { results?: GuardianResult[] };
}

export class GuardianSource implements NewsSource {
  readonly id = "guardian" as const;
  readonly name = sourceName("guardian");

  constructor(private readonly apiKey: string | undefined) {}

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async search(query: ArticleQuery): Promise<Article[]> {
    if (!this.apiKey) throw new MissingApiKeyError(this.name, "GUARDIAN_API_KEY");

    const params = new URLSearchParams({
      "api-key": this.apiKey,
      "page-size": "15",
      "order-by": "newest",
      "show-fields": "trailText,thumbnail,byline",
    });
    if (query.q) params.set("q", query.q);
    if (query.categories.length > 0) {
      params.set("section", query.categories.map((id) => SECTION[id]).join("|"));
    }
    if (query.from) params.set("from-date", query.from);
    if (query.to) params.set("to-date", query.to);

    const body = await getJson<GuardianResponse>(
      `https://content.guardianapis.com/search?${params}`,
      this.name,
      this.apiKey,
    );
    const fallback = query.categories.length === 1 ? query.categories[0] : null;
    return (body.response?.results ?? []).flatMap((result) => {
      const article = mapResult(result, fallback);
      return article ? [article] : [];
    });
  }
}

function mapResult(result: GuardianResult, fallback: CategoryId | null): Article | null {
  const url = safeHttpUrl(result.webUrl);
  const title = result.webTitle?.trim();
  if (!url || !title) return null;
  return {
    id: `guardian:${result.id ?? url}`,
    title: stripHtml(title),
    description: stripHtml(result.fields?.trailText ?? ""),
    url,
    imageUrl: safeHttpUrl(result.fields?.thumbnail),
    sourceId: "guardian",
    sourceName: sourceName("guardian"),
    author: cleanByline(result.fields?.byline),
    category: (result.sectionId && SECTION_TO_CATEGORY[result.sectionId]) || fallback,
    publishedAt: result.webPublicationDate ?? "",
  };
}
