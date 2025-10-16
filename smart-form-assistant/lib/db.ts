import { FormData, User, FormProgress, FormSubmission, AIUsage } from './types';
import { nanoid } from 'nanoid';

export class Database {
  constructor(private db: D1Database) {}

  // Users
  async createUser(email: string): Promise<User> {
    const id = nanoid();
    const created_at = Date.now();
    
    await this.db
      .prepare('INSERT INTO users (id, email, created_at) VALUES (?, ?, ?)')
      .bind(id, email, created_at)
      .run();

    return { id, email, created_at };
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first<User>();

    return result || null;
  }

  async getUserById(userId: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .bind(userId)
      .first<User>();

    return result || null;
  }

  // Form Progress
  async saveFormProgress(
    userId: string,
    currentStep: number,
    formData: FormData
  ): Promise<void> {
    const id = nanoid();
    const updated_at = Date.now();
    const formDataJson = JSON.stringify(formData);

    // Check if progress already exists
    const existing = await this.db
      .prepare('SELECT id FROM form_progress WHERE user_id = ?')
      .bind(userId)
      .first<{ id: string }>();

    if (existing) {
      await this.db
        .prepare(
          'UPDATE form_progress SET form_data = ?, current_step = ?, updated_at = ? WHERE user_id = ?'
        )
        .bind(formDataJson, currentStep, updated_at, userId)
        .run();
    } else {
      await this.db
        .prepare(
          'INSERT INTO form_progress (id, user_id, form_data, current_step, updated_at) VALUES (?, ?, ?, ?, ?)'
        )
        .bind(id, userId, formDataJson, currentStep, updated_at)
        .run();
    }
  }

  async getFormProgress(userId: string): Promise<{
    formData: FormData;
    currentStep: number;
  } | null> {
    const result = await this.db
      .prepare('SELECT * FROM form_progress WHERE user_id = ?')
      .bind(userId)
      .first<FormProgress>();

    if (!result) return null;

    return {
      formData: JSON.parse(result.form_data) as FormData,
      currentStep: result.current_step,
    };
  }

  async deleteFormProgress(userId: string): Promise<void> {
    await this.db
      .prepare('DELETE FROM form_progress WHERE user_id = ?')
      .bind(userId)
      .run();
  }

  // Form Submissions
  async submitForm(userId: string, formData: FormData): Promise<FormSubmission> {
    const id = nanoid();
    const submitted_at = Date.now();
    const formDataJson = JSON.stringify(formData);

    await this.db
      .prepare(
        'INSERT INTO form_submissions (id, user_id, form_data, submitted_at) VALUES (?, ?, ?, ?)'
      )
      .bind(id, userId, formDataJson, submitted_at)
      .run();

    return {
      id,
      user_id: userId,
      form_data: formDataJson,
      submitted_at,
    };
  }

  async getUserSubmissions(userId: string): Promise<FormSubmission[]> {
    const result = await this.db
      .prepare(
        'SELECT * FROM form_submissions WHERE user_id = ? ORDER BY submitted_at DESC'
      )
      .bind(userId)
      .all<FormSubmission>();

    return result.results || [];
  }

  // AI Usage Tracking
  async trackAIUsage(
    userId: string,
    endpoint: 'autofill' | 'improve' | 'validate',
    tokensUsed: number,
    costEstimate: number
  ): Promise<void> {
    const id = nanoid();
    const created_at = Date.now();

    await this.db
      .prepare(
        'INSERT INTO ai_usage (id, user_id, endpoint, tokens_used, cost_estimate, created_at) VALUES (?, ?, ?, ?, ?, ?)'
      )
      .bind(id, userId, endpoint, tokensUsed, costEstimate, created_at)
      .run();
  }

  async getAIUsageStats(userId: string, minutesWindow: number = 5): Promise<{
    requestCount: number;
    totalTokens: number;
    totalCost: number;
  }> {
    const windowStart = Date.now() - minutesWindow * 60 * 1000;

    const result = await this.db
      .prepare(
        `SELECT 
          COUNT(*) as request_count,
          COALESCE(SUM(tokens_used), 0) as total_tokens,
          COALESCE(SUM(cost_estimate), 0) as total_cost
         FROM ai_usage 
         WHERE user_id = ? AND created_at > ?`
      )
      .bind(userId, windowStart)
      .first<{
        request_count: number;
        total_tokens: number;
        total_cost: number;
      }>();

    return {
      requestCount: result?.request_count || 0,
      totalTokens: result?.total_tokens || 0,
      totalCost: result?.total_cost || 0,
    };
  }

  // Rate Limiting
  async checkRateLimit(userId: string, maxRequests: number = 10): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }> {
    const windowDuration = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    const windowStart = now - windowDuration;

    const stats = await this.getAIUsageStats(userId, 5);

    const allowed = stats.requestCount < maxRequests;
    const remaining = Math.max(0, maxRequests - stats.requestCount);
    
    // Find the oldest request in the window to calculate reset time
    const oldestRequest = await this.db
      .prepare(
        'SELECT created_at FROM ai_usage WHERE user_id = ? AND created_at > ? ORDER BY created_at ASC LIMIT 1'
      )
      .bind(userId, windowStart)
      .first<{ created_at: number }>();

    const resetAt = oldestRequest
      ? oldestRequest.created_at + windowDuration
      : now + windowDuration;

    return { allowed, remaining, resetAt };
  }
}

