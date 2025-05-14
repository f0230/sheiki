import { createClient } from '@supabase/supabase-js';

// Asegúrate de que estas credenciales estén actualizadas
const supabaseUrl = process.env.SUPABASE_URL;  // Vercel maneja estas variables de entorno
const supabaseKey = process.env.SUPABASE_ANON_KEY;  // Vercel maneja estas variables de entorno
export const supabase = createClient(supabaseUrl, supabaseKey);
