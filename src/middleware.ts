import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Root auto-redirect to /boardChallenge
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/boardChallenge', request.url), 307);
  }

  // Case-insensitive normalization for /boardchallenge
  if (pathname.toLowerCase() === '/boardchallenge' && pathname !== '/boardChallenge') {
    return NextResponse.redirect(new URL('/boardChallenge', request.url), 308);
  }

  // Only redirect if the path is explicitly lowercase '/srsma'.
  // Using strict equality avoids the case-insensitive redirect loop that occurs in next.config.js redirects.
  if (pathname === '/srsma') {
    return NextResponse.redirect(new URL('/SRSMA', request.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/srsma', '/boardchallenge'],
};
