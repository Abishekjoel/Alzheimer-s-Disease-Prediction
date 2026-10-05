/**
 * Types mirror the real Django REST Framework serializers exactly
 * (accounts/serializers.py, patients/serializers.py, analysis/serializers.py).
 * Nothing here is speculative — every field maps to a real backend field.
 */

export type UserRole = "researcher" | "clinician" | "admin";
export type BloodGroup = "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-" | "";

export interface UserProfile {
  role: UserRole;
  institution: string;
  full_name: string;
  date_of_birth: string | null;
  age: number | null;
  blood_group: BloodGroup;
  profile_picture_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
  date_joined: string;
  profile: UserProfile;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export type CaseSex = "M" | "F" | "U";
export type PredictedClass = "CN" | "MCI" | "AD";

export interface LatestAnalysisSummary {
  id: number;
  status: string;
  predicted_class: PredictedClass | null;
  confidence: number | null;
  uncertainty_level: UncertaintyLevel | null;
  created_at: string;
}

export interface Case {
  id: number;
  case_id: string;
  full_name: string;
  age_years: number | null;
  sex: CaseSex;
  blood_group: BloodGroup;
  weight_kg: number | null;
  photo_url: string | null;
  notes: string;
  created_by: string | null;
  analysis_count: number;
  latest_analysis: LatestAnalysisSummary | null;
  created_at: string;
  updated_at: string;
}

export interface ModelVersion {
  id: number;
  name: string;
  version: string;
  cnn_architecture: string;
  swin_architecture: string;
  fusion_method: string;
  training_dataset_info: Record<string, unknown>;
  metrics: Record<string, unknown>;
  is_active: boolean;
  is_demo: boolean;
  notes: string;
  created_at: string;
}
export type UncertaintyLevel = "LOW" | "MEDIUM" | "HIGH";
export type AnalysisStatus = "pending" | "quality_rejected" | "completed" | "failed";

export interface AnalysisProbabilities {
  CN: number;
  MCI: number;
  AD: number;
}

export interface CasePatientSummary {
  id: number;
  case_id: string;
  full_name: string;
  age_years: number | null;
  sex: CaseSex;
  blood_group: BloodGroup;
  weight_kg: number | null;
  photo_url: string | null;
}

export interface MRIAnalysis {
  id: number;
  case_id: string;
  case: CasePatientSummary;
  status: AnalysisStatus;
  error_message: string;
  quality_score: number | null;
  quality_is_valid: boolean | null;
  quality_issues: string[];
  predicted_class: PredictedClass | null;
  probabilities: AnalysisProbabilities | null;
  confidence: number | null;
  uncertainty_score: number | null;
  uncertainty_level: UncertaintyLevel | null;
  model_version: ModelVersion | null;
  is_demo: boolean;
  processing_time_ms: number | null;
  image_url: string | null;
  gradcam_url: string | null;
  attention_map_url: string | null;
  report_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ExplainabilityResponse {
  predicted_class: PredictedClass | null;
  gradcam_url: string | null;
  attention_map_url: string | null;
}

export interface ReportResponse {
  report_url: string;
}

export interface RecentAnalysisSummary {
  id: number;
  case_id: string;
  full_name: string;
  age_years: number | null;
  blood_group: BloodGroup;
  predicted_class: PredictedClass | null;
  confidence: number | null;
  status: AnalysisStatus;
  created_at: string;
}

export interface DashboardSummary {
  total_cases: number;
  total_analyses: number;
  today_analyses: number;
  reports_generated: number;
  class_distribution: Record<PredictedClass, number>;
  recent_analyses: RecentAnalysisSummary[];
}

export interface Paginated<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface ApiErrorBody {
  detail?: string;
  [field: string]: unknown;
}
