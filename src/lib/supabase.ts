// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Only create client if environment variables are available
export const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

// Alternative database query function using Supabase client
export async function supabaseQuery(query: string, params?: unknown[]) {
  if (!supabase) {
    throw new Error('Supabase client not configured - missing environment variables');
  }
  
  try {
    const { data, error } = await supabase.rpc('execute_sql', {
      query,
      params: params || []
    });
    
    if (error) {
      console.error('Supabase query error:', error);
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Supabase connection error:', error);
    throw error;
  }
}
