import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export const config = {
  matcher: ['/form/:path*'],
};

export function middleware(request: NextRequest) {
  const sessionToken = request.cookies.get('session_token');

  // If no session token, redirect to login
  if (!sessionToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Allow the request to proceed
  return NextResponse.next();
}

