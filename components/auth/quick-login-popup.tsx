"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { homeForRole } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const DEFAULT_EMAIL = process.env.NEXT_PUBLIC_DEMO_LOGIN_EMAIL || "";
const DEFAULT_PASSWORD = process.env.NEXT_PUBLIC_DEMO_LOGIN_PASSWORD || "";

export function QuickLoginPopup() {
  const router = useRouter();
  const [open, setOpen] = useState(true);
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState(DEFAULT_PASSWORD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (DEFAULT_EMAIL && DEFAULT_PASSWORD) {
      void handleQuickLogin(DEFAULT_EMAIL, DEFAULT_PASSWORD);
    }
  }, []);

  async function handleQuickLogin(loginEmail: string, loginPassword: string) {
    if (!loginEmail || !loginPassword) {
      setOpen(true);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const supabase = createClient();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      });

      if (signInError || !data.user) {
        setError("Identifiants invalides. Vérifiez l’e-mail et le mot de passe.");
        setOpen(true);
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const destination = profileError ? "/mon-compte" : homeForRole(profile?.role ?? "customer");
      router.push(destination);
      router.refresh();
    } catch {
      setError("Connexion rapide impossible. Vérifiez la configuration du compte.");
      setOpen(true);
    } finally {
      setLoading(false);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Connexion rapide</p>
            <h2 className="mt-1 text-2xl font-semibold">Revenir dans votre compte</h2>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-full border border-border px-2 py-1 text-sm text-muted-foreground hover:bg-secondary"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>

        <p className="mb-4 text-sm text-muted-foreground">
          Connectez-vous avec vos identifiants enregistrés. Si vous avez déjà un compte, le bouton ci-dessous vous reconnecte directement.
        </p>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="quick-email">E-mail</Label>
            <Input
              id="quick-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="quick-password">Mot de passe</Label>
            <Input
              id="quick-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setOpen(false)}
            >
              Plus tard
            </Button>
            <Button
              type="button"
              className="flex-1"
              disabled={loading}
              onClick={() => handleQuickLogin(email, password)}
            >
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
