import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

console.log('Supabase Config:', { 
  url: supabaseUrl, 
  keyLength: supabaseAnonKey?.length,
  keyStart: supabaseAnonKey?.substring(0, 10) + '...'
});

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client for server-side admin operations only (bypasses RLS)
// Note: Only use this in API routes, never in client components
export const getSupabaseAdmin = () => {
  if (typeof window !== 'undefined') {
    throw new Error('supabaseAdmin should only be used on server side')
  }
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  return createClient(supabaseUrl, supabaseServiceKey)
}

export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string
          created_at: string
          email: string
          first_name: string
          last_name: string
          phone?: string
          preferences?: any
          user_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          email: string
          first_name: string
          last_name: string
          phone?: string
          preferences?: any
          user_id: string
        }
        Update: {
          id?: string
          created_at?: string
          email?: string
          first_name?: string
          last_name?: string
          phone?: string
          preferences?: any
          user_id?: string
        }
      }
      sessions: {
        Row: {
          id: string
          created_at: string
          client_id: string
          session_type: string
          session_title: string
          session_date: string
          session_time: string
          location: string
          duration: string
          photographer: string
          investment: string
          status: string
          timeline?: any
        }
        Insert: {
          id?: string
          created_at?: string
          client_id: string
          session_type: string
          session_title: string
          session_date: string
          session_time: string
          location: string
          duration: string
          photographer: string
          investment: string
          status: string
          timeline?: any
        }
        Update: {
          id?: string
          created_at?: string
          client_id?: string
          session_type?: string
          session_title?: string
          session_date?: string
          session_time?: string
          location?: string
          duration?: string
          photographer?: string
          investment?: string
          status?: string
          timeline?: any
        }
      }
      documents: {
        Row: {
          id: string
          created_at: string
          client_id: string
          session_id?: string
          title: string
          description: string
          type: string
          status: string
          file_url?: string
          date?: string
        }
        Insert: {
          id?: string
          created_at?: string
          client_id: string
          session_id?: string
          title: string
          description: string
          type: string
          status: string
          file_url?: string
          date?: string
        }
        Update: {
          id?: string
          created_at?: string
          client_id?: string
          session_id?: string
          title?: string
          description?: string
          type?: string
          status?: string
          file_url?: string
          date?: string
        }
      }
    }
  }
}