import { cookies } from 'next/headers';
import { Session } from './types';

const COOKIE_NAME = 'session_token';

export async function getSessionToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value || null;
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentSession(
  sessionManager: { getSession: (token: string) => Promise<Session | null> }
): Promise<Session | null> {
  const token = await getSessionToken();
  
  if (!token) return null;

  return await sessionManager.getSession(token);
}

