import { useMemo, useState } from "react";
import { isCategoryId, isSourceId, SOURCES } from "@shared/catalog";
import type { ArticleQuery } from "@shared/article";
import { ArticleList } from "./components/ArticleList";
import { FeedSummary } from "./components/FeedSummary";
import { PreferencePanel } from "./components/PreferencePanel";
import { SearchForm, type FeedFilters } from "./components/SearchForm";
import { useArticles } from "./hooks/useArticles";
import { usePreferences } from "./hooks/usePreferences";
import { useSourceMeta } from "./hooks/useSourceMeta";

const EMPTY_FILTERS: FeedFilters = { source: "", category: "", from: "", to: "" };

export function App() {
  const sourceMeta = useSourceMeta();
  const { preferences, toggleSource, toggleCategory, addAuthor, removeAuthor, clearPreferences } = usePreferences();
  const [filters, setFilters] = useState<FeedFilters>(EMPTY_FILTERS);
  const [draft, setDraft] = useState("");
  const [keyword, setKeyword] = useState("");
  const [preferencesOpen, setPreferencesOpen] = useState(false);

  const request = useMemo<ArticleQuery>(
    () => ({
      q: keyword || undefined,
      sources: filters.source ? [filters.source] : preferences.sources,
      categories: filters.category ? [filters.category] : preferences.categories,
      from: filters.from || undefined,
      to: filters.to || undefined,
      authors: preferences.authors,
    }),
    [keyword, filters, preferences],
  );

  const feed = useArticles(request);
  const configError = feed.errors.find((error) => error.source === "config");
  const sourceErrors = feed.errors.filter((error) => error.source !== "config" && error.source !== "query");
  const queryError = feed.errors.find((error) => error.source === "query");
  const sourceOptions =
    sourceMeta ??
    SOURCES.map((source) => ({
      id: source.id,
      name: source.name,
      configured: true,
    }));

  function updateFilters(next: FeedFilters) {
    setFilters({
      ...next,
      source: isSourceId(next.source) ? next.source : "",
      category: isCategoryId(next.category) ? next.category : "",
    });
  }

  return (
    <>
      <header className="site-header">
        <div className="site-header-inner">
          <div>
            <p className="eyebrow">News aggregator</p>
            <h1>Front page</h1>
          </div>
          <button
            type="button"
            className="secondary preferences-toggle"
            aria-expanded={preferencesOpen}
            aria-controls="preferences"
            onClick={() => setPreferencesOpen((open) => !open)}
          >
            {preferencesOpen ? "Hide preferences" : "Preferences"}
          </button>
        </div>
      </header>

      <div className={preferencesOpen ? "layout preferences-open" : "layout"}>
        <main>
          {configError ? <p className="banner">{configError.message}</p> : null}
          {queryError ? <p className="banner error">{queryError.message}</p> : null}
          {sourceErrors.length > 0 ? (
            <ul className="error-list">
              {sourceErrors.map((error) => (
                <li key={error.source}>
                  {error.source}: {error.message}
                </li>
              ))}
            </ul>
          ) : null}

          <SearchForm
            draft={draft}
            filters={filters}
            sources={sourceOptions}
            onDraftChange={setDraft}
            onFiltersChange={updateFilters}
            onSearch={() => setKeyword(draft.trim())}
            onClear={() => {
              setDraft("");
              setKeyword("");
              setFilters(EMPTY_FILTERS);
            }}
          />
          <FeedSummary preferences={preferences} filters={filters} keyword={keyword} />
          <ArticleList status={feed.status} articles={feed.articles} errors={feed.errors} message={feed.message} />
        </main>
        <PreferencePanel
          preferences={preferences}
          sources={sourceMeta}
          open={preferencesOpen}
          onToggleSource={toggleSource}
          onToggleCategory={toggleCategory}
          onAddAuthor={addAuthor}
          onRemoveAuthor={removeAuthor}
          onClear={clearPreferences}
        />
      </div>
      <footer className="site-footer">
        <p>
          Headlines are fetched from The Guardian, The New York Times, and NewsAPI. Read the full story on the
          publisher’s site.
        </p>
      </footer>
    </>
  );
}
