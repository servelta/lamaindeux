// This file is a hand-written placeholder for Phase 1.
// Once the Supabase project exists, regenerate the real types with:
//   npm run db:types
// (requires SUPABASE_PROJECT_ID env var and the Supabase CLI logged in)
// and replace this file entirely — do not hand-edit generated types.

export type Database = {
  public: {
    Tables: Record<string, { Row: any; Insert: any; Update: any }>;
    Views: Record<string, { Row: any }>;
    Enums: {
      user_role: "customer" | "professional" | "admin";
      professional_status:
        | "PENDING"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "ACTIVE"
        | "SUSPENDED"
        | "REJECTED";
      booking_status:
        | "PENDING"
        | "CONFIRMED"
        | "ACCEPTED"
        | "COMPLETED"
        | "CANCELLED_BY_CUSTOMER"
        | "CANCELLED_BY_PROFESSIONAL"
        | "NO_SHOW"
        | "DISPUTED";
      pricing_type: "fixed" | "quote";
    };
  };
};
