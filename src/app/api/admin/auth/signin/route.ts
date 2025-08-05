import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { supabase } from '@/lib/supabase';

// Validation schema
const adminSignInSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

interface AdminUser {
  id: string;
  username: string;
  email: string;
  password_hash: string;
  role: string;
  permissions: Record<string, unknown>;
  is_active: boolean;
  last_login: string | null;
  created_at: string;
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
    
    // Find admin user in database using Supabase client
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', validatedData.username)
      .eq('is_active', true)
      .limit(1);
    
    if (error) {
      console.error('❌ Database error:', error);
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
    await supabase
      .from('admin_users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', adminUser.id);
    
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
    
    await supabase
      .from('admin_sessions')
      .insert({
        admin_user_id: adminUser.id,
        session_token: sessionToken,
        ip_address: clientIp,
        user_agent: request.headers.get('user-agent') || 'unknown',
        expires_at: expiresAt.toISOString()
      });
    
    // Log admin login
    await supabase
      .from('admin_logs')
      .insert({
        admin_user_id: adminUser.id,
        action: 'admin_login',
        details: { username: adminUser.username },
        ip_address: clientIp
      });
    
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
