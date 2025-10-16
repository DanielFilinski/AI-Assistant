import { getRequestContext } from '@cloudflare/next-on-pages';
import { Env } from './types';

/**
 * Get Cloudflare bindings (D1, KV, env vars) from the request context
 * This function works with @cloudflare/next-on-pages
 */
export function getCloudflareEnv(): Env {
  try {
    // Try to get the Cloudflare context
    const context = getRequestContext();
    
    if (context?.env) {
      // Cast the context.env to Env type
      const cfEnv = context.env as unknown as Env;
      return {
        DB: cfEnv.DB,
        SESSIONS: cfEnv.SESSIONS,
        GEMINI_API_KEY: cfEnv.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '',
      };
    }
  } catch (error) {
    // In development or when context is not available, try process.env
    console.log('Cloudflare context not available, using process.env');
  }

  // Fallback to process.env for local development
  return {
    DB: (process.env as any).DB as D1Database,
    SESSIONS: (process.env as any).SESSIONS as KVNamespace,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  };
}

