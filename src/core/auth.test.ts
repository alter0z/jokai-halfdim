import { describe, it, expect } from 'vitest';
import {
  createSessionToken,
  verifySessionToken,
  validateAdminCredentials,
  COOKIE_NAME,
} from './auth.js';

describe('Admin Authentication Core', () => {
  it('exports valid cookie name', () => {
    expect(COOKIE_NAME).toBe('jokai_admin_session');
  });

  it('creates and verifies a valid admin session token', async () => {
    const token = await createSessionToken({
      userId: 'admin_test_1',
      username: 'admin',
      role: 'ADMIN',
      expiresInMs: 60000,
    });

    expect(typeof token).toBe('string');
    expect(token.includes('.')).toBe(true);

    const verified = await verifySessionToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.userId).toBe('admin_test_1');
    expect(verified?.username).toBe('admin');
    expect(verified?.role).toBe('ADMIN');
  });

  it('rejects an expired token', async () => {
    const token = await createSessionToken({
      userId: 'admin_test_expired',
      username: 'admin',
      role: 'ADMIN',
      expiresInMs: -1000, // already expired
    });

    const verified = await verifySessionToken(token);
    expect(verified).toBeNull();
  });

  it('rejects a tampered signature', async () => {
    const token = await createSessionToken({
      userId: 'admin_test_tamper',
      username: 'admin',
      role: 'ADMIN',
    });

    const [payloadStr, sig] = token.split('.');
    const tampered = `${payloadStr}.${sig.slice(0, -4)}AAAA`;

    const verified = await verifySessionToken(tampered);
    expect(verified).toBeNull();
  });

  it('rejects an invalid format or empty token', async () => {
    expect(await verifySessionToken('')).toBeNull();
    expect(await verifySessionToken('invalid-token')).toBeNull();
    expect(await verifySessionToken(undefined)).toBeNull();
  });

  it('validates admin credentials against default/configured values', () => {
    expect(validateAdminCredentials('admin', 'jokai2026!')).toBe(true);
    expect(validateAdminCredentials('ADMIN', 'jokai2026!')).toBe(true); // case-insensitive username
    expect(validateAdminCredentials('admin', 'wrongpass')).toBe(false);
    expect(validateAdminCredentials('wronguser', 'jokai2026!')).toBe(false);
    expect(validateAdminCredentials('', '')).toBe(false);
  });
});
