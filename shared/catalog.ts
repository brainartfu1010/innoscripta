export const SOURCES = [
  { id: "guardian", name: "The Guardian" },
  { id: "nyt", name: "The New York Times" },
  { id: "newsapi", name: "NewsAPI" },
] as const;

export const CATEGORIES = [
  { id: "world", label: "World" },
  { id: "politics", label: "Politics" },
  { id: "business", label: "Business" },
  { id: "technology", label: "Technology" },
  { id: "science", label: "Science" },
  { id: "sports", label: "Sports" },
  { id: "culture", label: "Culture" },
  { id: "health", label: "Health" },
] as const;

export type SourceId = (typeof SOURCES)[number]["id"];
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export function isSourceId(value: string): value is SourceId {
  return SOURCES.some((source) => source.id === value);
}

export function isCategoryId(value: string): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value);
}

export function sourceName(id: SourceId): string {
  return SOURCES.find((source) => source.id === id)?.name ?? id;
}

export function categoryLabel(id: CategoryId): string {
  return CATEGORIES.find((category) => category.id === id)?.label ?? id;
}
