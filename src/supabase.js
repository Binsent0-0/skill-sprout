import { createClient } from '@supabase/supabase-js'

// Use 'import.meta.env' for Vite, or 'process.env' for Create React App
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)