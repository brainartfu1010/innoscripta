import { useEffect, useState } from "react";
import { fetchSources, type SourceInfo } from "../api";

export function useSourceMeta(): SourceInfo[] | null {
  const [sources, setSources] = useState<SourceInfo[] | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetchSources(controller.signal)
      .then(setSources)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setSources(null);
      });
    return () => controller.abort();
  }, []);

  return sources;
}
