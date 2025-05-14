import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;  // Cambié process.env por import.meta.env
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;  // Cambié process.env por import.meta.env

export const supabase = createClient(supabaseUrl, supabaseKey);


