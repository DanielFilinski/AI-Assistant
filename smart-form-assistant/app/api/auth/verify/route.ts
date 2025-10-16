import { NextResponse } from 'next/server';
import { MagicLinkManager, SessionManager } from '@/lib/session';
import { Database } from '@/lib/db';
import { setSessionCookie } from '@/lib/auth';
import { Env } from '@/lib/types';

export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.redirect(new URL('/login?error=invalid_token', request.url));
    }

    const env = (process.env as any) as Env;
    
    if (!env.DB || !env.SESSIONS) {
      return NextResponse.redirect(
        new URL('/login?error=server_error', request.url)
      );
    }

    const magicLinkManager = new MagicLinkManager(env.SESSIONS);
    const sessionManager = new SessionManager(env.SESSIONS);
    const db = new Database(env.DB);

    // Verify magic link
    const email = await magicLinkManager.verifyMagicLink(token);

    if (!email) {
      return NextResponse.redirect(
        new URL('/login?error=expired_token', request.url)
      );
    }

    // Get user
    const user = await db.getUserByEmail(email);

    if (!user) {
      return NextResponse.redirect(
        new URL('/login?error=user_not_found', request.url)
      );
    }

    // Create session
    const sessionToken = await sessionManager.createSession(user.id, user.email);

    // Set cookie
    const response = NextResponse.redirect(new URL('/form', request.url));
    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Auth verify error:', error);
    return NextResponse.redirect(
      new URL('/login?error=verification_failed', request.url)
    );
  }
}

