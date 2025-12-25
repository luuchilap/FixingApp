// Get API base URL from environment or use current origin (for Vercel same-origin requests)
const getApiBaseUrl = () => {
  if (typeof window !== 'undefined') {
    // Client-side: use env var or current origin
    return process.env.NEXT_PUBLIC_API_BASE_URL ?? window.location.origin;
  }
  // Server-side: use env var or localhost fallback
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
};

const API_BASE_URL = getApiBaseUrl();

export interface ApiError {
  status: number;
  message: string;
  error?: string;
}

function buildUrl(path: string, query?: Record<string, unknown>): string {
  const url = new URL(
    path.startsWith("/") ? path : `/${path}`,
    API_BASE_URL,
  );

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem("fa_token");
  } catch {
    return null;
  }
}

function normalizeHeaders(headers?: HeadersInit): Record<string, string> {
  if (!headers) return {};
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries());
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers);
  }
  return headers as Record<string, string>;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  let body: any;
  
  try {
    body = isJson ? await res.json() : await res.text();
  } catch (parseError) {
    // If parsing fails, use status text as message
    const err: ApiError = {
      status: res.status,
      message: res.statusText || "Request failed",
      error: "Failed to parse response",
    };
    throw err;
  }

  if (!res.ok) {
    // Extract error message from various possible formats
    let errorMessage = "Request failed";
    
    if (isJson && body) {
      // Try different possible message fields
      errorMessage = body.message || body.error || body.msg || errorMessage;
      
      // If message is an object, try to stringify it
      if (typeof errorMessage === 'object') {
        errorMessage = JSON.stringify(errorMessage);
      }
    } else if (typeof body === "string" && body) {
      errorMessage = body;
    } else {
      errorMessage = res.statusText || `HTTP ${res.status} error`;
    }
    
    const err: ApiError = {
      status: res.status,
      message: errorMessage,
      error: isJson && body ? (body.error as string | undefined) : undefined,
    };
    
    console.error(`API Error [${res.status}]:`, errorMessage, body);
    throw err;
  }

  return body as T;
}

interface RequestOptions {
  query?: Record<string, unknown>;
  auth?: boolean;
  init?: RequestInit;
}

export async function apiGet<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { query, auth, init } = options;
  const headers: Record<string, string> = {
    ...normalizeHeaders(init?.headers),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(buildUrl(path, query), {
      ...init,
      method: "GET",
      headers: headers as HeadersInit,
    });

    return handleResponse<T>(res);
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const apiError: ApiError = {
        status: 0,
        message: `Cannot connect to API at ${API_BASE_URL}. Make sure the backend server is running.`,
        error: 'Network Error'
      };
      console.error('Network error:', apiError.message);
      throw apiError;
    }
    throw error;
  }
}

export async function apiPost<TReq, TRes>(
  path: string,
  body: TReq,
  options: Omit<RequestOptions, "query"> = {},
): Promise<TRes> {
  const { auth, init } = options;
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    ...normalizeHeaders(init?.headers),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(buildUrl(path), {
      ...init,
      method: "POST",
      headers: headers as HeadersInit,
      body: isFormData ? (body as unknown as BodyInit) : JSON.stringify(body),
    });

    return handleResponse<TRes>(res);
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const apiError: ApiError = {
        status: 0,
        message: `Cannot connect to API at ${API_BASE_URL}. Make sure the backend server is running.`,
        error: 'Network Error'
      };
      console.error('Network error:', apiError.message);
      throw apiError;
    }
    throw error;
  }
}

export async function apiPut<TReq, TRes>(
  path: string,
  body: TReq,
  options: Omit<RequestOptions, "query"> = {},
): Promise<TRes> {
  const { auth, init } = options;
  const isFormData = body instanceof FormData;
  const headers: Record<string, string> = {
    ...normalizeHeaders(init?.headers),
  };

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(buildUrl(path), {
      ...init,
      method: "PUT",
      headers: headers as HeadersInit,
      body: isFormData ? (body as unknown as BodyInit) : JSON.stringify(body),
    });

    return handleResponse<TRes>(res);
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const apiError: ApiError = {
        status: 0,
        message: `Cannot connect to API at ${API_BASE_URL}. Make sure the backend server is running.`,
        error: 'Network Error'
      };
      console.error('Network error:', apiError.message);
      throw apiError;
    }
    throw error;
  }
}

export async function apiDelete<TRes>(
  path: string,
  options: Omit<RequestOptions, "query"> = {},
): Promise<TRes> {
  const { auth, init } = options;
  const headers: Record<string, string> = {
    ...normalizeHeaders(init?.headers),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  try {
    const res = await fetch(buildUrl(path), {
      ...init,
      method: "DELETE",
      headers: headers as HeadersInit,
    });

    return handleResponse<TRes>(res);
  } catch (error) {
    // Handle network errors (Failed to fetch)
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      const apiError: ApiError = {
        status: 0,
        message: `Cannot connect to API at ${API_BASE_URL}. Make sure the backend server is running.`,
        error: 'Network Error'
      };
      console.error('Network error:', apiError.message);
      throw apiError;
    }
    throw error;
  }
}


