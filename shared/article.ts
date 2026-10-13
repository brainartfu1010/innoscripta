import type { CategoryId, SourceId } from "./catalog.ts";

export interface Article {
  id: string;
  title: string;
  description: string;
  url: string;
  imageUrl: string | null;
  sourceId: SourceId;
  sourceName: string;
  author: string | null;
  category: CategoryId | null;
  publishedAt: string;
}

export interface ArticleQuery {
  q?: string;
  sources: SourceId[];
  categories: CategoryId[];
  from?: string;
  to?: string;
  authors: string[];
}

export interface SourceError {
  source: string;
  message: string;
}

export interface ArticleSearchResult {
  articles: Article[];
  errors: SourceError[];
}
