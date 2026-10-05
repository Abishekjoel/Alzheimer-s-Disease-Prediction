import { apiClient } from "@/api/client";
import type { AuthResponse, BloodGroup, User, UserRole } from "@/types/api";

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  institution?: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

export interface UpdateProfilePayload {
  full_name?: string;
  institution?: string;
  date_of_birth?: string | null;
  blood_group?: BloodGroup;
  profile_picture?: File | null;
}

export const authApi = {
  register: (payload: RegisterPayload) => apiClient.post<AuthResponse>("/api/accounts/register/", payload),
  login: (payload: LoginPayload) => apiClient.post<AuthResponse>("/api/accounts/login/", payload),
  profile: () => apiClient.get<User>("/api/accounts/profile/"),

  updateProfile: (payload: UpdateProfilePayload) => {
    const formData = new FormData();
    if (payload.full_name !== undefined) formData.append("full_name", payload.full_name);
    if (payload.institution !== undefined) formData.append("institution", payload.institution);
    if (payload.date_of_birth !== undefined) formData.append("date_of_birth", payload.date_of_birth ?? "");
    if (payload.blood_group !== undefined) formData.append("blood_group", payload.blood_group);
    if (payload.profile_picture) formData.append("profile_picture", payload.profile_picture);
    return apiClient.patch<User>("/api/accounts/profile/", formData);
  },

  /**
   * API PLACEHOLDER — there is no password-reset endpoint on the Django
   * backend today (accounts/urls.py only has register/login/profile).
   * This intentionally rejects rather than pretending to succeed; the
   * ForgotPassword page surfaces that clearly instead of faking a sent
   * email. Expected future contract:
   *   POST /api/accounts/password-reset/ { email } -> 200 { detail }
   */
  requestPasswordReset: (_email: string): Promise<never> =>
    Promise.reject(new Error("Password reset is not connected to a backend endpoint yet.")),
};
