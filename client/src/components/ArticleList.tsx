import type { Article } from "@shared/article";
import type { FeedState } from "../hooks/useArticles";
import { ArticleCard } from "./ArticleCard";

export function ArticleList({ status, articles, message }: FeedState) {
  if (status === "error") return <p className="banner error">{message}</p>;
  if (status === "loading" && articles.length === 0) {
    return (
      <ul className="article-list" aria-busy="true" aria-label="Loading articles">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="article-card skeleton" />
        ))}
      </ul>
    );
  }
  if (articles.length === 0) return <p className="status">No articles match this search.</p>;

  const count = `${articles.length} ${articles.length === 1 ? "article" : "articles"}`;
  return (
    <>
      <p className="status muted">{status === "loading" ? `Updating… ${count}` : count}</p>
      <ul className="article-list">
        {articles.map((article: Article) => (
          <li key={article.id}>
            <ArticleCard article={article} />
          </li>
        ))}
      </ul>
    </>
  );
}
