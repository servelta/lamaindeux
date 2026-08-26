"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";

export type ActionResult = { error?: string; success?: string } | void;

/**
 * Right to erasure (Section 32). Two paths, depending on whether the
 * account has booking history:
 *
 * - No bookings at all: hard-delete the auth user. `profiles`/`customers`/
 *   `professionals` cascade-delete automatically (FK ON DELETE CASCADE from
 *   Phase 1's schema).
 *
 * - Has bookings: bookings.customer_id/professional_id are ON DELETE RESTRICT
 *   by design (a booking must keep referring to *someone*, since the other
 *   party's own booking history depends on it existing). Hard-deleting
 *   would either fail outright or silently destroy the other party's
 *   records. Instead: scrub personally-identifying fields on the profile,
 *   and ban the auth account so it can never log in again. The bookings
 *   themselves already store their own contact-info snapshot independent
 *   of the profile (see Phase 4's schema), so this doesn't erase the other
 *   party's legitimate transaction records — only this user's ongoing
 *   identity.
 */
export async function deleteMyAccountAction(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Vous devez être connecté." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile) return { error: "Profil introuvable." };

  const admin = createAdminClient();

  if (profile.role === "customer") {
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", user.id);

    if (!count) {
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) return { error: "Impossible de supprimer le compte." };
      return { success: "Votre compte a été supprimé." };
    }

    await supabase
      .from("profiles")
      .update({ first_name: "Compte supprimé", last_name: "", phone: null, avatar_url: null })
      .eq("id", user.id);
    await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
    await supabase.auth.signOut();
    return {
      success:
        "Votre compte a été supprimé. Vos réservations passées sont conservées de façon anonymisée pour l'historique du professionnel concerné.",
    };
  }

  if (profile.role === "professional") {
    const { count } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", user.id)
      .in("status", ["PENDING", "CONFIRMED", "ACCEPTED"]);

    if (count) {
      return {
        error:
          "Vous avez des réservations en cours. Merci de les terminer ou de les annuler avant de supprimer votre compte.",
      };
    }

    const { count: totalBookings } = await supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("professional_id", user.id);

    if (!totalBookings) {
      const { error } = await admin.auth.admin.deleteUser(user.id);
      if (error) return { error: "Impossible de supprimer le compte." };
      return { success: "Votre compte a été supprimé." };
    }

    await supabase.rpc("anonymize_own_professional_account", { p_professional_id: user.id });
    await supabase
      .from("profiles")
      .update({ first_name: "Compte supprimé", last_name: "", phone: null, avatar_url: null })
      .eq("id", user.id);
    await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
    await supabase.auth.signOut();
    return {
      success:
        "Votre compte a été supprimé et votre profil retiré des résultats de recherche. Votre historique de réservations est conservé de façon anonymisée.",
    };
  }

  return { error: "Type de compte non pris en charge pour cette action." };
}
