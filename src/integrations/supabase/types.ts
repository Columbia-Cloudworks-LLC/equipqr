export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      billing_events: {
        Row: {
          amount_change: number | null
          created_at: string
          effective_date: string
          event_data: Json | null
          event_type: string
          id: string
          organization_id: string
          processed: boolean | null
          user_id: string | null
        }
        Insert: {
          amount_change?: number | null
          created_at?: string
          effective_date?: string
          event_data?: Json | null
          event_type: string
          id?: string
          organization_id: string
          processed?: boolean | null
          user_id?: string | null
        }
        Update: {
          amount_change?: number | null
          created_at?: string
          effective_date?: string
          event_data?: Json | null
          event_type?: string
          id?: string
          organization_id?: string
          processed?: boolean | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_events_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_usage: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string
          id: string
          organization_id: string | null
          usage_type: string
          usage_value: number
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          id?: string
          organization_id?: string | null
          usage_type: string
          usage_value: number
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          id?: string
          organization_id?: string | null
          usage_type?: string
          usage_value?: number
        }
        Relationships: [
          {
            foreignKeyName: "billing_usage_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string
          custom_attributes: Json | null
          id: string
          image_url: string | null
          installation_date: string
          last_known_location: Json | null
          last_maintenance: string | null
          location: string
          manufacturer: string
          model: string
          name: string
          notes: string | null
          organization_id: string
          serial_number: string
          status: Database["public"]["Enums"]["equipment_status"]
          team_id: string | null
          updated_at: string
          warranty_expiration: string | null
        }
        Insert: {
          created_at?: string
          custom_attributes?: Json | null
          id?: string
          image_url?: string | null
          installation_date: string
          last_known_location?: Json | null
          last_maintenance?: string | null
          location: string
          manufacturer: string
          model: string
          name: string
          notes?: string | null
          organization_id: string
          serial_number: string
          status?: Database["public"]["Enums"]["equipment_status"]
          team_id?: string | null
          updated_at?: string
          warranty_expiration?: string | null
        }
        Update: {
          created_at?: string
          custom_attributes?: Json | null
          id?: string
          image_url?: string | null
          installation_date?: string
          last_known_location?: Json | null
          last_maintenance?: string | null
          location?: string
          manufacturer?: string
          model?: string
          name?: string
          notes?: string | null
          organization_id?: string
          serial_number?: string
          status?: Database["public"]["Enums"]["equipment_status"]
          team_id?: string | null
          updated_at?: string
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_note_images: {
        Row: {
          created_at: string
          description: string | null
          equipment_note_id: string
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          uploaded_by: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          equipment_note_id: string
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          uploaded_by: string
        }
        Update: {
          created_at?: string
          description?: string | null
          equipment_note_id?: string
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_note_images_equipment_note_id_fkey"
            columns: ["equipment_note_id"]
            isOneToOne: false
            referencedRelation: "equipment_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_note_images_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          equipment_id: string
          hours_worked: number | null
          id: string
          is_private: boolean
          last_modified_at: string | null
          last_modified_by: string | null
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          equipment_id: string
          hours_worked?: number | null
          id?: string
          is_private?: boolean
          last_modified_at?: string | null
          last_modified_by?: string | null
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          equipment_id?: string
          hours_worked?: number | null
          id?: string
          is_private?: boolean
          last_modified_at?: string | null
          last_modified_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_notes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_notes_last_modified_by_fkey"
            columns: ["last_modified_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_performance_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          execution_time_ms: number
          function_name: string
          id: string
          success: boolean
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms: number
          function_name: string
          id?: string
          success: boolean
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number
          function_name?: string
          id?: string
          success?: boolean
        }
        Relationships: []
      }
      notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          equipment_id: string
          id: string
          is_private: boolean
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          equipment_id: string
          id?: string
          is_private?: boolean
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          equipment_id?: string
          id?: string
          is_private?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          created_at: string
          email_billing: boolean | null
          email_equipment_alerts: boolean | null
          email_invitations: boolean | null
          email_work_orders: boolean | null
          id: string
          push_notifications: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_billing?: boolean | null
          email_equipment_alerts?: boolean | null
          email_invitations?: boolean | null
          email_work_orders?: boolean | null
          id?: string
          push_notifications?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_billing?: boolean | null
          email_equipment_alerts?: boolean | null
          email_invitations?: boolean | null
          email_work_orders?: boolean | null
          id?: string
          push_notifications?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
          organization_id: string
          read: boolean
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json | null
          id?: string
          message: string
          organization_id: string
          read?: boolean
          title: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json | null
          id?: string
          message?: string
          organization_id?: string
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          accepted_by: string | null
          created_at: string
          declined_at: string | null
          email: string
          expired_at: string | null
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          message: string | null
          organization_id: string
          role: string
          slot_purchase_id: string | null
          slot_reserved: boolean | null
          status: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          declined_at?: string | null
          email: string
          expired_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by: string
          message?: string | null
          organization_id: string
          role: string
          slot_purchase_id?: string | null
          slot_reserved?: boolean | null
          status?: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          accepted_by?: string | null
          created_at?: string
          declined_at?: string | null
          email?: string
          expired_at?: string | null
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          message?: string | null
          organization_id?: string
          role?: string
          slot_purchase_id?: string | null
          slot_reserved?: boolean | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_accepted_by_fkey"
            columns: ["accepted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_invitations_slot_purchase_id_fkey"
            columns: ["slot_purchase_id"]
            isOneToOne: false
            referencedRelation: "slot_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          activated_slot_at: string | null
          id: string
          joined_date: string
          organization_id: string
          role: string
          slot_purchase_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          activated_slot_at?: string | null
          id?: string
          joined_date?: string
          organization_id: string
          role?: string
          slot_purchase_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          activated_slot_at?: string | null
          id?: string
          joined_date?: string
          organization_id?: string
          role?: string
          slot_purchase_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_slot_purchase_id_fkey"
            columns: ["slot_purchase_id"]
            isOneToOne: false
            referencedRelation: "slot_purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_slots: {
        Row: {
          amount_paid_cents: number
          auto_renew: boolean | null
          billing_period_end: string
          billing_period_start: string
          created_at: string
          id: string
          organization_id: string
          purchased_slots: number
          slot_type: string
          stripe_payment_intent_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          used_slots: number
        }
        Insert: {
          amount_paid_cents?: number
          auto_renew?: boolean | null
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          id?: string
          organization_id: string
          purchased_slots?: number
          slot_type?: string
          stripe_payment_intent_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          used_slots?: number
        }
        Update: {
          amount_paid_cents?: number
          auto_renew?: boolean | null
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          id?: string
          organization_id?: string
          purchased_slots?: number
          slot_type?: string
          stripe_payment_intent_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          used_slots?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_slots_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          billing_cycle: string
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          feature_type: string
          id: string
          organization_id: string | null
          quantity: number | null
          status: string
          stripe_subscription_id: string | null
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          feature_type: string
          id?: string
          organization_id?: string | null
          quantity?: number | null
          status?: string
          stripe_subscription_id?: string | null
          unit_price_cents: number
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          feature_type?: string
          id?: string
          organization_id?: string | null
          quantity?: number | null
          status?: string
          stripe_subscription_id?: string | null
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billable_members: number | null
          billing_cycle: string | null
          created_at: string
          features: string[]
          fleet_map_enabled: boolean | null
          id: string
          last_billing_calculation: string | null
          max_members: number
          member_count: number
          name: string
          next_billing_date: string | null
          plan: Database["public"]["Enums"]["organization_plan"]
          storage_used_mb: number | null
          updated_at: string
        }
        Insert: {
          billable_members?: number | null
          billing_cycle?: string | null
          created_at?: string
          features?: string[]
          fleet_map_enabled?: boolean | null
          id?: string
          last_billing_calculation?: string | null
          max_members?: number
          member_count?: number
          name: string
          next_billing_date?: string | null
          plan?: Database["public"]["Enums"]["organization_plan"]
          storage_used_mb?: number | null
          updated_at?: string
        }
        Update: {
          billable_members?: number | null
          billing_cycle?: string | null
          created_at?: string
          features?: string[]
          fleet_map_enabled?: boolean | null
          id?: string
          last_billing_calculation?: string | null
          max_members?: number
          member_count?: number
          name?: string
          next_billing_date?: string | null
          plan?: Database["public"]["Enums"]["organization_plan"]
          storage_used_mb?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      pm_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          created_at: string
          id: string
          metadata: Json | null
          new_status: string
          old_status: string | null
          pm_id: string
          reason: string | null
        }
        Insert: {
          changed_at?: string
          changed_by: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status: string
          old_status?: string | null
          pm_id: string
          reason?: string | null
        }
        Update: {
          changed_at?: string
          changed_by?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: string
          old_status?: string | null
          pm_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_status_history_pm_id_fkey"
            columns: ["pm_id"]
            isOneToOne: false
            referencedRelation: "preventative_maintenance"
            referencedColumns: ["id"]
          },
        ]
      }
      preventative_maintenance: {
        Row: {
          checklist_data: Json
          completed_at: string | null
          completed_by: string | null
          created_at: string
          created_by: string
          equipment_id: string
          id: string
          notes: string | null
          organization_id: string
          status: string
          updated_at: string
          work_order_id: string
        }
        Insert: {
          checklist_data?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by: string
          equipment_id: string
          id?: string
          notes?: string | null
          organization_id: string
          status?: string
          updated_at?: string
          work_order_id: string
        }
        Update: {
          checklist_data?: Json
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          created_by?: string
          equipment_id?: string
          id?: string
          notes?: string | null
          organization_id?: string
          status?: string
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_pm_equipment"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pm_organization"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_pm_work_order"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      scans: {
        Row: {
          equipment_id: string
          id: string
          location: string | null
          notes: string | null
          scanned_at: string
          scanned_by: string
        }
        Insert: {
          equipment_id: string
          id?: string
          location?: string | null
          notes?: string | null
          scanned_at?: string
          scanned_by: string
        }
        Update: {
          equipment_id?: string
          id?: string
          location?: string | null
          notes?: string | null
          scanned_at?: string
          scanned_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "scans_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scans_scanned_by_fkey"
            columns: ["scanned_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      slot_purchases: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string
          id: string
          organization_id: string
          purchased_by: string
          quantity: number
          slot_type: string
          status: string
          stripe_payment_intent_id: string | null
          stripe_session_id: string | null
          total_amount_cents: number
          unit_price_cents: number
          updated_at: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          id?: string
          organization_id: string
          purchased_by: string
          quantity: number
          slot_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount_cents: number
          unit_price_cents?: number
          updated_at?: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          id?: string
          organization_id?: string
          purchased_by?: string
          quantity?: number
          slot_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          stripe_session_id?: string | null
          total_amount_cents?: number
          unit_price_cents?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "slot_purchases_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "slot_purchases_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      team_members: {
        Row: {
          id: string
          joined_date: string
          role: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_date?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_date?: string
          role?: Database["public"]["Enums"]["team_member_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          organization_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          organization_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          organization_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teams_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_license_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          organization_id: string
          quantity: number
          status: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id?: string
          organization_id: string
          quantity?: number
          status?: string
          stripe_customer_id: string
          stripe_price_id: string
          stripe_subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          organization_id?: string
          quantity?: number
          status?: string
          stripe_customer_id?: string
          stripe_price_id?: string
          stripe_subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_license_subscriptions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_costs: {
        Row: {
          created_at: string
          created_by: string
          description: string
          id: string
          quantity: number
          total_price_cents: number | null
          unit_price_cents: number
          updated_at: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description: string
          id?: string
          quantity?: number
          total_price_cents?: number | null
          unit_price_cents?: number
          updated_at?: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          id?: string
          quantity?: number
          total_price_cents?: number | null
          unit_price_cents?: number
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_costs_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_images: {
        Row: {
          created_at: string
          description: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          mime_type: string | null
          note_id: string | null
          uploaded_by: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          mime_type?: string | null
          note_id?: string | null
          uploaded_by: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          mime_type?: string | null
          note_id?: string | null
          uploaded_by?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_images_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "work_order_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_notes: {
        Row: {
          author_id: string
          content: string
          created_at: string
          hours_worked: number | null
          id: string
          is_private: boolean
          updated_at: string
          work_order_id: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          is_private?: boolean
          updated_at?: string
          work_order_id: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          hours_worked?: number | null
          id?: string
          is_private?: boolean
          updated_at?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_work_order_notes_author"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_status_history: {
        Row: {
          changed_at: string
          changed_by: string
          created_at: string
          id: string
          metadata: Json | null
          new_status: Database["public"]["Enums"]["work_order_status"]
          old_status: Database["public"]["Enums"]["work_order_status"] | null
          reason: string | null
          work_order_id: string
        }
        Insert: {
          changed_at?: string
          changed_by: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status: Database["public"]["Enums"]["work_order_status"]
          old_status?: Database["public"]["Enums"]["work_order_status"] | null
          reason?: string | null
          work_order_id: string
        }
        Update: {
          changed_at?: string
          changed_by?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          new_status?: Database["public"]["Enums"]["work_order_status"]
          old_status?: Database["public"]["Enums"]["work_order_status"] | null
          reason?: string | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_status_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_status_history_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      work_orders: {
        Row: {
          acceptance_date: string | null
          assignee_id: string | null
          completed_date: string | null
          created_by: string
          created_date: string
          description: string
          due_date: string | null
          equipment_id: string
          estimated_hours: number | null
          has_pm: boolean
          id: string
          organization_id: string
          pm_required: boolean
          priority: Database["public"]["Enums"]["work_order_priority"]
          status: Database["public"]["Enums"]["work_order_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acceptance_date?: string | null
          assignee_id?: string | null
          completed_date?: string | null
          created_by: string
          created_date?: string
          description: string
          due_date?: string | null
          equipment_id: string
          estimated_hours?: number | null
          has_pm?: boolean
          id?: string
          organization_id: string
          pm_required?: boolean
          priority?: Database["public"]["Enums"]["work_order_priority"]
          status?: Database["public"]["Enums"]["work_order_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acceptance_date?: string | null
          assignee_id?: string | null
          completed_date?: string | null
          created_by?: string
          created_date?: string
          description?: string
          due_date?: string | null
          equipment_id?: string
          estimated_hours?: number | null
          has_pm?: boolean
          id?: string
          organization_id?: string
          pm_required?: boolean
          priority?: Database["public"]["Enums"]["work_order_priority"]
          status?: Database["public"]["Enums"]["work_order_status"]
          team_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_orders_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_orders_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation_atomic: {
        Args: { p_invitation_token: string; p_user_id?: string }
        Returns: Json
      }
      calculate_billable_members: {
        Args: { org_id: string }
        Returns: number
      }
      calculate_organization_billing: {
        Args: { org_id: string }
        Returns: Json
      }
      can_manage_invitation_atomic: {
        Args: { user_uuid: string; invitation_id: string }
        Returns: boolean
      }
      can_manage_invitation_optimized: {
        Args: { user_uuid: string; invitation_id: string }
        Returns: boolean
      }
      can_manage_invitation_safe: {
        Args: { user_uuid: string; invitation_id: string }
        Returns: boolean
      }
      check_admin_bypass_fixed: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      check_admin_permission_safe: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      check_admin_with_context: {
        Args: { user_uuid: string; org_id: string; bypass_context?: string }
        Returns: boolean
      }
      check_member_bypass_fixed: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      check_org_access_direct: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      check_org_access_secure: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      check_org_admin_secure: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      check_team_access_secure: {
        Args: { user_uuid: string; team_uuid: string }
        Returns: boolean
      }
      check_team_role_secure: {
        Args: { user_uuid: string; team_uuid: string; required_role: string }
        Returns: boolean
      }
      clear_rls_context: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_invitation_atomic: {
        Args: {
          p_organization_id: string
          p_email: string
          p_role: string
          p_message?: string
          p_invited_by?: string
        }
        Returns: string
      }
      create_invitation_bypass: {
        Args: {
          p_organization_id: string
          p_email: string
          p_role: string
          p_message?: string
          p_invited_by?: string
        }
        Returns: string
      }
      create_invitation_bypass_optimized: {
        Args: {
          p_organization_id: string
          p_email: string
          p_role: string
          p_message?: string
          p_invited_by?: string
        }
        Returns: string
      }
      create_invitation_with_context: {
        Args: {
          p_organization_id: string
          p_email: string
          p_role: string
          p_message?: string
          p_invited_by?: string
        }
        Returns: string
      }
      get_current_billing_period: {
        Args: Record<PropertyKey, never>
        Returns: {
          period_start: string
          period_end: string
        }[]
      }
      get_current_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_invitations_atomic: {
        Args: { user_uuid: string; org_id: string }
        Returns: {
          id: string
          email: string
          role: string
          status: string
          message: string
          created_at: string
          expires_at: string
          accepted_at: string
          declined_at: string
          expired_at: string
          slot_reserved: boolean
          slot_purchase_id: string
        }[]
      }
      get_invitations_bypass_optimized: {
        Args: { user_uuid: string; org_id: string }
        Returns: {
          id: string
          email: string
          role: string
          status: string
          message: string
          created_at: string
          expires_at: string
          accepted_at: string
          declined_at: string
          expired_at: string
          slot_reserved: boolean
          slot_purchase_id: string
        }[]
      }
      get_latest_completed_pm: {
        Args: { equipment_uuid: string }
        Returns: {
          id: string
          work_order_id: string
          completed_at: string
          completed_by: string
          work_order_title: string
        }[]
      }
      get_organization_premium_features: {
        Args: { org_id: string }
        Returns: Json
      }
      get_organization_slot_availability: {
        Args: { org_id: string }
        Returns: {
          total_purchased: number
          used_slots: number
          available_slots: number
          current_period_start: string
          current_period_end: string
        }[]
      }
      get_user_invitations_safe: {
        Args: { user_uuid: string; org_id: string }
        Returns: {
          id: string
          email: string
          role: string
          status: string
          message: string
          created_at: string
          expires_at: string
          accepted_at: string
          declined_at: string
          expired_at: string
          slot_reserved: boolean
          slot_purchase_id: string
        }[]
      }
      get_user_org_role_direct: {
        Args: { user_uuid: string; org_id: string }
        Returns: string
      }
      get_user_org_role_secure: {
        Args: { user_uuid: string; org_id: string }
        Returns: string
      }
      get_user_organization_membership: {
        Args: { user_uuid: string }
        Returns: {
          organization_id: string
          role: string
          status: string
        }[]
      }
      get_user_organizations: {
        Args: { user_uuid: string }
        Returns: {
          organization_id: string
        }[]
      }
      get_user_team_memberships: {
        Args: { user_uuid: string; org_id: string }
        Returns: {
          team_id: string
          team_name: string
          role: string
          joined_date: string
        }[]
      }
      is_org_admin: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      is_organization_member: {
        Args: { user_uuid: string; org_id: string }
        Returns: boolean
      }
      log_invitation_performance: {
        Args: {
          function_name: string
          execution_time_ms: number
          success: boolean
          error_message?: string
        }
        Returns: undefined
      }
      release_reserved_slot: {
        Args: { org_id: string; invitation_id: string }
        Returns: undefined
      }
      reserve_slot_for_invitation: {
        Args: { org_id: string; invitation_id: string }
        Returns: boolean
      }
      revert_pm_completion: {
        Args: { p_pm_id: string; p_reason?: string }
        Returns: Json
      }
      revert_work_order_status: {
        Args: { p_work_order_id: string; p_reason?: string }
        Returns: Json
      }
      set_bypass_triggers: {
        Args: { bypass?: boolean }
        Returns: undefined
      }
      set_rls_context: {
        Args: { context_name: string }
        Returns: undefined
      }
      sync_stripe_subscription_slots: {
        Args: {
          org_id: string
          subscription_id: string
          quantity: number
          period_start: string
          period_end: string
        }
        Returns: undefined
      }
      update_organization_billing_metrics: {
        Args: { org_id: string }
        Returns: undefined
      }
    }
    Enums: {
      equipment_status: "active" | "maintenance" | "inactive"
      organization_plan: "free" | "premium"
      team_member_role:
        | "owner"
        | "manager"
        | "technician"
        | "requestor"
        | "viewer"
      work_order_priority: "low" | "medium" | "high"
      work_order_status:
        | "submitted"
        | "accepted"
        | "assigned"
        | "in_progress"
        | "on_hold"
        | "completed"
        | "cancelled"
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
      equipment_status: ["active", "maintenance", "inactive"],
      organization_plan: ["free", "premium"],
      team_member_role: [
        "owner",
        "manager",
        "technician",
        "requestor",
        "viewer",
      ],
      work_order_priority: ["low", "medium", "high"],
      work_order_status: [
        "submitted",
        "accepted",
        "assigned",
        "in_progress",
        "on_hold",
        "completed",
        "cancelled",
      ],
    },
  },
} as const
