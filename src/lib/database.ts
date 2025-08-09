// Database configuration and connection utilities
import { Pool, PoolClient } from 'pg';

// Database connection pool
let pool: Pool | null = null;
let isDatabaseAvailable = false;

export function getPool(): Pool {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    
    if (!connectionString) {
      console.log('⚠️ No DATABASE_URL found, database operations will use fallback mode');
      isDatabaseAvailable = false;
      // Create a placeholder pool (won't be used for actual connections)
      pool = {} as Pool;
    } else {
      isDatabaseAvailable = true;
      pool = new Pool({
        connectionString: connectionString,
        ssl: connectionString.includes('localhost') ? false : {
          rejectUnauthorized: false
        },
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        keepAlive: true,
        keepAliveInitialDelayMillis: 0,
      });
    }
  }
  return pool;
}

// Check if database is available
export function isDatabaseConnected(): boolean {
  return isDatabaseAvailable && !!process.env.DATABASE_URL;
}

// Database query wrapper with error handling and fallback
export async function query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
  // Return empty array if database is not available
  if (!isDatabaseConnected()) {
    console.log('🔧 Database not available, returning empty result set');
    return [];
  }

  const client = await getPool().connect();
  try {
    const result = await client.query(text, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Transaction wrapper
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  // Return null/undefined if database is not available
  if (!isDatabaseConnected()) {
    console.log('🔧 Database not available, skipping transaction');
    return undefined as T;
  }

  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Transaction error:', error);
    throw error;
  } finally {
    client.release();
  }
}

// Health check function
export async function healthCheck(): Promise<boolean> {
  if (!isDatabaseConnected()) {
    return false;
  }

  try {
    await query('SELECT 1');
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
}

// Close pool (for graceful shutdown)
export async function closePool(): Promise<void> {
  if (pool && isDatabaseConnected()) {
    await pool.end();
    pool = null;
  }
}
