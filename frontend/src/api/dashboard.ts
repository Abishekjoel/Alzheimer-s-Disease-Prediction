import { apiClient } from "@/api/client";
import type { DashboardSummary } from "@/types/api";

export const dashboardApi = {
  /** Real, live-computed aggregates (analysis.views.DashboardSummaryView)
   * — never client-side estimates or invented numbers. */
  summary: () => apiClient.get<DashboardSummary>("/api/dashboard/summary/"),
};
