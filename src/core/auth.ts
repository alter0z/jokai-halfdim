/**
 * Core Authentication utilities for Jokai Halfdim Admin Dashboard
 *
 * Implements cryptographically signed sessions (HMAC-SHA256 via Web Crypto API)
 * compatible across Node.js runtime and Next.js Edge Middleware (using pure Web APIs).
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

function base64UrlEncode(str: string): string {
  const base64 = btoa(unescape(encodeURIComponent(str)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return decodeURIComponent(escape(atob(base64)));
}

function bufferToBase64Url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBuffer(base64url: string): ArrayBuffer {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

/**
 * Sign a session payload into a compact token string
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
  const payloadStr = base64UrlEncode(JSON.stringify(fullPayload));
  const data = enc.encode(payloadStr);

  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sigBuffer = await crypto.subtle.sign('HMAC', key, data);
  const signature = bufferToBase64Url(sigBuffer);

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

    const sigBuffer = base64UrlToBuffer(signatureStr);
    const isValid = await crypto.subtle.verify('HMAC', key, sigBuffer, data);

    if (!isValid) return null;

    const decodedJson = base64UrlDecode(payloadStr);
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
