import { getSql } from './database';

interface RetryOptions {
  maxRetries: number;
  delayMs: number;
  backoff: boolean;
}

const DEFAULT_RETRY_OPTIONS: RetryOptions = {
  maxRetries: 3,
  delayMs: 1000,
  backoff: true
};

/**
 * Execute a database query with retry logic for handling connection timeouts
 */
export async function executeWithRetry<T>(
  queryFn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const { maxRetries, delayMs, backoff } = { ...DEFAULT_RETRY_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await queryFn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Only retry on connection-related errors
      if (isRetryableError(lastError)) {
        const delay = backoff ? delayMs * Math.pow(2, attempt) : delayMs;
        console.warn(`Database query failed (attempt ${attempt + 1}/${maxRetries + 1}):`, lastError.message);
        console.log(`Retrying in ${delay}ms...`);
        await sleep(delay);
      } else {
        // Non-retryable error, throw immediately
        throw lastError;
      }
    }
  }
  
  throw lastError;
}

/**
 * Check if an error is retryable (connection-related)
 */
function isRetryableError(error: Error): boolean {
  const retryableMessages = [
    'ConnectTimeoutError',
    'Connection timeout',
    'ECONNRESET',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNREFUSED',
    'Connection pool exhausted',
    'Connection terminated unexpectedly'
  ];
  
  return retryableMessages.some(msg => 
    error.message.includes(msg) || error.toString().includes(msg)
  );
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute a SQL query with retry logic
 */
export async function queryWithRetry<T>(query: string, params?: unknown[]): Promise<T> {
  return executeWithRetry(async () => {
    const sql = getSql();
    // Use template literal syntax for neon/serverless
    if (params && params.length > 0) {
      // For parameterized queries, we need to handle them appropriately
      throw new Error('Parameterized queries not supported in this helper. Use executeWithRetry with a custom function.');
    }
    return await sql.unsafe(query) as T;
  });
}

/**
 * Test database connectivity with retry
 */
export async function testConnection(): Promise<boolean> {
  try {
    await executeWithRetry(async () => {
      const sql = getSql();
      await sql`SELECT 1`;
    }, { maxRetries: 2, delayMs: 500 });
    return true;
  } catch (error) {
    console.error('Database connection test failed:', error);
    return false;
  }
}
