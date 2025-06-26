// src/supabase/config.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://dsvqjsnxdxlgufzwcaub.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdnFqc254ZHhsZ3VmendjYXViIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA4MjgyMjMsImV4cCI6MjA2NjQwNDIyM30.YHdiWzPvU6XBXFzcDZL7LKtgjU_dv5pVVpFRF8OkEz8'

// Service role key (you need to get this from Supabase dashboard)
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzdnFqc254ZHhsZ3VmendjYXViIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDgyODIyMywiZXhwIjoyMDY2NDA0MjIzfQ._gqhjKgKmSVQyYsBrLTvls0EkLR9MIU99qnB8WJj5bU' // Replace with actual service role key

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// Admin client with service role key for bypassing RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
})

// Export as 'db' for compatibility with existing Firebase imports
export const db = supabase

// Default export
export default supabase