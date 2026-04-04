export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      residents: {
        Row: {
          id: string
          created_at: string
          first_name: string
          last_name: string
          residency_year: 'R1' | 'R2' | 'R3' | 'R4'
          hospital: string
          email: string
        }
        Insert: {
          id?: string
          created_at?: string
          first_name: string
          last_name: string
          residency_year: 'R1' | 'R2' | 'R3' | 'R4'
          hospital: string
          email: string
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string
          last_name?: string
          residency_year?: 'R1' | 'R2' | 'R3' | 'R4'
          hospital?: string
          email?: string
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
