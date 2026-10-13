# Front page

A news aggregator for the innoscripta frontend take-home. The React + TypeScript UI searches and filters articles from three publishers, and a small Node proxy keeps the API keys on the server.

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:5173. Without API keys the app still runs on sample articles so you can review search, filters, and preferences immediately.

```bash
# Production-style local run (API + built UI on one port)
npm run verify
npm start
```

Open http://localhost:3000 (`PORT` defaults to 3000; `npm run dev` still uses API port 3001 beside Vite).

```bash
# Docker (keys optional; sample mode works without them)
cp .env.example .env
docker compose up --build
```

Open http://localhost:3000.

## Requirements

| Brief | Where it lives |
| --- | --- |
| React + TypeScript | `client/` |
| At least three sources | The Guardian, The New York Times, NewsAPI.org |
| Search by keyword; filter by date, category, and source | Search form and `GET /api/articles` |
| Personalized feed (sources, categories, authors) | Preferences panel, stored in `localStorage` |
| Mobile layout | `client/src/styles.css` |
| Docker | `Dockerfile`, `docker-compose.yml` |

OpenNews is a journalism community, not an article API. NewsCred is an enterprise product. BBC does not offer a public search API in the same way. NewsAPI and NewsAPI.org in the brief are the same product, so it counts as one source.

## Architecture

```text
browser  →  Express  →  NewsSource adapters  →  Guardian / NYT / NewsAPI
                ↑
         one Article type
```

`searchArticles` depends on the `NewsSource` interface. Each publisher has its own adapter and maps its payload into the shared `Article` type. Adding a source means a new adapter plus one line in `createSources`. The UI never sees a raw provider response.

Preferences are the default feed. Choosing a source or category in the search form overrides that default until the filters are cleared. Author preferences always apply. Nothing here requires an account.

Until API keys are set, the server returns sample articles and says so. When some keys are set, only those sources are queried; missing keys are reported without emptying the feed. Successful live responses are cached for 60 seconds.

## Keys

Use the in-app **Settings** button to paste keys. They stay in this browser’s `localStorage` and are sent only to this app’s API as request headers.

You can also put keys in `.env` on the server; those are used when the browser does not send a value.

| Variable / Settings field | Register |
| --- | --- |
| `GUARDIAN_API_KEY` / The Guardian | https://open-platform.theguardian.com/access/ |
| `NYT_API_KEY` / New York Times | https://developer.nytimes.com/ — enable Article Search |
| `NEWSAPI_API_KEY` / NewsAPI.org | https://newsapi.org/register |

Do not commit `.env` or paste production keys into a public demo.

The NewsAPI developer plan is for local development, allows about 100 requests a day, and delays new articles by 24 hours. The Guardian developer key is for non-commercial use and is enough to run this exercise locally. A public deployment of NewsAPI needs their paid plan.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite UI + API with hot reload |
| `npm test` | Server unit tests |
| `npm run typecheck` | TypeScript for client and server |
| `npm run build` | Bundle server and client |
| `npm run verify` | test + typecheck + build |
| `npm start` | Serve the production build |

## API

`GET /api/health`

`GET /api/meta` — source ids and whether each key is set.

`GET /api/articles?q=&sources=guardian|nyt&categories=technology&from=2026-10-01&to=2026-10-13&authors=Ada%20Lovelace`

Guardian and NewsAPI each return up to 15 articles per request; The New York Times Article Search returns up to 10. One failed source does not empty the feed; its message is returned in `errors`. Results are merged, deduped by URL, and sorted newest first. Author and date windows are applied again after the merge.

## Decisions and limits

- No accounts. The brief asks for a personal feed, and this browser is enough to store it.
- Author matching is a case-insensitive substring, because the three APIs do not filter authors the same way.
- NewsAPI headlines do not accept a date range. A search that has a keyword or a date uses their archive endpoint. A date with no keyword uses the required keyword `the` so the range still applies. The default headline call, with no category selected, uses US top headlines because that endpoint requires a country, source list, or category.
- Category names are normalized. Guardian “sport” becomes “sports”; NewsAPI “entertainment” is used for culture.
- The first page only. Paging can be added on `NewsSource.search` without changing the UI’s article shape.

## How AI was used

Cursor scaffolded this repository from a design that was fixed first: a server-side proxy, one adapter per publisher, preferences in the browser, and Docker as the run path. The source choice, the shared `Article` model, and the decision to skip accounts were made before the files were generated. The sample-article fallback is there so the UI can be reviewed before live keys are added.

Review the adapters and `searchArticles` before the conversation with the tech lead. The useful explanation is why the proxy exists and what a fourth source would touch.
