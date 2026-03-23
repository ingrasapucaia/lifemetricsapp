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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          area: string
          created_at: string
          date: string
          feeling: string
          goal_id: string | null
          icon: string | null
          id: string
          origin: string | null
          title: string
          user_id: string
        }
        Insert: {
          area: string
          created_at?: string
          date?: string
          feeling?: string
          goal_id?: string | null
          icon?: string | null
          id?: string
          origin?: string | null
          title: string
          user_id: string
        }
        Update: {
          area?: string
          created_at?: string
          date?: string
          feeling?: string
          goal_id?: string | null
          icon?: string | null
          id?: string
          origin?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievements_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      deadline_acknowledgments: {
        Row: {
          acknowledged_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          acknowledged_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          acknowledged_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      goal_actions: {
        Row: {
          completed: boolean
          created_at: string
          goal_id: string
          id: string
          priority: string | null
          title: string
        }
        Insert: {
          completed?: boolean
          created_at?: string
          goal_id: string
          id?: string
          priority?: string | null
          title: string
        }
        Update: {
          completed?: boolean
          created_at?: string
          goal_id?: string
          id?: string
          priority?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_actions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          aligned_with_goal: boolean
          completed_at: string | null
          created_at: string
          deadline: string | null
          id: string
          life_area: string | null
          reward: string | null
          status: string
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          aligned_with_goal?: boolean
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          life_area?: string | null
          reward?: string | null
          status?: string
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          aligned_with_goal?: boolean
          completed_at?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          life_area?: string | null
          reward?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          challenges: string[] | null
          created_at: string
          gender: string | null
          id: string
          insights_tone: string | null
          life_areas: string[] | null
          life_goals: string | null
          main_objective: string[] | null
          name: string | null
          onboarding_completed: boolean
          opportunities: string[] | null
          strengths: string[] | null
          updated_at: string
          user_id: string
          week_starts_monday: boolean | null
        }
        Insert: {
          challenges?: string[] | null
          created_at?: string
          gender?: string | null
          id?: string
          insights_tone?: string | null
          life_areas?: string[] | null
          life_goals?: string | null
          main_objective?: string[] | null
          name?: string | null
          onboarding_completed?: boolean
          opportunities?: string[] | null
          strengths?: string[] | null
          updated_at?: string
          user_id: string
          week_starts_monday?: boolean | null
        }
        Update: {
          challenges?: string[] | null
          created_at?: string
          gender?: string | null
          id?: string
          insights_tone?: string | null
          life_areas?: string[] | null
          life_goals?: string | null
          main_objective?: string[] | null
          name?: string | null
          onboarding_completed?: boolean
          opportunities?: string[] | null
          strengths?: string[] | null
          updated_at?: string
          user_id?: string
          week_starts_monday?: boolean | null
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          date: string
          goal_id: string | null
          icon: string | null
          id: string
          life_areas: string[] | null
          note: string | null
          priority: string
          reward: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          goal_id?: string | null
          icon?: string | null
          id?: string
          life_areas?: string[] | null
          note?: string | null
          priority?: string
          reward?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          date?: string
          goal_id?: string | null
          icon?: string | null
          id?: string
          life_areas?: string[] | null
          note?: string | null
          priority?: string
          reward?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
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
      [_ in never]: never
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
    Enums: {},
  },
} as const
