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
      organization_members: {
        Row: {
          id: string
          joined_date: string
          organization_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_date?: string
          organization_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_date?: string
          organization_id?: string
          role?: string
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
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_cycle: string | null
          created_at: string
          features: string[]
          id: string
          max_members: number
          member_count: number
          name: string
          next_billing_date: string | null
          plan: Database["public"]["Enums"]["organization_plan"]
          updated_at: string
        }
        Insert: {
          billing_cycle?: string | null
          created_at?: string
          features?: string[]
          id?: string
          max_members?: number
          member_count?: number
          name: string
          next_billing_date?: string | null
          plan?: Database["public"]["Enums"]["organization_plan"]
          updated_at?: string
        }
        Update: {
          billing_cycle?: string | null
          created_at?: string
          features?: string[]
          id?: string
          max_members?: number
          member_count?: number
          name?: string
          next_billing_date?: string | null
          plan?: Database["public"]["Enums"]["organization_plan"]
          updated_at?: string
        }
        Relationships: []
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
      work_orders: {
        Row: {
          assignee_id: string | null
          completed_date: string | null
          created_by: string
          created_date: string
          description: string
          due_date: string | null
          equipment_id: string
          estimated_hours: number | null
          id: string
          organization_id: string
          priority: Database["public"]["Enums"]["work_order_priority"]
          status: Database["public"]["Enums"]["work_order_status"]
          team_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          completed_date?: string | null
          created_by: string
          created_date?: string
          description: string
          due_date?: string | null
          equipment_id: string
          estimated_hours?: number | null
          id?: string
          organization_id: string
          priority?: Database["public"]["Enums"]["work_order_priority"]
          status?: Database["public"]["Enums"]["work_order_status"]
          team_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          completed_date?: string | null
          created_by?: string
          created_date?: string
          description?: string
          due_date?: string | null
          equipment_id?: string
          estimated_hours?: number | null
          id?: string
          organization_id?: string
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
      [_ in never]: never
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
