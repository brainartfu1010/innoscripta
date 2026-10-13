import { categoryLabel, sourceName } from "@shared/catalog";
import type { Preferences } from "../hooks/usePreferences";
import type { FeedFilters } from "./SearchForm";

interface FeedSummaryProps {
  preferences: Preferences;
  filters: FeedFilters;
  keyword: string;
}

export function FeedSummary({ preferences, filters, keyword }: FeedSummaryProps) {
  const sources = filters.source ? [filters.source] : preferences.sources;
  const categories = filters.category ? [filters.category] : preferences.categories;
  const parts: string[] = [];

  if (keyword) parts.push(`“${keyword}”`);
  if (sources.length > 0) parts.push(labelList(sources.map((id) => sourceName(id))));
  else parts.push("all sources");
  if (categories.length > 0) parts.push(labelList(categories.map((id) => categoryLabel(id))));
  if (preferences.authors.length > 0) parts.push(`authors: ${preferences.authors.join(", ")}`);
  if (filters.from || filters.to) {
    parts.push(`${filters.from || "…"} → ${filters.to || "…"}`);
  }

  return <p className="feed-summary">Showing {parts.join(" · ")}</p>;
}

function labelList(labels: string[]): string {
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}
