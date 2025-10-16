import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
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
    
    if (!env?.DB || !env?.SESSIONS) {
      console.error('Service not configured');
      return NextResponse.json(
        { success: false, error: 'Service not configured' },
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

    const db = new Database(env.DB);
    const rateLimit = await db.checkRateLimit(session.userId);
    const stats = await db.getAIUsageStats(session.userId);

    return NextResponse.json({
      success: true,
      data: {
        requestsUsed: stats.requestCount,
        requestsLimit: 10,
        remaining: rateLimit.remaining,
        resetAt: rateLimit.resetAt,
        totalTokens: stats.totalTokens,
        totalCost: stats.totalCost,
      },
    });
  } catch (error) {
    console.error('Get AI usage error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get usage stats' },
      { status: 500 }
    );
  }
}

