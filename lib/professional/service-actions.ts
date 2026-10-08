"use server";
import { requireUserId } from "@/lib/professional/queries";
import type { ActionResult } from "@/lib/professional/profile-actions";
export type { ActionResult };
const managedServicesError = { error: "Vos deux services sont attribués et gérés automatiquement par LaMain2. Ils ne peuvent pas être modifiés depuis votre compte." };
export async function addProfessionalServiceAction(_previous: ActionResult, _form: FormData): Promise<ActionResult> { await requireUserId(); return managedServicesError; }
export async function toggleProfessionalServiceAction(_id: string, _active: boolean) { await requireUserId(); return managedServicesError; }
export async function deleteProfessionalServiceAction(_id: string) { await requireUserId(); return managedServicesError; }
