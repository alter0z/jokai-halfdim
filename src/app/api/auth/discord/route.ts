import { NextResponse } from 'next/server';

export async function GET() {
  const clientId = process.env.DISCORD_OAUTH_CLIENT_ID;
  const redirectUri = process.env.DISCORD_OAUTH_REDIRECT_URI || 'http://localhost:3000/api/auth/callback/discord';

  if (!clientId || clientId === 'your-oauth-client-id') {
    return NextResponse.redirect(
      new URL('/login?error=discord_not_configured', redirectUri)
    );
  }

  const scope = encodeURIComponent('identify');
  const discordAuthUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&response_type=code&scope=${scope}`;

  return NextResponse.redirect(discordAuthUrl);
}
