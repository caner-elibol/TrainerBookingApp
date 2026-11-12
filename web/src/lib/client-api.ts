"use client";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5190";

export async function clientFetch(path: string, token: string | null, init?: RequestInit): Promise<Response> {
  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
  });

  if (response.status === 401 && token && typeof window !== "undefined") {
    window.location.href = "/login?sessionExpired=1";
  }

  return response;
}

export function getSignalRHubUrl(): string {
  return `${BASE_URL}/hubs/availability`;
}
