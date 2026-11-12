import "server-only";
import { getAccessToken } from "@/lib/session";

const BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:5190";

export interface BackendResult<T = unknown> {
  ok: boolean;
  status: number;
  data: T | null;
}

export async function authedFetch<T = unknown>(path: string, init?: RequestInit): Promise<BackendResult<T>> {
  const token = await getAccessToken();

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T) : null;

  return { ok: response.ok, status: response.status, data };
}
