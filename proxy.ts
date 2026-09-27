import { NextResponse, NextRequest } from "next/server";

const ADMIN_PATHS = ["/admin", "/admin/:path*"];

export function hasSupabaseAuthSession(
  cookies: Array<{ name: string; value?: string | null }>
) {
  return cookies.some(({ name, value }) => {
    const normalizedName = name.toLowerCase();
    const hasSessionValue = Boolean(value);
    const isAuthCookie =
      normalizedName === "sb-access-token" ||
      normalizedName === "sb-refresh-token" ||
      /-auth-token(?:\.\d+)?$/.test(normalizedName) ||
      /-refresh-token(?:\.\d+)?$/.test(normalizedName);

    return hasSessionValue && isAuthCookie;
  });
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isAdminRoute = ADMIN_PATHS.some(
    (pattern) =>
      (pattern === "/admin" && pathname === "/admin") ||
      (pattern === "/admin/:path*" &&
        (pathname === "/admin" || pathname.startsWith("/admin/")))
  );

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  // The proxy only enforces an authenticated session. Role checks happen in the
  // actual admin page, where we can resolve the profile and redirect faculty admins
  // to the faculty dashboard or the super admin to the admin console.
  if (!hasSupabaseAuthSession(request.cookies.getAll())) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
