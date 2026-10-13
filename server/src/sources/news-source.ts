import type { Article, ArticleQuery } from "../../../shared/article.ts";
import type { SourceId } from "../../../shared/catalog.ts";

/**
 * One adapter per publisher. Search and the UI depend on this interface,
 * not on a Guardian, NYT, or NewsAPI payload.
 */
export interface NewsSource {
  readonly id: SourceId;
  readonly name: string;
  isConfigured(): boolean;
  search(query: ArticleQuery): Promise<Article[]>;
}

export class MissingApiKeyError extends Error {
  constructor(sourceName: string, envName: string) {
    super(`${sourceName} is not configured. Set ${envName}.`);
    this.name = "MissingApiKeyError";
  }
}
