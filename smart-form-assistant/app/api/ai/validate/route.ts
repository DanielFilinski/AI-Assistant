import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { SessionManager } from '@/lib/session';
import { GeminiClient } from '@/lib/gemini';
import { getSessionToken } from '@/lib/auth';
import { aiValidateSchema } from '@/lib/schemas';
import { Env } from '@/lib/types';

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

    const env = (process.env as any) as Env;
    
    if (!env.DB || !env.SESSIONS || !env.GEMINI_API_KEY) {
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
    const { formData } = aiValidateSchema.parse(body);

    // Call Gemini API
    const gemini = new GeminiClient(env.GEMINI_API_KEY);
    const { issues, tokensUsed } = await gemini.validateForm(formData);

    // Track usage
    const costEstimate = gemini.estimateCost(tokensUsed);
    await db.trackAIUsage(session.userId, 'validate', tokensUsed, costEstimate);

    return NextResponse.json({
      success: true,
      data: {
        issues,
        tokensUsed,
        remaining: rateLimit.remaining - 1,
      },
    });
  } catch (error) {
    console.error('AI validate error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to validate form',
      },
      { status: 500 }
    );
  }
}

