/**
 * Core Authentication utilities for Jokai Halfdim Admin Dashboard
 *
 * Implements cryptographically signed sessions (HMAC-SHA256 via Web Crypto API)
 * compatible across Node.js runtime and Next.js Edge Middleware.
 */

export const COOKIE_NAME = 'jokai_admin_session';

export interface SessionPayload {
  userId: string;
  username: string;
  role: 'ADMIN';
  discordId?: string;
  exp: number; // Unix timestamp in milliseconds
}

/**
 * Retrieve session signing secret from environment, falling back safely
 */
export function getAuthSecret(): string {
  const secret = process.env.ENCRYPTION_KEY || process.env.DISCORD_OAUTH_CLIENT_SECRET || 'jokai-default-secure-secret-key-min-32-chars';
  return secret;
}

/**
 * Sign a session payload into a compact token string (base64url.base64url)
 */
export async function createSessionToken(
  payload: Omit<SessionPayload, 'exp'> & { expiresInMs?: number },
  secret = getAuthSecret()
): Promise<string> {
  const exp = Date.now() + (payload.expiresInMs ?? 1000 * 60 * 60 * 24 * 7); // Default 7 days
  const fullPayload: SessionPayload = {
    userId: payload.userId,
    username: payload.username,
    role: payload.role,
    discordId: payload.discordId,
    exp,
  };

  const enc = new TextEncoder();
  const payloadStr = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  const data = enc.encode(payloadStr);

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, data);
  const signature = Buffer.from(sigBuffer).toString('base64url');

  return `${payloadStr}.${signature}`;
}

/**
 * Verify and decode a session token
 */
export async function verifySessionToken(
  token: string | undefined | null,
  secret = getAuthSecret()
): Promise<SessionPayload | null> {
  if (!token || typeof token !== 'string') return null;

  const parts = token.split('.');
  if (parts.length !== 2) return null;

  const [payloadStr, signatureStr] = parts;

  try {
    const enc = new TextEncoder();
    const data = enc.encode(payloadStr);

    const key = await crypto.subtle.importKey(
      'raw',
      enc.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );

    const sigBuffer = Buffer.from(signatureStr, 'base64url');
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, data);

    if (!isValid) return null;

    const decodedJson = Buffer.from(payloadStr, 'base64url').toString('utf8');
    const payload: SessionPayload = JSON.parse(decodedJson);

    // Check expiration
    if (!payload.exp || Date.now() > payload.exp) {
      return null;
    }

    if (payload.role !== 'ADMIN') {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

/**
 * Check if username and password match authorized admin credentials
 */
export function validateAdminCredentials(username: string, password: string): boolean {
  const expectedUser = (process.env.ADMIN_USERNAME || 'admin').trim();
  const expectedPass = (process.env.ADMIN_PASSWORD || 'jokai2026!').trim();

  if (!username || !password) return false;

  return (
    username.trim().toLowerCase() === expectedUser.toLowerCase() &&
    password.trim() === expectedPass
  );
}
