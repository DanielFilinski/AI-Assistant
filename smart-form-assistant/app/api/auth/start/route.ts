import { NextResponse } from 'next/server';
import { authStartSchema } from '@/lib/schemas';
import { Database } from '@/lib/db';
import { MagicLinkManager } from '@/lib/session';
import { getCloudflareEnv } from '@/lib/cloudflare';

export const runtime = 'edge';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = authStartSchema.parse(body);

    // Get Cloudflare bindings
    const env = getCloudflareEnv();
    
    if (!env?.DB || !env?.SESSIONS) {
      console.error('Environment bindings not available:', { 
        hasDB: !!env?.DB, 
        hasSESSIONS: !!env?.SESSIONS
      });
      return NextResponse.json(
        { success: false, error: 'Database not configured' },
        { status: 500 }
      );
    }

    const db = new Database(env.DB);
    const magicLinkManager = new MagicLinkManager(env.SESSIONS);

    // Get or create user
    let user = await db.getUserByEmail(email);
    if (!user) {
      user = await db.createUser(email);
    }

    // Generate magic link token
    const token = await magicLinkManager.createMagicLink(email);

    // For Cloudflare Workers, we can't send emails, so we return the link
    // In production, you would send this via email service
    const magicLink = `${request.headers.get('origin') || 'http://localhost:3000'}/api/auth/verify?token=${token}`;

    return NextResponse.json({
      success: true,
      data: {
        message: 'Magic link generated',
        magicLink, // In production, this would be sent via email
        email,
      },
    });
  } catch (error) {
    console.error('Auth start error:', error);
    
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { success: false, error: 'Invalid email address' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to start authentication' },
      { status: 500 }
    );
  }
}

