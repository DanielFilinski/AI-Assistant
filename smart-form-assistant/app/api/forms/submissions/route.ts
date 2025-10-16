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
      console.error('Database not configured');
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
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
    const submissions = await db.getUserSubmissions(session.userId);

    return NextResponse.json({
      success: true,
      data: submissions.map(s => ({
        id: s.id,
        formData: JSON.parse(s.form_data),
        submittedAt: s.submitted_at,
      })),
    });
  } catch (error) {
    console.error('Get submissions error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get submissions' },
      { status: 500 }
    );
  }
}

