import { useCallback, useEffect, useState } from "react";

import { analysisApi } from "@/api/analysis";
import type { MRIAnalysis } from "@/types/api";

export function useAnalysis(id: number) {
  const [analysis, setAnalysis] = useState<MRIAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setAnalysis(await analysisApi.get(id));
    } catch {
      setError("Couldn't load this analysis.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { analysis, loading, error, refetch, setAnalysis };
}
