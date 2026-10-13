import { useEffect, useState } from "react";
import { fetchSources, type SourceInfo } from "../api";
import type { ApiKeys } from "../apiKeys";

export function useSourceMeta(keys: ApiKeys, keysRevision: number): SourceInfo[] | null {
  const [sources, setSources] = useState<SourceInfo[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchSources(controller.signal, keys)
      .then(setSources)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSources(null);
      });
    return () => controller.abort();
  }, [keys, keysRevision]);

  return sources;
}
