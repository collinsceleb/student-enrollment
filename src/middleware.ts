import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const AUTH_PATHS = ["/login"];
const ADMIN_PATHS = ["/admin"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isAdminRoute = ADMIN_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  if (!accessToken && !refreshToken) {
    const url = new URL("/login", request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
