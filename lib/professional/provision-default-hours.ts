// Server only: initialize once, then respect the artisan's calendar edits.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const FLAG = "le_plan_b_default_hours_v1";
const BACKUP = "le_plan_b_previous_hours_v1";
export const defaultWorkingHours = Array.from({ length: 7 }, (_, weekday) => ({
  weekday, start_time: "10:00", end_time: "20:00",
}));

export async function provisionDefaultHours(client: SupabaseClient<Database>, professionalId?: string) {
  let initialized = 0;
  let skipped = 0;
  for (let offset = 0; ; offset += 100) {
    let query = client.from("professionals").select("profile_id").order("profile_id").range(offset, offset + 99);
    if (professionalId) query = query.eq("profile_id", professionalId);
    const { data: professionals, error } = await query;
    if (error) throw new Error("Unable to read artisan calendars.");
    for (const professional of professionals ?? []) {
      const id = professional.profile_id;
      const { data, error: userError } = await client.auth.admin.getUserById(id);
      if (userError || !data.user) throw new Error("Unable to read calendar initialization status.");
      const metadata = data.user.app_metadata;
      if (metadata[FLAG] === true) { skipped++; continue; }
      const { data: previous, error: readError } = await client.from("availability")
        .select("weekday,start_time,end_time").eq("professional_id", id);
      if (readError) throw new Error("Unable to back up previous working hours.");
      const backupMetadata = { ...metadata, [BACKUP]: metadata[BACKUP] ?? previous ?? [] };
      const { error: backupError } = await client.auth.admin.updateUserById(id, { app_metadata: backupMetadata });
      if (backupError) throw new Error("Unable to preserve previous working hours.");
      const { error: deleteError } = await client.from("availability").delete().eq("professional_id", id);
      if (deleteError) throw new Error("Unable to initialize working hours.");
      const { error: insertError } = await client.from("availability").insert(
        defaultWorkingHours.map(slot => ({ ...slot, professional_id: id })),
      );
      if (insertError) {
        if (previous?.length) {
          const { error: restoreError } = await client.from("availability").insert(previous.map(slot => ({ ...slot, professional_id: id })));
          if (restoreError) throw new Error("Calendar restoration failed; private backup retained.");
        }
        throw new Error("Unable to save default working hours; previous hours restored.");
      }
      const { error: flagError } = await client.auth.admin.updateUserById(id, {
        app_metadata: { ...backupMetadata, [FLAG]: true },
      });
      if (flagError) throw new Error("Unable to mark working hours initialized.");
      initialized++;
    }
    if (!professionals || professionals.length < 100) break;
  }
  return { initialized, skipped };
}
