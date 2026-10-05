import { useEffect, useState } from "react";

import { dashboardApi } from "@/api/dashboard";
import type { DashboardSummary } from "@/types/api";

interface DashboardDataState {
  summary: DashboardSummary | null;
  loading: boolean;
  error: string | null;
}

export function useDashboardData(): DashboardDataState {
  const [state, setState] = useState<DashboardDataState>({ summary: null, loading: true, error: null });

  useEffect(() => {
    let cancelled = false;
    dashboardApi
      .summary()
      .then((summary) => {
        if (!cancelled) setState({ summary, loading: false, error: null });
      })
      .catch(() => {
        if (!cancelled) setState({ summary: null, loading: false, error: "Couldn't load dashboard data." });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
