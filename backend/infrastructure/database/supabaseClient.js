//backend/infrastructure/database/supabaseClient.js
const { createClient } = require("@supabase/supabase-js");

// Variables de entorno
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("SUPABASE_URL o SUPABASE_ANON_KEY no están definidas");
  process.exit(1);
}

/**
 * Fetch con timeout manual usando AbortController
 */
const fetchWithTimeout = async (url, options = {}, timeout = 30000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
};

/**
 * Cliente Supabase estándar (respeta RLS)
 * Usar para operaciones normales de base de datos
 */
const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
  global: {
    headers: {
      "X-Client-Info": "nexia-backend-client",
    },
    fetch: fetchWithTimeout,
  },
});

module.exports = { supabaseClient };
