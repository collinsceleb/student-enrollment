import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

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

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  const isAdminRoute =
    pathname === "/admin" || pathname.startsWith("/admin/");

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  if (!hasSupabaseAuthSession(request.cookies.getAll())) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = createServerClient(supabaseUrl, publishableKey!, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: ["/admin/:path*"],
};
