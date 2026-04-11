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
      admin_saved_filters: {
        Row: {
          created_at: string
          filter_config: Json
          filter_name: string
          id: string
          page_key: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filter_config?: Json
          filter_name: string
          id?: string
          page_key: string
          user_id: string
        }
        Update: {
          created_at?: string
          filter_config?: Json
          filter_name?: string
          id?: string
          page_key?: string
          user_id?: string
        }
        Relationships: []
      }
      amortized_expenses: {
        Row: {
          annual_amount: number
          category_id: string | null
          created_at: string
          end_date: string
          id: string
          monthly_amount: number | null
          name: string
          notes: string | null
          start_date: string
          user_id: string
        }
        Insert: {
          annual_amount: number
          category_id?: string | null
          created_at?: string
          end_date: string
          id?: string
          monthly_amount?: number | null
          name: string
          notes?: string | null
          start_date: string
          user_id: string
        }
        Update: {
          annual_amount?: number
          category_id?: string | null
          created_at?: string
          end_date?: string
          id?: string
          monthly_amount?: number | null
          name?: string
          notes?: string | null
          start_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amortized_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      apostille_requests: {
        Row: {
          client_id: string
          created_at: string
          destination_country: string | null
          document_count: number
          document_description: string
          fee: number | null
          id: string
          notes: string | null
          shipping_label_url: string | null
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          destination_country?: string | null
          document_count?: number
          document_description: string
          fee?: number | null
          id?: string
          notes?: string | null
          shipping_label_url?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          destination_country?: string | null
          document_count?: number
          document_description?: string
          fee?: number | null
          id?: string
          notes?: string | null
          shipping_label_url?: string | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "apostille_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      appointment_emails: {
        Row: {
          appointment_id: string
          email_type: string
          id: string
          sent_at: string
        }
        Insert: {
          appointment_id: string
          email_type: string
          id?: string
          sent_at?: string
        }
        Update: {
          appointment_id?: string
          email_type?: string
          id?: string
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointment_emails_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      appointments: {
        Row: {
          admin_notes: string | null
          after_hours_fee: number | null
          appointment_duration_actual: number | null
          booking_source: string | null
          client_address: string | null
          client_id: string
          confirmation_number: string | null
          created_at: string
          entity_name: string | null
          estimated_price: number | null
          facility_contact: string | null
          facility_name: string | null
          facility_room: string | null
          id: string
          location: string | null
          notarization_type: Database["public"]["Enums"]["notarization_type"]
          notary_id: string | null
          notes: string | null
          recurrence_rule: string | null
          referral_professional_id: string | null
          referral_source: string | null
          refusal_reason: string | null
          refused_at: string | null
          rescheduled_from: string | null
          scheduled_date: string
          scheduled_time: string
          service_type: string
          session_recording_duration: number | null
          signer_count: number | null
          signer_title: string | null
          signing_capacity: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          travel_distance_miles: number | null
          travel_fee_estimate: number | null
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          after_hours_fee?: number | null
          appointment_duration_actual?: number | null
          booking_source?: string | null
          client_address?: string | null
          client_id: string
          confirmation_number?: string | null
          created_at?: string
          entity_name?: string | null
          estimated_price?: number | null
          facility_contact?: string | null
          facility_name?: string | null
          facility_room?: string | null
          id?: string
          location?: string | null
          notarization_type?: Database["public"]["Enums"]["notarization_type"]
          notary_id?: string | null
          notes?: string | null
          recurrence_rule?: string | null
          referral_professional_id?: string | null
          referral_source?: string | null
          refusal_reason?: string | null
          refused_at?: string | null
          rescheduled_from?: string | null
          scheduled_date: string
          scheduled_time: string
          service_type: string
          session_recording_duration?: number | null
          signer_count?: number | null
          signer_title?: string | null
          signing_capacity?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          travel_distance_miles?: number | null
          travel_fee_estimate?: number | null
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          after_hours_fee?: number | null
          appointment_duration_actual?: number | null
          booking_source?: string | null
          client_address?: string | null
          client_id?: string
          confirmation_number?: string | null
          created_at?: string
          entity_name?: string | null
          estimated_price?: number | null
          facility_contact?: string | null
          facility_name?: string | null
          facility_room?: string | null
          id?: string
          location?: string | null
          notarization_type?: Database["public"]["Enums"]["notarization_type"]
          notary_id?: string | null
          notes?: string | null
          recurrence_rule?: string | null
          referral_professional_id?: string | null
          referral_source?: string | null
          refusal_reason?: string | null
          refused_at?: string | null
          rescheduled_from?: string | null
          scheduled_date?: string
          scheduled_time?: string
          service_type?: string
          session_recording_duration?: number | null
          signer_count?: number | null
          signer_title?: string | null
          signing_capacity?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          travel_distance_miles?: number | null
          travel_fee_estimate?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_rescheduled_from_fkey"
            columns: ["rescheduled_from"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      background_checks: {
        Row: {
          agency: string | null
          check_type: string
          client_id: string
          created_at: string
          fee: number | null
          fingerprint_session_id: string | null
          fingerprints_required: boolean
          id: string
          notes: string | null
          purpose: string | null
          result_date: string | null
          result_file_path: string | null
          result_status: string | null
          status: string
          subject_name: string
          updated_at: string
        }
        Insert: {
          agency?: string | null
          check_type?: string
          client_id: string
          created_at?: string
          fee?: number | null
          fingerprint_session_id?: string | null
          fingerprints_required?: boolean
          id?: string
          notes?: string | null
          purpose?: string | null
          result_date?: string | null
          result_file_path?: string | null
          result_status?: string | null
          status?: string
          subject_name: string
          updated_at?: string
        }
        Update: {
          agency?: string | null
          check_type?: string
          client_id?: string
          created_at?: string
          fee?: number | null
          fingerprint_session_id?: string | null
          fingerprints_required?: boolean
          id?: string
          notes?: string | null
          purpose?: string | null
          result_date?: string | null
          result_file_path?: string | null
          result_status?: string | null
          status?: string
          subject_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "background_checks_fingerprint_session_id_fkey"
            columns: ["fingerprint_session_id"]
            isOneToOne: false
            referencedRelation: "fingerprint_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      booking_drafts: {
        Row: {
          created_at: string
          draft_data: Json
          id: string
          step: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draft_data?: Json
          id?: string
          step?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          draft_data?: Json
          id?: string
          step?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      build_tracker_items: {
        Row: {
          admin_notes: string | null
          category: string
          created_at: string | null
          description: string | null
          flow_steps: Json | null
          id: string
          impact_area: string | null
          is_on_todo: boolean
          page_route: string | null
          plan_id: string | null
          resolved_at: string | null
          severity: string
          status: string
          suggested_fix: string | null
          title: string
          todo_priority: number | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          flow_steps?: Json | null
          id?: string
          impact_area?: string | null
          is_on_todo?: boolean
          page_route?: string | null
          plan_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          suggested_fix?: string | null
          title: string
          todo_priority?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          flow_steps?: Json | null
          id?: string
          impact_area?: string | null
          is_on_todo?: boolean
          page_route?: string | null
          plan_id?: string | null
          resolved_at?: string | null
          severity?: string
          status?: string
          suggested_fix?: string | null
          title?: string
          todo_priority?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "build_tracker_items_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "build_tracker_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      build_tracker_plans: {
        Row: {
          chat_context: string | null
          created_at: string | null
          id: string
          plan_items: Json
          plan_summary: string | null
          plan_title: string
          source: string
          updated_at: string | null
        }
        Insert: {
          chat_context?: string | null
          created_at?: string | null
          id?: string
          plan_items?: Json
          plan_summary?: string | null
          plan_title: string
          source?: string
          updated_at?: string | null
        }
        Update: {
          chat_context?: string | null
          created_at?: string | null
          id?: string
          plan_items?: Json
          plan_summary?: string | null
          plan_title?: string
          source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      business_members: {
        Row: {
          business_id: string
          created_at: string
          id: string
          member_role: string
          user_id: string
        }
        Insert: {
          business_id: string
          created_at?: string
          id?: string
          member_role?: string
          user_id: string
        }
        Update: {
          business_id?: string
          created_at?: string
          id?: string
          member_role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "business_members_business_id_fkey"
            columns: ["business_id"]
            isOneToOne: false
            referencedRelation: "business_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      business_profiles: {
        Row: {
          articles_file_path: string | null
          authorized_signers: Json | null
          business_name: string
          business_type: string | null
          created_at: string
          created_by: string
          ein: string | null
          id: string
          updated_at: string
          verification_status: string
        }
        Insert: {
          articles_file_path?: string | null
          authorized_signers?: Json | null
          business_name: string
          business_type?: string | null
          created_at?: string
          created_by: string
          ein?: string | null
          id?: string
          updated_at?: string
          verification_status?: string
        }
        Update: {
          articles_file_path?: string | null
          authorized_signers?: Json | null
          business_name?: string
          business_type?: string | null
          created_at?: string
          created_by?: string
          ein?: string | null
          id?: string
          updated_at?: string
          verification_status?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachment_url: string | null
          created_at: string
          id: string
          is_admin: boolean | null
          message: string
          read: boolean | null
          recipient_id: string | null
          sender_id: string
        }
        Insert: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id: string
        }
        Update: {
          attachment_url?: string | null
          created_at?: string
          id?: string
          is_admin?: boolean | null
          message?: string
          read?: boolean | null
          recipient_id?: string | null
          sender_id?: string
        }
        Relationships: []
      }
      client_correspondence: {
        Row: {
          body: string
          client_id: string
          created_at: string
          direction: string
          from_address: string | null
          handled_at: string | null
          handled_by: string | null
          id: string
          notes: string | null
          status: string
          subject: string
          to_address: string | null
          updated_at: string
        }
        Insert: {
          body: string
          client_id: string
          created_at?: string
          direction?: string
          from_address?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          subject: string
          to_address?: string | null
          updated_at?: string
        }
        Update: {
          body?: string
          client_id?: string
          created_at?: string
          direction?: string
          from_address?: string | null
          handled_at?: string | null
          handled_by?: string | null
          id?: string
          notes?: string | null
          status?: string
          subject?: string
          to_address?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_correspondence_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      client_feedback: {
        Row: {
          appointment_id: string | null
          client_id: string
          comment: string | null
          created_at: string
          id: string
          nps_score: number | null
          rating: number
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          nps_score?: number | null
          rating: number
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          nps_score?: number | null
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "client_feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      client_style_profiles: {
        Row: {
          created_at: string
          id: string
          profile_name: string
          sample_texts: string[]
          style_analysis: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profile_name?: string
          sample_texts?: string[]
          style_analysis?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profile_name?: string
          sample_texts?: string[]
          style_analysis?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      compliance_calendars: {
        Row: {
          calendar_name: string
          client_id: string
          created_at: string
          entity_name: string | null
          entries: Json
          id: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          calendar_name: string
          client_id: string
          created_at?: string
          entity_name?: string | null
          entries?: Json
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          calendar_name?: string
          client_id?: string
          created_at?: string
          entity_name?: string | null
          entries?: Json
          id?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          created_at: string
          data: Json
          generated_by: string | null
          id: string
          report_month: string
          report_type: string
        }
        Insert: {
          created_at?: string
          data?: Json
          generated_by?: string | null
          id?: string
          report_month: string
          report_type?: string
        }
        Update: {
          created_at?: string
          data?: Json
          generated_by?: string | null
          id?: string
          report_month?: string
          report_type?: string
        }
        Relationships: []
      }
      compliance_rule_sets: {
        Row: {
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          rules: Json
          updated_at: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          rules?: Json
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          rules?: Json
          updated_at?: string
        }
        Relationships: []
      }
      content_posts: {
        Row: {
          author_id: string
          body: string | null
          category: string
          created_at: string
          hero_image_url: string | null
          id: string
          published_at: string | null
          service_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id: string
          body?: string | null
          category?: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          published_at?: string | null
          service_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string | null
          category?: string
          created_at?: string
          hero_image_url?: string | null
          id?: string
          published_at?: string | null
          service_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      continuing_education: {
        Row: {
          certificate_path: string | null
          completed_date: string
          course_name: string
          created_at: string
          credits: number
          deadline_date: string | null
          id: string
          notes: string | null
          provider: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          certificate_path?: string | null
          completed_date: string
          course_name: string
          created_at?: string
          credits?: number
          deadline_date?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          certificate_path?: string | null
          completed_date?: string
          course_name?: string
          created_at?: string
          credits?: number
          deadline_date?: string | null
          id?: string
          notes?: string | null
          provider?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      courier_jobs: {
        Row: {
          chain_of_custody_log: Json | null
          client_id: string
          created_at: string
          delivery_confirmed_at: string | null
          delivery_photo_path: string | null
          distance_miles: number | null
          dropoff_address: string
          fee: number | null
          id: string
          notes: string | null
          package_description: string | null
          pickup_address: string
          requires_signature: boolean
          status: string
          updated_at: string
        }
        Insert: {
          chain_of_custody_log?: Json | null
          client_id: string
          created_at?: string
          delivery_confirmed_at?: string | null
          delivery_photo_path?: string | null
          distance_miles?: number | null
          dropoff_address: string
          fee?: number | null
          id?: string
          notes?: string | null
          package_description?: string | null
          pickup_address: string
          requires_signature?: boolean
          status?: string
          updated_at?: string
        }
        Update: {
          chain_of_custody_log?: Json | null
          client_id?: string
          created_at?: string
          delivery_confirmed_at?: string | null
          delivery_photo_path?: string | null
          distance_miles?: number | null
          dropoff_address?: string
          fee?: number | null
          id?: string
          notes?: string | null
          package_description?: string | null
          pickup_address?: string
          requires_signature?: boolean
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      court_form_jobs: {
        Row: {
          case_number: string | null
          client_id: string
          completed_file_path: string | null
          county: string | null
          court_name: string | null
          created_at: string
          fee: number | null
          form_name: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          upl_disclaimer_accepted: boolean
        }
        Insert: {
          case_number?: string | null
          client_id: string
          completed_file_path?: string | null
          county?: string | null
          court_name?: string | null
          created_at?: string
          fee?: number | null
          form_name: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          upl_disclaimer_accepted?: boolean
        }
        Update: {
          case_number?: string | null
          client_id?: string
          completed_file_path?: string | null
          county?: string | null
          court_name?: string | null
          created_at?: string
          fee?: number | null
          form_name?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          upl_disclaimer_accepted?: boolean
        }
        Relationships: []
      }
      cover_letters: {
        Row: {
          company: string | null
          content: Json | null
          created_at: string
          id: string
          job_title: string | null
          resume_id: string | null
          status: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company?: string | null
          content?: Json | null
          created_at?: string
          id?: string
          job_title?: string | null
          resume_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company?: string | null
          content?: Json | null
          created_at?: string
          id?: string
          job_title?: string | null
          resume_id?: string | null
          status?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cover_letters_resume_id_fkey"
            columns: ["resume_id"]
            isOneToOne: false
            referencedRelation: "resumes"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          activity_type: string
          body: string | null
          contact_id: string
          contact_type: string
          created_at: string
          created_by: string | null
          id: string
          subject: string | null
        }
        Insert: {
          activity_type?: string
          body?: string | null
          contact_id: string
          contact_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          subject?: string | null
        }
        Update: {
          activity_type?: string
          body?: string | null
          contact_id?: string
          contact_type?: string
          created_at?: string
          created_by?: string | null
          id?: string
          subject?: string | null
        }
        Relationships: []
      }
      deals: {
        Row: {
          assigned_to: string | null
          contact_id: string | null
          created_at: string
          expected_close: string | null
          hubspot_deal_id: string | null
          id: string
          lead_id: string | null
          notes: string | null
          stage: string
          title: string
          updated_at: string
          value: number | null
        }
        Insert: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          expected_close?: string | null
          hubspot_deal_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          stage?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          assigned_to?: string | null
          contact_id?: string | null
          created_at?: string
          expected_close?: string | null
          hubspot_deal_id?: string | null
          id?: string
          lead_id?: string | null
          notes?: string | null
          stage?: string
          title?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      docudex_comments: {
        Row: {
          content: string
          created_at: string
          document_id: string
          id: string
          page_index: number
          position: Json | null
          resolved: boolean
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          document_id: string
          id?: string
          page_index?: number
          position?: Json | null
          resolved?: boolean
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          page_index?: number
          position?: Json | null
          resolved?: boolean
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "docudex_comments_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "docudex_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      docudex_documents: {
        Row: {
          created_at: string
          document_hash: string | null
          font_family: string | null
          footer_html: string | null
          header_html: string | null
          id: string
          is_template: boolean
          last_auto_saved_at: string | null
          margins: Json | null
          page_size: string
          pages: Json
          template_category: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
          watermark: string | null
        }
        Insert: {
          created_at?: string
          document_hash?: string | null
          font_family?: string | null
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_template?: boolean
          last_auto_saved_at?: string | null
          margins?: Json | null
          page_size?: string
          pages?: Json
          template_category?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id: string
          watermark?: string | null
        }
        Update: {
          created_at?: string
          document_hash?: string | null
          font_family?: string | null
          footer_html?: string | null
          header_html?: string | null
          id?: string
          is_template?: boolean
          last_auto_saved_at?: string | null
          margins?: Json | null
          page_size?: string
          pages?: Json
          template_category?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          watermark?: string | null
        }
        Relationships: []
      }
      docudex_shares: {
        Row: {
          accepted_at: string | null
          created_at: string
          document_id: string
          id: string
          permission: string
          shared_with_email: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          document_id: string
          id?: string
          permission?: string
          shared_with_email: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          document_id?: string
          id?: string
          permission?: string
          shared_with_email?: string
        }
        Relationships: [
          {
            foreignKeyName: "docudex_shares_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "docudex_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      docudex_templates: {
        Row: {
          category: string
          content: Json
          created_at: string
          created_by: string | null
          icon: string | null
          id: string
          is_public: boolean
          thumbnail_url: string | null
          title: string
          updated_at: string
          use_count: number
        }
        Insert: {
          category?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          use_count?: number
        }
        Update: {
          category?: string
          content?: Json
          created_at?: string
          created_by?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          use_count?: number
        }
        Relationships: []
      }
      docudex_versions: {
        Row: {
          created_at: string
          created_by: string | null
          document_id: string
          id: string
          label: string | null
          pages: Json
          version_number: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          document_id: string
          id?: string
          label?: string | null
          pages?: Json
          version_number?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          document_id?: string
          id?: string
          label?: string | null
          pages?: Json
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "docudex_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "docudex_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_bundles: {
        Row: {
          bundle_type: string
          created_at: string
          description: string | null
          document_list: Json
          id: string
          is_active: boolean | null
          name: string
          price: number | null
        }
        Insert: {
          bundle_type: string
          created_at?: string
          description?: string | null
          document_list?: Json
          id?: string
          is_active?: boolean | null
          name: string
          price?: number | null
        }
        Update: {
          bundle_type?: string
          created_at?: string
          description?: string | null
          document_list?: Json
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number | null
        }
        Relationships: []
      }
      document_collections: {
        Row: {
          created_at: string
          description: string | null
          document_ids: string[]
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          document_ids?: string[]
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          document_ids?: string[]
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      document_reminders: {
        Row: {
          created_at: string
          document_id: string
          expiry_date: string
          id: string
          notified: boolean
          remind_days_before: number
          user_id: string
        }
        Insert: {
          created_at?: string
          document_id: string
          expiry_date: string
          id?: string
          notified?: boolean
          remind_days_before?: number
          user_id: string
        }
        Update: {
          created_at?: string
          document_id?: string
          expiry_date?: string
          id?: string
          notified?: boolean
          remind_days_before?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_reminders_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_reviews: {
        Row: {
          created_at: string
          document_id: string
          findings: Json
          id: string
          overall_status: string
          reviewed_by: string
          score: number
          summary: string | null
        }
        Insert: {
          created_at?: string
          document_id: string
          findings?: Json
          id?: string
          overall_status?: string
          reviewed_by: string
          score?: number
          summary?: string | null
        }
        Update: {
          created_at?: string
          document_id?: string
          findings?: Json
          id?: string
          overall_status?: string
          reviewed_by?: string
          score?: number
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_reviews_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_tags: {
        Row: {
          created_at: string
          document_id: string
          id: string
          tag: string
        }
        Insert: {
          created_at?: string
          document_id: string
          id?: string
          tag: string
        }
        Update: {
          created_at?: string
          document_id?: string
          id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_tags_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_versions: {
        Row: {
          created_at: string
          document_id: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          uploaded_by: string
          version_number: number
        }
        Insert: {
          created_at?: string
          document_id: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          uploaded_by: string
          version_number?: number
        }
        Update: {
          created_at?: string
          document_id?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          uploaded_by?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "document_versions_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          appointment_id: string | null
          created_at: string
          document_hash: string | null
          file_name: string
          file_path: string
          id: string
          rejection_reason: string | null
          status: Database["public"]["Enums"]["document_status"]
          updated_at: string
          uploaded_by: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          document_hash?: string | null
          file_name: string
          file_path: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          document_hash?: string | null
          file_name?: string
          file_path?: string
          id?: string
          rejection_reason?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          updated_at?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      e_seal_verifications: {
        Row: {
          appointment_id: string | null
          commissioned_state: string
          created_at: string
          created_by: string
          document_hash: string | null
          document_id: string
          document_name: string
          id: string
          notarized_at: string
          notary_name: string
          revoked_at: string | null
          signer_name: string | null
          status: string
          verification_note: string | null
        }
        Insert: {
          appointment_id?: string | null
          commissioned_state?: string
          created_at?: string
          created_by: string
          document_hash?: string | null
          document_id: string
          document_name: string
          id?: string
          notarized_at?: string
          notary_name?: string
          revoked_at?: string | null
          signer_name?: string | null
          status?: string
          verification_note?: string | null
        }
        Update: {
          appointment_id?: string | null
          commissioned_state?: string
          created_at?: string
          created_by?: string
          document_hash?: string | null
          document_id?: string
          document_name?: string
          id?: string
          notarized_at?: string
          notary_name?: string
          revoked_at?: string | null
          signer_name?: string | null
          status?: string
          verification_note?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e_seal_verifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e_seal_verifications_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: true
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      email_cache: {
        Row: {
          attachments: Json | null
          bcc_addresses: Json | null
          body_html: string | null
          body_text: string | null
          cc_addresses: Json | null
          date: string | null
          folder: string
          from_address: string | null
          from_name: string | null
          has_attachments: boolean | null
          id: string
          in_reply_to: string | null
          is_read: boolean | null
          is_starred: boolean | null
          labels: string[] | null
          lead_extracted: boolean
          message_id: string
          references: string | null
          subject: string | null
          synced_at: string | null
          to_addresses: Json | null
        }
        Insert: {
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          date?: string | null
          folder?: string
          from_address?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          in_reply_to?: string | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          lead_extracted?: boolean
          message_id: string
          references?: string | null
          subject?: string | null
          synced_at?: string | null
          to_addresses?: Json | null
        }
        Update: {
          attachments?: Json | null
          bcc_addresses?: Json | null
          body_html?: string | null
          body_text?: string | null
          cc_addresses?: Json | null
          date?: string | null
          folder?: string
          from_address?: string | null
          from_name?: string | null
          has_attachments?: boolean | null
          id?: string
          in_reply_to?: string | null
          is_read?: boolean | null
          is_starred?: boolean | null
          labels?: string[] | null
          lead_extracted?: boolean
          message_id?: string
          references?: string | null
          subject?: string | null
          synced_at?: string | null
          to_addresses?: Json | null
        }
        Relationships: []
      }
      email_drafts: {
        Row: {
          attachments: Json | null
          body_html: string | null
          cc_addresses: Json | null
          created_at: string | null
          id: string
          in_reply_to: string | null
          subject: string | null
          to_addresses: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attachments?: Json | null
          body_html?: string | null
          cc_addresses?: Json | null
          created_at?: string | null
          id?: string
          in_reply_to?: string | null
          subject?: string | null
          to_addresses?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attachments?: Json | null
          body_html?: string | null
          cc_addresses?: Json | null
          created_at?: string | null
          id?: string
          in_reply_to?: string | null
          subject?: string | null
          to_addresses?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_signatures: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          name: string
          signature_html: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          signature_html?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          signature_html?: string | null
          user_id?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      expense_categories: {
        Row: {
          category_name: string
          created_at: string
          id: string
          irs_schedule_c_line: string | null
          is_deductible: boolean
          parent_category: string | null
        }
        Insert: {
          category_name: string
          created_at?: string
          id?: string
          irs_schedule_c_line?: string | null
          is_deductible?: boolean
          parent_category?: string | null
        }
        Update: {
          category_name?: string
          created_at?: string
          id?: string
          irs_schedule_c_line?: string | null
          is_deductible?: boolean
          parent_category?: string | null
        }
        Relationships: []
      }
      fee_adjustments: {
        Row: {
          adjusted_by: string
          adjusted_fee: number
          appointment_id: string
          created_at: string
          id: string
          original_fee: number
          reason: string
        }
        Insert: {
          adjusted_by: string
          adjusted_fee?: number
          appointment_id: string
          created_at?: string
          id?: string
          original_fee?: number
          reason: string
        }
        Update: {
          adjusted_by?: string
          adjusted_fee?: number
          appointment_id?: string
          created_at?: string
          id?: string
          original_fee?: number
          reason?: string
        }
        Relationships: [
          {
            foreignKeyName: "fee_adjustments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          is_public: boolean | null
          nps_score: number | null
          rating: number
          service_id: string | null
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          is_public?: boolean | null
          nps_score?: number | null
          rating: number
          service_id?: string | null
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          is_public?: boolean | null
          nps_score?: number | null
          rating?: number
          service_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_transactions: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          is_tax_deductible: boolean | null
          notes: string | null
          receipt_url: string | null
          transaction_date: string
          type: string
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_tax_deductible?: boolean | null
          notes?: string | null
          receipt_url?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_tax_deductible?: boolean | null
          notes?: string | null
          receipt_url?: string | null
          transaction_date?: string
          type?: string
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financial_transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      fingerprint_sessions: {
        Row: {
          agency_destination: string | null
          appointment_id: string | null
          card_count: number
          card_type: string
          client_id: string
          created_at: string
          fee: number | null
          id: string
          notes: string | null
          reason: string | null
          session_type: string
          status: string
          updated_at: string
        }
        Insert: {
          agency_destination?: string | null
          appointment_id?: string | null
          card_count?: number
          card_type?: string
          client_id: string
          created_at?: string
          fee?: number | null
          id?: string
          notes?: string | null
          reason?: string | null
          session_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          agency_destination?: string | null
          appointment_id?: string | null
          card_count?: number
          card_type?: string
          client_id?: string
          created_at?: string
          fee?: number | null
          id?: string
          notes?: string | null
          reason?: string | null
          session_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fingerprint_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      form_library: {
        Row: {
          category: string
          created_at: string
          file_name: string
          file_path: string
          id: string
          notes: string | null
          title: string
          uploaded_by: string
        }
        Insert: {
          category?: string
          created_at?: string
          file_name: string
          file_path: string
          id?: string
          notes?: string | null
          title: string
          uploaded_by: string
        }
        Update: {
          category?: string
          created_at?: string
          file_name?: string
          file_path?: string
          id?: string
          notes?: string | null
          title?: string
          uploaded_by?: string
        }
        Relationships: []
      }
      grant_templates: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_content: Json | null
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_content?: Json | null
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_content?: Json | null
        }
        Relationships: []
      }
      grants: {
        Row: {
          content: Json | null
          created_at: string
          grant_type: string | null
          id: string
          status: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          grant_type?: string | null
          id?: string
          status?: string | null
          template_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          grant_type?: string | null
          id?: string
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      i9_verifications: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          document_list_a: string[] | null
          document_list_b: string[] | null
          document_list_c: string[] | null
          employee_name: string
          employer_address: string | null
          employer_name: string | null
          id: string
          notary_notes: string | null
          section_completed: string
          status: string
          updated_at: string
          verification_date: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          document_list_a?: string[] | null
          document_list_b?: string[] | null
          document_list_c?: string[] | null
          employee_name: string
          employer_address?: string | null
          employer_name?: string | null
          id?: string
          notary_notes?: string | null
          section_completed?: string
          status?: string
          updated_at?: string
          verification_date?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          document_list_a?: string[] | null
          document_list_b?: string[] | null
          document_list_c?: string[] | null
          employee_name?: string
          employer_address?: string | null
          employer_name?: string | null
          id?: string
          notary_notes?: string | null
          section_completed?: string
          status?: string
          updated_at?: string
          verification_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "i9_verifications_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      identity_certificates: {
        Row: {
          certificate_number: string | null
          certificate_type: string
          client_id: string
          created_at: string
          created_by: string
          expires_at: string | null
          file_path: string | null
          id: string
          id_document_number: string | null
          id_document_type: string | null
          issued_at: string
          issued_to_dob: string | null
          issued_to_name: string
          notes: string | null
          revocation_reason: string | null
          revoked_at: string | null
          status: string
          updated_at: string
          verification_method: string
        }
        Insert: {
          certificate_number?: string | null
          certificate_type?: string
          client_id: string
          created_at?: string
          created_by: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          id_document_number?: string | null
          id_document_type?: string | null
          issued_at?: string
          issued_to_dob?: string | null
          issued_to_name: string
          notes?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          verification_method?: string
        }
        Update: {
          certificate_number?: string | null
          certificate_type?: string
          client_id?: string
          created_at?: string
          created_by?: string
          expires_at?: string | null
          file_path?: string | null
          id?: string
          id_document_number?: string | null
          id_document_type?: string | null
          issued_at?: string
          issued_to_dob?: string | null
          issued_to_name?: string
          notes?: string | null
          revocation_reason?: string | null
          revoked_at?: string | null
          status?: string
          updated_at?: string
          verification_method?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          appointment_id: string | null
          communication_technology: string | null
          created_at: string
          credential_analysis_method: string | null
          document_date: string | null
          document_type_description: string
          entry_date: string
          entry_time: string
          fee_charged: number | null
          id: string
          id_expiration: string | null
          id_number: string | null
          id_type: string | null
          journal_number: number
          kba_vendor: string | null
          notarial_act_type: string
          notary_commission_expiration: string | null
          notary_commission_number: string | null
          notary_name: string
          notary_user_id: string
          notes: string | null
          session_id: string | null
          signer_address: string | null
          signer_name: string
          signer_signature_path: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          communication_technology?: string | null
          created_at?: string
          credential_analysis_method?: string | null
          document_date?: string | null
          document_type_description?: string
          entry_date?: string
          entry_time?: string
          fee_charged?: number | null
          id?: string
          id_expiration?: string | null
          id_number?: string | null
          id_type?: string | null
          journal_number?: number
          kba_vendor?: string | null
          notarial_act_type?: string
          notary_commission_expiration?: string | null
          notary_commission_number?: string | null
          notary_name?: string
          notary_user_id: string
          notes?: string | null
          session_id?: string | null
          signer_address?: string | null
          signer_name?: string
          signer_signature_path?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          communication_technology?: string | null
          created_at?: string
          credential_analysis_method?: string | null
          document_date?: string | null
          document_type_description?: string
          entry_date?: string
          entry_time?: string
          fee_charged?: number | null
          id?: string
          id_expiration?: string | null
          id_number?: string | null
          id_type?: string | null
          journal_number?: number
          kba_vendor?: string | null
          notarial_act_type?: string
          notary_commission_expiration?: string | null
          notary_commission_number?: string | null
          notary_name?: string
          notary_user_id?: string
          notes?: string | null
          session_id?: string | null
          signer_address?: string | null
          signer_name?: string
          signer_signature_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journal_entries_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "journal_entries_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "notarization_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_sources: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_active: boolean
          last_scraped_at: string | null
          name: string
          source_type: string
          url: string | null
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          name: string
          source_type?: string
          url?: string | null
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_scraped_at?: string | null
          name?: string
          source_type?: string
          url?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          address: string | null
          business_name: string | null
          city: string | null
          contacted_at: string | null
          created_at: string
          email: string | null
          email_cache_id: string | null
          hubspot_contact_id: string | null
          hubspot_deal_id: string | null
          id: string
          intent_score: string
          lead_type: string
          name: string | null
          notes: string | null
          phone: string | null
          service_needed: string | null
          source: string
          source_url: string | null
          state: string | null
          status: string
          updated_at: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          email_cache_id?: string | null
          hubspot_contact_id?: string | null
          hubspot_deal_id?: string | null
          id?: string
          intent_score?: string
          lead_type?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          service_needed?: string | null
          source?: string
          source_url?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          business_name?: string | null
          city?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string | null
          email_cache_id?: string | null
          hubspot_contact_id?: string | null
          hubspot_deal_id?: string | null
          id?: string
          intent_score?: string
          lead_type?: string
          name?: string | null
          notes?: string | null
          phone?: string | null
          service_needed?: string | null
          source?: string
          source_url?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          zip?: string | null
        }
        Relationships: []
      }
      loan_signing_packages: {
        Row: {
          appointment_id: string | null
          client_id: string
          created_at: string
          document_count: number
          fee: number | null
          id: string
          lender_name: string | null
          notes: string | null
          package_type: string
          scanback_deadline: string | null
          scanback_required: boolean
          status: string
          title_company: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          created_at?: string
          document_count?: number
          fee?: number | null
          id?: string
          lender_name?: string | null
          notes?: string | null
          package_type?: string
          scanback_deadline?: string | null
          scanback_required?: boolean
          status?: string
          title_company?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          document_count?: number
          fee?: number | null
          id?: string
          lender_name?: string | null
          notes?: string | null
          package_type?: string
          scanback_deadline?: string | null
          scanback_required?: boolean
          status?: string
          title_company?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "loan_signing_packages_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      mailroom_items: {
        Row: {
          client_id: string
          created_at: string
          forwarding_address: string | null
          id: string
          notes: string | null
          received_date: string
          scanned_file_path: string | null
          sender: string | null
          status: string
          subject: string
        }
        Insert: {
          client_id: string
          created_at?: string
          forwarding_address?: string | null
          id?: string
          notes?: string | null
          received_date?: string
          scanned_file_path?: string | null
          sender?: string | null
          status?: string
          subject: string
        }
        Update: {
          client_id?: string
          created_at?: string
          forwarding_address?: string | null
          id?: string
          notes?: string | null
          received_date?: string
          scanned_file_path?: string | null
          sender?: string | null
          status?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "mailroom_items_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      mileage_logs: {
        Row: {
          appointment_id: string | null
          created_at: string
          destination: string
          id: string
          irs_rate: number
          miles: number
          notes: string | null
          origin: string
          purpose: string | null
          total_deduction: number | null
          trip_date: string
          user_id: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          destination: string
          id?: string
          irs_rate?: number
          miles: number
          notes?: string | null
          origin: string
          purpose?: string | null
          total_deduction?: number | null
          trip_date?: string
          user_id: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          destination?: string
          id?: string
          irs_rate?: number
          miles?: number
          notes?: string | null
          origin?: string
          purpose?: string | null
          total_deduction?: number | null
          trip_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mileage_logs_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      notarization_sessions: {
        Row: {
          appointment_id: string
          attestation_confirmed: boolean | null
          attestation_confirmed_at: string | null
          attestation_notes: string | null
          bluenotary_session_url: string | null
          completed_at: string | null
          created_at: string
          credential_analysis_result: Json | null
          document_name: string | null
          esign_consent: boolean | null
          esign_consent_at: string | null
          id: string
          id_verified: boolean | null
          kba_attempts: number | null
          kba_completed: boolean | null
          last_activity_at: string | null
          participant_link: string | null
          pause_reason: string | null
          paused_at: string | null
          recording_consent: boolean | null
          recording_consent_at: string | null
          recording_url: string | null
          retention_expires_at: string | null
          session_mode: string
          session_timeout_minutes: number | null
          session_type: Database["public"]["Enums"]["notarization_type"]
          session_unique_id: string | null
          signer_email: string | null
          signer_ip: string | null
          signer_location_state: string | null
          signing_platform: string | null
          signnow_document_id: string | null
          started_at: string | null
          status: Database["public"]["Enums"]["appointment_status"]
          total_pause_duration_seconds: number | null
          updated_at: string
          visual_match_confirmed: boolean | null
          webhook_events_registered: number | null
          webhook_status: string | null
        }
        Insert: {
          appointment_id: string
          attestation_confirmed?: boolean | null
          attestation_confirmed_at?: string | null
          attestation_notes?: string | null
          bluenotary_session_url?: string | null
          completed_at?: string | null
          created_at?: string
          credential_analysis_result?: Json | null
          document_name?: string | null
          esign_consent?: boolean | null
          esign_consent_at?: string | null
          id?: string
          id_verified?: boolean | null
          kba_attempts?: number | null
          kba_completed?: boolean | null
          last_activity_at?: string | null
          participant_link?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          recording_consent?: boolean | null
          recording_consent_at?: string | null
          recording_url?: string | null
          retention_expires_at?: string | null
          session_mode?: string
          session_timeout_minutes?: number | null
          session_type?: Database["public"]["Enums"]["notarization_type"]
          session_unique_id?: string | null
          signer_email?: string | null
          signer_ip?: string | null
          signer_location_state?: string | null
          signing_platform?: string | null
          signnow_document_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          total_pause_duration_seconds?: number | null
          updated_at?: string
          visual_match_confirmed?: boolean | null
          webhook_events_registered?: number | null
          webhook_status?: string | null
        }
        Update: {
          appointment_id?: string
          attestation_confirmed?: boolean | null
          attestation_confirmed_at?: string | null
          attestation_notes?: string | null
          bluenotary_session_url?: string | null
          completed_at?: string | null
          created_at?: string
          credential_analysis_result?: Json | null
          document_name?: string | null
          esign_consent?: boolean | null
          esign_consent_at?: string | null
          id?: string
          id_verified?: boolean | null
          kba_attempts?: number | null
          kba_completed?: boolean | null
          last_activity_at?: string | null
          participant_link?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          recording_consent?: boolean | null
          recording_consent_at?: string | null
          recording_url?: string | null
          retention_expires_at?: string | null
          session_mode?: string
          session_timeout_minutes?: number | null
          session_type?: Database["public"]["Enums"]["notarization_type"]
          session_unique_id?: string | null
          signer_email?: string | null
          signer_ip?: string | null
          signer_location_state?: string | null
          signing_platform?: string | null
          signnow_document_id?: string | null
          started_at?: string | null
          status?: Database["public"]["Enums"]["appointment_status"]
          total_pause_duration_seconds?: number | null
          updated_at?: string
          visual_match_confirmed?: boolean | null
          webhook_events_registered?: number | null
          webhook_status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notarization_sessions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: true
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      notary_certifications: {
        Row: {
          certification_name: string
          certification_number: string | null
          created_at: string | null
          expiry_date: string | null
          file_path: string | null
          id: string
          issued_date: string | null
          issuing_body: string | null
          user_id: string
        }
        Insert: {
          certification_name: string
          certification_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issued_date?: string | null
          issuing_body?: string | null
          user_id: string
        }
        Update: {
          certification_name?: string
          certification_number?: string | null
          created_at?: string | null
          expiry_date?: string | null
          file_path?: string | null
          id?: string
          issued_date?: string | null
          issuing_body?: string | null
          user_id?: string
        }
        Relationships: []
      }
      notary_invites: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          expires_at: string | null
          id: string
          invited_by: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          expires_at?: string | null
          id?: string
          invited_by: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string | null
          id?: string
          invited_by?: string
          status?: string
        }
        Relationships: []
      }
      notary_journal: {
        Row: {
          appointment_id: string | null
          archived: boolean
          certificate_photos: Json | null
          created_at: string
          created_by: string
          credential_analysis: Json | null
          document_description: string | null
          document_type: string
          fees_charged: number | null
          id: string
          id_expiration: string | null
          id_number: string | null
          id_type: string | null
          journal_number: number
          net_profit: number | null
          notarization_type: Database["public"]["Enums"]["notarization_type"]
          notary_payout: number | null
          notes: string | null
          oath_administered: boolean | null
          oath_timestamp: string | null
          platform_fee: number | null
          platform_markup: number | null
          recording_url: string | null
          service_performed: string
          signer_address: string | null
          signer_location_attestation: string | null
          signer_name: string
          travel_fee: number | null
          updated_at: string
          witnesses_present: number | null
        }
        Insert: {
          appointment_id?: string | null
          archived?: boolean
          certificate_photos?: Json | null
          created_at?: string
          created_by: string
          credential_analysis?: Json | null
          document_description?: string | null
          document_type: string
          fees_charged?: number | null
          id?: string
          id_expiration?: string | null
          id_number?: string | null
          id_type?: string | null
          journal_number?: number
          net_profit?: number | null
          notarization_type?: Database["public"]["Enums"]["notarization_type"]
          notary_payout?: number | null
          notes?: string | null
          oath_administered?: boolean | null
          oath_timestamp?: string | null
          platform_fee?: number | null
          platform_markup?: number | null
          recording_url?: string | null
          service_performed?: string
          signer_address?: string | null
          signer_location_attestation?: string | null
          signer_name: string
          travel_fee?: number | null
          updated_at?: string
          witnesses_present?: number | null
        }
        Update: {
          appointment_id?: string | null
          archived?: boolean
          certificate_photos?: Json | null
          created_at?: string
          created_by?: string
          credential_analysis?: Json | null
          document_description?: string | null
          document_type?: string
          fees_charged?: number | null
          id?: string
          id_expiration?: string | null
          id_number?: string | null
          id_type?: string | null
          journal_number?: number
          net_profit?: number | null
          notarization_type?: Database["public"]["Enums"]["notarization_type"]
          notary_payout?: number | null
          notes?: string | null
          oath_administered?: boolean | null
          oath_timestamp?: string | null
          platform_fee?: number | null
          platform_markup?: number | null
          recording_url?: string | null
          service_performed?: string
          signer_address?: string | null
          signer_location_attestation?: string | null
          signer_name?: string
          travel_fee?: number | null
          updated_at?: string
          witnesses_present?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notary_journal_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notary_journal_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notary_pages: {
        Row: {
          accent_color: string | null
          bio: string | null
          cover_photo_path: string | null
          created_at: string
          credentials: Json | null
          custom_css: string | null
          display_name: string
          email: string | null
          external_booking_url: string | null
          font_family: string | null
          gallery_photos: Json | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          nav_services: Json | null
          phone: string | null
          professional_type: string | null
          profile_photo_path: string | null
          profit_share_enabled: boolean | null
          profit_share_percentage: number | null
          seo_description: string | null
          seo_title: string | null
          service_areas: Json | null
          services_offered: Json | null
          signing_platform_url: string | null
          slug: string
          social_links: Json | null
          tagline: string | null
          theme_color: string | null
          title: string | null
          updated_at: string
          use_platform_booking: boolean | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          bio?: string | null
          cover_photo_path?: string | null
          created_at?: string
          credentials?: Json | null
          custom_css?: string | null
          display_name?: string
          email?: string | null
          external_booking_url?: string | null
          font_family?: string | null
          gallery_photos?: Json | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          nav_services?: Json | null
          phone?: string | null
          professional_type?: string | null
          profile_photo_path?: string | null
          profit_share_enabled?: boolean | null
          profit_share_percentage?: number | null
          seo_description?: string | null
          seo_title?: string | null
          service_areas?: Json | null
          services_offered?: Json | null
          signing_platform_url?: string | null
          slug: string
          social_links?: Json | null
          tagline?: string | null
          theme_color?: string | null
          title?: string | null
          updated_at?: string
          use_platform_booking?: boolean | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          bio?: string | null
          cover_photo_path?: string | null
          created_at?: string
          credentials?: Json | null
          custom_css?: string | null
          display_name?: string
          email?: string | null
          external_booking_url?: string | null
          font_family?: string | null
          gallery_photos?: Json | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          nav_services?: Json | null
          phone?: string | null
          professional_type?: string | null
          profile_photo_path?: string | null
          profit_share_enabled?: boolean | null
          profit_share_percentage?: number | null
          seo_description?: string | null
          seo_title?: string | null
          service_areas?: Json | null
          services_offered?: Json | null
          signing_platform_url?: string | null
          slug?: string
          social_links?: Json | null
          tagline?: string | null
          theme_color?: string | null
          title?: string | null
          updated_at?: string
          use_platform_booking?: boolean | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: []
      }
      notary_payouts: {
        Row: {
          created_at: string
          gross_revenue: number
          id: string
          net_payout: number
          notary_user_id: string
          notes: string | null
          paid_at: string | null
          period_end: string
          period_start: string
          platform_fees: number
          status: string
        }
        Insert: {
          created_at?: string
          gross_revenue?: number
          id?: string
          net_payout?: number
          notary_user_id: string
          notes?: string | null
          paid_at?: string | null
          period_end: string
          period_start: string
          platform_fees?: number
          status?: string
        }
        Update: {
          created_at?: string
          gross_revenue?: number
          id?: string
          net_payout?: number
          notary_user_id?: string
          notes?: string | null
          paid_at?: string | null
          period_end?: string
          period_start?: string
          platform_fees?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "notary_payouts_notary_user_id_fkey"
            columns: ["notary_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          channel: string
          created_at: string
          enabled: boolean
          event_type: string
          id: string
          user_id: string
        }
        Insert: {
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type: string
          id?: string
          user_id: string
        }
        Update: {
          channel?: string
          created_at?: string
          enabled?: boolean
          event_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_queue: {
        Row: {
          body: string | null
          channel: string
          created_at: string
          error_message: string | null
          id: string
          metadata: Json | null
          priority: string
          sent_at: string | null
          status: string
          subject: string | null
          user_id: string
        }
        Insert: {
          body?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id: string
        }
        Update: {
          body?: string | null
          channel?: string
          created_at?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          priority?: string
          sent_at?: string | null
          status?: string
          subject?: string | null
          user_id?: string
        }
        Relationships: []
      }
      outbound_webhook_log: {
        Row: {
          attempted_at: string
          event_type: string
          id: string
          payload: Json
          response_body: string | null
          response_status: number | null
          retry_count: number
          webhook_id: string
        }
        Insert: {
          attempted_at?: string
          event_type: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          webhook_id: string
        }
        Update: {
          attempted_at?: string
          event_type?: string
          id?: string
          payload?: Json
          response_body?: string | null
          response_status?: number | null
          retry_count?: number
          webhook_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "outbound_webhook_log_webhook_id_fkey"
            columns: ["webhook_id"]
            isOneToOne: false
            referencedRelation: "outbound_webhooks"
            referencedColumns: ["id"]
          },
        ]
      }
      outbound_webhooks: {
        Row: {
          created_at: string
          description: string | null
          events_subscribed: string[]
          id: string
          is_active: boolean
          last_triggered_at: string | null
          secret: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          events_subscribed?: string[]
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          secret?: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          events_subscribed?: string[]
          id?: string
          is_active?: boolean
          last_triggered_at?: string | null
          secret?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          appointment_id: string | null
          client_id: string
          created_at: string
          id: string
          invoice_url: string | null
          method: string | null
          notes: string | null
          paid_at: string | null
          referral_professional_id: string | null
          refund_amount: number | null
          refunded_at: string | null
          status: string
          stripe_payment_intent_id: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          appointment_id?: string | null
          client_id: string
          created_at?: string
          id?: string
          invoice_url?: string | null
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          referral_professional_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          appointment_id?: string | null
          client_id?: string
          created_at?: string
          id?: string
          invoice_url?: string | null
          method?: string | null
          notes?: string | null
          paid_at?: string | null
          referral_professional_id?: string | null
          refund_amount?: number | null
          refunded_at?: string | null
          status?: string
          stripe_payment_intent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      permit_filings: {
        Row: {
          business_name: string | null
          client_id: string
          created_at: string
          expiry_date: string | null
          fee: number | null
          filing_date: string | null
          id: string
          jurisdiction: string | null
          notes: string | null
          permit_number: string | null
          permit_type: string
          status: string
          updated_at: string
        }
        Insert: {
          business_name?: string | null
          client_id: string
          created_at?: string
          expiry_date?: string | null
          fee?: number | null
          filing_date?: string | null
          id?: string
          jurisdiction?: string | null
          notes?: string | null
          permit_number?: string | null
          permit_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          business_name?: string | null
          client_id?: string
          created_at?: string
          expiry_date?: string | null
          fee?: number | null
          filing_date?: string | null
          id?: string
          jurisdiction?: string | null
          notes?: string | null
          permit_number?: string | null
          permit_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      pricing_rules: {
        Row: {
          adjustment_type: string
          adjustment_value: number
          conditions: Json
          created_at: string
          id: string
          is_active: boolean | null
          name: string
          priority: number | null
          rule_type: string
          updated_at: string
        }
        Insert: {
          adjustment_type?: string
          adjustment_value?: number
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name: string
          priority?: number | null
          rule_type?: string
          updated_at?: string
        }
        Update: {
          adjustment_type?: string
          adjustment_value?: number
          conditions?: Json
          created_at?: string
          id?: string
          is_active?: boolean | null
          name?: string
          priority?: number | null
          rule_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      print_jobs: {
        Row: {
          binding_type: string | null
          client_id: string
          color: boolean
          completed_at: string | null
          copies: number
          created_at: string
          document_id: string | null
          double_sided: boolean
          file_name: string
          file_path: string | null
          id: string
          notes: string | null
          page_count: number
          paper_size: string
          price: number | null
          priority: string
          status: string
          updated_at: string
        }
        Insert: {
          binding_type?: string | null
          client_id: string
          color?: boolean
          completed_at?: string | null
          copies?: number
          created_at?: string
          document_id?: string | null
          double_sided?: boolean
          file_name: string
          file_path?: string | null
          id?: string
          notes?: string | null
          page_count?: number
          paper_size?: string
          price?: number | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Update: {
          binding_type?: string | null
          client_id?: string
          color?: boolean
          completed_at?: string | null
          copies?: number
          created_at?: string
          document_id?: string | null
          double_sided?: boolean
          file_name?: string
          file_path?: string | null
          id?: string
          notes?: string | null
          page_count?: number
          paper_size?: string
          price?: number | null
          priority?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      print_orders: {
        Row: {
          client_id: string
          created_at: string
          design_file_path: string | null
          id: string
          notes: string | null
          product_name: string
          quantity: number
          shipping_tracking: string | null
          specifications: Json | null
          status: string
          total_price: number | null
          unit_price: number | null
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          design_file_path?: string | null
          id?: string
          notes?: string | null
          product_name: string
          quantity?: number
          shipping_tracking?: string | null
          specifications?: Json | null
          status?: string
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          design_file_path?: string | null
          id?: string
          notes?: string | null
          product_name?: string
          quantity?: number
          shipping_tracking?: string | null
          specifications?: Json | null
          status?: string
          total_price?: number | null
          unit_price?: number | null
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "print_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "print_vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      print_products: {
        Row: {
          base_price: number
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          min_quantity: number | null
          name: string
          options: Json | null
          price_tiers: Json | null
          sort_order: number | null
          subcategory: string | null
          turnaround_days: number | null
          updated_at: string
        }
        Insert: {
          base_price?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_quantity?: number | null
          name: string
          options?: Json | null
          price_tiers?: Json | null
          sort_order?: number | null
          subcategory?: string | null
          turnaround_days?: number | null
          updated_at?: string
        }
        Update: {
          base_price?: number
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          min_quantity?: number | null
          name?: string
          options?: Json | null
          price_tiers?: Json | null
          sort_order?: number | null
          subcategory?: string | null
          turnaround_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      print_vendors: {
        Row: {
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          notes: string | null
          specialties: string[] | null
          turnaround_days: number | null
          updated_at: string
        }
        Insert: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          notes?: string | null
          specialties?: string[] | null
          turnaround_days?: number | null
          updated_at?: string
        }
        Update: {
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          notes?: string | null
          specialties?: string[] | null
          turnaround_days?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      process_serving_cases: {
        Row: {
          affidavit_date: string | null
          affidavit_filed: boolean
          attempts: number
          case_number: string | null
          client_id: string
          court_name: string | null
          created_at: string
          deadline: string | null
          document_description: string | null
          fee: number | null
          id: string
          max_attempts: number
          notes: string | null
          respondent_address: string | null
          respondent_name: string
          serve_type: string
          status: string
          updated_at: string
        }
        Insert: {
          affidavit_date?: string | null
          affidavit_filed?: boolean
          attempts?: number
          case_number?: string | null
          client_id: string
          court_name?: string | null
          created_at?: string
          deadline?: string | null
          document_description?: string | null
          fee?: number | null
          id?: string
          max_attempts?: number
          notes?: string | null
          respondent_address?: string | null
          respondent_name: string
          serve_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          affidavit_date?: string | null
          affidavit_filed?: boolean
          attempts?: number
          case_number?: string | null
          client_id?: string
          court_name?: string | null
          created_at?: string
          deadline?: string | null
          document_description?: string | null
          fee?: number | null
          id?: string
          max_attempts?: number
          notes?: string | null
          respondent_address?: string | null
          respondent_name?: string
          serve_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      professional_service_enrollments: {
        Row: {
          created_at: string
          custom_description: string | null
          custom_price_from: number | null
          custom_price_to: number | null
          custom_short_description: string | null
          display_order: number | null
          id: string
          is_active: boolean
          professional_user_id: string
          service_id: string
          show_in_nav: boolean
          show_on_site: boolean
          updated_at: string
        }
        Insert: {
          created_at?: string
          custom_description?: string | null
          custom_price_from?: number | null
          custom_price_to?: number | null
          custom_short_description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          professional_user_id: string
          service_id: string
          show_in_nav?: boolean
          show_on_site?: boolean
          updated_at?: string
        }
        Update: {
          created_at?: string
          custom_description?: string | null
          custom_price_from?: number | null
          custom_price_to?: number | null
          custom_short_description?: string | null
          display_order?: number | null
          id?: string
          is_active?: boolean
          professional_user_id?: string
          service_id?: string
          show_in_nav?: boolean
          show_on_site?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "professional_service_enrollments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          admin_notes: string | null
          avatar_path: string | null
          bond_amount: number | null
          bond_company: string | null
          city: string | null
          client_preferred_language: string | null
          commission_expiration: string | null
          commission_number: string | null
          created_at: string
          email: string | null
          eo_expiration: string | null
          eo_policy_number: string | null
          full_name: string | null
          id: string
          phone: string | null
          plan: string
          seal_file_path: string | null
          state: string | null
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          admin_notes?: string | null
          avatar_path?: string | null
          bond_amount?: number | null
          bond_company?: string | null
          city?: string | null
          client_preferred_language?: string | null
          commission_expiration?: string | null
          commission_number?: string | null
          created_at?: string
          email?: string | null
          eo_expiration?: string | null
          eo_policy_number?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          plan?: string
          seal_file_path?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          admin_notes?: string | null
          avatar_path?: string | null
          bond_amount?: number | null
          bond_company?: string | null
          city?: string | null
          client_preferred_language?: string | null
          commission_expiration?: string | null
          commission_number?: string | null
          created_at?: string
          email?: string | null
          eo_expiration?: string | null
          eo_policy_number?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          plan?: string
          seal_file_path?: string | null
          state?: string | null
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      profit_share_config: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          id: string
          is_active: boolean
          min_platform_fee: number
          professional_user_id: string
          service_id: string | null
          share_percentage: number
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_platform_fee?: number
          professional_user_id: string
          service_id?: string | null
          share_percentage?: number
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          min_platform_fee?: number
          professional_user_id?: string
          service_id?: string | null
          share_percentage?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_share_config_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_share_transactions: {
        Row: {
          appointment_id: string | null
          created_at: string
          gross_amount: number
          id: string
          notes: string | null
          paid_at: string | null
          payment_id: string | null
          period_end: string | null
          period_start: string | null
          platform_fee: number
          professional_share: number
          professional_user_id: string
          service_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          created_at?: string
          gross_amount?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          period_end?: string | null
          period_start?: string | null
          platform_fee?: number
          professional_share?: number
          professional_user_id: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          created_at?: string
          gross_amount?: number
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_id?: string | null
          period_end?: string | null
          period_start?: string | null
          platform_fee?: number
          professional_share?: number
          professional_user_id?: string
          service_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_share_transactions_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profit_share_transactions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profit_share_transactions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      promo_codes: {
        Row: {
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          times_used: number
          usage_limit: number | null
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          times_used?: number
          usage_limit?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          times_used?: number
          usage_limit?: number | null
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      proposals: {
        Row: {
          accepted_at: string | null
          branding: Json | null
          content_html: string
          created_at: string
          id: string
          lead_id: string | null
          sent_at: string | null
          status: string
          template_type: string
          title: string
          updated_at: string
          user_id: string
          viewed_at: string | null
        }
        Insert: {
          accepted_at?: string | null
          branding?: Json | null
          content_html?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          sent_at?: string | null
          status?: string
          template_type?: string
          title: string
          updated_at?: string
          user_id: string
          viewed_at?: string | null
        }
        Update: {
          accepted_at?: string | null
          branding?: Json | null
          content_html?: string
          created_at?: string
          id?: string
          lead_id?: string | null
          sent_at?: string | null
          status?: string
          template_type?: string
          title?: string
          updated_at?: string
          user_id?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "proposals_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      real_estate_services: {
        Row: {
          client_id: string
          created_at: string
          details: Json | null
          fee: number | null
          id: string
          notes: string | null
          photos: string[] | null
          property_address: string
          scheduled_date: string | null
          scheduled_time: string | null
          service_subtype: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          details?: Json | null
          fee?: number | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          property_address: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_subtype?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          details?: Json | null
          fee?: number | null
          id?: string
          notes?: string | null
          photos?: string[] | null
          property_address?: string
          scheduled_date?: string | null
          scheduled_time?: string | null
          service_subtype?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      recorder_filings: {
        Row: {
          client_id: string
          county: string | null
          created_at: string
          document_description: string
          fee: number | null
          file_path: string | null
          filed_by: string | null
          id: string
          notes: string | null
          recording_date: string | null
          recording_number: string | null
          recording_type: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          county?: string | null
          created_at?: string
          document_description: string
          fee?: number | null
          file_path?: string | null
          filed_by?: string | null
          id?: string
          notes?: string | null
          recording_date?: string | null
          recording_number?: string | null
          recording_type?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          county?: string | null
          created_at?: string
          document_description?: string
          fee?: number | null
          file_path?: string | null
          filed_by?: string | null
          id?: string
          notes?: string | null
          recording_date?: string | null
          recording_number?: string | null
          recording_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      recurring_expenses: {
        Row: {
          amount: number
          category_id: string | null
          created_at: string
          frequency: string
          id: string
          is_active: boolean | null
          name: string
          next_due: string
          notes: string | null
          updated_at: string
          user_id: string
          vendor: string | null
        }
        Insert: {
          amount: number
          category_id?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          name: string
          next_due: string
          notes?: string | null
          updated_at?: string
          user_id: string
          vendor?: string | null
        }
        Update: {
          amount?: number
          category_id?: string | null
          created_at?: string
          frequency?: string
          id?: string
          is_active?: boolean | null
          name?: string
          next_due?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_expenses_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "expense_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          converted_at: string | null
          created_at: string
          id: string
          referee_email: string
          referral_code: string
          referrer_id: string
          reward_amount: number | null
          status: string
        }
        Insert: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referee_email: string
          referral_code?: string
          referrer_id: string
          reward_amount?: number | null
          status?: string
        }
        Update: {
          converted_at?: string | null
          created_at?: string
          id?: string
          referee_email?: string
          referral_code?: string
          referrer_id?: string
          reward_amount?: number | null
          status?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          content: Json | null
          created_at: string
          id: string
          status: string | null
          template_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json | null
          created_at?: string
          id?: string
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json | null
          created_at?: string
          id?: string
          status?: string | null
          template_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          appointment_id: string | null
          client_id: string
          comment: string | null
          created_at: string
          id: string
          rating: number
        }
        Insert: {
          appointment_id?: string | null
          client_id: string
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
        }
        Update: {
          appointment_id?: string | null
          client_id?: string
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      ron_credential_analysis: {
        Row: {
          analysis_result: Json | null
          appointment_id: string | null
          created_at: string
          id: string
          id_expiration: string | null
          id_number_hash: string | null
          id_state: string | null
          id_type: string
          session_id: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          analysis_result?: Json | null
          appointment_id?: string | null
          created_at?: string
          id?: string
          id_expiration?: string | null
          id_number_hash?: string | null
          id_state?: string | null
          id_type: string
          session_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          analysis_result?: Json | null
          appointment_id?: string | null
          created_at?: string
          id?: string
          id_expiration?: string | null
          id_number_hash?: string | null
          id_state?: string | null
          id_type?: string
          session_id?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ron_credential_analysis_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ron_credential_analysis_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "notarization_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ron_recordings: {
        Row: {
          appointment_id: string | null
          consent_verified: boolean
          created_at: string
          created_by: string
          duration_seconds: number | null
          file_name: string
          file_path: string
          file_size_bytes: number | null
          id: string
          notes: string | null
          recording_type: string
          retention_expires_at: string | null
          session_id: string | null
          updated_at: string
        }
        Insert: {
          appointment_id?: string | null
          consent_verified?: boolean
          created_at?: string
          created_by: string
          duration_seconds?: number | null
          file_name: string
          file_path: string
          file_size_bytes?: number | null
          id?: string
          notes?: string | null
          recording_type?: string
          retention_expires_at?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Update: {
          appointment_id?: string | null
          consent_verified?: boolean
          created_at?: string
          created_by?: string
          duration_seconds?: number | null
          file_name?: string
          file_path?: string
          file_size_bytes?: number | null
          id?: string
          notes?: string | null
          recording_type?: string
          retention_expires_at?: string | null
          session_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ron_recordings_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ron_recordings_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "notarization_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      scanback_tracking: {
        Row: {
          created_at: string
          delivery_confirmed_at: string | null
          document_name: string
          id: string
          notes: string | null
          package_id: string
          page_count: number | null
          scan_status: string
          scanned_at: string | null
          shipped_at: string | null
          shipping_carrier: string | null
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          delivery_confirmed_at?: string | null
          document_name: string
          id?: string
          notes?: string | null
          package_id: string
          page_count?: number | null
          scan_status?: string
          scanned_at?: string | null
          shipped_at?: string | null
          shipping_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          delivery_confirmed_at?: string | null
          document_name?: string
          id?: string
          notes?: string | null
          package_id?: string
          page_count?: number | null
          scan_status?: string
          scanned_at?: string | null
          shipped_at?: string | null
          shipping_carrier?: string | null
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scanback_tracking_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: false
            referencedRelation: "loan_signing_packages"
            referencedColumns: ["id"]
          },
        ]
      }
      scrivener_jobs: {
        Row: {
          client_id: string
          completed_file_path: string | null
          court_jurisdiction: string | null
          created_at: string
          fee: number | null
          form_name: string | null
          form_type: string
          id: string
          notes: string | null
          page_count: number | null
          status: string
          updated_at: string
          upl_acknowledgment: boolean
        }
        Insert: {
          client_id: string
          completed_file_path?: string | null
          court_jurisdiction?: string | null
          created_at?: string
          fee?: number | null
          form_name?: string | null
          form_type: string
          id?: string
          notes?: string | null
          page_count?: number | null
          status?: string
          updated_at?: string
          upl_acknowledgment?: boolean
        }
        Update: {
          client_id?: string
          completed_file_path?: string | null
          court_jurisdiction?: string | null
          created_at?: string
          fee?: number | null
          form_name?: string | null
          form_type?: string
          id?: string
          notes?: string | null
          page_count?: number | null
          status?: string
          updated_at?: string
          upl_acknowledgment?: boolean
        }
        Relationships: []
      }
      service_add_ons: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          price: number
          service_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          price?: number
          service_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          price?: number
          service_id?: string | null
        }
        Relationships: []
      }
      service_faqs: {
        Row: {
          answer: string
          created_at: string
          id: string
          question: string
          service_id: string
          sort_order: number
        }
        Insert: {
          answer: string
          created_at?: string
          id?: string
          question: string
          service_id: string
          sort_order?: number
        }
        Update: {
          answer?: string
          created_at?: string
          id?: string
          question?: string
          service_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_faqs_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_requests: {
        Row: {
          assigned_to: string | null
          client_id: string
          client_visible_status: string
          created_at: string
          deliverable_url: string | null
          due_date: string | null
          external_order_id: string | null
          external_payment_amount: number | null
          external_payment_status: string | null
          id: string
          intake_data: Json
          notes: string | null
          priority: string
          reference_number: string | null
          service_name: string
          sla_deadline: string | null
          source_platform: string
          status: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          client_visible_status?: string
          created_at?: string
          deliverable_url?: string | null
          due_date?: string | null
          external_order_id?: string | null
          external_payment_amount?: number | null
          external_payment_status?: string | null
          id?: string
          intake_data?: Json
          notes?: string | null
          priority?: string
          reference_number?: string | null
          service_name: string
          sla_deadline?: string | null
          source_platform?: string
          status?: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          client_visible_status?: string
          created_at?: string
          deliverable_url?: string | null
          due_date?: string | null
          external_order_id?: string | null
          external_payment_amount?: number | null
          external_payment_status?: string | null
          id?: string
          intake_data?: Json
          notes?: string | null
          priority?: string
          reference_number?: string | null
          service_name?: string
          sla_deadline?: string | null
          source_platform?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requests_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_requirements: {
        Row: {
          created_at: string
          description: string
          display_order: number
          id: string
          is_required: boolean
          ohio_statute_ref: string | null
          requirement_type: string
          service_id: string
        }
        Insert: {
          created_at?: string
          description: string
          display_order?: number
          id?: string
          is_required?: boolean
          ohio_statute_ref?: string | null
          requirement_type?: string
          service_id: string
        }
        Update: {
          created_at?: string
          description?: string
          display_order?: number
          id?: string
          is_required?: boolean
          ohio_statute_ref?: string | null
          requirement_type?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_requirements_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          service_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          service_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          service_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_upsells: {
        Row: {
          created_at: string
          discount_percent: number | null
          id: string
          is_active: boolean
          message: string
          suggested_service: string
          trigger_service: string
        }
        Insert: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          message?: string
          suggested_service: string
          trigger_service: string
        }
        Update: {
          created_at?: string
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          message?: string
          suggested_service?: string
          trigger_service?: string
        }
        Relationships: []
      }
      service_workflows: {
        Row: {
          created_at: string
          id: string
          requires_admin_action: boolean
          requires_client_action: boolean
          service_id: string
          step_description: string | null
          step_name: string
          step_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          requires_admin_action?: boolean
          requires_client_action?: boolean
          service_id: string
          step_description?: string | null
          step_name: string
          step_number?: number
        }
        Update: {
          created_at?: string
          id?: string
          requires_admin_action?: boolean
          requires_client_action?: boolean
          service_id?: string
          step_description?: string | null
          step_name?: string
          step_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "service_workflows_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          avg_rating: number | null
          cancellation_hours: number | null
          category: string
          created_at: string
          description: string | null
          display_order: number
          duration_minutes: number | null
          email_templates: Json | null
          estimated_turnaround: string | null
          hero_image_url: string | null
          icon: string | null
          id: string
          is_active: boolean
          is_popular: boolean
          name: string
          price_from: number | null
          price_to: number | null
          pricing_model: string
          short_description: string | null
          updated_at: string
          video_url: string | null
        }
        Insert: {
          avg_rating?: number | null
          cancellation_hours?: number | null
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          email_templates?: Json | null
          estimated_turnaround?: string | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name: string
          price_from?: number | null
          price_to?: number | null
          pricing_model?: string
          short_description?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Update: {
          avg_rating?: number | null
          cancellation_hours?: number | null
          category?: string
          created_at?: string
          description?: string | null
          display_order?: number
          duration_minutes?: number | null
          email_templates?: Json | null
          estimated_turnaround?: string | null
          hero_image_url?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean
          is_popular?: boolean
          name?: string
          price_from?: number | null
          price_to?: number | null
          pricing_model?: string
          short_description?: string | null
          updated_at?: string
          video_url?: string | null
        }
        Relationships: []
      }
      session_tracking: {
        Row: {
          appointment_id: string
          created_at: string
          id: string
          notes: string | null
          shareable_token: string
          status: string
          updated_at: string
        }
        Insert: {
          appointment_id: string
          created_at?: string
          id?: string
          notes?: string | null
          shareable_token?: string
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_id?: string
          created_at?: string
          id?: string
          notes?: string | null
          shareable_token?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_tracking_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      signnow_documents: {
        Row: {
          appointment_id: string | null
          completed_at: string | null
          created_at: string
          document_name: string
          id: string
          invite_sent_at: string | null
          signed_at: string | null
          signnow_document_id: string
          signnow_emails_sent: Json
          status: string
          updated_at: string
          viewed_at: string | null
        }
        Insert: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          document_name?: string
          id?: string
          invite_sent_at?: string | null
          signed_at?: string | null
          signnow_document_id: string
          signnow_emails_sent?: Json
          status?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Update: {
          appointment_id?: string | null
          completed_at?: string | null
          created_at?: string
          document_name?: string
          id?: string
          invite_sent_at?: string | null
          signed_at?: string | null
          signnow_document_id?: string
          signnow_emails_sent?: Json
          status?: string
          updated_at?: string
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signnow_documents_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      skip_trace_requests: {
        Row: {
          client_id: string
          created_at: string
          data_sources_used: string[] | null
          fee: number | null
          id: string
          purpose: string | null
          result_address: string | null
          result_email: string | null
          result_notes: string | null
          result_phone: string | null
          status: string
          subject_dob: string | null
          subject_last_known_address: string | null
          subject_name: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          data_sources_used?: string[] | null
          fee?: number | null
          id?: string
          purpose?: string | null
          result_address?: string | null
          result_email?: string | null
          result_notes?: string | null
          result_phone?: string | null
          status?: string
          subject_dob?: string | null
          subject_last_known_address?: string | null
          subject_name: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          data_sources_used?: string[] | null
          fee?: number | null
          id?: string
          purpose?: string | null
          result_address?: string | null
          result_email?: string | null
          result_notes?: string | null
          result_phone?: string | null
          status?: string
          subject_dob?: string | null
          subject_last_known_address?: string | null
          subject_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      sos_filings: {
        Row: {
          client_id: string
          confirmation_url: string | null
          created_at: string
          entity_name: string
          fee: number | null
          filing_date: string | null
          filing_number: string | null
          filing_type: string
          id: string
          notes: string | null
          state: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          confirmation_url?: string | null
          created_at?: string
          entity_name: string
          fee?: number | null
          filing_date?: string | null
          filing_number?: string | null
          filing_type?: string
          id?: string
          notes?: string | null
          state?: string
          status?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          confirmation_url?: string | null
          created_at?: string
          entity_name?: string
          fee?: number | null
          filing_date?: string | null
          filing_number?: string | null
          filing_type?: string
          id?: string
          notes?: string | null
          state?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      time_slots: {
        Row: {
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_available: boolean
          specific_date: string | null
          start_time: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_available?: boolean
          specific_date?: string | null
          start_time: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_available?: boolean
          specific_date?: string | null
          start_time?: string
        }
        Relationships: []
      }
      tool_generation_versions: {
        Row: {
          created_at: string
          generation_id: string
          id: string
          result: string
        }
        Insert: {
          created_at?: string
          generation_id: string
          id?: string
          result?: string
        }
        Update: {
          created_at?: string
          generation_id?: string
          id?: string
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_generation_versions_generation_id_fkey"
            columns: ["generation_id"]
            isOneToOne: false
            referencedRelation: "tool_generations"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_generations: {
        Row: {
          created_at: string
          edited_at: string | null
          fields: Json
          id: string
          is_preset: boolean
          preset_name: string | null
          result: string
          tool_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          edited_at?: string | null
          fields?: Json
          id?: string
          is_preset?: boolean
          preset_name?: string | null
          result?: string
          tool_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          edited_at?: string | null
          fields?: Json
          id?: string
          is_preset?: boolean
          preset_name?: string | null
          result?: string
          tool_id?: string
          user_id?: string
        }
        Relationships: []
      }
      translation_requests: {
        Row: {
          affidavit_path: string | null
          certified: boolean
          client_id: string
          created_at: string
          deadline: string | null
          document_name: string
          document_path: string | null
          fee: number | null
          id: string
          notes: string | null
          page_count: number | null
          source_language: string
          status: string
          target_language: string
          translator_credentials: string | null
          translator_name: string | null
          updated_at: string
        }
        Insert: {
          affidavit_path?: string | null
          certified?: boolean
          client_id: string
          created_at?: string
          deadline?: string | null
          document_name: string
          document_path?: string | null
          fee?: number | null
          id?: string
          notes?: string | null
          page_count?: number | null
          source_language?: string
          status?: string
          target_language: string
          translator_credentials?: string | null
          translator_name?: string | null
          updated_at?: string
        }
        Update: {
          affidavit_path?: string | null
          certified?: boolean
          client_id?: string
          created_at?: string
          deadline?: string | null
          document_name?: string
          document_path?: string | null
          fee?: number | null
          id?: string
          notes?: string | null
          page_count?: number | null
          source_language?: string
          status?: string
          target_language?: string
          translator_credentials?: string | null
          translator_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      usage_tracking: {
        Row: {
          created_at: string
          feature: string
          id: string
          period_start: string
          usage_count: number
          usage_period: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature: string
          id?: string
          period_start?: string
          usage_count?: number
          usage_period?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature?: string
          id?: string
          period_start?: string
          usage_count?: number
          usage_period?: string
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_signatures: {
        Row: {
          created_at: string
          font_family: string | null
          id: string
          image_path: string | null
          is_default: boolean | null
          name: string
          style_config: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          font_family?: string | null
          id?: string
          image_path?: string | null
          is_default?: boolean | null
          name?: string
          style_config?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          font_family?: string | null
          id?: string
          image_path?: string | null
          is_default?: boolean | null
          name?: string
          style_config?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      virtual_assistant_tasks: {
        Row: {
          assigned_to: string | null
          client_id: string
          created_at: string
          deadline: string | null
          deliverable_path: string | null
          description: string | null
          hourly_rate: number | null
          hours_actual: number | null
          hours_estimated: number | null
          id: string
          notes: string | null
          priority: string
          status: string
          task_type: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          client_id: string
          created_at?: string
          deadline?: string | null
          deliverable_path?: string | null
          description?: string | null
          hourly_rate?: number | null
          hours_actual?: number | null
          hours_estimated?: number | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          task_type?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          client_id?: string
          created_at?: string
          deadline?: string | null
          deliverable_path?: string | null
          description?: string | null
          hourly_rate?: number | null
          hours_actual?: number | null
          hours_estimated?: number | null
          id?: string
          notes?: string | null
          priority?: string
          status?: string
          task_type?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      vital_records_requests: {
        Row: {
          agency: string | null
          agency_fee: number | null
          client_id: string
          copies_requested: number
          county: string | null
          created_at: string
          date_of_event: string | null
          id: string
          notes: string | null
          person_name: string
          record_type: string
          service_fee: number | null
          state: string
          status: string
          tracking_number: string | null
          updated_at: string
        }
        Insert: {
          agency?: string | null
          agency_fee?: number | null
          client_id: string
          copies_requested?: number
          county?: string | null
          created_at?: string
          date_of_event?: string | null
          id?: string
          notes?: string | null
          person_name: string
          record_type?: string
          service_fee?: number | null
          state?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Update: {
          agency?: string | null
          agency_fee?: number | null
          client_id?: string
          copies_requested?: number
          county?: string | null
          created_at?: string
          date_of_event?: string | null
          id?: string
          notes?: string | null
          person_name?: string
          record_type?: string
          service_fee?: number | null
          state?: string
          status?: string
          tracking_number?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          created_at: string
          id: string
          notified_at: string | null
          preferred_date: string | null
          service_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notified_at?: string | null
          preferred_date?: string | null
          service_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notified_at?: string | null
          preferred_date?: string | null
          service_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "waitlist_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_events: {
        Row: {
          created_at: string
          error: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          source: string
          status: string
        }
        Insert: {
          created_at?: string
          error?: string | null
          event_type: string
          id?: string
          payload?: Json
          processed_at?: string | null
          source: string
          status?: string
        }
        Update: {
          created_at?: string
          error?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          source?: string
          status?: string
        }
        Relationships: []
      }
      witnesses: {
        Row: {
          address: string | null
          appointment_id: string
          created_at: string
          full_name: string
          id: string
          id_number: string | null
          id_type: string | null
        }
        Insert: {
          address?: string | null
          appointment_id: string
          created_at?: string
          full_name: string
          id?: string
          id_number?: string | null
          id_type?: string | null
        }
        Update: {
          address?: string | null
          appointment_id?: string
          created_at?: string
          full_name?: string
          id?: string
          id_number?: string | null
          id_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "witnesses_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      e_seal_verifications_public: {
        Row: {
          commissioned_state: string | null
          document_hash: string | null
          id: string | null
          notarized_at: string | null
          notary_name: string | null
          revoked_at: string | null
          status: string | null
          verification_note: string | null
        }
        Insert: {
          commissioned_state?: string | null
          document_hash?: string | null
          id?: string | null
          notarized_at?: string | null
          notary_name?: string | null
          revoked_at?: string | null
          status?: string | null
          verification_note?: string | null
        }
        Update: {
          commissioned_state?: string | null
          document_hash?: string | null
          id?: string | null
          notarized_at?: string | null
          notary_name?: string | null
          revoked_at?: string | null
          status?: string | null
          verification_note?: string | null
        }
        Relationships: []
      }
      journal_entries_legacy: {
        Row: {
          appointment_id: string | null
          communication_technology: string | null
          created_at: string | null
          document_type: string | null
          entry_date: string | null
          entry_time: string | null
          id: string | null
          id_number: string | null
          id_type: string | null
          journal_number: string | null
          notarial_act_type: string | null
          notary_name: string | null
          notary_user_id: string | null
          notes: string | null
          signer_address: string | null
          signer_name: string | null
        }
        Insert: {
          appointment_id?: string | null
          communication_technology?: never
          created_at?: string | null
          document_type?: string | null
          entry_date?: never
          entry_time?: never
          id?: string | null
          id_number?: string | null
          id_type?: string | null
          journal_number?: never
          notarial_act_type?: string | null
          notary_name?: string | null
          notary_user_id?: string | null
          notes?: string | null
          signer_address?: string | null
          signer_name?: string | null
        }
        Update: {
          appointment_id?: string | null
          communication_technology?: never
          created_at?: string | null
          document_type?: string | null
          entry_date?: never
          entry_time?: never
          id?: string | null
          id_number?: string | null
          id_type?: string | null
          journal_number?: never
          notarial_act_type?: string | null
          notary_name?: string | null
          notary_user_id?: string | null
          notes?: string | null
          signer_address?: string | null
          signer_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notary_journal_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notary_journal_created_by_fkey"
            columns: ["notary_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      notary_pages_public: {
        Row: {
          accent_color: string | null
          bio: string | null
          cover_photo_path: string | null
          created_at: string | null
          credentials: Json | null
          display_name: string | null
          external_booking_url: string | null
          font_family: string | null
          gallery_photos: Json | null
          id: string | null
          is_featured: boolean | null
          is_published: boolean | null
          nav_services: Json | null
          professional_type: string | null
          profile_photo_path: string | null
          seo_description: string | null
          seo_title: string | null
          service_areas: Json | null
          services_offered: Json | null
          slug: string | null
          social_links: Json | null
          tagline: string | null
          theme_color: string | null
          title: string | null
          updated_at: string | null
          use_platform_booking: boolean | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          accent_color?: string | null
          bio?: string | null
          cover_photo_path?: string | null
          created_at?: string | null
          credentials?: Json | null
          display_name?: string | null
          external_booking_url?: string | null
          font_family?: string | null
          gallery_photos?: Json | null
          id?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          nav_services?: Json | null
          professional_type?: string | null
          profile_photo_path?: string | null
          seo_description?: string | null
          seo_title?: string | null
          service_areas?: Json | null
          services_offered?: Json | null
          slug?: string | null
          social_links?: Json | null
          tagline?: string | null
          theme_color?: string | null
          title?: string | null
          updated_at?: string | null
          use_platform_booking?: boolean | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          accent_color?: string | null
          bio?: string | null
          cover_photo_path?: string | null
          created_at?: string | null
          credentials?: Json | null
          display_name?: string | null
          external_booking_url?: string | null
          font_family?: string | null
          gallery_photos?: Json | null
          id?: string | null
          is_featured?: boolean | null
          is_published?: boolean | null
          nav_services?: Json | null
          professional_type?: string | null
          profile_photo_path?: string | null
          seo_description?: string | null
          seo_title?: string | null
          service_areas?: Json | null
          services_offered?: Json | null
          slug?: string | null
          social_links?: Json | null
          tagline?: string | null
          theme_color?: string | null
          title?: string | null
          updated_at?: string | null
          use_platform_booking?: boolean | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      public_feedback: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string | null
          feedback_type: string | null
          id: string | null
          rating: number | null
          reviewer_name: string | null
          service_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      public_reviews: {
        Row: {
          appointment_id: string | null
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
        }
        Insert: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
        }
        Update: {
          appointment_id?: string | null
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews_public: {
        Row: {
          comment: string | null
          created_at: string | null
          id: string | null
          rating: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string | null
          id?: string | null
          rating?: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_profit_share: {
        Args: { p_payment_id: string; p_professional_id: string }
        Returns: undefined
      }
      check_and_reserve_slot: {
        Args: {
          p_client_id: string
          p_date: string
          p_service_type: string
          p_time: string
        }
        Returns: string
      }
      check_journal_completeness: {
        Args: { p_appointment_id: string }
        Returns: boolean
      }
      create_per_document_journal_entries: {
        Args: {
          p_documents: Json
          p_notary_name: string
          p_notary_user_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_client_lifetime_value: {
        Args: { _client_id: string }
        Returns: number
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_audit_event: {
        Args: {
          _action: string
          _details?: Json
          _entity_id?: string
          _entity_type?: string
        }
        Returns: undefined
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      validate_ohio_fee_cap: {
        Args: { p_amount: number; p_notarial_act_count?: number }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "client" | "notary"
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "id_verification"
        | "kba_pending"
        | "in_session"
        | "completed"
        | "cancelled"
        | "no_show"
      document_status:
        | "uploaded"
        | "pending_review"
        | "approved"
        | "notarized"
        | "rejected"
      notarization_type: "in_person" | "ron"
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
      app_role: ["admin", "client", "notary"],
      appointment_status: [
        "scheduled",
        "confirmed",
        "id_verification",
        "kba_pending",
        "in_session",
        "completed",
        "cancelled",
        "no_show",
      ],
      document_status: [
        "uploaded",
        "pending_review",
        "approved",
        "notarized",
        "rejected",
      ],
      notarization_type: ["in_person", "ron"],
    },
  },
} as const
