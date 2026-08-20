import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { findRouteRule } from "@/lib/auth/roles";

export async function middleware(request: NextRequest) {
  const { supabaseResponse, user, supabase } = await updateSession(request);
  const { pathname } = request.nextUrl;

  const rule = findRouteRule(pathname);
  if (!rule) {
    // Public route (homepage, search, professional profiles, auth pages, etc.)
    return supabaseResponse;
  }

  // Every route under a protected prefix requires a logged-in user.
  if (!user) {
    const redirectUrl = new URL("/connexion", request.url);
    redirectUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(redirectUrl);
  }

  // Look up the user's role from `profiles`. This is a small, indexed
  // table read on every request to a protected route — acceptable for
  // MVP scale; revisit with custom JWT claims if this becomes a bottleneck.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !rule.roles.includes(profile.role)) {
    // Authenticated, but wrong role for this area of the app.
    // Redirect home rather than leaking that the route exists.
    return NextResponse.redirect(new URL("/", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static, _next/image (Next internals)
     * - favicon.ico, images, fonts
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
