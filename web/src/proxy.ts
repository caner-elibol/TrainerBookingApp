import { NextRequest, NextResponse } from "next/server";
import { decodeJwtPayload } from "@/lib/jwt";

const ACCESS_TOKEN_COOKIE = "pt_access_token";
const ROLE_CLAIM = "http://schemas.microsoft.com/ws/2008/06/identity/claims/role";

const trainerRoutes = ["/dashboard", "/onboarding", "/packages"];
const clientRoutes = ["/appointments"];
const authRoutes = ["/login", "/register"];

export function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;
  const token = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;

  const isTrainerRoute = trainerRoutes.some((route) => path.startsWith(route));
  const isClientRoute = clientRoutes.some((route) => path.startsWith(route));
  const isAuthRoute = authRoutes.includes(path);

  if ((isTrainerRoute || isClientRoute) && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isTrainerRoute && token) {
    const claims = decodeJwtPayload<Record<string, unknown>>(token);
    if (claims?.[ROLE_CLAIM] !== "Trainer") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isClientRoute && token) {
    const claims = decodeJwtPayload<Record<string, unknown>>(token);
    if (claims?.[ROLE_CLAIM] !== "Client") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  if (isAuthRoute && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
