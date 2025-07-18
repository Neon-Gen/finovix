import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          company_name: string
          subscription_plan: 'basic' | 'standard' | 'pro'
          created_at: string
        }
        Insert: {
          id: string
          email: string
          full_name: string
          company_name: string
          subscription_plan?: 'basic' | 'standard' | 'pro'
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          company_name?: string
          subscription_plan?: 'basic' | 'standard' | 'pro'
          created_at?: string
        }
      }
      user_settings: {
        Row: {
          user_id: string
          full_name: string
          email: string
          phone?: string
          avatar_url?: string
          company_name?: string
          company_address?: string
          company_phone?: string
          company_email?: string
          company_website?: string
          tax_number?: string
          currency: string
          date_format: string
          time_format: string
          language: string
          timezone: string
          default_tax_rate: number
          email_notifications: boolean
          push_notifications: boolean
          marketing_emails: boolean
          data_sharing: boolean
          bill_reminders: boolean
          payment_alerts: boolean
          expense_alerts: boolean
          weekly_reports: boolean
          monthly_reports: boolean
          analytics_tracking: boolean
          two_factor_auth: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          full_name?: string
          email?: string
          phone?: string
          avatar_url?: string
          company_name?: string
          company_address?: string
          company_phone?: string
          company_email?: string
          company_website?: string
          tax_number?: string
          currency?: string
          date_format?: string
          time_format?: string
          language?: string
          timezone?: string
          default_tax_rate?: number
          email_notifications?: boolean
          push_notifications?: boolean
          marketing_emails?: boolean
          data_sharing?: boolean
          bill_reminders?: boolean
          payment_alerts?: boolean
          expense_alerts?: boolean
          weekly_reports?: boolean
          monthly_reports?: boolean
          analytics_tracking?: boolean
          two_factor_auth?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          full_name?: string
          email?: string
          phone?: string
          avatar_url?: string
          company_name?: string
          company_address?: string
          company_phone?: string
          company_email?: string
          company_website?: string
          tax_number?: string
          currency?: string
          date_format?: string
          time_format?: string
          language?: string
          timezone?: string
          default_tax_rate?: number
          email_notifications?: boolean
          push_notifications?: boolean
          marketing_emails?: boolean
          data_sharing?: boolean
          bill_reminders?: boolean
          payment_alerts?: boolean
          expense_alerts?: boolean
          weekly_reports?: boolean
          monthly_reports?: boolean
          analytics_tracking?: boolean
          two_factor_auth?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bills: {
        Row: {
          id: string
          user_id: string
          bill_number: string
          customer_name: string
          customer_email: string
          customer_phone: string
          items: any[]
          subtotal: number
          tax_amount: number
          total_amount: number
          status: 'draft' | 'sent' | 'paid' | 'overdue'
          created_at: string
          due_date: string
        }
        Insert: {
          id?: string
          user_id: string
          bill_number: string
          customer_name: string
          customer_email?: string
          customer_phone?: string
          items: any[]
          subtotal: number
          tax_amount: number
          total_amount: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          created_at?: string
          due_date: string
        }
        Update: {
          id?: string
          user_id?: string
          bill_number?: string
          customer_name?: string
          customer_email?: string
          customer_phone?: string
          items?: any[]
          subtotal?: number
          tax_amount?: number
          total_amount?: number
          status?: 'draft' | 'sent' | 'paid' | 'overdue'
          created_at?: string
          due_date?: string
        }
      }
      expenses: {
        Row: {
          id: string
          user_id: string
          description: string
          amount: number
          category: string
          date: string
          receipt_url?: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          description: string
          amount: number
          category: string
          date: string
          receipt_url?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          description?: string
          amount?: number
          category?: string
          date?: string
          receipt_url?: string
          created_at?: string
        }
      }
      employees: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          phone: string
          hourly_rate: number
          overtime_rate: number
          position: string
          department: string
          hire_date: string
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          phone: string
          hourly_rate: number
          overtime_rate: number
          position: string
          department: string
          hire_date: string
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          phone?: string
          hourly_rate?: number
          overtime_rate?: number
          position?: string
          department?: string
          hire_date?: string
          is_active?: boolean
          created_at?: string
        }
      }
      attendance: {
        Row: {
          id: string
          user_id: string
          employee_id: string
          date: string
          check_in: string
          check_out?: string
          regular_hours: number
          overtime_hours: number
          total_pay: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          employee_id: string
          date: string
          check_in: string
          check_out?: string
          regular_hours?: number
          overtime_hours?: number
          total_pay?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          employee_id?: string
          date?: string
          check_in?: string
          check_out?: string
          regular_hours?: number
          overtime_hours?: number
          total_pay?: number
          created_at?: string
        }
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
  }
}