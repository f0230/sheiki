// src/lib/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wrytzercbdwyjhgfaqsu.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndyeXR6ZXJjYmR3eWpoZ2ZhcXN1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcxNDU3MTYsImV4cCI6MjA2MjcyMTcxNn0.ElFQuV0TMA8AeFSH7jpVAiXWmWN4VLmEur_ki-S4uMU';

export const supabase = createClient(supabaseUrl, supabaseKey);
