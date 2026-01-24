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
      chat_messages: {
        Row: {
          content: string
          created_at: string | null
          edit_count: number | null
          id: string
          is_active: boolean | null
          parent_message_id: string | null
          role: string
          session_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          edit_count?: number | null
          id?: string
          is_active?: boolean | null
          parent_message_id?: string | null
          role: string
          session_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          edit_count?: number | null
          id?: string
          is_active?: boolean | null
          parent_message_id?: string | null
          role?: string
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_parent_message_id_fkey"
            columns: ["parent_message_id"]
            isOneToOne: false
            referencedRelation: "chat_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chat_messages_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "chat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_sessions: {
        Row: {
          created_at: string | null
          id: string
          name: string | null
          project_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string | null
          project_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chat_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          email: string | null
          id: string
          share_anonymized_data: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id: string
          share_anonymized_data?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          email?: string | null
          id?: string
          share_anonymized_data?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          active_tab: string | null
          chat_messages: Json | null
          claims: Json | null
          created_at: string | null
          draft_text: string | null
          evaluation_grid: Json | null
          final_draft: string | null
          final_draft_versions: Json | null
          has_verified: boolean | null
          id: string
          instructions: string | null
          interventions: Json | null
          name: string | null
          requirement_checks: Json | null
          rubric_scores: Json | null
          sources: Json | null
          strict_mode: boolean | null
          summary: Json | null
          updated_at: string | null
          user_id: string
          verification_language: string | null
        }
        Insert: {
          active_tab?: string | null
          chat_messages?: Json | null
          claims?: Json | null
          created_at?: string | null
          draft_text?: string | null
          evaluation_grid?: Json | null
          final_draft?: string | null
          final_draft_versions?: Json | null
          has_verified?: boolean | null
          id?: string
          instructions?: string | null
          interventions?: Json | null
          name?: string | null
          requirement_checks?: Json | null
          rubric_scores?: Json | null
          sources?: Json | null
          strict_mode?: boolean | null
          summary?: Json | null
          updated_at?: string | null
          user_id: string
          verification_language?: string | null
        }
        Update: {
          active_tab?: string | null
          chat_messages?: Json | null
          claims?: Json | null
          created_at?: string | null
          draft_text?: string | null
          evaluation_grid?: Json | null
          final_draft?: string | null
          final_draft_versions?: Json | null
          has_verified?: boolean | null
          id?: string
          instructions?: string | null
          interventions?: Json | null
          name?: string | null
          requirement_checks?: Json | null
          rubric_scores?: Json | null
          sources?: Json | null
          strict_mode?: boolean | null
          summary?: Json | null
          updated_at?: string | null
          user_id?: string
          verification_language?: string | null
        }
        Relationships: []
      }
      saved_drafts: {
        Row: {
          content: string
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      source_quality_ratings: {
        Row: {
          avg_relevance: number | null
          created_at: string | null
          id: string
          source_authors: string | null
          source_hash: string
          source_journal: string | null
          source_title: string | null
          source_year: string | null
          support_rate: number | null
          times_partial: number | null
          times_supported: number | null
          times_unsupported: number | null
          times_used: number | null
          topic_areas: string[] | null
          updated_at: string | null
        }
        Insert: {
          avg_relevance?: number | null
          created_at?: string | null
          id?: string
          source_authors?: string | null
          source_hash: string
          source_journal?: string | null
          source_title?: string | null
          source_year?: string | null
          support_rate?: number | null
          times_partial?: number | null
          times_supported?: number | null
          times_unsupported?: number | null
          times_used?: number | null
          topic_areas?: string[] | null
          updated_at?: string | null
        }
        Update: {
          avg_relevance?: number | null
          created_at?: string | null
          id?: string
          source_authors?: string | null
          source_hash?: string
          source_journal?: string | null
          source_title?: string | null
          source_year?: string | null
          support_rate?: number | null
          times_partial?: number | null
          times_supported?: number | null
          times_unsupported?: number | null
          times_used?: number | null
          topic_areas?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      system_knowledge: {
        Row: {
          category: Database["public"]["Enums"]["knowledge_category"]
          confidence_score: number | null
          created_at: string | null
          data: Json
          id: string
          success_rate: number | null
          topic: string | null
          topic_hash: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: Database["public"]["Enums"]["knowledge_category"]
          confidence_score?: number | null
          created_at?: string | null
          data?: Json
          id?: string
          success_rate?: number | null
          topic?: string | null
          topic_hash?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: Database["public"]["Enums"]["knowledge_category"]
          confidence_score?: number | null
          created_at?: string | null
          data?: Json
          id?: string
          success_rate?: number | null
          topic?: string | null
          topic_hash?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      user_writing_profiles: {
        Row: {
          avg_paragraph_length: number | null
          avg_sentence_length: number | null
          closing_patterns: Json | null
          confidence_score: number | null
          created_at: string
          formality_level: string | null
          id: string
          opening_patterns: Json | null
          preferred_voice: string | null
          primary_language: string | null
          quebec_french_markers: boolean | null
          samples_analyzed: number | null
          transition_phrases: Json | null
          updated_at: string
          user_id: string
          uses_contractions: boolean | null
          vocabulary_level: string | null
        }
        Insert: {
          avg_paragraph_length?: number | null
          avg_sentence_length?: number | null
          closing_patterns?: Json | null
          confidence_score?: number | null
          created_at?: string
          formality_level?: string | null
          id?: string
          opening_patterns?: Json | null
          preferred_voice?: string | null
          primary_language?: string | null
          quebec_french_markers?: boolean | null
          samples_analyzed?: number | null
          transition_phrases?: Json | null
          updated_at?: string
          user_id: string
          uses_contractions?: boolean | null
          vocabulary_level?: string | null
        }
        Update: {
          avg_paragraph_length?: number | null
          avg_sentence_length?: number | null
          closing_patterns?: Json | null
          confidence_score?: number | null
          created_at?: string
          formality_level?: string | null
          id?: string
          opening_patterns?: Json | null
          preferred_voice?: string | null
          primary_language?: string | null
          quebec_french_markers?: boolean | null
          samples_analyzed?: number | null
          transition_phrases?: Json | null
          updated_at?: string
          user_id?: string
          uses_contractions?: boolean | null
          vocabulary_level?: string | null
        }
        Relationships: []
      }
      verification_feedback: {
        Row: {
          accuracy_rating: number | null
          claim_feedback: Json | null
          created_at: string | null
          id: string
          user_id: string
          verification_id: string | null
          was_helpful: boolean | null
        }
        Insert: {
          accuracy_rating?: number | null
          claim_feedback?: Json | null
          created_at?: string | null
          id?: string
          user_id: string
          verification_id?: string | null
          was_helpful?: boolean | null
        }
        Update: {
          accuracy_rating?: number | null
          claim_feedback?: Json | null
          created_at?: string | null
          id?: string
          user_id?: string
          verification_id?: string | null
          was_helpful?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "verification_feedback_verification_id_fkey"
            columns: ["verification_id"]
            isOneToOne: false
            referencedRelation: "verification_history"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_history: {
        Row: {
          claims: Json
          created_at: string | null
          draft_text: string | null
          evaluation_grid_snapshot: Json | null
          id: string
          instructions_snapshot: string | null
          interventions: Json | null
          language: string | null
          project_id: string | null
          requirement_checks: Json | null
          rubric_scores: Json | null
          sources_snapshot: Json | null
          strict_mode: boolean | null
          summary: Json | null
          user_id: string
        }
        Insert: {
          claims?: Json
          created_at?: string | null
          draft_text?: string | null
          evaluation_grid_snapshot?: Json | null
          id?: string
          instructions_snapshot?: string | null
          interventions?: Json | null
          language?: string | null
          project_id?: string | null
          requirement_checks?: Json | null
          rubric_scores?: Json | null
          sources_snapshot?: Json | null
          strict_mode?: boolean | null
          summary?: Json | null
          user_id: string
        }
        Update: {
          claims?: Json
          created_at?: string | null
          draft_text?: string | null
          evaluation_grid_snapshot?: Json | null
          id?: string
          instructions_snapshot?: string | null
          interventions?: Json | null
          language?: string | null
          project_id?: string | null
          requirement_checks?: Json | null
          rubric_scores?: Json | null
          sources_snapshot?: Json | null
          strict_mode?: boolean | null
          summary?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_history_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
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
      knowledge_category:
        | "common_error"
        | "source_quality"
        | "intervention_pattern"
        | "requirement_template"
        | "topic_insight"
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
      knowledge_category: [
        "common_error",
        "source_quality",
        "intervention_pattern",
        "requirement_template",
        "topic_insight",
      ],
    },
  },
} as const
