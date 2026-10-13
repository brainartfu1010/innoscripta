import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Article, ArticleQuery } from "../../shared/article.ts";
import type { SourceId } from "../../shared/catalog.ts";
import { sourceName } from "../../shared/catalog.ts";
import { stripHtml } from "./http.ts";
import { parseArticleQuery } from "./query.ts";
import { filterArticles, searchArticles } from "./search.ts";
import type { NewsSource } from "./sources/news-source.ts";

function query(overrides: Partial<ArticleQuery> = {}): ArticleQuery {
  return {
    sources: [],
    categories: [],
    authors: [],
    ...overrides,
  };
}

function article(overrides: Partial<Article> = {}): Article {
  return {
    id: overrides.id ?? "nyt:1",
    title: overrides.title ?? "Headline",
    description: overrides.description ?? "Summary",
    url: overrides.url ?? "https://example.com/story",
    imageUrl: null,
    sourceId: overrides.sourceId ?? "nyt",
    sourceName: overrides.sourceName ?? "The New York Times",
    author: overrides.author === undefined ? "Ada Lovelace" : overrides.author,
    category: overrides.category === undefined ? "technology" : overrides.category,
    publishedAt: overrides.publishedAt ?? "2026-10-10T08:00:00.000Z",
  };
}

class FakeSource implements NewsSource {
  calls = 0;

  readonly name: string;

  constructor(
    readonly id: SourceId,
    private readonly result: Article[] | Error,
    private readonly configured = true,
  ) {
    this.name = sourceName(id);
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async search(): Promise<Article[]> {
    this.calls += 1;
    if (this.result instanceof Error) throw this.result;
    return this.result;
  }
}

describe("parseArticleQuery", () => {
  it("keeps known filters and drops invalid values", () => {
    const params = new URLSearchParams(
      "q=climate&sources=guardian,made-up&categories=science|nope&from=2026-10-01&to=yesterday&authors=Ada%20Lovelace",
    );
    assert.deepEqual(parseArticleQuery(params), {
      q: "climate",
      sources: ["guardian"],
      categories: ["science"],
      from: "2026-10-01",
      to: undefined,
      authors: ["Ada Lovelace"],
    });
  });
});

describe("text", () => {
  it("strips tags and decodes entities", () => {
    assert.equal(stripHtml("<p>Fish &amp; chips</p>"), "Fish & chips");
  });
});

describe("searchArticles", () => {
  it("sorts newest first, dedupes urls, and filters authors", async () => {
    const guardian = new FakeSource("guardian", [
      article({
        id: "g1",
        sourceId: "guardian",
        url: "https://example.com/shared",
        publishedAt: "2026-10-01T00:00:00.000Z",
        author: "Ada Lovelace",
      }),
    ]);
    const nyt = new FakeSource("nyt", [
      article({
        id: "n1",
        url: "https://example.com/shared",
        publishedAt: "2026-10-12T00:00:00.000Z",
        author: "Ada Lovelace",
      }),
      article({
        id: "n2",
        url: "https://example.com/other",
        publishedAt: "2026-10-11T00:00:00.000Z",
        author: "Grace Hopper",
      }),
    ]);

    const result = await searchArticles([guardian, nyt], query({ authors: ["ada"] }));
    assert.deepEqual(
      result.articles.map((item) => item.id),
      ["n1"],
    );
    assert.deepEqual(result.errors, []);
  });

  it("asks only the selected sources and keeps going when one fails", async () => {
    const guardian = new FakeSource("guardian", new Error("Guardian returned HTTP 500"));
    const nyt = new FakeSource("nyt", [article({ id: "n1" })]);
    const newsapi = new FakeSource("newsapi", [article({ id: "a1", sourceId: "newsapi", url: "https://example.com/a" })]);

    const result = await searchArticles([guardian, nyt, newsapi], query({ sources: ["guardian", "nyt"] }));
    assert.equal(guardian.calls, 1);
    assert.equal(nyt.calls, 1);
    assert.equal(newsapi.calls, 0);
    assert.equal(result.articles[0]?.id, "n1");
    assert.equal(result.errors[0]?.source, "guardian");
  });

  it("rejects an inverted date range", async () => {
    const result = await searchArticles([], query({ from: "2026-10-12", to: "2026-10-01" }));
    assert.equal(result.articles.length, 0);
    assert.equal(result.errors[0]?.source, "query");
  });

  it("serves filtered samples when no source has a key", async () => {
    const sources = [
      new FakeSource("guardian", [], false),
      new FakeSource("nyt", [], false),
      new FakeSource("newsapi", [], false),
    ];
    const result = await searchArticles(sources, query({ q: "battery", categories: ["technology"] }));
    assert.equal(sources.every((source) => source.calls === 0), true);
    assert.equal(result.articles.length, 1);
    assert.match(result.articles[0]?.title ?? "", /battery/i);
    assert.equal(result.errors[0]?.source, "config");
  });
});

describe("filterArticles", () => {
  it("applies the date window", () => {
    const articles = filterArticles(
      [
        article({ id: "old", publishedAt: "2026-09-01T00:00:00.000Z", url: "https://example.com/old" }),
        article({ id: "new", publishedAt: "2026-10-12T00:00:00.000Z", url: "https://example.com/new" }),
      ],
      query({ from: "2026-10-01" }),
    );
    assert.deepEqual(
      articles.map((item) => item.id),
      ["new"],
    );
  });
});
