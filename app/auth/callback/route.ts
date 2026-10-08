import { safeReturnTo } from "@/lib/auth/safe-return-to";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = safeReturnTo(requestUrl.searchParams.get("next"));

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = next ?? "/reinitialiser-mot-de-passe";
      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }
  }

  const loginUrl = new URL("/connexion", requestUrl.origin);
  if (next) loginUrl.searchParams.set("next", next);
  loginUrl.searchParams.set("error", "Le lien de confirmation est invalide ou a expiré.");
  return NextResponse.redirect(loginUrl);
}