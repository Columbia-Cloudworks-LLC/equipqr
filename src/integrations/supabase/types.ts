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
          org_id: string | null
          ts: string
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
          org_id?: string | null
          ts?: string
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
          org_id?: string | null
          ts?: string
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
          created_by: string
          deleted_at: string | null
          id: string
          install_date: string | null
          location: string | null
          manufacturer: string | null
          model: string | null
          name: string
          org_id: string
          serial_number: string | null
          status: Database["public"]["Enums"]["equipment_status"]
          team_id: string | null
          updated_at: string
          warranty_expiration: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          install_date?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name: string
          org_id: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          team_id?: string | null
          updated_at?: string
          warranty_expiration?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          install_date?: string | null
          location?: string | null
          manufacturer?: string | null
          model?: string | null
          name?: string
          org_id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["equipment_status"]
          team_id?: string | null
          updated_at?: string
          warranty_expiration?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "equipment_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
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
          uploaded_by: string
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
          uploaded_by: string
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
          uploaded_by?: string
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
            foreignKeyName: "image_upload_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "app_user"
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
      organization: {
        Row: {
          created_at: string
          deleted_at: string | null
          id: string
          name: string
          owner_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name: string
          owner_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          id?: string
          name?: string
          owner_user_id?: string | null
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
      scan_history: {
        Row: {
          equipment_id: string
          id: string
          scanned_by_user_id: string | null
          scanned_from_ip: unknown | null
          ts: string
        }
        Insert: {
          equipment_id: string
          id?: string
          scanned_by_user_id?: string | null
          scanned_from_ip?: unknown | null
          ts?: string
        }
        Update: {
          equipment_id?: string
          id?: string
          scanned_by_user_id?: string | null
          scanned_from_ip?: unknown | null
          ts?: string
        }
        Relationships: [
          {
            foreignKeyName: "scan_history_equipment_id_fkey"
            columns: ["equipment_id"]
            isOneToOne: false
            referencedRelation: "equipment"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scan_history_scanned_by_user_id_fkey"
            columns: ["scanned_by_user_id"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
        ]
      }
      team: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          id: string
          name: string
          org_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          id?: string
          name: string
          org_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          id?: string
          name?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organization"
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
      work_note: {
        Row: {
          created_at: string
          created_by: string
          deleted_at: string | null
          equipment_id: string | null
          hours_worked: number | null
          id: string
          note: string
          work_order_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          deleted_at?: string | null
          equipment_id?: string | null
          hours_worked?: number | null
          id?: string
          note: string
          work_order_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          deleted_at?: string | null
          equipment_id?: string | null
          hours_worked?: number | null
          id?: string
          note?: string
          work_order_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_note_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
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
          closed_at: string | null
          created_by: string
          customer_id: string | null
          deleted_at: string | null
          description: string | null
          equipment_id: string
          id: string
          opened_at: string
          org_id: string
          status: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          created_by: string
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          equipment_id: string
          id?: string
          opened_at?: string
          org_id: string
          status?: Database["public"]["Enums"]["work_order_status"]
          title: string
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          created_by?: string
          customer_id?: string | null
          deleted_at?: string | null
          description?: string | null
          equipment_id?: string
          id?: string
          opened_at?: string
          org_id?: string
          status?: Database["public"]["Enums"]["work_order_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "work_order_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_user"
            referencedColumns: ["id"]
          },
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      access_role: "owner" | "manager" | "technician" | "viewer"
      equipment_status: "active" | "inactive" | "maintenance"
      image_status: "processing" | "ready" | "failed"
      work_order_status:
        | "open"
        | "in_progress"
        | "closed"
        | "on_hold"
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
      access_role: ["owner", "manager", "technician", "viewer"],
      equipment_status: ["active", "inactive", "maintenance"],
      image_status: ["processing", "ready", "failed"],
      work_order_status: [
        "open",
        "in_progress",
        "closed",
        "on_hold",
        "cancelled",
      ],
    },
  },
} as const
