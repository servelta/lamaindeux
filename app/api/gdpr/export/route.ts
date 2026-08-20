import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Right to data portability (Section 32). Returns everything the platform
 * holds that's tied to the requesting user's own account — nothing about
 * other users, regardless of role. Protected purely by the caller's own
 * session (RLS also independently restricts every query below to rows the
 * caller owns), so there's no separate authorization check needed beyond
 * "is someone logged in".
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  const exportData: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    account: {
      email: user.email,
      created_at: user.created_at,
      ...profile,
    },
  };

  if (profile?.role === "customer") {
    const { data: bookings } = await supabase
      .from("bookings")
      .select("booking_number, status, scheduled_date, scheduled_time, address_line, postcode, city, description, price_cents, created_at")
      .eq("customer_id", user.id);
    const { data: reviews } = await supabase
      .from("reviews")
      .select("rating, comment, created_at")
      .eq("customer_id", user.id);
    exportData.bookings = bookings ?? [];
    exportData.reviews = reviews ?? [];
  }

  if (profile?.role === "professional") {
    const { data: professional } = await supabase.from("professionals").select("*").eq("profile_id", user.id).single();
    const { data: services } = await supabase.from("professional_services").select("*").eq("professional_id", user.id);
    const { data: bookings } = await supabase
      .from("bookings")
      .select("booking_number, status, scheduled_date, scheduled_time, city, price_cents, created_at")
      .eq("professional_id", user.id);
    exportData.professional_profile = professional;
    exportData.services = services ?? [];
    exportData.bookings = bookings ?? [];
  }

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="lamaindeux-mes-donnees-${user.id.slice(0, 8)}.json"`,
    },
  });
}
