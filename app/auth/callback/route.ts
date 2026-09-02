import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const next = requestUrl.searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const destination = next?.startsWith("/") ? next : "/reinitialiser-mot-de-passe";
      return NextResponse.redirect(new URL(destination, requestUrl.origin));
    }
  }

  const loginUrl = new URL("/connexion", requestUrl.origin);
  loginUrl.searchParams.set("error", "Le lien de récupération est invalide ou a expiré.");
  return NextResponse.redirect(loginUrl);
}