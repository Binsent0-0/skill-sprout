import { createClient } from '@supabase/supabase-js'

// logic to check if we are using Vite or CRA
const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL || process.env.REACT_APP_SUPABASE_URL
const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY || process.env.REACT_APP_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase URL or Key. Check your .env file.")
}

export const supabase = createClient(supabaseUrl, supabaseKey)