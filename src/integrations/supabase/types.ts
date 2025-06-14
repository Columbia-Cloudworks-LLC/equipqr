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
      account_link_requests: {
        Row: {
          completed_at: string | null
          created_at: string
          existing_user_id: string
          expires_at: string
          id: string
          new_provider: string
          new_provider_email: string
          status: string
          verification_token: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          existing_user_id: string
          expires_at?: string
          id?: string
          new_provider: string
          new_provider_email: string
          status?: string
          verification_token: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          existing_user_id?: string
          expires_at?: string
          id?: string
          new_provider?: string
          new_provider_email?: string
          status?: string
          verification_token?: string
        }
        Relationships: []
      }
      app_user: {
        Row: {
          auth_uid: string
          created_at: string
          display_name: string | null
          email: string
          id: string
          last_login_at: string | null
        }
        Insert: {
          auth_uid: string
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          last_login_at?: string | null
        }
        Update: {
          auth_uid?: string
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          last_login_at?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          actor_service: string | null
          actor_user_id: string | null
          after_json: Json | null
          before_json: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: unknown | null
          org_id: string | null
          session_id: string | null
          ts: string
          user_agent: string | null
        }
        Insert: {
          action: string
          actor_service?: string | null
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: unknown | null
          org_id?: string | null
          session_id?: string | null
          ts?: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          actor_service?: string | null
          actor_user_id?: string | null
          after_json?: Json | null
          before_json?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: unknown | null
          org_id?: string | null
          session_id?: string | null
          ts?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_log_actor_user_id_fkey"
            columns: ["actor_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string
          email: string
          error_code: string | null
          error_message: string | null
          event_type: string
          id: string
          ip_address: unknown | null
          metadata: Json | null
          provider: string
          success: boolean
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          error_code?: string | null
          error_message?: string | null
          event_type: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          provider: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          error_code?: string | null
          error_message?: string | null
          event_type?: string
          id?: string
          ip_address?: unknown | null
          metadata?: Json | null
          provider?: string
          success?: boolean
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      auth_rate_limits: {
        Row: {
          attempt_count: number | null
          attempt_type: string
          blocked_until: string | null
          created_at: string | null
          id: string
          identifier: string
          window_start: string | null
        }
        Insert: {
          attempt_count?: number | null
          attempt_type: string
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier: string
          window_start?: string | null
        }
        Update: {
          attempt_count?: number | null
          attempt_type?: string
          blocked_until?: string | null
          created_at?: string | null
          id?: string
          identifier?: string
          window_start?: string | null
        }
        Relationships: []
      }
      billing_customer: {
        Row: {
          created_at: string
          default_payment_method_id: string | null
          deleted_at: string | null
          id: string
          org_id: string
          stripe_customer_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_payment_method_id?: string | null
          deleted_at?: string | null
          id?: string
          org_id: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_payment_method_id?: string | null
          deleted_at?: string | null
          id?: string
          org_id?: string
          stripe_customer_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_customer_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_price: {
        Row: {
          active: boolean
          created_at: string
          id: string
          month_amount_cents: number
          name: string
          plan_level: string
          stripe_price_id: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          month_amount_cents: number
          name: string
          plan_level: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          month_amount_cents?: number
          name?: string
          plan_level?: string
          stripe_price_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      billing_subscription: {
        Row: {
          canceled_at: string | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          deleted_at: string | null
          id: string
          org_id: string
          price_id: string
          status: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          deleted_at?: string | null
          id?: string
          org_id: string
          price_id: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          canceled_at?: string | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          deleted_at?: string | null
          id?: string
          org_id?: string
          price_id?: string
          status?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_subscription_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_subscription_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "billing_price"
            referencedColumns: ["id"]
          },
        ]
      }
      customer: {
        Row: {
          contact_info: Json | null
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          contact_info?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          contact_info?: Json | null
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          install_date: string | null
          last_scan_accuracy: number | null
          last_scan_by_user_id: string | null
          last_scan_latitude: number | null
          last_scan_longitude: number | null
          last_scan_timestamp: string | null
          location: string | null
          location_override: boolean | null
          location_source: string | null
          manufacturer: string | null
          model: string | null
          name: string
          notes: string | null
          org_id: string
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          team_id: string | null
          updated_at: string
          warranty_expiration: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          install_date?: string | null
          last_scan_accuracy?: number | null
          last_scan_by_user_id?: string | null
          last_scan_latitude?: number | null
          last_scan_longitude?: number | null
          last_scan_timestamp?: string | null
          location?: string | null
          location_override?: boolean | null
          location_source?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          notes?: string | null
          org_id: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          team_id?: string | null
          updated_at?: string
          warranty_expiration?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          install_date?: string | null
          last_scan_accuracy?: number | null
          last_scan_by_user_id?: string | null
          last_scan_latitude?: number | null
          last_scan_longitude?: number | null
          last_scan_timestamp?: string | null
          location?: string | null
          location_override?: boolean | null
          location_source?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          notes?: string | null
          org_id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          team_id?: string | null
          updated_at?: string
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_acl: {
        Row: {
          equipment_id: string
          expires_at: string | null
          id: string
          role: Database["public"]["Enums"]["access_role"]
          subject_id: string
          subject_type: string
        }
        Insert: {
          equipment_id: string
          expires_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["access_role"]
          subject_id: string
          subject_type: string
        }
        Update: {
          equipment_id?: string
          expires_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["access_role"]
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "equipment_acl_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_attributes: {
        Row: {
          created_at: string
          equipment_id: string
          id: string
          key: string
          updated_at: string
          value: string | null
        }
        Insert: {
          created_at?: string
          equipment_id: string
          id?: string
          key: string
          updated_at?: string
          value?: string | null
        }
        Update: {
          created_at?: string
          equipment_id?: string
          id?: string
          key?: string
          updated_at?: string
          value?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_attributes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      equipment_work_notes: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          edited_at: string | null
          edited_by: string | null
          equipment_id: string
          hours_worked: number | null
          id: string
          image_urls: string[] | null
          is_public: boolean
          note: string
          updated_at: string
          work_order_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          edited_by?: string | null
          equipment_id: string
          hours_worked?: number | null
          id?: string
          image_urls?: string[] | null
          is_public?: boolean
          note: string
          updated_at?: string
          work_order_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          edited_at?: string | null
          edited_by?: string | null
          equipment_id?: string
          hours_worked?: number | null
          id?: string
          image_urls?: string[] | null
          is_public?: boolean
          note?: string
          updated_at?: string
          work_order_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_work_notes_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipment_work_notes_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_equipment_work_notes_created_by"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_equipment_work_notes_edited_by"
            columns: ["edited_by"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_subscriptions: {
        Row: {
          activated_at: string
          created_at: string
          deactivated_at: string | null
          feature_id: string
          id: string
          org_id: string
          quantity: number | null
          status: string
          stripe_price_id: string
          updated_at: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          deactivated_at?: string | null
          feature_id: string
          id?: string
          org_id: string
          quantity?: number | null
          status?: string
          stripe_price_id: string
          updated_at?: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          deactivated_at?: string | null
          feature_id?: string
          id?: string
          org_id?: string
          quantity?: number | null
          status?: string
          stripe_price_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_subscriptions_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "subscription_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage: {
        Row: {
          created_at: string
          feature_id: string
          id: string
          org_id: string
          period_end: string
          period_start: string
          updated_at: string
          usage_amount: number
          usage_unit: string
        }
        Insert: {
          created_at?: string
          feature_id: string
          id?: string
          org_id: string
          period_end: string
          period_start: string
          updated_at?: string
          usage_amount?: number
          usage_unit: string
        }
        Update: {
          created_at?: string
          feature_id?: string
          id?: string
          org_id?: string
          period_end?: string
          period_start?: string
          updated_at?: string
          usage_amount?: number
          usage_unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "feature_usage_feature_id_fkey"
            columns: ["feature_id"]
            isOneToOne: false
            referencedRelation: "subscription_features"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feature_usage_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      image_upload: {
        Row: {
          bucket: string
          checksum_sha256: string | null
          created_at: string
          deleted_at: string | null
          equipment_id: string | null
          height: number | null
          id: string
          mime_type: string | null
          object_key: string
          size_bytes: number | null
          status: Database["public"]["Enums"]["image_status"]
          uploaded_by: string | null
          width: number | null
          work_note_id: string | null
        }
        Insert: {
          bucket?: string
          checksum_sha256?: string | null
          created_at?: string
          deleted_at?: string | null
          equipment_id?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          object_key: string
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["image_status"]
          uploaded_by?: string | null
          width?: number | null
          work_note_id?: string | null
        }
        Update: {
          bucket?: string
          checksum_sha256?: string | null
          created_at?: string
          deleted_at?: string | null
          equipment_id?: string | null
          height?: number | null
          id?: string
          mime_type?: string | null
          object_key?: string
          size_bytes?: number | null
          status?: Database["public"]["Enums"]["image_status"]
          uploaded_by?: string | null
          width?: number | null
          work_note_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "image_upload_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "image_upload_work_note_id_fkey"
            columns: ["work_note_id"]
            isOneToOne: false
            referencedRelation: "work_note"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          data: Json | null
          id: string
          message: string
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
          read?: boolean
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      organization: {
        Row: {
          created_at: string
          current_storage_bytes: number | null
          deleted_at: string | null
          frozen_at: string | null
          grace_period_end: string | null
          grace_period_notified: boolean | null
          grace_period_start: string | null
          id: string
          last_storage_check: string | null
          name: string
          owner_user_id: string | null
          pending_transfer_to: string | null
          status: string
          storage_overage_notified: boolean | null
          transfer_deadline: string | null
          transfer_initiated_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_storage_bytes?: number | null
          deleted_at?: string | null
          frozen_at?: string | null
          grace_period_end?: string | null
          grace_period_notified?: boolean | null
          grace_period_start?: string | null
          id?: string
          last_storage_check?: string | null
          name: string
          owner_user_id?: string | null
          pending_transfer_to?: string | null
          status?: string
          storage_overage_notified?: boolean | null
          transfer_deadline?: string | null
          transfer_initiated_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_storage_bytes?: number | null
          deleted_at?: string | null
          frozen_at?: string | null
          grace_period_end?: string | null
          grace_period_notified?: boolean | null
          grace_period_start?: string | null
          id?: string
          last_storage_check?: string | null
          name?: string
          owner_user_id?: string | null
          pending_transfer_to?: string | null
          status?: string
          storage_overage_notified?: boolean | null
          transfer_deadline?: string | null
          transfer_initiated_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_pending_transfer_to_fkey"
            columns: ["pending_transfer_to"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_acl: {
        Row: {
          expires_at: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["access_role"]
          subject_id: string
          subject_type: string
        }
        Insert: {
          expires_at?: string | null
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["access_role"]
          subject_id: string
          subject_type: string
        }
        Update: {
          expires_at?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["access_role"]
          subject_id?: string
          subject_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_acl_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_billing_exemptions: {
        Row: {
          created_at: string
          created_by: string | null
          exemption_type: string
          expires_at: string | null
          free_user_count: number | null
          id: string
          is_active: boolean
          org_id: string
          reason: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exemption_type: string
          expires_at?: string | null
          free_user_count?: number | null
          id?: string
          is_active?: boolean
          org_id: string
          reason?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exemption_type?: string
          expires_at?: string | null
          free_user_count?: number | null
          id?: string
          is_active?: boolean
          org_id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_billing_exemptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_billing_state: {
        Row: {
          billing_required: boolean
          created_at: string
          first_equipment_added_at: string | null
          grace_period_days: number | null
          grace_period_end: string | null
          grace_period_start: string | null
          id: string
          org_id: string
          updated_at: string
        }
        Insert: {
          billing_required?: boolean
          created_at?: string
          first_equipment_added_at?: string | null
          grace_period_days?: number | null
          grace_period_end?: string | null
          grace_period_start?: string | null
          id?: string
          org_id: string
          updated_at?: string
        }
        Update: {
          billing_required?: boolean
          created_at?: string
          first_equipment_added_at?: string | null
          grace_period_days?: number | null
          grace_period_end?: string | null
          grace_period_start?: string | null
          id?: string
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_billing_state_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          invited_by_email: string | null
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          invited_by_email?: string | null
          org_id: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by_email?: string | null
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invitations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_storage_billing: {
        Row: {
          billing_period_end: string
          billing_period_start: string
          created_at: string
          id: string
          org_id: string
          overage_amount_cents: number
          overage_gb: number
          status: string
          stripe_invoice_id: string | null
          updated_at: string
        }
        Insert: {
          billing_period_end: string
          billing_period_start: string
          created_at?: string
          id?: string
          org_id: string
          overage_amount_cents?: number
          overage_gb?: number
          status?: string
          stripe_invoice_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string
          id?: string
          org_id?: string
          overage_amount_cents?: number
          overage_gb?: number
          status?: string
          stripe_invoice_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_storage_billing_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_storage_usage: {
        Row: {
          calculated_at: string
          created_at: string
          id: string
          org_id: string
          overage_amount_cents: number
          overage_bytes: number
          overage_gb: number
          period_end: string
          period_start: string
          total_bytes_used: number
          updated_at: string
        }
        Insert: {
          calculated_at?: string
          created_at?: string
          id?: string
          org_id: string
          overage_amount_cents?: number
          overage_bytes?: number
          overage_gb?: number
          period_end: string
          period_start: string
          total_bytes_used?: number
          updated_at?: string
        }
        Update: {
          calculated_at?: string
          created_at?: string
          id?: string
          org_id?: string
          overage_amount_cents?: number
          overage_bytes?: number
          overage_gb?: number
          period_end?: string
          period_start?: string
          total_bytes_used?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_storage_usage_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          org_id: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          org_id: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          org_id?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_transfers: {
        Row: {
          accepted_at: string | null
          created_at: string
          expires_at: string
          from_user_id: string
          id: string
          initiated_at: string
          initiated_by: string
          org_id: string
          rejected_at: string | null
          status: string
          to_user_id: string
          transfer_reason: string | null
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id: string
          id?: string
          initiated_at?: string
          initiated_by: string
          org_id: string
          rejected_at?: string | null
          status?: string
          to_user_id: string
          transfer_reason?: string | null
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          expires_at?: string
          from_user_id?: string
          id?: string
          initiated_at?: string
          initiated_by?: string
          org_id?: string
          rejected_at?: string | null
          status?: string
          to_user_id?: string
          transfer_reason?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_transfers_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_transfers_initiated_by_fkey"
            columns: ["initiated_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_transfers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_transfers_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_user_licenses: {
        Row: {
          billable_users: number
          calculated_at: string
          created_at: string
          id: string
          monthly_cost_cents: number
          org_id: string
          total_users: number
          updated_at: string
        }
        Insert: {
          billable_users?: number
          calculated_at?: string
          created_at?: string
          id?: string
          monthly_cost_cents?: number
          org_id: string
          total_users?: number
          updated_at?: string
        }
        Update: {
          billable_users?: number
          calculated_at?: string
          created_at?: string
          id?: string
          monthly_cost_cents?: number
          org_id?: string
          total_users?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_user_licenses_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_user_seats: {
        Row: {
          free_seats: number
          id: string
          org_id: string
          paid_seats: number
          total_seats: number
          updated_at: string
          used_seats: number
        }
        Insert: {
          free_seats?: number
          id?: string
          org_id: string
          paid_seats?: number
          total_seats?: number
          updated_at?: string
          used_seats?: number
        }
        Update: {
          free_seats?: number
          id?: string
          org_id?: string
          paid_seats?: number
          total_seats?: number
          updated_at?: string
          used_seats?: number
        }
        Relationships: [
          {
            foreignKeyName: "organization_user_seats_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_history: {
        Row: {
          browser_name: string | null
          browser_version: string | null
          device_fingerprint: string | null
          device_type: string | null
          equipment_id: string
          id: string
          language: string | null
          latitude: number | null
          location_accuracy: number | null
          longitude: number | null
          operating_system: string | null
          referrer_url: string | null
          scan_method: string | null
          scanned_by_user_id: string | null
          scanned_from_ip: unknown | null
          screen_resolution: string | null
          session_id: string | null
          timezone: string | null
          ts: string
          user_agent: string | null
        }
        Insert: {
          browser_name?: string | null
          browser_version?: string | null
          device_fingerprint?: string | null
          device_type?: string | null
          equipment_id: string
          id?: string
          language?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          operating_system?: string | null
          referrer_url?: string | null
          scan_method?: string | null
          scanned_by_user_id?: string | null
          scanned_from_ip?: unknown | null
          screen_resolution?: string | null
          session_id?: string | null
          timezone?: string | null
          ts?: string
          user_agent?: string | null
        }
        Update: {
          browser_name?: string | null
          browser_version?: string | null
          device_fingerprint?: string | null
          device_type?: string | null
          equipment_id?: string
          id?: string
          language?: string | null
          latitude?: number | null
          location_accuracy?: number | null
          longitude?: number | null
          operating_system?: string | null
          referrer_url?: string | null
          scan_method?: string | null
          scanned_by_user_id?: string | null
          scanned_from_ip?: unknown | null
          screen_resolution?: string | null
          session_id?: string | null
          timezone?: string | null
          ts?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_features: {
        Row: {
          created_at: string
          description: string | null
          feature_key: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          feature_key: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          feature_key?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      team: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          created_by: string
          email: string
          expires_at: string
          id: string
          invited_by_email: string | null
          role: string
          status: string
          team_id: string
          token: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          created_by: string
          email: string
          expires_at?: string
          id?: string
          invited_by_email?: string | null
          role?: string
          status?: string
          team_id: string
          token: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          created_by?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by_email?: string | null
          role?: string
          status?: string
          team_id?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member: {
        Row: {
          id: string
          joined_at: string
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "team"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      team_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          role: string
          team_member_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role: string
          team_member_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          role?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_roles_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_member"
            referencedColumns: ["id"]
          },
        ]
      }
      user_auth_methods: {
        Row: {
          created_at: string
          email: string
          id: string
          is_primary: boolean
          last_used_at: string | null
          provider: string
          provider_id: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          provider: string
          provider_id?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_primary?: boolean
          last_used_at?: string | null
          provider?: string
          provider_id?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: []
      }
      user_billing_exemptions: {
        Row: {
          created_at: string
          created_by: string | null
          exemption_type: string
          expires_at: string | null
          id: string
          is_active: boolean
          reason: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          exemption_type: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          exemption_type?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          reason?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          datetime_format_preference:
            | Database["public"]["Enums"]["datetime_format"]
            | null
          deactivated_at: string | null
          deactivation_reason: string | null
          default_org_id: string | null
          display_name: string | null
          id: string
          is_deactivated: boolean
          job_title: string | null
          org_id: string
          phone_number: string | null
          reactivation_deadline: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          datetime_format_preference?:
            | Database["public"]["Enums"]["datetime_format"]
            | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          default_org_id?: string | null
          display_name?: string | null
          id: string
          is_deactivated?: boolean
          job_title?: string | null
          org_id: string
          phone_number?: string | null
          reactivation_deadline?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          datetime_format_preference?:
            | Database["public"]["Enums"]["datetime_format"]
            | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          default_org_id?: string | null
          display_name?: string | null
          id?: string
          is_deactivated?: boolean
          job_title?: string | null
          org_id?: string
          phone_number?: string | null
          reactivation_deadline?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_default_org_id_fkey"
            columns: ["default_org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_profiles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          org_id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      work_note: {
        Row: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          equipment_id: string | null
          hours_worked: number | null
          id: string
          is_public: boolean | null
          note: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          equipment_id?: string | null
          hours_worked?: number | null
          id?: string
          is_public?: boolean | null
          note: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          deleted_at?: string | null
          equipment_id?: string | null
          hours_worked?: number | null
          id?: string
          is_public?: boolean | null
          note?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_note_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_note_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order: {
        Row: {
          accepted_at: string | null
          assigned_at: string | null
          assigned_to: string | null
          closed_at: string | null
          completed_at: string | null
          created_by: string | null
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          equipment_id: string
          estimated_hours: number | null
          id: string
          opened_at: string
          org_id: string
          status: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at: string
        }
        Insert: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          equipment_id: string
          estimated_hours?: number | null
          id?: string
          opened_at?: string
          org_id: string
          status?: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at?: string
        }
        Update: {
          accepted_at?: string | null
          assigned_at?: string | null
          assigned_to?: string | null
          closed_at?: string | null
          completed_at?: string | null
          created_by?: string | null
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          equipment_id?: string
          estimated_hours?: number | null
          id?: string
          opened_at?: string
          org_id?: string
          status?: Database["public"]["Enums"]["work_order_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customer"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_assignee: {
        Row: {
          assigned_ts: string
          id: string
          unassigned_ts: string | null
          user_id: string
          work_order_id: string
        }
        Insert: {
          assigned_ts?: string
          id?: string
          unassigned_ts?: string | null
          user_id: string
          work_order_id: string
        }
        Update: {
          assigned_ts?: string
          id?: string
          unassigned_ts?: string | null
          user_id?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_assignee_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_assignee_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order"
            referencedColumns: ["id"]
          },
        ]
      }
      work_order_audit_log: {
        Row: {
          change_type: string
          changed_by: string
          created_at: string
          id: string
          new_value: Json | null
          old_value: Json | null
          work_order_id: string
        }
        Insert: {
          change_type: string
          changed_by: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          work_order_id: string
        }
        Update: {
          change_type?: string
          changed_by?: string
          created_at?: string
          id?: string
          new_value?: Json | null
          old_value?: Json | null
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_audit_log_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "work_order_audit_log_work_order_id_fkey"
            columns: ["work_order_id"]
            isOneToOne: false
            referencedRelation: "work_order"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_org_storage_usage: {
        Args: { p_org_id: string }
        Returns: number
      }
      calculate_org_user_billing: {
        Args: { p_org_id: string }
        Returns: Json
      }
      calculate_org_user_billing_corrected: {
        Args: { p_org_id: string }
        Returns: Json
      }
      calculate_org_user_billing_with_exemptions: {
        Args: { p_org_id: string }
        Returns: Json
      }
      calculate_storage_overage: {
        Args: { p_org_id: string; p_period_start: string; p_period_end: string }
        Returns: {
          total_bytes: number
          overage_bytes: number
          overage_gb: number
          overage_amount_cents: number
        }[]
      }
      can_access_equipment: {
        Args: { user_id: string; equipment_id: string }
        Returns: boolean
      }
      can_access_team: {
        Args: { p_uid: string; p_team_id: string }
        Returns: boolean
      }
      can_assign_team_role: {
        Args: { p_auth_user_id: string; p_team_id: string; p_role: string }
        Returns: boolean
      }
      can_create_equipment_safe: {
        Args: { p_user_id: string; p_team_id?: string }
        Returns: boolean
      }
      can_delete_equipment: {
        Args: { p_uid: string; p_equipment_id: string }
        Returns: boolean
      }
      can_edit_equipment: {
        Args: { user_id: string; equipment_id: string }
        Returns: boolean
      }
      can_edit_unassigned_equipment: {
        Args: { user_id: string; equipment_id: string }
        Returns: boolean
      }
      can_edit_work_note: {
        Args: { note_id: string; user_id: string }
        Returns: boolean
      }
      can_insert_to_team_org: {
        Args: { p_uid: string; p_org_id: string }
        Returns: boolean
      }
      can_manage_org_member_role: {
        Args: { manager_id: string; target_user_id: string; org_id: string }
        Returns: boolean
      }
      can_manage_org_members: {
        Args: { p_user_id: string; p_org_id: string }
        Returns: boolean
      }
      can_manage_work_orders: {
        Args: { p_user_id: string; p_equipment_id: string }
        Returns: boolean
      }
      can_submit_work_orders: {
        Args: { p_user_id: string; p_equipment_id: string }
        Returns: boolean
      }
      can_view_scan_history: {
        Args: { p_user_id: string; p_equipment_id: string }
        Returns: boolean
      }
      can_view_work_orders: {
        Args: { p_user_id: string; p_equipment_id: string }
        Returns: boolean
      }
      check_duplicate_email_signup: {
        Args: { p_email: string; p_provider?: string }
        Returns: Json
      }
      check_enhanced_rate_limit: {
        Args: {
          p_identifier: string
          p_attempt_type: string
          p_max_attempts?: number
          p_window_minutes?: number
          p_escalation_factor?: number
        }
        Returns: Json
      }
      check_equipment_create_permission: {
        Args: { p_user_id: string; p_team_id?: string; p_org_id?: string }
        Returns: {
          has_permission: boolean
          org_id: string
          reason: string
        }[]
      }
      check_equipment_permissions: {
        Args: { _user_id: string; _equipment_id: string; _action: string }
        Returns: boolean
      }
      check_org_billing_exemptions: {
        Args: { p_org_id: string }
        Returns: {
          exemption_type: string
          reason: string
          expires_at: string
          free_user_count: number
          is_active: boolean
        }[]
      }
      check_rate_limit: {
        Args: {
          p_identifier: string
          p_attempt_type: string
          p_max_attempts?: number
          p_window_minutes?: number
        }
        Returns: boolean
      }
      check_team_access: {
        Args: { user_id: string; team_id: string }
        Returns: boolean
      }
      check_team_access_detailed: {
        Args: { user_id: string; team_id: string }
        Returns: {
          has_access: boolean
          access_reason: string
          user_org_id: string
          team_org_id: string
          is_team_member: boolean
          is_org_owner: boolean
          team_role: string
        }[]
      }
      check_team_access_nonrecursive: {
        Args: { p_user_id: string; p_team_id: string }
        Returns: boolean
      }
      check_user_seat_availability: {
        Args: { p_org_id: string }
        Returns: Json
      }
      check_user_team_permission: {
        Args: { _user_id: string; _team_id: string; _required_roles: string[] }
        Returns: boolean
      }
      freeze_organization: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      gen_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      generate_verification_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_assignable_team_members: {
        Args: { p_equipment_id: string }
        Returns: {
          user_id: string
          app_user_id: string
          display_name: string
          email: string
          role: string
        }[]
      }
      get_equipment_latest_image: {
        Args: { equipment_id_param: string }
        Returns: string
      }
      get_equipment_scan_history: {
        Args: { p_equipment_id: string; p_user_id: string; p_limit?: number }
        Returns: {
          id: string
          ts: string
          scanned_by_user_id: string
          scanned_from_ip: unknown
          user_agent: string
          device_type: string
          browser_name: string
          browser_version: string
          operating_system: string
          screen_resolution: string
          latitude: number
          longitude: number
          location_accuracy: number
          session_id: string
          referrer_url: string
          scan_method: string
          device_fingerprint: string
          timezone: string
          language: string
          user_display_name: string
          user_org_name: string
        }[]
      }
      get_equipment_work_notes: {
        Args: { equipment_id: string }
        Returns: {
          created_at: string
          created_by: string | null
          deleted_at: string | null
          edited_at: string | null
          edited_by: string | null
          equipment_id: string
          hours_worked: number | null
          id: string
          image_urls: string[] | null
          is_public: boolean
          note: string
          updated_at: string
          work_order_id: string | null
        }[]
      }
      get_org_feature_access: {
        Args: { p_org_id: string; p_feature_key: string }
        Returns: boolean
      }
      get_org_feature_access_categorized: {
        Args: {
          p_org_id: string
          p_feature_key: string
          p_feature_category?: string
        }
        Returns: boolean
      }
      get_org_grace_period_info: {
        Args: { p_org_id: string }
        Returns: Json
      }
      get_org_managers: {
        Args: { p_org_id: string }
        Returns: {
          user_id: string
          display_name: string
          email: string
          role: string
          is_current_user: boolean
        }[]
      }
      get_org_role: {
        Args: { p_auth_user_id: string; p_org_id: string }
        Returns: string
      }
      get_organization_members: {
        Args: { org_id: string }
        Returns: {
          id: string
          team_id: string
          user_id: string
          joined_at: string
          name: string
          email: string
          role: string
          status: string
        }[]
      }
      get_team_member_role_safe: {
        Args: { auth_user_id: string; team_id_param: string }
        Returns: string
      }
      get_team_members_with_roles: {
        Args: { _team_id: string }
        Returns: {
          id: string
          team_id: string
          user_id: string
          joined_at: string
          name: string
          email: string
          role: string
          status: string
          auth_uid: string
        }[]
      }
      get_team_org: {
        Args: { team_id_param: string }
        Returns: string
      }
      get_team_org_safe: {
        Args: { team_id_param: string }
        Returns: string
      }
      get_team_role: {
        Args: { _user_id: string; _team_id: string }
        Returns: string
      }
      get_team_role_safe: {
        Args: { _user_id: string; _team_id: string }
        Returns: string
      }
      get_user_by_email: {
        Args: { email_address: string }
        Returns: {
          id: string
          email: string
          auth_uid: string
        }[]
      }
      get_user_by_email_safe: {
        Args: { email_param: string }
        Returns: {
          id: string
          email: string
        }[]
      }
      get_user_default_org: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_org_id_safe: {
        Args: { user_id_param: string }
        Returns: string
      }
      get_user_role: {
        Args: { _user_id: string; _org_id: string }
        Returns: Database["public"]["Enums"]["user_role"]
      }
      get_user_role_in_team: {
        Args: { p_user_uid: string; p_team_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _user_id: string
          _org_id: string
          _role: Database["public"]["Enums"]["user_role"]
        }
        Returns: boolean
      }
      has_team_role: {
        Args: { _user_id: string; _team_id: string; _role: string }
        Returns: boolean
      }
      is_only_manager_in_org: {
        Args: { p_user_id: string; p_org_id: string }
        Returns: boolean
      }
      is_org_member: {
        Args: { p_auth_user_id: string; p_org_id: string }
        Returns: boolean
      }
      is_team_member: {
        Args: { _user_id: string; _team_id: string }
        Returns: boolean
      }
      is_using_service_role: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      log_permission_debug: {
        Args: {
          p_function_name: string
          p_user_id: string
          p_equipment_id?: string
          p_team_id?: string
          p_result?: boolean
          p_details?: string
        }
        Returns: undefined
      }
      log_security_event: {
        Args: {
          p_event_type: string
          p_entity_type: string
          p_entity_id: string
          p_details?: Json
        }
        Returns: undefined
      }
      log_security_event_enhanced: {
        Args: {
          p_event_type: string
          p_entity_type: string
          p_entity_id: string
          p_details?: Json
          p_severity?: string
          p_source_ip?: unknown
        }
        Returns: undefined
      }
      reactivate_organization: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      record_equipment_scan: {
        Args: { p_equipment_id: string; p_user_id: string; p_scan_data: Json }
        Returns: Json
      }
      remove_organization_member: {
        Args: { p_org_id: string; p_user_id: string; p_removed_by: string }
        Returns: Json
      }
      rpc_check_equipment_permission: {
        Args: {
          user_id: string
          action: string
          team_id?: string
          equipment_id?: string
        }
        Returns: Json
      }
      sanitize_text: {
        Args: { input_text: string }
        Returns: string
      }
      send_assignment_notification: {
        Args: {
          p_user_id: string
          p_work_order_id: string
          p_work_order_title: string
          p_equipment_name: string
        }
        Returns: undefined
      }
      set_user_default_org: {
        Args: { user_id_param: string; org_id_param: string }
        Returns: boolean
      }
      setup_billing_exemption_by_email: {
        Args: {
          p_email: string
          p_exemption_type: string
          p_free_user_count?: number
          p_reason?: string
        }
        Returns: Json
      }
      simplified_equipment_create_permission: {
        Args: { p_user_id: string; p_team_id?: string }
        Returns: Json
      }
      soft_delete_organization: {
        Args: { p_org_id: string }
        Returns: boolean
      }
      test_equipment_permission_flow: {
        Args: { auth_user_id: string; team_id?: string }
        Returns: Json
      }
      user_belongs_to_org: {
        Args: { _user_id: string; _org_id: string }
        Returns: boolean
      }
      user_belongs_to_org_safe: {
        Args: { user_id_param: string; org_id_param: string }
        Returns: boolean
      }
      user_belongs_to_team: {
        Args: { _user_id: string; _team_id: string }
        Returns: boolean
      }
      user_has_role_in_team: {
        Args: { _user_id: string; _team_id: string; _roles: string[] }
        Returns: boolean
      }
      user_has_role_safe: {
        Args: {
          user_id_param: string
          org_id_param: string
          role_param: string
        }
        Returns: boolean
      }
      user_has_technician_or_above_in_org: {
        Args: { _user_id: string; _org_id: string }
        Returns: boolean
      }
      validate_email: {
        Args: { email_text: string }
        Returns: boolean
      }
      validate_team_access_with_org: {
        Args: { p_user_id: string; p_team_id: string }
        Returns: {
          is_member: boolean
          has_org_access: boolean
          role: string
          team_org_id: string
          access_reason: string
        }[]
      }
      validate_uuid_format: {
        Args: { uuid_text: string }
        Returns: boolean
      }
    }
    Enums: {
      access_role: "owner" | "manager" | "technician" | "viewer"
      datetime_format:
        | "MM/DD/YYYY h:mm A"
        | "DD/MM/YYYY h:mm A"
        | "YYYY-MM-DD HH:mm:ss"
        | "ISO"
      equipment_status:
        | "active"
        | "inactive"
        | "maintenance"
        | "storage"
        | "retired"
      image_status: "processing" | "ready" | "failed"
      user_role:
        | "owner"
        | "manager"
        | "technician"
        | "viewer"
        | "member"
        | "requestor"
      work_order_status:
        | "open"
        | "in_progress"
        | "closed"
        | "on_hold"
        | "cancelled"
        | "submitted"
        | "accepted"
        | "assigned"
        | "completed"
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
      access_role: ["owner", "manager", "technician", "viewer"],
      datetime_format: [
        "MM/DD/YYYY h:mm A",
        "DD/MM/YYYY h:mm A",
        "YYYY-MM-DD HH:mm:ss",
        "ISO",
      ],
      equipment_status: [
        "active",
        "inactive",
        "maintenance",
        "storage",
        "retired",
      ],
      image_status: ["processing", "ready", "failed"],
      user_role: [
        "owner",
        "manager",
        "technician",
        "viewer",
        "member",
        "requestor",
      ],
      work_order_status: [
        "open",
        "in_progress",
        "closed",
        "on_hold",
        "cancelled",
        "submitted",
        "accepted",
        "assigned",
        "completed",
      ],
    },
  },
} as const
