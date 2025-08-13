import { NextRequest, NextResponse } from 'next/server';
import { getSql } from '@/lib/database';
import { SecurityUtils } from '@/lib/security';
import jwt from 'jsonwebtoken';

// Security monitoring endpoint for administrators
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = jwt.verify(
      adminToken, 
      process.env.JWT_SECRET || 'fallback-secret-for-development'
    ) as any;

    if (payload.sessionType !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const sql = getSql();
    
    // Get security dashboard data
    const dashboardData = await sql`
      SELECT 
        (SELECT COUNT(*) FROM teams WHERE status = 'active') as active_teams,
        (SELECT COUNT(*) FROM audit_logs WHERE timestamp > NOW() - INTERVAL '24 hours') as events_24h,
        (SELECT COUNT(*) FROM audit_logs WHERE severity IN ('ERROR', 'CRITICAL') AND timestamp > NOW() - INTERVAL '24 hours') as critical_events_24h,
        (SELECT COUNT(*) FROM voting_sessions WHERE status = 'active') as active_voting_sessions,
        (SELECT COUNT(*) FROM votes WHERE created_at > NOW() - INTERVAL '24 hours') as votes_24h
    ` as Array<{
      active_teams: string;
      events_24h: string;
      critical_events_24h: string;
      active_voting_sessions: string;
      votes_24h: string;
    }>;

    // Get recent security events
    const recentEvents = await sql`
      SELECT 
        event_type,
        severity,
        timestamp,
        user_id,
        ip_address,
        details
      FROM audit_logs 
      WHERE timestamp > NOW() - INTERVAL '24 hours'
      ORDER BY timestamp DESC
      LIMIT 50
    ` as Array<{
      event_type: string;
      severity: string;
      timestamp: string;
      user_id: string;
      ip_address: string;
      details: unknown;
    }>;

    // Get event summary
    const eventSummary = await sql`
      SELECT 
        event_type,
        COUNT(*) as event_count,
        MAX(timestamp) as last_occurrence,
        COUNT(DISTINCT user_id) as unique_users
      FROM audit_logs 
      WHERE timestamp > NOW() - INTERVAL '7 days'
      GROUP BY event_type
      ORDER BY event_count DESC
      LIMIT 20
    ` as Array<{
      event_type: string;
      event_count: string;
      last_occurrence: string;
      unique_users: string;
    }>;

    // Get current rate limits
    const rateLimits = await sql`
      SELECT 
        identifier_hash,
        attempt_count,
        locked_until,
        reset_time
      FROM rate_limits 
      WHERE locked_until > NOW() OR reset_time > NOW()
      ORDER BY locked_until DESC NULLS LAST
      LIMIT 20
    ` as Array<{
      identifier_hash: string;
      attempt_count: number;
      locked_until: string | null;
      reset_time: string;
    }>;

    // Log this security monitoring access
    const auditLog = SecurityUtils.createAuditLog(
      'SECURITY_MONITORING_ACCESS',
      { endpoint: '/api/admin/security' },
      { id: payload.adminId, name: payload.username, isAdmin: true },
      request
    );

    // Insert audit log into database
    await sql`
      INSERT INTO audit_logs (
        event_type, user_id, ip_address, user_agent, 
        request_path, details, severity
      ) VALUES (
        ${auditLog.action as string},
        ${(auditLog.user as any).id as string},
        ${(auditLog.request as any).ip as string},
        ${(auditLog.request as any).userAgent as string},
        ${(auditLog.request as any).path as string},
        ${JSON.stringify(auditLog.details)},
        'INFO'
      )
    `;

    return NextResponse.json({
      success: true,
      data: {
        dashboard: dashboardData[0],
        recentEvents: recentEvents,
        eventSummary: eventSummary,
        rateLimits: rateLimits
      }
    });

  } catch (error) {
    console.error('Security monitoring error:', error);

    // Log the error
    const auditLog = SecurityUtils.createAuditLog(
      'SECURITY_MONITORING_ERROR',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { id: 'system' },
      request
    );
    console.log('📋 Audit Error:', SecurityUtils.sanitizeForLog(JSON.stringify(auditLog)));

    return NextResponse.json(
      { error: 'Failed to retrieve security data' },
      { status: 500 }
    );
  }
}

// Security configuration endpoint
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminToken = request.cookies.get('admin-token')?.value;
    
    if (!adminToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify JWT token
    const payload = jwt.verify(
      adminToken, 
      process.env.JWT_SECRET || 'fallback-secret-for-development'
    ) as any;

    if (payload.sessionType !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action, ...actionData } = body;

    const sql = getSql();

    switch (action) {
      case 'blacklist_session':
        // Blacklist a specific session
        const { sessionId, reason } = actionData;
        await sql`
          INSERT INTO session_blacklist (jti, user_id, reason, expires_at)
          VALUES (${sessionId}, ${payload.adminId}, ${reason || 'admin_action'}, NOW() + INTERVAL '24 hours')
        `;
        break;

      case 'clear_rate_limits':
        // Clear rate limits for a specific IP or all
        const { ipHash } = actionData;
        if (ipHash) {
          await sql`DELETE FROM rate_limits WHERE identifier_hash = ${ipHash}`;
        } else {
          await sql`DELETE FROM rate_limits`;
        }
        break;

      case 'update_security_config':
        // Update security configuration
        const { key, value } = actionData;
        await sql`
          INSERT INTO security_config (key, value, updated_by)
          VALUES (${key}, ${value}, ${payload.username})
          ON CONFLICT (key) DO UPDATE SET
            value = EXCLUDED.value,
            updated_by = EXCLUDED.updated_by,
            updated_at = NOW()
        `;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Log the security action
    const auditLog = SecurityUtils.createAuditLog(
      'SECURITY_ADMIN_ACTION',
      { action, ...actionData },
      { id: payload.adminId, name: payload.username, isAdmin: true },
      request
    );

    await sql`
      INSERT INTO audit_logs (
        event_type, user_id, ip_address, user_agent, 
        request_path, details, severity
      ) VALUES (
        ${auditLog.action as string},
        ${(auditLog.user as any).id as string},
        ${(auditLog.request as any).ip as string},
        ${(auditLog.request as any).userAgent as string},
        ${(auditLog.request as any).path as string},
        ${JSON.stringify(auditLog.details)},
        'WARN'
      )
    `;

    return NextResponse.json({
      success: true,
      message: 'Security action completed'
    });

  } catch (error) {
    console.error('Security action error:', error);

    return NextResponse.json(
      { error: 'Failed to perform security action' },
      { status: 500 }
    );
  }
}
