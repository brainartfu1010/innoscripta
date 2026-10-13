import { useState } from "react";
import { CATEGORIES, SOURCES, type CategoryId, type SourceId } from "@shared/catalog";
import type { SourceInfo } from "../api";
import type { Preferences } from "../hooks/usePreferences";

interface PreferencePanelProps {
  preferences: Preferences;
  sources: SourceInfo[] | null;
  open: boolean;
  onToggleSource: (id: SourceId) => void;
  onToggleCategory: (id: CategoryId) => void;
  onAddAuthor: (name: string) => void;
  onRemoveAuthor: (name: string) => void;
  onClear: () => void;
}

export function PreferencePanel({
  preferences,
  sources,
  open,
  onToggleSource,
  onToggleCategory,
  onAddAuthor,
  onRemoveAuthor,
  onClear,
}: PreferencePanelProps) {
  const [author, setAuthor] = useState("");
  const configured = new Map((sources ?? []).map((source) => [source.id, source.configured]));

  return (
    <aside id="preferences" className={open ? "preferences is-open" : "preferences"}>
      <h2>Your feed</h2>
      <p className="hint">
        Choose sources, categories, and authors. The choice is saved in this browser only.
      </p>

      <fieldset>
        <legend>Sources</legend>
        <div className="check-list">
          {SOURCES.map((source) => (
            <label key={source.id} className="check">
              <input
                type="checkbox"
                checked={preferences.sources.includes(source.id)}
                onChange={() => onToggleSource(source.id)}
              />
              <span>{source.name}</span>
              {configured.get(source.id) === false ? <span className="tag">No key</span> : null}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend>Categories</legend>
        <div className="check-list">
          {CATEGORIES.map((category) => (
            <label key={category.id} className="check">
              <input
                type="checkbox"
                checked={preferences.categories.includes(category.id)}
                onChange={() => onToggleCategory(category.id)}
              />
              <span>{category.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <form
        className="field"
        onSubmit={(event) => {
          event.preventDefault();
          onAddAuthor(author);
          setAuthor("");
        }}
      >
        <label htmlFor="preference-author">Authors</label>
        <div className="author-row">
          <input
            id="preference-author"
            value={author}
            onChange={(event) => setAuthor(event.target.value)}
            placeholder="Add an author"
            autoComplete="off"
          />
          <button type="submit" className="secondary">
            Add
          </button>
        </div>
      </form>
      {preferences.authors.length > 0 ? (
        <ul className="chips">
          {preferences.authors.map((name) => (
            <li key={name} className="chip">
              <span>{name}</span>
              <button type="button" onClick={() => onRemoveAuthor(name)} aria-label={`Remove ${name}`}>
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="hint">Leave this empty to include every author.</p>
      )}

      <button type="button" className="secondary" onClick={onClear}>
        Reset preferences
      </button>
    </aside>
  );
}
