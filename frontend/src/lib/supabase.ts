// frontend/src/lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// . Tipos seguros para variables de entorno
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// . Validación en tiempo de ejecución
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Faltan las variables de entorno de Supabase.')
}

// . Cliente fuertemente tipado
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)
