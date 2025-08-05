// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Alternative database query function using Supabase client
export async function supabaseQuery(query: string, params?: unknown[]) {
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
