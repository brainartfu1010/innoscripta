import { useState } from "react";
import type { Article } from "@shared/article";
import { categoryLabel } from "@shared/catalog";
import { formatDate } from "../format";

export function ArticleCard({ article }: { article: Article }) {
  const [imageFailed, setImageFailed] = useState(false);
  const showImage = Boolean(article.imageUrl) && !imageFailed;

  return (
    <article className={showImage ? "article-card has-image" : "article-card"}>
      {showImage ? (
        <img src={article.imageUrl ?? undefined} alt="" onError={() => setImageFailed(true)} />
      ) : null}
      <div>
        <p className="meta">
          <span>{article.sourceName}</span>
          {article.publishedAt ? (
            <>
              {" · "}
              <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
            </>
          ) : null}
          {article.author ? ` · ${article.author}` : null}
          {article.category ? ` · ${categoryLabel(article.category)}` : null}
        </p>
        <h3>
          <a href={article.url} target="_blank" rel="noreferrer">
            {article.title}
          </a>
        </h3>
        {article.description ? <p>{article.description}</p> : null}
        <p className="read-link">
          <a href={article.url} target="_blank" rel="noreferrer">
            Read article
          </a>
        </p>
      </div>
    </article>
  );
}
