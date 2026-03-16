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
      case_documents: {
        Row: {
          case_id: string
          citizen_id: string
          created_at: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size_kb: number | null
          file_url: string
          id: string
          is_ai_generated: boolean | null
          mime_type: string | null
          ocr_summary: string | null
          ocr_text: string | null
        }
        Insert: {
          case_id: string
          citizen_id: string
          created_at?: string | null
          document_type: Database["public"]["Enums"]["document_type"]
          file_name: string
          file_size_kb?: number | null
          file_url: string
          id?: string
          is_ai_generated?: boolean | null
          mime_type?: string | null
          ocr_summary?: string | null
          ocr_text?: string | null
        }
        Update: {
          case_id?: string
          citizen_id?: string
          created_at?: string | null
          document_type?: Database["public"]["Enums"]["document_type"]
          file_name?: string
          file_size_kb?: number | null
          file_url?: string
          id?: string
          is_ai_generated?: boolean | null
          mime_type?: string | null
          ocr_summary?: string | null
          ocr_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_documents_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_pipeline: {
        Row: {
          accepted_at: string | null
          case_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          lawyer_id: string
          lawyer_notes: string | null
          next_milestone: string | null
          offer_amount: number | null
          offer_note: string | null
          offer_sent_at: string | null
          outcome: Database["public"]["Enums"]["case_outcome"] | null
          show_on_profile: boolean | null
          stage: Database["public"]["Enums"]["pipeline_stage"] | null
          updated_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          case_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lawyer_id: string
          lawyer_notes?: string | null
          next_milestone?: string | null
          offer_amount?: number | null
          offer_note?: string | null
          offer_sent_at?: string | null
          outcome?: Database["public"]["Enums"]["case_outcome"] | null
          show_on_profile?: boolean | null
          stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          updated_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          case_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          lawyer_id?: string
          lawyer_notes?: string | null
          next_milestone?: string | null
          offer_amount?: number | null
          offer_note?: string | null
          offer_sent_at?: string | null
          outcome?: Database["public"]["Enums"]["case_outcome"] | null
          show_on_profile?: boolean | null
          stage?: Database["public"]["Enums"]["pipeline_stage"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_pipeline_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_pipeline_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_state: {
        Row: {
          action_plan: Json | null
          agent_trace: Json | null
          case_id: string
          created_at: string | null
          current_agent: string | null
          evidence_inventory: Json | null
          fact_confirmation_status: string | null
          generated_documents: Json | null
          human_review_flags: Json | null
          id: string
          language_preference: string | null
          legal_mapping: Json | null
          ocr_documents: Json | null
          pipeline_status: string | null
          raw_narrative: string | null
          reasoning_trace: Json | null
          retrieved_chunks: Json | null
          state_jurisdiction: string | null
          structured_facts: Json | null
          updated_at: string | null
          user_feedback: Json | null
        }
        Insert: {
          action_plan?: Json | null
          agent_trace?: Json | null
          case_id: string
          created_at?: string | null
          current_agent?: string | null
          evidence_inventory?: Json | null
          fact_confirmation_status?: string | null
          generated_documents?: Json | null
          human_review_flags?: Json | null
          id?: string
          language_preference?: string | null
          legal_mapping?: Json | null
          ocr_documents?: Json | null
          pipeline_status?: string | null
          raw_narrative?: string | null
          reasoning_trace?: Json | null
          retrieved_chunks?: Json | null
          state_jurisdiction?: string | null
          structured_facts?: Json | null
          updated_at?: string | null
          user_feedback?: Json | null
        }
        Update: {
          action_plan?: Json | null
          agent_trace?: Json | null
          case_id?: string
          created_at?: string | null
          current_agent?: string | null
          evidence_inventory?: Json | null
          fact_confirmation_status?: string | null
          generated_documents?: Json | null
          human_review_flags?: Json | null
          id?: string
          language_preference?: string | null
          legal_mapping?: Json | null
          ocr_documents?: Json | null
          pipeline_status?: string | null
          raw_narrative?: string | null
          reasoning_trace?: Json | null
          retrieved_chunks?: Json | null
          state_jurisdiction?: string | null
          structured_facts?: Json | null
          updated_at?: string | null
          user_feedback?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "case_state_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_timeline: {
        Row: {
          agent_name: string | null
          case_id: string
          created_at: string | null
          description: string | null
          event_type: string
          id: string
          metadata: Json | null
        }
        Insert: {
          agent_name?: string | null
          case_id: string
          created_at?: string | null
          description?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
        }
        Update: {
          agent_name?: string | null
          case_id?: string
          created_at?: string | null
          description?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "case_timeline_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          analysis_duration_ms: number | null
          applicable_laws: Json | null
          budget_max: number | null
          budget_min: number | null
          case_brief: Json | null
          citizen_id: string
          completed_at: string | null
          confidence_score: number | null
          confirmed_facts: Json | null
          created_at: string | null
          district: string | null
          domain: Database["public"]["Enums"]["legal_domain"]
          evidence_inventory: Json | null
          id: string
          incident_date: string | null
          incident_description: string | null
          incident_location: string | null
          is_seeking_lawyer: boolean | null
          lawyer_matched_at: string | null
          preferred_district: string | null
          preferred_state: string | null
          recommended_strategy: Json | null
          state: string | null
          status: Database["public"]["Enums"]["case_status"] | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          analysis_duration_ms?: number | null
          applicable_laws?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          case_brief?: Json | null
          citizen_id: string
          completed_at?: string | null
          confidence_score?: number | null
          confirmed_facts?: Json | null
          created_at?: string | null
          district?: string | null
          domain: Database["public"]["Enums"]["legal_domain"]
          evidence_inventory?: Json | null
          id?: string
          incident_date?: string | null
          incident_description?: string | null
          incident_location?: string | null
          is_seeking_lawyer?: boolean | null
          lawyer_matched_at?: string | null
          preferred_district?: string | null
          preferred_state?: string | null
          recommended_strategy?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          analysis_duration_ms?: number | null
          applicable_laws?: Json | null
          budget_max?: number | null
          budget_min?: number | null
          case_brief?: Json | null
          citizen_id?: string
          completed_at?: string | null
          confidence_score?: number | null
          confirmed_facts?: Json | null
          created_at?: string | null
          district?: string | null
          domain?: Database["public"]["Enums"]["legal_domain"]
          evidence_inventory?: Json | null
          id?: string
          incident_date?: string | null
          incident_description?: string | null
          incident_location?: string | null
          is_seeking_lawyer?: boolean | null
          lawyer_matched_at?: string | null
          preferred_district?: string | null
          preferred_state?: string | null
          recommended_strategy?: Json | null
          state?: string | null
          status?: Database["public"]["Enums"]["case_status"] | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      citizen_profiles: {
        Row: {
          created_at: string | null
          district: string | null
          email: string | null
          full_name: string | null
          id: string
          is_active: boolean | null
          phone: string | null
          preferred_lang: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          district?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          phone?: string | null
          preferred_lang?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          district?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          phone?: string | null
          preferred_lang?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      evidence: {
        Row: {
          case_id: string
          citizen_id: string
          created_at: string | null
          date_of_evidence: string | null
          evidence_type: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          is_processed: boolean | null
          ocr_summary: string | null
          ocr_text: string | null
          relevance_score: number | null
          tags: Json | null
        }
        Insert: {
          case_id: string
          citizen_id: string
          created_at?: string | null
          date_of_evidence?: string | null
          evidence_type?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          is_processed?: boolean | null
          ocr_summary?: string | null
          ocr_text?: string | null
          relevance_score?: number | null
          tags?: Json | null
        }
        Update: {
          case_id?: string
          citizen_id?: string
          created_at?: string | null
          date_of_evidence?: string | null
          evidence_type?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          is_processed?: boolean | null
          ocr_summary?: string | null
          ocr_text?: string | null
          relevance_score?: number | null
          tags?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "evidence_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evidence_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          case_id: string
          citizen_id: string
          comment: string | null
          created_at: string | null
          feedback_type: string
          id: string
          section: string
        }
        Insert: {
          case_id: string
          citizen_id: string
          comment?: string | null
          created_at?: string | null
          feedback_type: string
          id?: string
          section: string
        }
        Update: {
          case_id?: string
          citizen_id?: string
          comment?: string | null
          created_at?: string | null
          feedback_type?: string
          id?: string
          section?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizen_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_case_history: {
        Row: {
          court_type: string | null
          created_at: string | null
          description: string | null
          domain: Database["public"]["Enums"]["legal_domain"]
          id: string
          is_platform_case: boolean | null
          lawyer_id: string
          outcome: Database["public"]["Enums"]["case_outcome"]
          pipeline_id: string | null
          year: number
        }
        Insert: {
          court_type?: string | null
          created_at?: string | null
          description?: string | null
          domain: Database["public"]["Enums"]["legal_domain"]
          id?: string
          is_platform_case?: boolean | null
          lawyer_id: string
          outcome: Database["public"]["Enums"]["case_outcome"]
          pipeline_id?: string | null
          year: number
        }
        Update: {
          court_type?: string | null
          created_at?: string | null
          description?: string | null
          domain?: Database["public"]["Enums"]["legal_domain"]
          id?: string
          is_platform_case?: boolean | null
          lawyer_id?: string
          outcome?: Database["public"]["Enums"]["case_outcome"]
          pipeline_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_case_history_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_case_history_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "case_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_profiles: {
        Row: {
          avg_rating: number | null
          bar_council_id: string | null
          bio: string | null
          completeness_score: number | null
          court_types: string[] | null
          created_at: string | null
          email: string
          enrollment_number: string | null
          enrollment_year: number | null
          experience_years: number | null
          fee_max: number | null
          fee_min: number | null
          full_name: string
          id: string
          is_active: boolean | null
          is_available: boolean | null
          languages: string[] | null
          phone: string | null
          practice_district: string | null
          practice_state: string | null
          primary_category: string | null
          professional_title: string | null
          profile_photo_url: string | null
          response_time_hours: number | null
          specialisations: Database["public"]["Enums"]["legal_domain"][] | null
          state_bar_council: string | null
          total_cases: number | null
          total_reviews: number | null
          updated_at: string | null
          verification_status:
            | Database["public"]["Enums"]["verification_status"]
            | null
          win_rate: number | null
        }
        Insert: {
          avg_rating?: number | null
          bar_council_id?: string | null
          bio?: string | null
          completeness_score?: number | null
          court_types?: string[] | null
          created_at?: string | null
          email?: string
          enrollment_number?: string | null
          enrollment_year?: number | null
          experience_years?: number | null
          fee_max?: number | null
          fee_min?: number | null
          full_name?: string
          id: string
          is_active?: boolean | null
          is_available?: boolean | null
          languages?: string[] | null
          phone?: string | null
          practice_district?: string | null
          practice_state?: string | null
          primary_category?: string | null
          professional_title?: string | null
          profile_photo_url?: string | null
          response_time_hours?: number | null
          specialisations?: Database["public"]["Enums"]["legal_domain"][] | null
          state_bar_council?: string | null
          total_cases?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          win_rate?: number | null
        }
        Update: {
          avg_rating?: number | null
          bar_council_id?: string | null
          bio?: string | null
          completeness_score?: number | null
          court_types?: string[] | null
          created_at?: string | null
          email?: string
          enrollment_number?: string | null
          enrollment_year?: number | null
          experience_years?: number | null
          fee_max?: number | null
          fee_min?: number | null
          full_name?: string
          id?: string
          is_active?: boolean | null
          is_available?: boolean | null
          languages?: string[] | null
          phone?: string | null
          practice_district?: string | null
          practice_state?: string | null
          primary_category?: string | null
          professional_title?: string | null
          profile_photo_url?: string | null
          response_time_hours?: number | null
          specialisations?: Database["public"]["Enums"]["legal_domain"][] | null
          state_bar_council?: string | null
          total_cases?: number | null
          total_reviews?: number | null
          updated_at?: string | null
          verification_status?:
            | Database["public"]["Enums"]["verification_status"]
            | null
          win_rate?: number | null
        }
        Relationships: []
      }
      lawyer_reviews: {
        Row: {
          case_id: string
          citizen_id: string
          created_at: string | null
          id: string
          is_verified: boolean | null
          lawyer_id: string
          outcome: Database["public"]["Enums"]["case_outcome"] | null
          pipeline_id: string
          rating: number
          review_text: string | null
        }
        Insert: {
          case_id: string
          citizen_id: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          lawyer_id: string
          outcome?: Database["public"]["Enums"]["case_outcome"] | null
          pipeline_id: string
          rating: number
          review_text?: string | null
        }
        Update: {
          case_id?: string
          citizen_id?: string
          created_at?: string | null
          id?: string
          is_verified?: boolean | null
          lawyer_id?: string
          outcome?: Database["public"]["Enums"]["case_outcome"] | null
          pipeline_id?: string
          rating?: number
          review_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_reviews_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_reviews_citizen_id_fkey"
            columns: ["citizen_id"]
            isOneToOne: false
            referencedRelation: "citizen_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_reviews_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_reviews_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "case_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      lawyer_saved_research: {
        Row: {
          case_id: string | null
          case_law: Json | null
          confidence: number | null
          domain: Database["public"]["Enums"]["legal_domain"] | null
          id: string
          lawyer_id: string
          query: string
          result: Json
          saved_at: string | null
          statutes: Json | null
        }
        Insert: {
          case_id?: string | null
          case_law?: Json | null
          confidence?: number | null
          domain?: Database["public"]["Enums"]["legal_domain"] | null
          id?: string
          lawyer_id: string
          query: string
          result: Json
          saved_at?: string | null
          statutes?: Json | null
        }
        Update: {
          case_id?: string | null
          case_law?: Json | null
          confidence?: number | null
          domain?: Database["public"]["Enums"]["legal_domain"] | null
          id?: string
          lawyer_id?: string
          query?: string
          result?: Json
          saved_at?: string | null
          statutes?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "lawyer_saved_research_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_pipeline"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lawyer_saved_research_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "lawyer_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          case_id: string
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          pipeline_id: string | null
          read_at: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          case_id: string
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          pipeline_id?: string | null
          read_at?: string | null
          sender_id: string
          sender_role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          case_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          pipeline_id?: string | null
          read_at?: string | null
          sender_id?: string
          sender_role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_pipeline_id_fkey"
            columns: ["pipeline_id"]
            isOneToOne: false
            referencedRelation: "case_pipeline"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          read_at: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          title: string
          type: Database["public"]["Enums"]["notification_type"]
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          read_at?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notification_type"]
          user_id?: string
        }
        Relationships: []
      }
      pipeline_logs: {
        Row: {
          agent_name: string
          agent_version: string | null
          case_id: string
          confidence: number | null
          created_at: string | null
          duration_ms: number | null
          error_message: string | null
          id: string
          input: Json | null
          llm_model: string | null
          llm_provider: string | null
          output: Json | null
          status: string | null
          tokens_used: number | null
        }
        Insert: {
          agent_name: string
          agent_version?: string | null
          case_id: string
          confidence?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input?: Json | null
          llm_model?: string | null
          llm_provider?: string | null
          output?: Json | null
          status?: string | null
          tokens_used?: number | null
        }
        Update: {
          agent_name?: string
          agent_version?: string | null
          case_id?: string
          confidence?: number | null
          created_at?: string | null
          duration_ms?: number | null
          error_message?: string | null
          id?: string
          input?: Json | null
          llm_model?: string | null
          llm_provider?: string | null
          output?: Json | null
          status?: string | null
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pipeline_logs_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      unassigned_escalations: {
        Row: {
          case_id: string
          created_at: string | null
          escalated_at: string | null
          hours_since_posted: number
          id: string
          is_resolved: boolean | null
          offer_count: number | null
          resolved_at: string | null
          suggested_fee_max: number | null
          suggested_fee_min: number | null
          unassigned_reason: string | null
        }
        Insert: {
          case_id: string
          created_at?: string | null
          escalated_at?: string | null
          hours_since_posted: number
          id?: string
          is_resolved?: boolean | null
          offer_count?: number | null
          resolved_at?: string | null
          suggested_fee_max?: number | null
          suggested_fee_min?: number | null
          unassigned_reason?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string | null
          escalated_at?: string | null
          hours_since_posted?: number
          id?: string
          is_resolved?: boolean | null
          offer_count?: number | null
          resolved_at?: string | null
          suggested_fee_max?: number | null
          suggested_fee_min?: number | null
          unassigned_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "unassigned_escalations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: true
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          active_case_id: string | null
          created_at: string | null
          id: string
          last_activity: string | null
          user_id: string
        }
        Insert: {
          active_case_id?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          user_id: string
        }
        Update: {
          active_case_id?: string | null
          created_at?: string | null
          id?: string
          last_activity?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_sessions_active_case_id_fkey"
            columns: ["active_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      is_admin: { Args: never; Returns: boolean }
      is_citizen: { Args: never; Returns: boolean }
      is_lawyer: { Args: never; Returns: boolean }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      case_outcome: "won" | "settled" | "withdrawn" | "referred" | "pending"
      case_status:
        | "draft"
        | "intake_complete"
        | "analysis_pending"
        | "analysis_complete"
        | "seeking_lawyer"
        | "lawyer_matched"
        | "active"
        | "completed"
        | "closed"
      document_type:
        | "legal_notice"
        | "complaint_draft"
        | "rtr_application"
        | "affidavit"
        | "bail_application"
        | "consumer_complaint"
        | "evidence_summary"
        | "case_brief"
        | "other"
      legal_domain:
        | "consumer"
        | "tenant"
        | "labour"
        | "criminal"
        | "cyber"
        | "property"
        | "family"
        | "rti"
        | "corruption"
        | "civil"
        | "other"
        | "tax"
        | "corporate"
        | "intellectual_property"
        | "constitutional"
        | "banking_finance"
        | "insurance"
        | "matrimonial"
        | "immigration"
        | "environmental"
        | "medical_negligence"
        | "motor_accident"
        | "cheque_bounce"
        | "debt_recovery"
        | "arbitration"
        | "service_matters"
        | "land_acquisition"
        | "wills_succession"
        | "domestic_violence"
        | "pocso"
        | "sc_st_atrocities"
        | "divorce"
      notification_type:
        | "new_case_match"
        | "offer_received"
        | "offer_accepted"
        | "offer_withdrawn"
        | "case_update"
        | "message_received"
        | "profile_viewed"
        | "unassigned_alert"
        | "system"
      pipeline_stage:
        | "pending"
        | "offered"
        | "accepted"
        | "active"
        | "completed"
        | "withdrawn"
      user_role: "citizen" | "lawyer" | "admin"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
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
      case_outcome: ["won", "settled", "withdrawn", "referred", "pending"],
      case_status: [
        "draft",
        "intake_complete",
        "analysis_pending",
        "analysis_complete",
        "seeking_lawyer",
        "lawyer_matched",
        "active",
        "completed",
        "closed",
      ],
      document_type: [
        "legal_notice",
        "complaint_draft",
        "rtr_application",
        "affidavit",
        "bail_application",
        "consumer_complaint",
        "evidence_summary",
        "case_brief",
        "other",
      ],
      legal_domain: [
        "consumer",
        "tenant",
        "labour",
        "criminal",
        "cyber",
        "property",
        "family",
        "rti",
        "corruption",
        "civil",
        "other",
        "tax",
        "corporate",
        "intellectual_property",
        "constitutional",
        "banking_finance",
        "insurance",
        "matrimonial",
        "immigration",
        "environmental",
        "medical_negligence",
        "motor_accident",
        "cheque_bounce",
        "debt_recovery",
        "arbitration",
        "service_matters",
        "land_acquisition",
        "wills_succession",
        "domestic_violence",
        "pocso",
        "sc_st_atrocities",
        "divorce",
      ],
      notification_type: [
        "new_case_match",
        "offer_received",
        "offer_accepted",
        "offer_withdrawn",
        "case_update",
        "message_received",
        "profile_viewed",
        "unassigned_alert",
        "system",
      ],
      pipeline_stage: [
        "pending",
        "offered",
        "accepted",
        "active",
        "completed",
        "withdrawn",
      ],
      user_role: ["citizen", "lawyer", "admin"],
      verification_status: ["unverified", "pending", "verified", "rejected"],
    },
  },
} as const
