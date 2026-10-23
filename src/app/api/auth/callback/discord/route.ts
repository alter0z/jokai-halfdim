import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/db/index';
import { createSessionToken, COOKIE_NAME } from '@/core/auth';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!code) {
    return NextResponse.redirect(`${appUrl}/login?error=missing_code`);
  }

  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
  const clientSecret = process.env.DISCORD_OAUTH_CLIENT_SECRET;
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI || `${appUrl}/api/auth/callback/discord`;

  if (!clientId || !clientSecret || clientId === 'your-oauth-client-id') {
    return NextResponse.redirect(`${appUrl}/login?error=discord_not_configured`);
  }

  try {
    // 1. Exchange code for access token
    const tokenRes = await fetch('https://discord.com/api/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenRes.ok) {
      console.error('Discord token exchange failed:', await tokenRes.text());
      return NextResponse.redirect(`${appUrl}/login?error=discord_auth_failed`);
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    // 2. Fetch Discord user profile
    const userRes = await fetch('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userRes.ok) {
      return NextResponse.redirect(`${appUrl}/login?error=discord_profile_failed`);
    }

    const discordUser = await userRes.json();
    const discordId = discordUser.id;
    const discordUsername = discordUser.username;

    // 3. Find or create user with role verification
    let user = await prisma.user.findUnique({
      where: { discordId },
    });

    // If no user exists yet, check if any admin exists; if not, promote the first Discord user
    if (!user) {
      const existingAdmin = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
      });

      user = await prisma.user.create({
        data: {
          discordId,
          username: discordUsername,
          role: existingAdmin ? 'CUSTOMER' : 'ADMIN',
        },
      });
    }

    // Only allow ADMIN to log in to dashboard
    if (user.role !== 'ADMIN') {
      return NextResponse.redirect(`${appUrl}/login?error=not_an_admin`);
    }

    // 4. Create session token
    const token = await createSessionToken({
      userId: user.id,
      username: user.username,
      discordId: user.discordId ?? undefined,
      role: 'ADMIN',
      expiresInMs: 1000 * 60 * 60 * 24 * 7,
    });

    const response = NextResponse.redirect(`${appUrl}/admin/orders`);
    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    });

    return response;
  } catch (error) {
    console.error('Discord callback error:', error);
    return NextResponse.redirect(`${appUrl}/login?error=internal_auth_error`);
  }
}
