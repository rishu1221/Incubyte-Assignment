const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:4000";

export class ApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

type Envelope<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  let body: Envelope<T> | null = null;
  try {
    body = (await response.json()) as Envelope<T>;
  } catch {
    body = null;
  }

  if (!response.ok || !body?.success || body.data === undefined) {
    throw new ApiError(body?.error ?? "The pay ledger could not be reached.", response.status);
  }

  return body.data;
}

export function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) {
    if (value) {
      search.set(key, value);
    }
  }
  const query = search.toString();
  return request<T>(query ? `${path}?${query}` : path);
}

export function apiPost<T>(path: string, payload: unknown): Promise<T> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
