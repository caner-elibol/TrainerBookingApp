import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { setAuthCookies } from "@/lib/session";

export async function POST(request: Request) {
  const body = await request.text();
  const backendResponse = await backendFetch("/api/auth/otp/verify", {
    method: "POST",
    body,
  });

  const responseBody = await backendResponse.text();

  if (!backendResponse.ok) {
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { requiresRegistration, auth } = JSON.parse(responseBody);

  if (requiresRegistration || !auth) {
    return NextResponse.json({ success: true, requiresRegistration: true });
  }

  const response = NextResponse.json({ success: true, requiresRegistration: false });
  setAuthCookies(response, auth);
  return response;
}
