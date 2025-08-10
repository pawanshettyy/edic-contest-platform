import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { isDatabaseConnected, getSql } from '@/lib/database';

// Validation schema
const adminSignInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  password_hash: string;
  role: string;
  permissions?: Record<string, unknown>;
  is_active: boolean;
  last_login?: string | null;
  created_at: string | Date;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const clientIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';
    
    console.log('🔍 Admin signin attempt:', {
      username: body.username,
      hasPassword: !!body.password,
      passwordLength: body.password?.length
    });
    
    // Validate request body
    const validatedData = adminSignInSchema.parse(body);
    
    // Check if database is available
    if (!isDatabaseConnected()) {
      console.log('🔧 Database not available, checking fallback admin credentials');
      
      // Use fallback admin for development
      if (validatedData.username === 'admin' && validatedData.password === 'admin123') {
        console.log('✅ Fallback admin authentication successful');
        
        // Create session token for fallback admin
        const payload = {
          adminId: 'fallback-admin',
          username: 'admin',
          role: 'super_admin',
          sessionType: 'development'
        };
        
        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback-secret', {
          expiresIn: '24h'
        });
        
        const response = NextResponse.json({
          success: true,
          message: 'Admin signin successful (development mode)',
          user: {
            id: 'fallback-admin',
            username: 'admin',
            role: 'super_admin'
          }
        });
        
        response.cookies.set('admin-token', token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 // 24 hours
        });
        
        return response;
      } else {
        return NextResponse.json(
          { success: false, message: 'Invalid credentials' },
          { status: 401 }
        );
      }
    }
    
    // Find admin user in database using PostgreSQL
    const sql = getSql();
    const adminUsers = await sql`
      SELECT * FROM admin_users 
      WHERE username = ${validatedData.username} AND is_active = true 
      LIMIT 1
    ` as AdminUser[];
    
    if (!adminUsers || adminUsers.length === 0) {
      console.error('❌ No admin users found');
      
      // If no admin found, try fallback for development
      if (validatedData.username === 'admin' && validatedData.password === 'admin123') {
        console.log('🔧 Database tables not ready, using fallback admin');
        
        if (validatedData.username === 'admin' && validatedData.password === 'admin123') {
          // Create session token for fallback admin
          const sessionToken = jwt.sign(
            {
              adminId: 'fallback-admin-id',
              username: 'admin',
              role: 'super_admin',
              sessionType: 'admin'
            },
            process.env.JWT_SECRET || 'fallback-secret-for-development',
            { expiresIn: '8h' }
          );
          
          const responseAdmin = {
            id: 'fallback-admin-id',
            username: 'admin',
            email: 'admin@techpreneur.com',
            role: 'super_admin',
            permissions: { all: true },
          };
          
          const response = NextResponse.json({
            message: 'Admin signed in successfully (fallback mode)',
            admin: responseAdmin,
          });
          
          response.cookies.set('admin-token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 8, // 8 hours
            path: '/'
          });
          
          return response;
        }
      }
      
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }
    
    console.log('📊 Admin users found:', adminUsers?.length || 0);
    
    const adminUser = adminUsers?.[0] as AdminUser;
    
    if (!adminUser) {
      console.log('❌ Admin user not found for username:', validatedData.username);
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    console.log('👤 Found admin user:', {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      is_active: adminUser.is_active
    });
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(validatedData.password, adminUser.password_hash);
    console.log('🔐 Password validation result:', isPasswordValid);
    
    if (!isPasswordValid) {
      console.log('❌ Password validation failed');
      return NextResponse.json(
        { error: 'Invalid username or password' },
        { status: 401 }
      );
    }
    
    console.log('✅ Password validation successful');
    
    // Update last login
    await sql`UPDATE admin_users SET last_login = NOW() WHERE id = ${adminUser.id}`;
    
    // Create session token
    const sessionToken = jwt.sign(
      {
        adminId: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
        sessionType: 'admin'
      },
      process.env.JWT_SECRET || 'fallback-secret-for-development',
      { expiresIn: '8h' } // Admin sessions expire faster
    );
    
    // Store session in database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 8);
    
    try {
      await sql`
        INSERT INTO admin_sessions (admin_user_id, session_token, expires_at)
        VALUES (${adminUser.id}, ${sessionToken}, ${expiresAt.toISOString()})
      `;
      console.log('✅ Session stored in database successfully');
    } catch (sessionError) {
      console.log('⚠️ Failed to store session in database:', sessionError);
      console.log('🔧 Continuing without database session (development mode)');
    }
    
    // Log admin login
    try {
      await sql`
        INSERT INTO admin_logs (admin_user_id, action, details, ip_address)
        VALUES (${adminUser.id}, 'admin_login', ${JSON.stringify({ username: adminUser.username })}, ${clientIp})
      `;
      console.log('✅ Admin login logged successfully');
    } catch (logError) {
      console.log('⚠️ Failed to log admin login:', logError);
      console.log('🔧 Continuing without logging (development mode)');
    }
    
    // Return success response (excluding sensitive data)
    const responseAdmin = {
      id: adminUser.id,
      username: adminUser.username,
      email: adminUser.email,
      role: adminUser.role,
      permissions: adminUser.permissions,
    };
    
    const response = NextResponse.json({
      message: 'Admin signed in successfully',
      admin: responseAdmin,
    });
    
    // Set HTTP-only cookie for admin
    response.cookies.set('admin-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // Stricter for admin
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/' // Changed from '/admin' to '/' so API routes can access it
    });
    
    return response;
    
  } catch (error) {
    console.error('Admin signin error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0].message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
