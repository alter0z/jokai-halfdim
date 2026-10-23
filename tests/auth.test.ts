import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST as loginHandler } from '../src/app/api/auth/login/route.js';
import { POST as logoutHandler } from '../src/app/api/auth/logout/route.js';
import { GET as meHandler } from '../src/app/api/auth/me/route.js';
import { NextRequest } from 'next/server';
import { COOKIE_NAME } from '../src/core/auth.js';

describe('Authentication API Handlers', () => {
  beforeEach(() => {
    process.env.ADMIN_USERNAME = 'admin';
    process.env.ADMIN_PASSWORD = 'jokai2026!';
    process.env.ENCRYPTION_KEY = 'test-secret-at-least-32-chars-long!!';
  });

  it('rejects invalid credentials with 401', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'wrongpassword' }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.error).toBe('Invalid admin credentials');
  });

  it('authenticates valid credentials, sets cookie and returns user', async () => {
    const req = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'jokai2026!', rememberMe: true }),
      headers: { 'content-type': 'application/json' },
    });

    const res = await loginHandler(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.ok).toBe(true);
    expect(data.user.username).toBe('admin');
    expect(data.user.role).toBe('ADMIN');

    // Cookie check
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain(COOKIE_NAME);
  });

  it('verifies session in /api/auth/me when cookie is provided', async () => {
    // 1. Login to get cookie
    const loginReq = new NextRequest('http://localhost:3000/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: 'admin', password: 'jokai2026!' }),
      headers: { 'content-type': 'application/json' },
    });
    const loginRes = await loginHandler(loginReq);
    const setCookie = loginRes.headers.get('set-cookie');
    const tokenMatch = setCookie?.match(new RegExp(`${COOKIE_NAME}=([^;]+)`));
    const token = tokenMatch?.[1];
    expect(token).toBeDefined();

    // 2. Call /api/auth/me with cookie
    const meReq = new NextRequest('http://localhost:3000/api/auth/me', {
      headers: { cookie: `${COOKIE_NAME}=${token}` },
    });
    const meRes = await meHandler(meReq);
    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.authenticated).toBe(true);
    expect(meData.user.username).toBe('admin');
  });

  it('clears session on /api/auth/logout', async () => {
    const res = await logoutHandler();
    expect(res.status).toBe(200);
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain(`${COOKIE_NAME}=;`);
  });
});
