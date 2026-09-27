import { NextResponse, NextRequest } from "next/server";

const ADMIN_PATHS = ["/admin", "/admin/:path*"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isAdminRoute = ADMIN_PATHS.some(
    (pattern) =>
      pattern === "/admin" && pathname === "/admin" ||
      pattern === "/admin/:path*" && (pathname === "/admin" || pathname.startsWith("/admin/"))
  );

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const accessToken = request.cookies.get("sb-access-token")?.value;
  const refreshToken = request.cookies.get("sb-refresh-token")?.value;

  if (!accessToken && !refreshToken) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
