import type { AnalysisStatus, CaseSex, PredictedClass, UncertaintyLevel } from "@/types/api";

export const SEX_LABELS: Record<CaseSex, string> = {
  M: "Male",
  F: "Female",
  U: "Not specified",
};

export const PREDICTION_LABELS: Record<PredictedClass, string> = {
  CN: "Cognitively Normal",
  MCI: "Mild Cognitive Impairment",
  AD: "Alzheimer's Disease",
};

export const PREDICTION_TONE: Record<PredictedClass, "success" | "warning" | "danger"> = {
  CN: "success",
  MCI: "warning",
  AD: "danger",
};

export const UNCERTAINTY_TONE: Record<UncertaintyLevel, "success" | "warning" | "danger"> = {
  LOW: "success",
  MEDIUM: "warning",
  HIGH: "danger",
};

export const STATUS_LABELS: Record<AnalysisStatus, string> = {
  pending: "Pending",
  quality_rejected: "Quality Rejected",
  completed: "Completed",
  failed: "Failed",
};

export const STATUS_TONE: Record<AnalysisStatus, "success" | "warning" | "danger" | "muted"> = {
  pending: "muted",
  quality_rejected: "warning",
  completed: "success",
  failed: "danger",
};

export const CLASS_NAMES: PredictedClass[] = ["CN", "MCI", "AD"];

export const NAV_LINKS_PUBLIC = [
  { label: "Technology", href: "/#technology" },
  { label: "How It Works", href: "/#how-it-works" },
  { label: "Features", href: "/#features" },
  { label: "Explainability", href: "/#explainability" },
  { label: "About", href: "/about" },
];
