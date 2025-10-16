import { NextResponse } from 'next/server';
import { SessionManager } from '@/lib/session';
import { getSessionToken, clearSessionCookie } from '@/lib/auth';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function POST() {
  try {
    const token = await getSessionToken();

    if (token) {
      // Get Cloudflare bindings
      const env = getCloudflareEnv();
      
      if (env?.SESSIONS) {
        const sessionManager = new SessionManager(env.SESSIONS);
        await sessionManager.deleteSession(token);
      }
    }

    await clearSessionCookie();

    return NextResponse.json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to logout' },
      { status: 500 }
    );
  }
}

