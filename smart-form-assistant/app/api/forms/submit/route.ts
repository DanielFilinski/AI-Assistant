import { NextResponse } from 'next/server';
import { Database } from '@/lib/db';
import { SessionManager } from '@/lib/session';
import { getSessionToken } from '@/lib/auth';
import { completeFormSchema } from '@/lib/schemas';
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
    
    if (!env.DB || !env.SESSIONS) {
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

    const body = await request.json();
    const formData = completeFormSchema.parse(body);

    const db = new Database(env.DB);
    
    // Submit the form
    const submission = await db.submitForm(session.userId, formData);

    // Clear the progress after successful submission
    await db.deleteFormProgress(session.userId);

    return NextResponse.json({
      success: true,
      data: {
        submissionId: submission.id,
        message: 'Form submitted successfully',
      },
    });
  } catch (error) {
    console.error('Submit form error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid or incomplete form data' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to submit form' },
      { status: 500 }
    );
  }
}

