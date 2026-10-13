# Front page — innoscripta take-home

React + TypeScript news aggregator with a small Node proxy, three live sources, personalized feed preferences, and Docker.

## Brief checklist

| Requirement | Status | Where |
| --- | --- | --- |
| React.js + TypeScript | Done | `client/` |
| ≥ 3 article sources | Done | Guardian, New York Times, NewsAPI.org |
| Search by keyword | Done | Search form → `GET /api/articles?q=` |
| Filter by date | Done | From / To date fields |
| Filter by category | Done | Category select + My feed preferences |
| Filter by source | Done | Source select + My feed preferences |
| Personalized feed (sources, categories, authors) | Done | **My feed** sidebar / mobile panel (`localStorage`) |
| Mobile-responsive UI | Done | `client/src/styles.css` |
| Docker + run docs | Done | `Dockerfile`, `docker-compose.yml`, below |
| DRY / KISS / SOLID | Done | Shared `Article` model + `NewsSource` adapters |

Source choice notes: OpenNews is not an article API, NewsCred is enterprise-only, and BBC has no comparable public search API. “NewsAPI” and “NewsAPI.org” in the brief are the same product, so they count as one source.

## Run with Docker

This is the intended review path.

```bash
git clone <this-repo>
cd innoscripta
cp .env.example .env
# Optional: fill GUARDIAN_API_KEY, NYT_API_KEY, NEWSAPI_API_KEY
docker compose up --build
```

Open **http://localhost:3000**.

What the image does:

1. Installs dependencies
2. Runs unit tests and TypeScript checks
3. Builds the React client and Express server
4. Serves both on port 3000

You can also add keys later in the UI via **Settings** (stored in the browser and sent as headers). Server `.env` keys remain a fallback.

Stop with `Ctrl+C`, or in detached mode use `docker compose down`.

## Local development (without Docker)

Node.js 20+.

```bash
npm install
cp .env.example .env
npm run dev
```

- UI: http://localhost:5173  
- API: http://localhost:3001 (Vite proxies `/api`)

```bash
npm run verify   # test + typecheck + build
npm start        # http://localhost:3000
```

## Using the app

1. **Settings** — paste Guardian / NYT / NewsAPI keys (or rely on sample articles).
2. **Search** — keyword plus filters for source, category, author, and date range.
3. **My feed** — choose preferred sources, categories, and authors. These become the default feed until a search filter overrides them.

## Architecture (SOLID)

```text
browser  →  Express  →  NewsSource adapters  →  Guardian / NYT / NewsAPI
                ↑
         shared Article type
```

| Principle | How it shows up |
| --- | --- |
| Single responsibility | UI components render; `searchArticles` merges; each `*Source` talks to one API |
| Open/closed | New publisher = new adapter + one line in `createSources` |
| Liskov | Any `NewsSource` can replace another in `searchArticles` |
| Interface segregation | Adapters only implement `search` / `isConfigured` |
| Dependency inversion | Server depends on `NewsSource`, not Guardian/NYT/NewsAPI SDKs |

DRY: one `Article` / `ArticleQuery` model in `shared/`.  
KISS: no accounts, no Redux — preferences and keys stay in `localStorage`.

## Keys

| Settings field / env var | Register |
| --- | --- |
| The Guardian / `GUARDIAN_API_KEY` | https://open-platform.theguardian.com/access/ |
| New York Times / `NYT_API_KEY` | https://developer.nytimes.com/ (enable Article Search) |
| NewsAPI.org / `NEWSAPI_API_KEY` | https://newsapi.org/register |

Do not commit `.env`. NewsAPI’s free plan is for local development (~100 req/day, 24h delay). Guardian’s developer key is for non-commercial use.

## API

- `GET /api/health`
- `GET /api/meta` — sources and whether each key is present (headers or env)
- `GET /api/articles?q=&sources=guardian|nyt&categories=technology&from=2026-10-01&to=2026-10-13&authors=Ada%20Lovelace`

Headers (optional, from Settings): `x-api-key-guardian`, `x-api-key-nyt`, `x-api-key-newsapi`.

Guardian/NewsAPI return up to 15 articles each; NYT up to 10. Failed sources are reported in `errors` without clearing the rest. Results are deduped by URL and sorted newest first.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite UI + API |
| `npm test` | Server tests |
| `npm run typecheck` | Client + server TypeScript |
| `npm run build` | Production bundles |
| `npm run verify` | test + typecheck + build |
| `npm start` | Serve production build |
| `docker compose up --build` | Full containerized app |

## How AI was used

Cursor helped implement the scaffold after the design was fixed: server-side proxy, one adapter per publisher, browser preferences/settings, and Docker as the run path. Source selection and the shared `Article` model were deliberate. Sample articles keep the UI reviewable before keys exist. Expect to explain why the proxy exists and what a fourth source would touch.
