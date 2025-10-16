import { nanoid } from 'nanoid';
import { Session } from './types';

const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export class SessionManager {
  constructor(private kv: KVNamespace) {}

  async createSession(userId: string, email: string): Promise<string> {
    const token = nanoid(32);
    const expiresAt = Date.now() + SESSION_DURATION;

    const session: Session = {
      userId,
      email,
      expiresAt,
    };

    await this.kv.put(`session:${token}`, JSON.stringify(session), {
      expirationTtl: SESSION_DURATION / 1000, // KV expects seconds
    });

    return token;
  }

  async getSession(token: string): Promise<Session | null> {
    const sessionData = await this.kv.get(`session:${token}`);
    
    if (!sessionData) return null;

    try {
      const session = JSON.parse(sessionData) as Session;
      
      // Check if session is expired
      if (session.expiresAt < Date.now()) {
        await this.deleteSession(token);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }

  async deleteSession(token: string): Promise<void> {
    await this.kv.delete(`session:${token}`);
  }

  async refreshSession(token: string): Promise<boolean> {
    const session = await this.getSession(token);
    
    if (!session) return false;

    // Create new session with same data but extended expiration
    await this.createSession(session.userId, session.email);
    
    return true;
  }
}

// Magic Link token management
export class MagicLinkManager {
  constructor(private kv: KVNamespace) {}

  async createMagicLink(email: string): Promise<string> {
    const token = nanoid(32);
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

    await this.kv.put(
      `magic:${token}`,
      JSON.stringify({ email, expiresAt }),
      {
        expirationTtl: 15 * 60, // 15 minutes in seconds
      }
    );

    return token;
  }

  async verifyMagicLink(token: string): Promise<string | null> {
    const data = await this.kv.get(`magic:${token}`);
    
    if (!data) return null;

    try {
      const { email, expiresAt } = JSON.parse(data);
      
      if (expiresAt < Date.now()) {
        await this.kv.delete(`magic:${token}`);
        return null;
      }

      // Delete token after use (one-time use)
      await this.kv.delete(`magic:${token}`);
      
      return email;
    } catch {
      return null;
    }
  }
}

