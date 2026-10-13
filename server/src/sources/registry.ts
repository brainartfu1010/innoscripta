import { GuardianSource } from "./guardian-source.ts";
import { NewsApiSource } from "./newsapi-source.ts";
import type { NewsSource } from "./news-source.ts";
import { NytSource } from "./nyt-source.ts";

export function createSources(
  env: Pick<NodeJS.ProcessEnv, "GUARDIAN_API_KEY" | "NYT_API_KEY" | "NEWSAPI_API_KEY">,
): NewsSource[] {
  return [
    new GuardianSource(clean(env.GUARDIAN_API_KEY)),
    new NytSource(clean(env.NYT_API_KEY)),
    new NewsApiSource(clean(env.NEWSAPI_API_KEY)),
  ];
}

function clean(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
