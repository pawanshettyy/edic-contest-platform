import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { query, isDatabaseConnected } from '@/lib/database';

interface AdminTokenPayload {
  adminId: string;
  username: string;
  role: string;
  sessionType: string;
}

async function verifyAdminSession(token: string) {
  const decoded = jwt.verify(
    token,
    process.env.JWT_SECRET || 'fallback-secret-for-development'
  ) as AdminTokenPayload;
  
  if (decoded.sessionType !== 'admin') {
    throw new Error('Invalid session type');
  }
  
  // If database not available, allow fallback admin
  if (!isDatabaseConnected()) {
    if (decoded.adminId === 'fallback-admin-id') {
      return decoded;
    }
    throw new Error('Database not configured');
  }
  
  try {
    const sessions = await query(
      'SELECT * FROM admin_sessions WHERE admin_user_id = $1 AND is_active = true',
      [decoded.adminId]
    );
    
    if (!sessions || sessions.length === 0) {
      throw new Error('No active admin session found');
    }
    
    return decoded;
  } catch (error) {
    // If admin_sessions table doesn't exist, allow fallback
    if (decoded.adminId === 'fallback-admin-id') {
      return decoded;
    }
    throw error;
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('admin-token')?.value;
    
    if (!token) {
      return NextResponse.json({ error: 'No admin session' }, { status: 401 });
    }
    
    await verifyAdminSession(token);
    
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '50');
    const action = url.searchParams.get('action');
    const targetType = url.searchParams.get('target_type');
    const adminId = url.searchParams.get('admin_id');
    
    // If no database connection, return mock logs for development
    if (!isDatabaseConnected()) {
      return NextResponse.json({
        logs: [
          {
            id: '1',
            action: 'admin_login',
            target_type: 'auth',
            target_id: null,
            details: { message: 'Development mode - database not connected' },
            timestamp: new Date().toISOString(),
            ip_address: '127.0.0.1',
            admin_users: { username: 'admin' }
          }
        ],
        totalCount: 1,
        page,
        totalPages: 1,
        hasNextPage: false
      });
    }
    
    const offset = (page - 1) * limit;
    
    try {
      // Build base query with filters
      let whereClause = '';
      const params: (string | number)[] = [];
      let paramIndex = 1;
      
      if (action) {
        whereClause += `action = $${paramIndex}`;
        params.push(action);
        paramIndex++;
      }
      
      if (targetType) {
        if (whereClause) whereClause += ' AND ';
        whereClause += `target_type = $${paramIndex}`;
        params.push(targetType);
        paramIndex++;
      }
      
      if (adminId) {
        if (whereClause) whereClause += ' AND ';
        whereClause += `admin_user_id = $${paramIndex}`;
        params.push(adminId);
        paramIndex++;
      }
      
      const whereQuery = whereClause ? ` WHERE ${whereClause}` : '';
      
      // Get logs with pagination
      const logsQuery = `
        SELECT 
          al.id,
          al.action,
          al.target_type,
          al.target_id,
          al.details,
          al.timestamp,
          al.ip_address,
          au.id as admin_user_id,
          au.username,
          au.role
        FROM admin_logs al
        LEFT JOIN admin_users au ON al.admin_user_id = au.id
        ${whereQuery}
        ORDER BY al.timestamp DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      
      params.push(limit, offset);
      
      const logs = await query(logsQuery, params);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM admin_logs
        ${whereQuery}
      `;
      
      const countParams = params.slice(0, -2); // Remove limit and offset
      const countResult = await query(countQuery, countParams);
      const totalCount = parseInt((countResult[0] as { total: string })?.total || '0');
      
      // Get activity statistics
      let activityStats = {};
      try {
        const statsResult = await query(`
          SELECT 
            action,
            COUNT(*) as count,
            DATE_TRUNC('day', timestamp) as date
          FROM admin_logs
          WHERE timestamp >= NOW() - INTERVAL '7 days'
          GROUP BY action, DATE_TRUNC('day', timestamp)
          ORDER BY date DESC
        `);
        
        activityStats = {
          recentActivity: statsResult || [],
          totalLogs: totalCount
        };
      } catch (statsError) {
        console.warn('Could not fetch activity stats:', statsError);
      }
      
      // Transform logs to match expected format
      interface LogRow {
        id: string;
        action: string;
        target_type: string;
        target_id: string | null;
        details: object;
        timestamp: string;
        ip_address: string;
        admin_user_id: string;
        username: string;
        role: string;
      }
      
      const transformedLogs = (logs as LogRow[] || []).map((log: LogRow) => ({
        id: log.id,
        action: log.action,
        target_type: log.target_type,
        target_id: log.target_id,
        details: log.details,
        timestamp: log.timestamp,
        ip_address: log.ip_address,
        admin_users: {
          id: log.admin_user_id,
          username: log.username,
          role: log.role
        }
      }));
      
      return NextResponse.json({
        logs: transformedLogs,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit)
        },
        stats: activityStats
      });
      
    } catch (dbError) {
      console.error('Database error in admin logs:', dbError);
      
      // Fallback to mock data if database error
      return NextResponse.json({
        logs: [
          {
            id: '1',
            action: 'system_error',
            target_type: 'database',
            target_id: null,
            details: { message: 'Database connection error - showing fallback data' },
            timestamp: new Date().toISOString(),
            ip_address: '127.0.0.1',
            admin_users: { username: 'system' }
          }
        ],
        pagination: {
          page: 1,
          limit: 50,
          total: 1,
          totalPages: 1
        },
        stats: { totalLogs: 1 }
      });
    }
    
  } catch (error) {
    console.error('Admin logs GET error:', error);
    
    if (error instanceof jwt.JsonWebTokenError || (error instanceof Error && error.message.includes('session'))) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
