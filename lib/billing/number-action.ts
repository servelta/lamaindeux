"use server";
import { createHash } from "node:crypto";
import { z } from "zod";
import { requireUserId, getOwnProfessional } from "@/lib/professional/queries";
import { createClient } from "@/lib/supabase/server";
import { billingSchema } from "./model";
export async function allocateBillingNumberAction(
  requestId: string,
  document: unknown,
): Promise<{ number: string } | { error: string }> {
  const owner = await requireUserId();
  const professional = await getOwnProfessional(owner);
  if (!professional || professional.status === "SUSPENDED")
    return { error: "Accès réservé aux artisans." };
  if (
    !z.string().uuid().safeParse(requestId).success ||
    !document ||
    typeof document !== "object"
  )
    return { error: "Document invalide." };
  const parsed = billingSchema.safeParse({ ...document, number: "AUTO" });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Vérifiez le document.",
    };
  const { number: _number, ...content } = parsed.data;
  const year = Number(content.issuedOn.slice(0, 4));
  if (year < 2000 || year > 9999)
    return { error: "Choisissez une date du document à partir de 2000." };
  const client = await createClient();
  const { data, error } = await client.rpc("allocate_billing_number", {
    p_request_id: requestId,
    p_kind: content.kind,
    p_year: year,
    p_payload_hash: createHash("sha256")
      .update(JSON.stringify(content))
      .digest("hex"),
  });
  if (
    error ||
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    typeof data.number !== "string"
  )
    return {
      error:
        "Impossible d’attribuer un numéro. Réessayez sans modifier le document.",
    };
  return { number: data.number };
}
