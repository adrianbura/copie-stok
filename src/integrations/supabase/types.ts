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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      alerts: {
        Row: {
          acknowledged: boolean | null
          acknowledged_at: string | null
          acknowledged_by: string | null
          created_at: string
          id: string
          message: string
          product_id: string | null
          severity: string
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Insert: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          message: string
          product_id?: string | null
          severity?: string
          title: string
          type: Database["public"]["Enums"]["alert_type"]
        }
        Update: {
          acknowledged?: boolean | null
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          created_at?: string
          id?: string
          message?: string
          product_id?: string | null
          severity?: string
          title?: string
          type?: Database["public"]["Enums"]["alert_type"]
        }
        Relationships: [
          {
            foreignKeyName: "alerts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_documents: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          document_number: string
          id: string
          items: Json
          notes: string | null
          partner: string | null
          total_value: number | null
          type: string
          warehouse: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          document_number: string
          id?: string
          items?: Json
          notes?: string | null
          partner?: string | null
          total_value?: number | null
          type: string
          warehouse?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          document_number?: string
          id?: string
          items?: Json
          notes?: string | null
          partner?: string | null
          total_value?: number | null
          type?: string
          warehouse?: string | null
        }
        Relationships: []
      }
      pending_approvals: {
        Row: {
          approval_token: string
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          rejected_at: string | null
          rejected_by: string | null
          status: string
          user_id: string
        }
        Insert: {
          approval_token?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          user_id: string
        }
        Update: {
          approval_token?: string
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          rejected_at?: string | null
          rejected_by?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          batch_number: string | null
          category: Database["public"]["Enums"]["pyro_category"]
          certification: string | null
          code: string
          created_at: string
          created_by: string | null
          expiry_date: string | null
          hazard_class: string | null
          id: string
          location: string | null
          min_stock: number
          name: string
          net_weight: number | null
          quantity: number
          supplier: string | null
          unit_price: number
          updated_at: string
        }
        Insert: {
          batch_number?: string | null
          category: Database["public"]["Enums"]["pyro_category"]
          certification?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          hazard_class?: string | null
          id?: string
          location?: string | null
          min_stock?: number
          name: string
          net_weight?: number | null
          quantity?: number
          supplier?: string | null
          unit_price?: number
          updated_at?: string
        }
        Update: {
          batch_number?: string | null
          category?: Database["public"]["Enums"]["pyro_category"]
          certification?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          expiry_date?: string | null
          hazard_class?: string | null
          id?: string
          location?: string | null
          min_stock?: number
          name?: string
          net_weight?: number | null
          quantity?: number
          supplier?: string | null
          unit_price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_approved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_approved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reference: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reference?: string | null
          type: Database["public"]["Enums"]["movement_type"]
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference?: string | null
          type?: Database["public"]["Enums"]["movement_type"]
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_operator_names: {
        Args: never
        Returns: {
          full_name: string
          user_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_authenticated: { Args: never; Returns: boolean }
    }
    Enums: {
      alert_type: "expiry" | "low_stock" | "compliance"
      movement_type: "entry" | "exit"
      pyro_category: "F1" | "F2" | "F3" | "F4" | "T1" | "T2"
      user_role: "admin" | "operator" | "viewer"
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
      alert_type: ["expiry", "low_stock", "compliance"],
      movement_type: ["entry", "exit"],
      pyro_category: ["F1", "F2", "F3", "F4", "T1", "T2"],
      user_role: ["admin", "operator", "viewer"],
    },
  },
} as const
