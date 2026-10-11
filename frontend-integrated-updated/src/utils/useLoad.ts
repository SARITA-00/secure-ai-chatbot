import { useCallback, useEffect, useState } from "react";
import { ApiError } from "../services/api";

type LoadState<T> = {
  data: T | null;
  loading: boolean;
  error: string;
  reload: () => void;
  /** Replace the loaded data locally (e.g. after a successful update). */
  setData: (updater: (current: T | null) => T | null) => void;
};

/** Run an API call on mount (and on `reload()` / when `deps` change). */
export function useLoad<T>(
  fetcher: () => Promise<T>,
  deps: ReadonlyArray<unknown> = [],
): LoadState<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    fetcher()
      .then((result) => {
        if (cancelled) return;
        setDataState(result);
        setError("");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ApiError ? err.message : "Couldn't load this data.",
        );
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);

  const reload = useCallback(() => {
    setLoading(true);
    setTick((t) => t + 1);
  }, []);

  const setData = useCallback(
    (updater: (current: T | null) => T | null) => setDataState(updater),
    [],
  );

  return { data, loading, error, reload, setData };
}
