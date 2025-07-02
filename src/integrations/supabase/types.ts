export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
      calculate_billable_members: {
        Args: { org_id: string }
        Returns: number
      }
      calculate_organization_billing: {
        Args: { org_id: string }
        Returns: Json
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
      get_current_billing_period: {
        Args: Record<PropertyKey, never>
        Returns: {
          period_start: string
          period_end: string
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
      get_user_team_memberships: {
        Args: { user_uuid: string; org_id: string }
        Returns: {
          team_id: string
          team_name: string
          role: string
          joined_date: string
        }[]
      }
      release_reserved_slot: {
        Args: { org_id: string; invitation_id: string }
        Returns: undefined
      }
      reserve_slot_for_invitation: {
        Args: { org_id: string; invitation_id: string }
        Returns: boolean
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
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
