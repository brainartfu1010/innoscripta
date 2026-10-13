import { useEffect, useId, useState } from "react";
import type { ApiKeys } from "../apiKeys";

interface SettingsPanelProps {
  open: boolean;
  keys: ApiKeys;
  onClose: () => void;
  onSave: (keys: ApiKeys) => void;
  onClear: () => void;
}

export function SettingsPanel({ open, keys, onClose, onSave, onClear }: SettingsPanelProps) {
  const titleId = useId();
  const [draft, setDraft] = useState<ApiKeys>(keys);

  useEffect(() => {
    if (open) setDraft(keys);
  }, [open, keys]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="settings-backdrop" role="presentation" onClick={onClose}>
      <div
        className="settings-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="settings-header">
          <h2 id={titleId}>Settings</h2>
          <button type="button" className="secondary" onClick={onClose}>
            Close
          </button>
        </div>
        <p className="hint">
          Paste your API keys here. They are stored only in this browser and sent to this app’s server as
          request headers. Server <code>.env</code> keys still work as a fallback.
        </p>

        <form
          className="settings-form"
          onSubmit={(event) => {
            event.preventDefault();
            onSave(draft);
            onClose();
          }}
        >
          <label className="field">
            <span>The Guardian</span>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft.guardian}
              onChange={(event) => setDraft((current) => ({ ...current, guardian: event.target.value }))}
              placeholder="GUARDIAN_API_KEY"
            />
            <a className="settings-link" href="https://open-platform.theguardian.com/access/" target="_blank" rel="noreferrer">
              Get a Guardian key
            </a>
          </label>

          <label className="field">
            <span>New York Times</span>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft.nyt}
              onChange={(event) => setDraft((current) => ({ ...current, nyt: event.target.value }))}
              placeholder="NYT_API_KEY"
            />
            <a className="settings-link" href="https://developer.nytimes.com/" target="_blank" rel="noreferrer">
              Get an NYT key (enable Article Search)
            </a>
          </label>

          <label className="field">
            <span>NewsAPI.org</span>
            <input
              type="password"
              autoComplete="off"
              spellCheck={false}
              value={draft.newsapi}
              onChange={(event) => setDraft((current) => ({ ...current, newsapi: event.target.value }))}
              placeholder="NEWSAPI_API_KEY"
            />
            <a className="settings-link" href="https://newsapi.org/register" target="_blank" rel="noreferrer">
              Get a NewsAPI key
            </a>
          </label>

          <div className="settings-actions">
            <button type="submit">Save keys</button>
            <button
              type="button"
              className="secondary"
              onClick={() => {
                onClear();
                setDraft({ guardian: "", nyt: "", newsapi: "" });
              }}
            >
              Clear keys
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
