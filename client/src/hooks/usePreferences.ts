import { useEffect, useState } from "react";
import { isCategoryId, isSourceId, type CategoryId, type SourceId } from "@shared/catalog";

const STORAGE_KEY = "news-aggregator-preferences";

export interface Preferences {
  sources: SourceId[];
  categories: CategoryId[];
  authors: string[];
}

const EMPTY: Preferences = { sources: [], categories: [], authors: [] };

function loadPreferences(): Preferences {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return EMPTY;
    const record = parsed as Record<string, unknown>;
    return {
      sources: stringList(record.sources).filter(isSourceId),
      categories: stringList(record.categories).filter(isCategoryId),
      authors: stringList(record.authors).slice(0, 10),
    };
  } catch {
    return EMPTY;
  }
}

function stringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
}

export function usePreferences() {
  const [preferences, setPreferences] = useState<Preferences>(loadPreferences);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  function toggleSource(id: SourceId) {
    setPreferences((current) => ({ ...current, sources: toggle(current.sources, id) }));
  }

  function toggleCategory(id: CategoryId) {
    setPreferences((current) => ({ ...current, categories: toggle(current.categories, id) }));
  }

  function addAuthor(name: string) {
    const cleaned = name.replace(/[|,]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    if (!cleaned) return;
    setPreferences((current) => {
      if (current.authors.some((author) => author.toLowerCase() === cleaned.toLowerCase())) return current;
      return { ...current, authors: [...current.authors, cleaned].slice(0, 10) };
    });
  }

  function removeAuthor(name: string) {
    setPreferences((current) => ({
      ...current,
      authors: current.authors.filter((author) => author !== name),
    }));
  }

  function clearPreferences() {
    setPreferences(EMPTY);
  }

  return { preferences, toggleSource, toggleCategory, addAuthor, removeAuthor, clearPreferences };
}

function toggle<T extends string>(list: T[], id: T): T[] {
  return list.includes(id) ? list.filter((item) => item !== id) : [...list, id];
}
