// Legacy Supabase configuration - replaced with Neon PostgreSQL
// This file is kept for backward compatibility but is no longer used

// Database connection has been migrated to Neon PostgreSQL
// See src/lib/database.ts for current database implementation

export const supabase = null;

// Legacy function - replaced with Neon queries
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function supabaseQuery(_query: string, _params?: unknown[]) {
  throw new Error('Supabase has been replaced with Neon PostgreSQL. Use database.ts instead.');
}
