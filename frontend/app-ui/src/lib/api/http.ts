const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";

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

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await res.json() : await res.text();

  if (!res.ok) {
    const err: ApiError = {
      status: res.status,
      message:
        (isJson && (body.message as string)) ||
        (typeof body === "string" ? body : "Request failed"),
      error: isJson ? (body.error as string | undefined) : undefined,
    };
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
  const headers: HeadersInit = {
    ...(init?.headers ?? {}),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(buildUrl(path, query), {
    ...init,
    method: "GET",
    headers,
  });

  return handleResponse<T>(res);
}

export async function apiPost<TReq, TRes>(
  path: string,
  body: TReq,
  options: Omit<RequestOptions, "query"> = {},
): Promise<TRes> {
  const { auth, init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  return handleResponse<TRes>(res);
}

export async function apiPut<TReq, TRes>(
  path: string,
  body: TReq,
  options: Omit<RequestOptions, "query"> = {},
): Promise<TRes> {
  const { auth, init } = options;
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(init?.headers ?? {}),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    method: "PUT",
    headers,
    body: JSON.stringify(body),
  });

  return handleResponse<TRes>(res);
}

export async function apiDelete<TRes>(
  path: string,
  options: Omit<RequestOptions, "query"> = {},
): Promise<TRes> {
  const { auth, init } = options;
  const headers: HeadersInit = {
    ...(init?.headers ?? {}),
  };

  if (auth) {
    const token = getAuthToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const res = await fetch(buildUrl(path), {
    ...init,
    method: "DELETE",
    headers,
  });

  return handleResponse<TRes>(res);
}


