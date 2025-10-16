import { Env } from './types';

// Helper to get Cloudflare bindings from the request context
// This is a workaround for Next.js on Cloudflare Workers
export function getCloudflareContext(): Env | null {
  // In Cloudflare Workers, the bindings are available on the global scope
  // or passed through the request context
  if (typeof globalThis !== 'undefined') {
    const env = (globalThis as any).process?.env;
    
    // Check if we have Cloudflare bindings
    if (env?.DB && env?.SESSIONS) {
      return {
        DB: env.DB as D1Database,
        SESSIONS: env.SESSIONS as KVNamespace,
        GEMINI_API_KEY: env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
      };
    }
  }

  // Fallback for local development or when bindings are not available
  return null;
}

// For local development, we'll need to mock these
export function getMockEnv(): Env {
  return {
    DB: null as any, // Will be replaced with actual D1 connection or local SQLite
    SESSIONS: null as any, // Will be replaced with actual KV or local storage
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  };
}

