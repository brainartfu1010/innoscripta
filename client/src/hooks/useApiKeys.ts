import { useCallback, useState } from "react";
import { EMPTY_API_KEYS, loadApiKeys, saveApiKeys, type ApiKeys } from "../apiKeys";

export function useApiKeys() {
  const [keys, setKeys] = useState<ApiKeys>(() => loadApiKeys());
  const [revision, setRevision] = useState(0);

  const save = useCallback((next: ApiKeys) => {
    const cleaned = {
      guardian: next.guardian.trim(),
      nyt: next.nyt.trim(),
      newsapi: next.newsapi.trim(),
    };
    saveApiKeys(cleaned);
    setKeys(cleaned);
    setRevision((value) => value + 1);
  }, []);

  const clear = useCallback(() => {
    saveApiKeys(EMPTY_API_KEYS);
    setKeys(EMPTY_API_KEYS);
    setRevision((value) => value + 1);
  }, []);

  return { keys, revision, save, clear };
}
