import { NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { getSessionToken } from '@/lib/auth';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function GET() {
  try {
    const token = await getSessionToken();

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Not authenticated' },
        { status: 401 }
      );
    }

    // Get Cloudflare bindings
    const env = getCloudflareEnv();
    
    if (!env?.SESSIONS) {
      console.error('Session storage not configured');
      return NextResponse.json(
        { success: false, error: 'Session storage not configured' },
        { status: 500 }
      );
    }

    const sessionManager = new SessionManager(env.SESSIONS);
    const session = await sessionManager.getSession(token);

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: session.userId,
        email: session.email,
        expiresAt: session.expiresAt,
      },
    });
  } catch (error) {
    console.error('Session check error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check session' },
      { status: 500 }
    );
  }
}

