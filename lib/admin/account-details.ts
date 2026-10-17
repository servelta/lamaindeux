"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/admin/queries";
import { createAdminClient } from "@/lib/supabase/server";

export async function getAdminAccountDetails(accountId: string) {
  // The service role lookup must only run after a fresh admin role check.
  await requireAdmin();
  if (!z.string().uuid().safeParse(accountId).success) return null;

  const { data, error } = await createAdminClient().auth.admin.getUserById(accountId);
  if (error || !data.user) return null;

  const user = data.user;
  const isGuest = user.app_metadata.booking_guest === true;
  // Return only display fields, never tokens, identities or arbitrary metadata.
  return {
    email: isGuest ? null : user.email ?? null,
    contactEmail: typeof user.app_metadata.professional_contact_email === "string"
      ? user.app_metadata.professional_contact_email : null,
    createdAt: user.created_at,
    lastSignInAt: isGuest ? null : user.last_sign_in_at ?? null,
    emailConfirmed: !isGuest && !!user.email_confirmed_at,
    isGuest,
  };
}

export type AdminAccountDetails = Awaited<ReturnType<typeof getAdminAccountDetails>>;
