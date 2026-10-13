import type { Article } from "../../shared/article.ts";
import type { CategoryId, SourceId } from "../../shared/catalog.ts";
import { sourceName } from "../../shared/catalog.ts";

export const SAMPLE_ARTICLES: Article[] = [
  article("guardian", "world", "Amelia Hart", "2026-10-12", "City councils debate late-night transit funding", "Several cities are weighing whether overnight buses should stay in the budget."),
  article("guardian", "politics", "Jonas Keller", "2026-10-11", "Parliament committee questions new data rules", "Lawmakers asked how the draft would apply to small newsrooms."),
  article("nyt", "business", "Priya Raman", "2026-10-10", "Chip export limits ripple through supply contracts", "Manufacturers said the latest rules change delivery dates into next quarter."),
  article("nyt", "technology", "Amelia Hart", "2026-10-09", "Labs report a cheaper battery chemistry", "Researchers published early results for a cell that uses fewer scarce metals."),
  article("nyt", "science", "Jonas Keller", "2026-09-30", "Survey maps bird migration after a warm spring", "Volunteer counts show several species arriving earlier than last decade."),
  article("newsapi", "sports", "Priya Raman", "2026-10-08", "Marathon organizers publish a revised course", "The new route shortens one climb and adds a water station."),
  article("guardian", "culture", "Amelia Hart", "2026-10-02", "Museum opens its archive of protest posters", "The collection is digitized and free to browse on site."),
  article("newsapi", "health", "Jonas Keller", "2026-10-07", "Clinics expand evening vaccination hours", "Two hospital groups will stay open until 9 p.m. on weekdays."),
  article("newsapi", "business", "Priya Raman", "2026-09-20", "Regional banks outline climate risk scenarios", "The reports describe flood exposure for branch networks."),
  article("guardian", "technology", "Grace Hopper", "2026-10-06", "Startups trial offline maps for rural clinics", "The apps keep pharmacy stock lists available without a signal."),
  article("nyt", "politics", "Grace Hopper", "2026-10-05", "City hall releases draft rules for scooter lanes", "The proposal would reserve curb space near transit hubs."),
  article("newsapi", "world", "Amelia Hart", "2026-10-04", "Coastal towns share a joint flood warning feed", "Three ports agreed to publish tide alerts on the same schedule."),
];

function article(
  sourceId: SourceId,
  category: CategoryId,
  author: string,
  day: string,
  title: string,
  description: string,
): Article {
  return {
    id: `sample-${sourceId}-${day}-${category}`,
    title,
    description,
    url: `https://example.com/${sourceId}/${category}`,
    imageUrl: null,
    sourceId,
    sourceName: sourceName(sourceId),
    author,
    category,
    publishedAt: `${day}T08:00:00.000Z`,
  };
}
