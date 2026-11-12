import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { getRefreshToken, setAuthCookies, clearAuthCookies } from "@/lib/session";

export async function POST() {
  const refreshToken = await getRefreshToken();

  if (!refreshToken) {
    return NextResponse.json({ error: "No active session." }, { status: 401 });
  }

  const backendResponse = await backendFetch("/api/auth/refresh", {
    method: "POST",
    body: JSON.stringify({ refreshToken }),
  });

  if (!backendResponse.ok) {
    const response = NextResponse.json({ error: "Session expired." }, { status: 401 });
    clearAuthCookies(response);
    return response;
  }

  const auth = await backendResponse.json();
  const response = NextResponse.json({ success: true });
  setAuthCookies(response, auth);
  return response;
}
