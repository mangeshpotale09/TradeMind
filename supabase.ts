
import { createClient } from '@supabase/supabase-js';

// Attempt to get credentials from environment variables if they exist
const supabaseUrl = (typeof process !== 'undefined' && process.env?.SUPABASE_URL) || 'https://cbholbwqicamdveptlis.supabase.co';
const supabaseAnonKey = (typeof process !== 'undefined' && process.env?.SUPABASE_ANON_KEY) || 'sb_publishable_akkGB2VwmRKMl0l40lVh7A_yqNynuxD';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
