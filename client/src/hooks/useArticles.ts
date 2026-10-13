import { useEffect, useState } from "react";
import type { Article, ArticleQuery, SourceError } from "@shared/article";
import { fetchArticles } from "../api";

export interface FeedState {
  status: "loading" | "ready" | "error";
  articles: Article[];
  errors: SourceError[];
  message: string;
}

export function useArticles(query: ArticleQuery): FeedState {
  const serialized = JSON.stringify(query);
  const [state, setState] = useState<FeedState>({
    status: "loading",
    articles: [],
    errors: [],
    message: "",
  });

  useEffect(() => {
    const parsed = JSON.parse(serialized) as ArticleQuery;
    const controller = new AbortController();
    setState((current) => ({ ...current, status: "loading", message: "" }));

    fetchArticles(parsed, controller.signal)
      .then((result) => {
        setState({
          status: "ready",
          articles: result.articles,
          errors: result.errors,
          message: "",
        });
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setState({
          status: "error",
          articles: [],
          errors: [],
          message: "The server could not be reached.",
        });
      });

    return () => controller.abort();
  }, [serialized]);

  return state;
}
