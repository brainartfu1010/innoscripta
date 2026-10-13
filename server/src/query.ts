import type { ArticleQuery } from "../../shared/article.ts";
import { isCategoryId, isSourceId, type CategoryId, type SourceId } from "../../shared/catalog.ts";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

function readList(params: URLSearchParams, key: string): string[] {
  return params
    .getAll(key)
    .flatMap((value) => value.split(/[|,]/))
    .map((value) => value.trim())
    .filter(Boolean);
}

function readDate(params: URLSearchParams, key: string): string | undefined {
  const value = params.get(key)?.trim() ?? "";
  return DATE.test(value) ? value : undefined;
}

export function parseArticleQuery(params: URLSearchParams): ArticleQuery {
  const q = params.get("q")?.trim().slice(0, 200);
  const sources = [...new Set(readList(params, "sources").filter(isSourceId))] as SourceId[];
  const categories = [...new Set(readList(params, "categories").filter(isCategoryId))] as CategoryId[];
  const authors = [...new Set(readList(params, "authors").map((author) => author.slice(0, 80)))].slice(0, 10);

  return {
    q: q || undefined,
    sources,
    categories,
    from: readDate(params, "from"),
    to: readDate(params, "to"),
    authors,
  };
}
