import { apiClient } from "@/api/client";
import type {
  ExplainabilityResponse,
  MRIAnalysis,
  Paginated,
  ReportResponse,
} from "@/types/api";

export const analysisApi = {
  /**
   * Uploads an MRI and runs the full pipeline. The backend currently
   * executes this synchronously (quality check -> preprocessing -> hybrid
   * model inference -> uncertainty -> Grad-CAM -> attention viz all
   * happen before the response returns) — see
   * analysis/services/analysis_pipeline.py. The UI must not claim
   * real-time internal progress it cannot observe; see
   * components/analysis/AnalysisProgress for how that's handled.
   */
  upload: (caseId: number, file: File) => {
    const formData = new FormData();
    formData.append("case", String(caseId));
    formData.append("image", file);
    return apiClient.post<MRIAnalysis>("/api/analysis/upload/", formData);
  },

  get: (id: number) => apiClient.get<MRIAnalysis>(`/api/analysis/${id}/`),

  /**
   * The backend only supports `?case=<id>` server-side today
   * (analysis/views.py::AnalysisHistoryView). Prediction/model/date/
   * uncertainty filtering and case-ID search are applied client-side over
   * the fetched page in pages/History — real data, just not yet a
   * server-side filter. Expected future contract:
   *   GET /api/analysis/history/?case=&prediction=&model_version=&uncertainty=&search=
   */
  history: (params: { case?: number; page?: number } = {}) => {
    const query = new URLSearchParams();
    if (params.case) query.set("case", String(params.case));
    if (params.page) query.set("page", String(params.page));
    const qs = query.toString();
    return apiClient.get<Paginated<MRIAnalysis>>(`/api/analysis/history/${qs ? `?${qs}` : ""}`);
  },

  explainability: (id: number) => apiClient.get<ExplainabilityResponse>(`/api/analysis/${id}/explainability/`),

  report: (id: number) => apiClient.get<ReportResponse>(`/api/analysis/${id}/report/`),
};
