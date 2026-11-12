import "server-only";
import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";
import { setAuthCookies, type BackendAuthResponse } from "@/lib/session";

interface ResumeInviteBackendResponse {
  isNewAccount: boolean;
  auth: BackendAuthResponse | null;
}

export async function POST(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const backendResponse = await backendFetch(`/api/invites/${encodeURIComponent(token)}/resume`, {
    method: "POST",
  });

  const responseText = await backendResponse.text();

  if (!backendResponse.ok) {
    return new NextResponse(responseText, {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = JSON.parse(responseText) as ResumeInviteBackendResponse;
  const response = NextResponse.json({ isNewAccount: result.isNewAccount });
  if (result.auth) {
    setAuthCookies(response, result.auth);
  }
  return response;
}
