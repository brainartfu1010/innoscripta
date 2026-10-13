import type { CategoryId, SourceId } from "@shared/catalog";
import { CATEGORIES, SOURCES } from "@shared/catalog";
import type { SourceInfo } from "../api";

export interface FeedFilters {
  source: SourceId | "";
  category: CategoryId | "";
  from: string;
  to: string;
}

interface SearchFormProps {
  draft: string;
  filters: FeedFilters;
  sources: SourceInfo[];
  onDraftChange: (value: string) => void;
  onFiltersChange: (filters: FeedFilters) => void;
  onSearch: () => void;
  onClear: () => void;
}

export function SearchForm({
  draft,
  filters,
  sources,
  onDraftChange,
  onFiltersChange,
  onSearch,
  onClear,
}: SearchFormProps) {
  const dateError = filters.from && filters.to && filters.from > filters.to;

  return (
    <form
      className="search-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSearch();
      }}
    >
      <div className="search-row">
        <label className="field">
          <span>Keyword</span>
          <input
            value={draft}
            onChange={(event) => onDraftChange(event.target.value)}
            placeholder="Search headlines"
            autoComplete="off"
          />
        </label>
        <div className="actions">
          <button type="submit">Search</button>
          <button type="button" className="secondary" onClick={onClear}>
            Clear filters
          </button>
        </div>
      </div>

      <div className="filters">
        <label className="field">
          <span>Source</span>
          <select
            value={filters.source}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                source: event.target.value as SourceId | "",
              })
            }
          >
            <option value="">Any source</option>
            {(sources.length > 0 ? sources : SOURCES.map((source) => ({ ...source, configured: true }))).map(
              (source) => (
                <option key={source.id} value={source.id}>
                  {source.name}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="field">
          <span>Category</span>
          <select
            value={filters.category}
            onChange={(event) =>
              onFiltersChange({
                ...filters,
                category: event.target.value as CategoryId | "",
              })
            }
          >
            <option value="">Any category</option>
            {CATEGORIES.map((category) => (
              <option key={category.id} value={category.id}>
                {category.label}
              </option>
            ))}
          </select>
        </label>
        <label className="field">
          <span>From</span>
          <input
            type="date"
            value={filters.from}
            onChange={(event) => onFiltersChange({ ...filters, from: event.target.value })}
          />
        </label>
        <label className="field">
          <span>To</span>
          <input
            type="date"
            value={filters.to}
            onChange={(event) => onFiltersChange({ ...filters, to: event.target.value })}
          />
        </label>
      </div>
      <p className="hint">
        Saved preferences are the default feed. A source or category chosen here overrides that default until you
        clear filters.
      </p>
      {dateError ? <p className="banner error">The start date is after the end date.</p> : null}
    </form>
  );
}
