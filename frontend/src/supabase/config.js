// src/supabase/config.js
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://superdb.myaccessio.com/'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIiwiaWF0IjoxNzU1ODAxMDAwLCJleHAiOjE5MTM1Njc0MDB9.uMtajMVPuVUqv7-jj-suVlCzRyejrHM-rPjoaZSTwRs'
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UiLCJpYXQiOjE3NTU4MDEwMDAsImV4cCI6MTkxMzU2NzQwMH0.Bjf92niNuUOcG4pA6EU2pq4lDOHeBVZk5kCABoyddTc'

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