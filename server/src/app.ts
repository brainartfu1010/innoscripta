import express, { type Express } from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { CATEGORIES } from "../../shared/catalog.ts";
import { parseArticleQuery } from "./query.ts";
import { searchArticles } from "./search.ts";
import type { NewsSource } from "./sources/news-source.ts";

export function createApp(sources: NewsSource[]): Express {
  const app = express();
  app.disable("x-powered-by");

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true });
  });

  app.get("/api/meta", (_req, res) => {
    res.json({
      sources: sources.map((source) => ({
        id: source.id,
        name: source.name,
        configured: source.isConfigured(),
      })),
      categories: CATEGORIES,
    });
  });

  app.get("/api/articles", async (req, res) => {
    const params = new URL(req.originalUrl, "http://localhost").searchParams;
    try {
      const result = await searchArticles(sources, parseArticleQuery(params));
      res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({
        articles: [],
        errors: [{ source: "server", message: "Search failed." }],
      });
    }
  });

  const clientDist = path.resolve(process.cwd(), "client/dist");
  if (existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== "GET" && req.method !== "HEAD") {
        next();
        return;
      }
      if (req.path.startsWith("/api")) {
        next();
        return;
      }
      res.sendFile(path.join(clientDist, "index.html"));
    });
  }

  return app;
}
