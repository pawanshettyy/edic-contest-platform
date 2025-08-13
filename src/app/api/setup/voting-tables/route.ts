import { NextResponse } from 'next/server';
import { getSql } from '@/lib/database';
import fs from 'fs';
import path from 'path';

export async function POST() {
  try {
    const sql = getSql();
    
    // Read the voting tables migration SQL
    const migrationPath = path.join(process.cwd(), 'database', 'voting-tables-migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // Split the migration into individual statements
    const statements = migrationSQL
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--') && statement !== 'COMMIT');
    
    const results = [];
    
    // Execute each statement
    for (const statement of statements) {
      try {
        console.log('Executing:', statement.substring(0, 100) + '...');
        const result = await sql.unsafe(statement);
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: true,
          result: result
        });
      } catch (error) {
        console.error('Error executing statement:', statement);
        console.error('Error:', error);
        results.push({
          statement: statement.substring(0, 100) + '...',
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
    
    return NextResponse.json({
      success: true,
      message: 'Voting tables migration completed',
      results
    });
    
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run voting tables migration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
