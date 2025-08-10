// Neon serverless database configuration
import { neon } from '@neondatabase/serverless';

// Database connection
let sql: ReturnType<typeof neon> | null = null;

export function getSql() {
  if (!sql) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required');
    }
    
    sql = neon(connectionString);
  }
  
  return sql;
}

// Check if database is configured
export function isDatabaseConnected(): boolean {
  return !!process.env.DATABASE_URL;
}

// Simple template literal query wrapper
export async function executeQuery<T = unknown>(queryFn: (sql: ReturnType<typeof neon>) => Promise<T[]>): Promise<T[]> {
  if (!isDatabaseConnected()) {
    console.error('❌ DATABASE_URL not configured');
    throw new Error('Database not configured');
  }

  try {
    const sql = getSql();
    const result = await queryFn(sql);
    return result;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Legacy query function for backward compatibility - converts to template literals
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  if (!isDatabaseConnected()) {
    console.error('❌ DATABASE_URL not configured');
    throw new Error('Database not configured');
  }

  try {
    const sql = getSql();
    
    // Convert parameterized query to template literal format
    if (params && params.length > 0) {
      // Replace $1, $2, etc. with actual values for simple cases
      let formattedQuery = text;
      params.forEach((param, index) => {
        const placeholder = `$${index + 1}`;
        let replacement: string;
        
        if (typeof param === 'string') {
          replacement = `'${param.replace(/'/g, "''")}'`; // Escape single quotes
        } else if (param === null || param === undefined) {
          replacement = 'NULL';
        } else {
          replacement = String(param);
        }
        
        formattedQuery = formattedQuery.replace(placeholder, replacement);
      });
      
      const result = await sql([formattedQuery] as unknown as TemplateStringsArray);
      return result as T[];
    } else {
      // Simple query without parameters
      const result = await sql([text] as unknown as TemplateStringsArray);
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
    return false;
  }

  try {
    const sql = getSql();
    await sql`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Server action for getting data (as suggested by Neon)
export async function getData() {
  const sql = getSql();
  const data = await sql`SELECT * FROM teams LIMIT 10`;
  return data;
}
