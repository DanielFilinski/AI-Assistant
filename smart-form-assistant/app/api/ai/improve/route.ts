import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { SessionManager } from '@/lib/session';
import { GeminiClient } from '@/lib/gemini';
import { getSessionToken } from '@/lib/auth';
import { aiImproveSchema } from '@/lib/schemas';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function POST(request: Request) {
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
    
    if (!env?.DB || !env?.SESSIONS || !env?.GEMINI_API_KEY) {
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

    // Check rate limit
    const rateLimit = await db.checkRateLimit(session.userId);
    if (!rateLimit.allowed) {
      const resetIn = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          resetIn,
          resetAt: rateLimit.resetAt,
        },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { text, field } = aiImproveSchema.parse(body);

    // Call Gemini API
    const gemini = new GeminiClient(env.GEMINI_API_KEY);
    const { improved, tokensUsed } = await gemini.improveText(text, field);

    // Track usage
    const costEstimate = gemini.estimateCost(tokensUsed);
    await db.trackAIUsage(session.userId, 'improve', tokensUsed, costEstimate);

    return NextResponse.json({
      success: true,
      data: {
        original: text,
        improved,
        tokensUsed,
        remaining: rateLimit.remaining - 1,
      },
    });
  } catch (error) {
    console.error('AI improve error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to improve text',
      },
      { status: 500 }
    );
  }
}

