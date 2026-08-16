export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.code = code;
    this.status = status;
  }
}

export interface PaginationMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
}

interface ApiSuccess<T> {
  success: true;
  message?: string;
  data: T;
  pagination?: PaginationMeta;
}

interface ApiFailure {
  success: false;
  error: { code: string; message: string; details?: unknown };
}

type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const API_PREFIX = "/api/v1";

const ACCESS_TOKEN_KEY = "auth_access_token";
const REFRESH_TOKEN_KEY = "auth_refresh_token";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  window.localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function parseEnvelope<T>(response: Response): Promise<T> {
  let body: ApiEnvelope<T> | null = null;

  try {
    body = (await response.json()) as ApiEnvelope<T>;
  } catch {
    // Non-JSON response body
  }

  if (!response.ok || !body || body.success !== true) {
    const errorBody = body && body.success === false ? body.error : null;
    throw new ApiError(
      errorBody?.message ?? `Request failed with status ${response.status}`,
      errorBody?.code ?? "REQUEST_FAILED",
      response.status
    );
  }

  return body.data;
}

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(`${API_BASE}${API_PREFIX}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return false;

    const body = (await response.json()) as ApiEnvelope<{
      accessToken: string;
      refreshToken: string;
    }>;

    if (body.success !== true) return false;

    setTokens(body.data.accessToken, body.data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

function redirectToLogin(): void {
  clearTokens();
  window.localStorage.removeItem("auth_user");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE}${API_PREFIX}${path}`;

  const buildOptions = (): RequestInit => {
    const headers: Record<string, string> = {
      ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(options.headers as Record<string, string> | undefined),
    };
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return { ...options, headers };
  };

  let response = await fetch(url, buildOptions());

  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(url, buildOptions());
    }
  }

  if (response.status === 401) {
    redirectToLogin();
  }

  return parseEnvelope<T>(response);
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: "GET" });
  },
  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "POST", body: body === undefined ? undefined : JSON.stringify(body) });
  },
  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PATCH", body: body === undefined ? undefined : JSON.stringify(body) });
  },
  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, { method: "PUT", body: body === undefined ? undefined : JSON.stringify(body) });
  },
  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: "DELETE" });
  },
};

export function toQueryString(params: Record<string, string | number | boolean | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }
  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  const url = `${API_BASE}${API_PREFIX}${path}`;

  const buildOptions = (): RequestInit => {
    const headers: Record<string, string> = {};
    const token = getAccessToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
    return { headers };
  };

  let response = await fetch(url, buildOptions());

  if (response.status === 401 && getRefreshToken()) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      response = await fetch(url, buildOptions());
    }
  }

  if (response.status === 401) {
    redirectToLogin();
    return;
  }

  if (!response.ok) {
    throw new ApiError(
      `Download failed with status ${response.status}`,
      "DOWNLOAD_FAILED",
      response.status
    );
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}