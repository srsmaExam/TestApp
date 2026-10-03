import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Root auto-redirect to /boardChallenge (preserves UTM parameters)
  if (pathname === '/') {
    const url = request.nextUrl.clone();
    url.pathname = '/boardChallenge';
    return NextResponse.redirect(url, 307);
  }

  // Case-insensitive normalization for /boardchallenge (preserves UTM parameters)
  if (pathname.toLowerCase() === '/boardchallenge' && pathname !== '/boardChallenge') {
    const url = request.nextUrl.clone();
    url.pathname = '/boardChallenge';
    return NextResponse.redirect(url, 308);
  }

  // Only redirect if the path is explicitly lowercase '/srsma'.
  // Using strict equality avoids the case-insensitive redirect loop that occurs in next.config.js redirects.
  if (pathname === '/srsma') {
    const url = request.nextUrl.clone();
    url.pathname = '/SRSMA';
    return NextResponse.redirect(url, 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/srsma', '/boardchallenge'],
};
