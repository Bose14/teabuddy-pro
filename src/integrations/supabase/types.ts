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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      daily_cash_flow: {
        Row: {
          cash_expenses: number
          cash_sales: number
          closing_cash: number
          created_at: string
          daily_profit: number | null
          daily_sales: number | null
          date: string
          expected_closing_cash: number | null
          id: string
          notes: string | null
          online_expenses: number
          online_sales: number
          total_expenses: number
          updated_at: string
          yesterday_cash: number
        }
        Insert: {
          cash_expenses?: number
          cash_sales?: number
          closing_cash?: number
          created_at?: string
          daily_profit?: number | null
          daily_sales?: number | null
          date?: string
          expected_closing_cash?: number | null
          id?: string
          notes?: string | null
          online_expenses?: number
          online_sales?: number
          total_expenses?: number
          updated_at?: string
          yesterday_cash?: number
        }
        Update: {
          cash_expenses?: number
          cash_sales?: number
          closing_cash?: number
          created_at?: string
          daily_profit?: number | null
          daily_sales?: number | null
          date?: string
          expected_closing_cash?: number | null
          id?: string
          notes?: string | null
          online_expenses?: number
          online_sales?: number
          total_expenses?: number
          updated_at?: string
          yesterday_cash?: number
        }
        Relationships: []
      }
      employees: {
        Row: {
          advance_given: number
          created_at: string
          id: string
          is_active: boolean
          monthly_salary: number
          name: string
          role: string
          updated_at: string
        }
        Insert: {
          advance_given?: number
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_salary?: number
          name: string
          role: string
          updated_at?: string
        }
        Update: {
          advance_given?: number
          created_at?: string
          id?: string
          is_active?: boolean
          monthly_salary?: number
          name?: string
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          amount: number
          created_at: string
          date: string
          employee_id: string | null
          expense_type: string
          id: string
          is_salary_payment: boolean | null
          notes: string | null
          payment_method: string
          vendor_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          date?: string
          employee_id?: string | null
          expense_type: string
          id?: string
          is_salary_payment?: boolean | null
          notes?: string | null
          payment_method?: string
          vendor_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          date?: string
          employee_id?: string | null
          expense_type?: string
          id?: string
          is_salary_payment?: boolean | null
          notes?: string | null
          payment_method?: string
          vendor_name?: string | null
        }
        Relationships: []
      }
      salary_payments: {
        Row: {
          amount: number
          created_at: string
          employee_id: string
          id: string
          month: string
          notes: string | null
          payment_method: string
          payment_type: string
          year: number
        }
        Insert: {
          amount: number
          created_at?: string
          employee_id: string
          id?: string
          month: string
          notes?: string | null
          payment_method?: string
          payment_type?: string
          year: number
        }
        Update: {
          amount?: number
          created_at?: string
          employee_id?: string
          id?: string
          month?: string
          notes?: string | null
          payment_method?: string
          payment_type?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "salary_payments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      stock: {
        Row: {
          category: string
          closing_stock: number | null
          created_at: string
          expiry_date: string | null
          id: string
          low_stock_threshold: number
          opening_stock: number
          product_name: string
          purchase_price: number
          purchased_qty: number
          selling_price: number
          unit: string
          updated_at: string
          used_sold_qty: number
          vendor: string | null
        }
        Insert: {
          category: string
          closing_stock?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          low_stock_threshold?: number
          opening_stock?: number
          product_name: string
          purchase_price?: number
          purchased_qty?: number
          selling_price?: number
          unit?: string
          updated_at?: string
          used_sold_qty?: number
          vendor?: string | null
        }
        Update: {
          category?: string
          closing_stock?: number | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          low_stock_threshold?: number
          opening_stock?: number
          product_name?: string
          purchase_price?: number
          purchased_qty?: number
          selling_price?: number
          unit?: string
          updated_at?: string
          used_sold_qty?: number
          vendor?: string | null
        }
        Relationships: []
      }
      stock_transactions: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          quantity: number
          stock_id: string
          transaction_type: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          quantity: number
          stock_id: string
          transaction_type: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          quantity?: number
          stock_id?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transactions_stock_id_fkey"
            columns: ["stock_id"]
            isOneToOne: false
            referencedRelation: "stock"
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
      expense_type:
        | "Milk"
        | "Oil"
        | "Sugar"
        | "Vegetables"
        | "Salary"
        | "Rent"
        | "Electricity"
        | "Gas"
        | "Others"
      payment_method: "Cash" | "Online"
      stock_category: "Raw Materials" | "Resale Items"
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
      expense_type: [
        "Milk",
        "Oil",
        "Sugar",
        "Vegetables",
        "Salary",
        "Rent",
        "Electricity",
        "Gas",
        "Others",
      ],
      payment_method: ["Cash", "Online"],
      stock_category: ["Raw Materials", "Resale Items"],
    },
  },
} as const
