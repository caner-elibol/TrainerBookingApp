import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeJwtPayload } from "@/lib/jwt";

export const ACCESS_TOKEN_COOKIE = "pt_access_token";
export const REFRESH_TOKEN_COOKIE = "pt_refresh_token";

const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

export type UserRole = "Trainer" | "Client";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AccessTokenClaims {
  sub: string;
  email: string;
  name: string;
  exp: number;
  [ROLE_CLAIM]: UserRole;
}

export interface BackendAuthResponse {
  accessToken: string;
  accessTokenExpiresAtUtc: string;
  refreshToken: string;
  refreshTokenExpiresAtUtc: string;
}

function toSessionUser(claims: AccessTokenClaims): SessionUser {
  return {
    id: claims.sub,
    email: claims.email,
    fullName: claims.name,
    role: claims[ROLE_CLAIM],
  };
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_COOKIE)?.value ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_COOKIE)?.value ?? null;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const token = await getAccessToken();
  if (!token) return null;

  const claims = decodeJwtPayload<AccessTokenClaims>(token);
  if (!claims) return null;

  if (claims.exp * 1000 < Date.now()) return null;

  return toSessionUser(claims);
}

const cookieBaseOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export function setAuthCookies(response: NextResponse, auth: BackendAuthResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, auth.accessToken, {
    ...cookieBaseOptions,
    expires: new Date(auth.accessTokenExpiresAtUtc),
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, auth.refreshToken, {
    ...cookieBaseOptions,
    expires: new Date(auth.refreshTokenExpiresAtUtc),
  });
}

export function clearAuthCookies(response: NextResponse): void {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}
