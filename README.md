# Front page

A news aggregator for the innoscripta frontend take-home. The React + TypeScript UI searches and filters articles from three publishers, and a small Node proxy keeps the API keys on the server.

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

Until API keys are set, the server returns a few sample articles and says so. That keeps the interface usable before the keys exist. Sample data stops as soon as any selected source has a key.

## Run with Docker

Docker is the intended way to run the submission.

```bash
cp .env.example .env
# Fill in GUARDIAN_API_KEY, NYT_API_KEY, and NEWSAPI_API_KEY.
docker compose up --build
```

Open http://localhost:3000.

Compose reads `.env` for the key values and starts the app on port 3000. The image runs the tests and the TypeScript check before it builds the client.

## Local development

Requires Node.js 20 or newer.

```bash
npm install
cp .env.example .env
npm run dev
```

The API listens on http://localhost:3001 and the Vite app on http://localhost:5173. Vite proxies `/api` to the API.

```bash
npm test
npm run typecheck
npm run build
npm start
```

`npm start` serves the built client and the API together on port 3000, or on `PORT` from the environment.

## Keys

| Variable | Register |
| --- | --- |
| `GUARDIAN_API_KEY` | https://open-platform.theguardian.com/access/ |
| `NYT_API_KEY` | https://developer.nytimes.com/ — enable Article Search |
| `NEWSAPI_API_KEY` | https://newsapi.org/register |

Keys are read only on the server. Do not commit `.env`.

The NewsAPI developer plan is for local development, allows about 100 requests a day, and delays new articles by 24 hours. The Guardian developer key is for non-commercial use and is enough to run this exercise locally. A public deployment of NewsAPI needs their paid plan.

## API

`GET /api/health`

`GET /api/meta` — source ids and whether each key is set.

`GET /api/articles?q=&sources=guardian|nyt&categories=technology&from=2026-10-01&to=2026-10-13&authors=Ada%20Lovelace`

Each source returns up to 15 articles. One failed source does not empty the feed; its message is returned in `errors`. Results are merged, deduped by URL, and sorted newest first. Author and date windows are applied again after the merge.

## Decisions and limits

- No accounts. The brief asks for a personal feed, and this browser is enough to store it.
- Author matching is a case-insensitive substring, because the three APIs do not filter authors the same way.
- NewsAPI headlines do not accept a date range. A search that has a keyword or a date uses their archive endpoint. A date with no keyword uses the required keyword `the` so the range still applies. The default headline call, with no category selected, uses US top headlines because that endpoint requires a country, source list, or category.
- Category names are normalized. Guardian “sport” becomes “sports”; NewsAPI “entertainment” is used for culture.
- The first page only. Paging can be added on `NewsSource.search` without changing the UI’s article shape.

## How AI was used

Cursor scaffolded this repository from a design that was fixed first: a server-side proxy, one adapter per publisher, preferences in the browser, and Docker as the run path. The source choice, the shared `Article` model, and the decision to skip accounts were made before the files were generated. The sample-article fallback is there so the UI can be reviewed before live keys are added.

Review the adapters and `searchArticles` before the conversation with the tech lead. The useful explanation is why the proxy exists and what a fourth source would touch.
