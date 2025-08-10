// Database configuration and connection utilities
// Updated to use Neon serverless driver for production
import { neon } from '@neondatabase/serverless';

// Database connection
let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL environment variable is required');
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    console.log('🔗 Initializing Neon serverless connection...');
    sql = neon(connectionString);
  }
  
  return sql;
}

// Check if database is available
export function isDatabaseConnected(): boolean {
  return !!process.env.DATABASE_URL;
}

// Database query wrapper with error handling
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  if (!isDatabaseConnected()) {
    console.error('❌ DATABASE_URL not configured');
    throw new Error('Database not configured');
  }

  try {
    const sql = getSql();
    
    // For Neon serverless, convert parameterized queries to template literals
    if (params && params.length > 0) {
      // Build the query using template literal syntax
      let formattedQuery = text;
      
      // Replace $1, $2, etc. with actual parameter values
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        formattedQuery = formattedQuery.replace(placeholder, '?PARAM' + index + '?');
      });
      
      // Split the query by parameter placeholders
      const parts = formattedQuery.split(/\?PARAM\d+\?/);
      const strings = parts.map((part, i) => part + (i < params.length ? '' : ''));
      
      // Create a template literal call
      const result = await sql(strings as unknown as TemplateStringsArray, ...params);
      return result as T[];
    } else {
      // For simple queries without parameters, use template literal
      const result = await sql`${text}`;
      return result as T[];
    }
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  if (!isDatabaseConnected()) {
    console.log('❌ Database not configured');
    return false;
  }

  try {
    const sql = getSql();
    await sql`SELECT 1 as health_check`;
    console.log('✅ Database health check passed');
    return true;
  } catch (error) {
    console.error('❌ Database health check failed:', error);
    return false;
  }
}

// Legacy functions for backward compatibility
export async function transaction<T>(
  callback: (client: unknown) => Promise<T>
): Promise<T> {
  if (!isDatabaseConnected()) {
    console.log('🔧 Database not available, skipping transaction');
    throw new Error('Database not configured');
  }

  // Note: Neon serverless doesn't support transactions in the same way
  // This is a simplified implementation
  try {
    const mockClient = { query };
    return await callback(mockClient);
  } catch (error) {
    console.error('Transaction error:', error);
    throw error;
  }
}

export async function closePool(): Promise<void> {
  // Neon serverless doesn't require explicit connection closing
  console.log('🔄 Neon serverless connections are automatically managed');
}
