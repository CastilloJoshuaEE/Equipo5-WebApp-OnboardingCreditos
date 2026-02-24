//backend/infrastructure/database/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");

// Variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(" SUPABASE_URL o SUPABASE_ANON_KEY no están definidas");
  process.exit(1);
}

/**
 * Cliente Supabase estándar (respeta RLS)
 * Usar para operaciones normales de base de datos
 */
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      "X-Client-Info": "nexia-backend-client",
    },
  },
});

module.exports = {supabaseClient};
