import { getToken } from "@/services/authStorage";
import type { ApiErrorBody } from "@/types/api";

/**
 * Base URL for the Django API. Empty by default so requests go through
 * Vite's dev proxy (see vite.config.ts) to http://127.0.0.1:8000 — same
 * origin from the browser's point of view, no CORS configuration needed
 * in development. Set VITE_API_BASE_URL for a production build talking to
 * a separately-hosted backend.
 */
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "";

export class ApiError extends Error {
  status: number;
  body: ApiErrorBody | null;

  constructor(status: number, body: ApiErrorBody | null, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

function extractMessage(body: ApiErrorBody | null, fallback: string): string {
  if (!body) return fallback;
  if (typeof body.detail === "string") return body.detail;
  const firstFieldError = Object.values(body).find((value) => value !== undefined);
  if (Array.isArray(firstFieldError) && typeof firstFieldError[0] === "string") {
    return firstFieldError[0];
  }
  if (typeof firstFieldError === "string") return firstFieldError;
  return fallback;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const isFormData = options.body instanceof FormData;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Token ${token}`;

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    body: isFormData ? (options.body as FormData) : options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type") ?? "";
  const parsed = contentType.includes("application/json") ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    throw new ApiError(response.status, parsed, extractMessage(parsed, response.statusText || "Request failed"));
  }

  return parsed as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>(path, { method: "GET" }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: "POST", body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: "PATCH", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

export { API_BASE };
