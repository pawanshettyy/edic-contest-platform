import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const sql = getSql();
    
    // Read the schema update SQL
    const migrationPath = path.join(process.cwd(), 'database', 'update-production-schema.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => 
        statement.length > 0 && 
        !statement.startsWith('--') && 
        statement !== 'COMMIT' &&
        !statement.match(/^\s*$/)
      );
    
    const results = [];
    let successCount = 0;
    let errorCount = 0;
    
    // Execute each statement
    for (const statement of statements) {
      try {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const result = await sql.unsafe(statement);
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: true,
          result: Array.isArray(result) ? `${result.length} rows affected` : 'Success'
        });
        successCount++;
      } catch (error) {
        console.error('Error executing statement:', statement.substring(0, 100));
        console.error('Error:', error);
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        errorCount++;
        
        // Continue with other statements even if one fails
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Production schema update completed: ${successCount} success, ${errorCount} errors`,
      summary: {
        totalStatements: statements.length,
        successCount,
        errorCount
      },
      results
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run production schema update',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Production Schema Update API',
    description: 'Use POST to run the schema update',
    warning: 'This will update the production database schema'
  });
}
