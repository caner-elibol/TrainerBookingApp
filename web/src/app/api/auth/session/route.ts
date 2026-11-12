import { NextResponse } from "next/server";
import { getSessionUser, getAccessToken } from "@/lib/session";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ user: null, accessToken: null });
  }

  const accessToken = await getAccessToken();
  return NextResponse.json({ user, accessToken });
}
