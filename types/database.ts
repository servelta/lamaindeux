export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      admin_actions: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          notes: string | null
          target_id: string
          target_table: string
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          notes?: string | null
          target_id: string
          target_table: string
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          target_id?: string
          target_table?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_actions_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      availability: {
        Row: {
          created_at: string
          end_time: string
          id: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Insert: {
          created_at?: string
          end_time: string
          id?: string
          professional_id: string
          start_time: string
          weekday: number
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          professional_id?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "availability_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "availability_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      availability_exceptions: {
        Row: {
          created_at: string
          date: string
          end_time: string | null
          id: string
          professional_id: string
          reason: string | null
          start_time: string | null
        }
        Insert: {
          created_at?: string
          date: string
          end_time?: string | null
          id?: string
          professional_id: string
          reason?: string | null
          start_time?: string | null
        }
        Update: {
          created_at?: string
          date?: string
          end_time?: string | null
          id?: string
          professional_id?: string
          reason?: string | null
          start_time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "availability_exceptions_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      bookings: {
        Row: {
          address_line: string
          booking_number: string
          cancelled_at: string | null
          cancelled_reason: string | null
          city: string
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone: string
          created_at: string
          customer_id: string
          description: string | null
          id: string
          is_quote_request: boolean
          photo_urls: string[]
          plumber_service_id: string
          postcode: string
          price_cents: number | null
          professional_id: string
          reminder_sent_at: string | null
          scheduled_date: string
          scheduled_time: string
          status: Database["public"]["Enums"]["booking_status"]
          updated_at: string
        }
        Insert: {
          address_line: string
          booking_number?: string
          cancelled_at?: string | null
          cancelled_reason?: string | null
          city: string
          contact_email: string
          contact_first_name: string
          contact_last_name: string
          contact_phone: string
          created_at?: string
          customer_id: string
          description?: string | null
          id?: string
          is_quote_request?: boolean
          photo_urls?: string[]
          plumber_service_id: string
          postcode: string
          price_cents?: number | null
          professional_id: string
          reminder_sent_at?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Update: {
          address_line?: string
          booking_number?: string
          cancelled_at?: string | null
          cancelled_reason?: string | null
          city?: string
          contact_email?: string
          contact_first_name?: string
          contact_last_name?: string
          contact_phone?: string
          created_at?: string
          customer_id?: string
          description?: string | null
          id?: string
          is_quote_request?: boolean
          photo_urls?: string[]
          plumber_service_id?: string
          postcode?: string
          price_cents?: number | null
          professional_id?: string
          reminder_sent_at?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bookings_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bookings_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "bookings_plumber_service_id_fkey"
            columns: ["plumber_service_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["professional_service_id"]
          },
          {
            foreignKeyName: "bookings_plumber_service_id_fkey"
            columns: ["plumber_service_id"]
            isOneToOne: false
            referencedRelation: "professional_services"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          postcode_prefixes: string[]
          slug: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          postcode_prefixes?: string[]
          slug: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          postcode_prefixes?: string[]
          slug?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          document_url: string | null
          id: string
          professional_id: string
          signed_at: string | null
          version: string
        }
        Insert: {
          created_at?: string
          document_url?: string | null
          id?: string
          professional_id: string
          signed_at?: string | null
          version?: string
        }
        Update: {
          created_at?: string
          document_url?: string | null
          id?: string
          professional_id?: string
          signed_at?: string | null
          version?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "contracts_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string
          profile_id: string
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          profile_id: string
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          profile_id?: string
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          booking_id: string
          created_at: string
          id: string
          sender_id: string
        }
        Insert: {
          body: string
          booking_id: string
          created_at?: string
          id?: string
          sender_id: string
        }
        Update: {
          body?: string
          booking_id?: string
          created_at?: string
          id?: string
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          read_at: string | null
          related_booking_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          related_booking_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          read_at?: string | null
          related_booking_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_related_booking_id_fkey"
            columns: ["related_booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_settings: {
        Row: {
          cancellation_policy: string | null
          default_subscription_price_cents: number
          email_enabled: boolean
          id: boolean
          logo_url: string | null
          platform_name: string
          sms_enabled: boolean
          stripe_payment_link_url: string | null
          support_email: string
          updated_at: string
        }
        Insert: {
          cancellation_policy?: string | null
          default_subscription_price_cents?: number
          email_enabled?: boolean
          id?: boolean
          logo_url?: string | null
          platform_name?: string
          sms_enabled?: boolean
          stripe_payment_link_url?: string | null
          support_email?: string
          updated_at?: string
        }
        Update: {
          cancellation_policy?: string | null
          default_subscription_price_cents?: number
          email_enabled?: boolean
          id?: boolean
          logo_url?: string | null
          platform_name?: string
          sms_enabled?: boolean
          stripe_payment_link_url?: string | null
          support_email?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_documents: {
        Row: {
          doc_type: Database["public"]["Enums"]["document_type"]
          id: string
          professional_id: string
          storage_path: string
          uploaded_at: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          doc_type: Database["public"]["Enums"]["document_type"]
          id?: string
          professional_id: string
          storage_path: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          doc_type?: Database["public"]["Enums"]["document_type"]
          id?: string
          professional_id?: string
          storage_path?: string
          uploaded_at?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plumber_documents_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "plumber_documents_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "plumber_documents_verified_by_fkey"
            columns: ["verified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      professional_service_areas: {
        Row: {
          city_id: string
          created_at: string
          id: string
          postcodes: string[]
          professional_id: string
        }
        Insert: {
          city_id: string
          created_at?: string
          id?: string
          postcodes?: string[]
          professional_id: string
        }
        Update: {
          city_id?: string
          created_at?: string
          id?: string
          postcodes?: string[]
          professional_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plumber_service_areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plumber_service_areas_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "plumber_service_areas_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      professional_services: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          price_cents: number | null
          pricing_type: Database["public"]["Enums"]["pricing_type"]
          professional_id: string
          service_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          price_cents?: number | null
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          professional_id: string
          service_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          price_cents?: number | null
          pricing_type?: Database["public"]["Enums"]["pricing_type"]
          professional_id?: string
          service_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plumber_services_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "plumber_services_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "plumber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      professionals: {
        Row: {
          business_address: string | null
          business_city: string | null
          business_postcode: string | null
          company_name: string
          completed_jobs_count: number
          contract_signed_at: string | null
          contract_status: Database["public"]["Enums"]["contract_status"]
          created_at: string
          description: string | null
          payment_date: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          profile_id: string
          rating_avg: number
          rating_count: number
          siren: string | null
          siret: string | null
          slug: string
          status: Database["public"]["Enums"]["professional_status"]
          status_reason: string | null
          stripe_payment_link_url: string | null
          subscription_end: string | null
          subscription_start: string | null
          trade_id: string
          updated_at: string
          website: string | null
          years_experience: number | null
        }
        Insert: {
          business_address?: string | null
          business_city?: string | null
          business_postcode?: string | null
          company_name: string
          completed_jobs_count?: number
          contract_signed_at?: string | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string
          description?: string | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          profile_id: string
          rating_avg?: number
          rating_count?: number
          siren?: string | null
          siret?: string | null
          slug: string
          status?: Database["public"]["Enums"]["professional_status"]
          status_reason?: string | null
          stripe_payment_link_url?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          trade_id: string
          updated_at?: string
          website?: string | null
          years_experience?: number | null
        }
        Update: {
          business_address?: string | null
          business_city?: string | null
          business_postcode?: string | null
          company_name?: string
          completed_jobs_count?: number
          contract_signed_at?: string | null
          contract_status?: Database["public"]["Enums"]["contract_status"]
          created_at?: string
          description?: string | null
          payment_date?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          profile_id?: string
          rating_avg?: number
          rating_count?: number
          siren?: string | null
          siret?: string | null
          slug?: string
          status?: Database["public"]["Enums"]["professional_status"]
          status_reason?: string | null
          stripe_payment_link_url?: string | null
          subscription_end?: string | null
          subscription_start?: string | null
          trade_id?: string
          updated_at?: string
          website?: string | null
          years_experience?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "plumbers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          first_name: string
          id: string
          last_name: string
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          first_name: string
          id: string
          last_name: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          count: number
          key: string
          window_start: string
        }
        Insert: {
          count?: number
          key: string
          window_start?: string
        }
        Update: {
          count?: number
          key?: string
          window_start?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string
          comment: string | null
          created_at: string
          customer_id: string
          hidden_by_admin: boolean
          id: string
          moderated_at: string | null
          professional_id: string
          rating: number
        }
        Insert: {
          booking_id: string
          comment?: string | null
          created_at?: string
          customer_id: string
          hidden_by_admin?: boolean
          id?: string
          moderated_at?: string | null
          professional_id: string
          rating: number
        }
        Update: {
          booking_id?: string
          comment?: string | null
          created_at?: string
          customer_id?: string
          hidden_by_admin?: boolean
          id?: string
          moderated_at?: string | null
          professional_id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reviews_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "reviews_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      services: {
        Row: {
          active: boolean
          category: string | null
          created_at: string
          default_pricing_type: Database["public"]["Enums"]["pricing_type"]
          description: string | null
          id: string
          name: string
          slug: string
          sort_order: number
          trade_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          category?: string | null
          created_at?: string
          default_pricing_type?: Database["public"]["Enums"]["pricing_type"]
          description?: string | null
          id?: string
          name: string
          slug: string
          sort_order?: number
          trade_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          category?: string | null
          created_at?: string
          default_pricing_type?: Database["public"]["Enums"]["pricing_type"]
          description?: string | null
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          trade_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          amount_cents: number
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          professional_id: string
          status: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          professional_id: string
          status?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          professional_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "active_professionals"
            referencedColumns: ["profile_id"]
          },
          {
            foreignKeyName: "subscriptions_plumber_id_fkey"
            columns: ["professional_id"]
            isOneToOne: false
            referencedRelation: "professionals"
            referencedColumns: ["profile_id"]
          },
        ]
      }
      trades: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          name: string
          name_singular: string
          slug_plural: string
          slug_singular: string
          sort_order: number
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name: string
          name_singular: string
          slug_plural: string
          slug_singular: string
          sort_order?: number
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
          name_singular?: string
          slug_plural?: string
          slug_singular?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      active_professionals: {
        Row: {
          avatar_url: string | null
          business_city: string | null
          city_id: string | null
          city_name: string | null
          city_slug: string | null
          company_name: string | null
          completed_jobs_count: number | null
          description: string | null
          duration_minutes: number | null
          first_name: string | null
          last_name: string | null
          postcodes: string[] | null
          price_cents: number | null
          pricing_type: Database["public"]["Enums"]["pricing_type"] | null
          professional_service_id: string | null
          profile_id: string | null
          rating_avg: number | null
          rating_count: number | null
          service_id: string | null
          service_name: string | null
          service_slug: string | null
          slug: string | null
          trade_id: string | null
          trade_name_singular: string | null
          trade_slug_plural: string | null
          trade_slug_singular: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plumber_service_areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plumber_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plumbers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "professionals_trade_id_fkey"
            columns: ["trade_id"]
            isOneToOne: false
            referencedRelation: "trades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      anonymize_own_professional_account: {
        Args: { p_professional_id: string }
        Returns: undefined
      }
      auth_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      check_rate_limit: {
        Args: { p_key: string; p_limit: number; p_window_seconds: number }
        Returns: boolean
      }
      generate_booking_number: { Args: never; Returns: string }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      booking_status:
        | "PENDING"
        | "CONFIRMED"
        | "ACCEPTED"
        | "COMPLETED"
        | "CANCELLED_BY_CUSTOMER"
        | "CANCELLED_BY_PROFESSIONAL"
        | "NO_SHOW"
        | "DISPUTED"
      contract_status: "not_signed" | "signed"
      document_type: "identity" | "qualification" | "insurance" | "other"
      payment_status: "not_received" | "received"
      pricing_type: "fixed" | "quote"
      professional_status:
        | "PENDING"
        | "UNDER_REVIEW"
        | "APPROVED"
        | "ACTIVE"
        | "SUSPENDED"
        | "REJECTED"
      user_role: "customer" | "professional" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      booking_status: [
        "PENDING",
        "CONFIRMED",
        "ACCEPTED",
        "COMPLETED",
        "CANCELLED_BY_CUSTOMER",
        "CANCELLED_BY_PROFESSIONAL",
        "NO_SHOW",
        "DISPUTED",
      ],
      contract_status: ["not_signed", "signed"],
      document_type: ["identity", "qualification", "insurance", "other"],
      payment_status: ["not_received", "received"],
      pricing_type: ["fixed", "quote"],
      professional_status: [
        "PENDING",
        "UNDER_REVIEW",
        "APPROVED",
        "ACTIVE",
        "SUSPENDED",
        "REJECTED",
      ],
      user_role: ["customer", "professional", "admin"],
    },
  },
} as const
