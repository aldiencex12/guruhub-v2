import { useAuthStore } from "@/store/auth.store";

const getApiUrl = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (typeof window !== "undefined") {
    // If accessed via LAN IP (e.g. 192.168.1.96:3001), route API calls to 192.168.1.96:8000
    const hostname = window.location.hostname;
    return `http://${hostname}:8000`;
  }
  return "http://localhost:8000";
};

export const BASE_URL = getApiUrl();

class ApiError extends Error {
  status: number;
  info: any;
  constructor(message: string, status: number, info: any) {
    super(message);
    this.status = status;
    this.info = info;
  }
}

let refreshPromise: Promise<string | null> | null = null;

async function refreshTokens(): Promise<string | null> {
  const store = useAuthStore.getState();
  const refreshToken = store.refreshToken;
  if (!refreshToken) {
    throw new Error("No refresh token");
  }

  const response = await fetch(`${BASE_URL}/auth/refresh`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refreshToken }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  const data = await response.json();
  const newAccessToken = data.accessToken;
  const newRefreshToken = data.refreshToken;

  store.setAccessToken(newAccessToken);
  store.setRefreshToken(newRefreshToken);

  return newAccessToken;
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const store = useAuthStore.getState();
  const accessToken = store.accessToken;
  const schoolId = store.currentUser?.schoolId;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Content-Type") && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }
  if (schoolId) {
    headers.set("x-school-id", String(schoolId));
  }

  const url = `${BASE_URL}${path}`;
  const fetchOptions = { ...options, headers };

  let response = await fetch(url, fetchOptions);

  if (response.status === 401 && store.refreshToken) {
    // Check if another concurrent request already refreshed the token
    const currentStoreToken = useAuthStore.getState().accessToken;
    if (currentStoreToken && currentStoreToken !== accessToken) {
      headers.set("Authorization", `Bearer ${currentStoreToken}`);
      response = await fetch(url, { ...options, headers });
    }

    if (response.status === 401) {
      // Percobaan token refresh
      try {
        if (!refreshPromise) {
          refreshPromise = refreshTokens();
        }
        const newAccessToken = await refreshPromise;
        refreshPromise = null;

        if (newAccessToken) {
          // Replay dengan token akses baru
          headers.set("Authorization", `Bearer ${newAccessToken}`);
          response = await fetch(url, { ...options, headers });
        }
      } catch (e) {
        refreshPromise = null;
        store.logout();
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        throw e;
      }
    }
  }

  if (!response.ok) {
    let info: any = null;
    try {
      info = await response.json();
    } catch {}
    let errorMessage = "Request failed";
    if (info) {
      if (typeof info.message === "string") errorMessage = info.message;
      else if (typeof info.error === "string") errorMessage = info.error;
      else if (info.error?.message) errorMessage = info.error.message;
      else if (info.errors && info.errors.length > 0) {
        const err = info.errors[0];
        if (typeof err === "string") errorMessage = err;
        else if (err.reason) errorMessage = `Baris ${err.row || '?'}: ${err.reason}`;
        else errorMessage = JSON.stringify(err);
      }
    }
    
    throw new ApiError(errorMessage, response.status, info);
  }

  // Handle standard JSON response
  const contentType = response.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export const api = {
  get: (path: string, options?: RequestInit) => request(path, { ...options, method: "GET" }),
  post: (path: string, body?: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData || (body && typeof body.append === 'function');
    return request(path, {
      ...options,
      method: "POST",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  put: (path: string, body?: any, options?: RequestInit) => {
    const isFormData = body instanceof FormData || (body && typeof body.append === 'function');
    return request(path, {
      ...options,
      method: "PUT",
      body: isFormData ? body : JSON.stringify(body),
    });
  },
  delete: (path: string, options?: RequestInit) => request(path, { ...options, method: "DELETE" }),
  download: async (path: string, filename: string) => {
    const store = useAuthStore.getState();
    const accessToken = store.accessToken;
    const schoolId = store.currentUser?.schoolId;

    const headers = new Headers();
    if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);
    if (schoolId) headers.set("x-school-id", String(schoolId));

    const response = await fetch(`${BASE_URL}${path}`, { headers });
    if (!response.ok) throw new Error("Gagal mengunduh file");

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }, 100);
  }
};
