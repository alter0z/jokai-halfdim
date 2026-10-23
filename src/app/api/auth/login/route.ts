import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/index';
import {
  createSessionToken,
  validateAdminCredentials,
  COOKIE_NAME,
} from '@/core/auth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, rememberMe } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const isValid = validateAdminCredentials(username, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Ensure an ADMIN user record exists in the database
    let adminUser = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!adminUser) {
      adminUser = await prisma.user.create({
        data: {
          username: username.trim(),
          role: 'ADMIN',
        },
      });
    }

    // 30 days if remember me, otherwise 24 hours
    const expiresInMs = rememberMe
      ? 1000 * 60 * 60 * 24 * 30
      : 1000 * 60 * 60 * 24;

    const token = await createSessionToken({
      userId: adminUser.id,
      username: adminUser.username,
      role: 'ADMIN',
      expiresInMs,
    });

    const response = NextResponse.json({
      ok: true,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        role: adminUser.role,
      },
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: Math.floor(expiresInMs / 1000),
    });

    return response;
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error during authentication' },
      { status: 500 }
    );
  }
}
