import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, COOKIE_NAME } from '@/core/auth';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get(COOKIE_NAME)?.value;

  // Protect all /admin routes
  if (pathname.startsWith('/admin')) {
    const session = await verifySessionToken(token);

    if (!session) {
      const loginUrl = new URL('/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // If visiting /login while already authenticated, redirect to /admin/orders
  if (pathname === '/login') {
    const session = await verifySessionToken(token);
    if (session) {
      return NextResponse.redirect(new URL('/admin/orders', req.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
