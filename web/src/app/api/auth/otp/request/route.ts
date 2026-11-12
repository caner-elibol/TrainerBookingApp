import { NextResponse } from "next/server";
import { backendFetch } from "@/lib/api";

export async function POST(request: Request) {
  const body = await request.text();
  const backendResponse = await backendFetch("/api/auth/otp/request", {
    method: "POST",
    body,
  });

  if (!backendResponse.ok) {
    const responseBody = await backendResponse.text();
    return new NextResponse(responseBody, {
      status: backendResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  return NextResponse.json({ success: true });
}
