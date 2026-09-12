import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Only redirect if the path is explicitly lowercase '/srsma'.
  // Using strict equality avoids the case-insensitive redirect loop that occurs in next.config.js redirects.
  if (request.nextUrl.pathname === '/srsma') {
    return NextResponse.redirect(new URL('/SRSMA', request.url), 308);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/srsma'],
};
