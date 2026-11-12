import "server-only";

const BASE_URL = process.env.BACKEND_API_URL ?? "http://localhost:5190";

export function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });
}
