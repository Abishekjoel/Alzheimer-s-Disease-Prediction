import { apiClient } from "@/api/client";
import type { Case, CaseSex, BloodGroup, Paginated, PredictedClass } from "@/types/api";

export interface CreateCasePayload {
  full_name?: string;
  age_years?: number | null;
  sex?: CaseSex;
  blood_group?: BloodGroup;
  weight_kg?: number | null;
  photo?: File | null;
  notes?: string;
}

export interface CaseFilters {
  search?: string;
  blood_group?: BloodGroup;
  sex?: CaseSex;
  prediction?: PredictedClass;
  age_min?: number;
  age_max?: number;
  date_from?: string;
  date_to?: string;
}

function toFormData(payload: CreateCasePayload): FormData {
  const formData = new FormData();
  if (payload.full_name !== undefined) formData.append("full_name", payload.full_name);
  if (payload.age_years !== undefined && payload.age_years !== null) formData.append("age_years", String(payload.age_years));
  if (payload.sex !== undefined) formData.append("sex", payload.sex);
  if (payload.blood_group !== undefined) formData.append("blood_group", payload.blood_group);
  if (payload.weight_kg !== undefined && payload.weight_kg !== null) formData.append("weight_kg", String(payload.weight_kg));
  if (payload.photo) formData.append("photo", payload.photo);
  if (payload.notes !== undefined) formData.append("notes", payload.notes);
  return formData;
}

export const patientsApi = {
  listCases: (filters: CaseFilters = {}) => {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") query.set(key, String(value));
    });
    const qs = query.toString();
    return apiClient.get<Paginated<Case>>(`/api/patients/cases/${qs ? `?${qs}` : ""}`);
  },
  createCase: (payload: CreateCasePayload) => apiClient.post<Case>("/api/patients/cases/", toFormData(payload)),
  updateCase: (id: number, payload: CreateCasePayload) => apiClient.patch<Case>(`/api/patients/cases/${id}/`, toFormData(payload)),
  getCase: (id: number) => apiClient.get<Case>(`/api/patients/cases/${id}/`),
};
