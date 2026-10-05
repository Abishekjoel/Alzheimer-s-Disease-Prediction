import { analysisApi } from "@/api/analysis";
import type { MRIAnalysis } from "@/types/api";

/**
 * API PLACEHOLDER NOTICE
 * -----------------------
 * The Django backend has no dedicated `/api/reports/` list endpoint —
 * reports are generated on demand per-analysis via
 * `GET /api/analysis/<id>/report/` (analysis/views.py::AnalysisReportView).
 * There is no server-side index of "reports that have been generated."
 *
 * Rather than inventing a `/api/reports/` endpoint that doesn't exist,
 * this derives a reports list from real completed analyses (real data,
 * from the real history endpoint) and lazily requests/generates the PDF
 * URL for each one on demand. If a real reports index is added later
 * (e.g. GET /api/reports/?page=), swap this implementation without
 * changing the Reports page's contract.
 */
export async function listReportableAnalyses(): Promise<MRIAnalysis[]> {
  const page = await analysisApi.history();
  return page.results.filter((analysis) => analysis.status === "completed");
}

export const reportsApi = {
  list: listReportableAnalyses,
  generate: (analysisId: number) => analysisApi.report(analysisId),
};
