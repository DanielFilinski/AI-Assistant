// Database types
export interface User {
  id: string;
  email: string;
  created_at: number;
}

export interface FormProgress {
  id: string;
  user_id: string;
  form_data: string; // JSON
  current_step: number;
  updated_at: number;
}

export interface FormSubmission {
  id: string;
  user_id: string;
  form_data: string; // JSON
  submitted_at: number;
}

export interface AIUsage {
  id: string;
  user_id: string;
  endpoint: 'autofill' | 'improve' | 'validate';
  tokens_used: number;
  cost_estimate: number;
  created_at: number;
}

export interface RateLimit {
  id: string;
  user_id: string;
  window_start: number;
  request_count: number;
}

// Form data types
export interface Step1Data {
  fullName: string;
  email: string;
  phone: string;
  location: string;
}

export interface Step2Data {
  currentPosition: string;
  company: string;
  yearsOfExperience: number;
  keyAchievements: string;
}

export interface Step3Data {
  primarySkills: string;
  programmingLanguages: string;
  frameworksAndTools: string;
}

export interface Step4Data {
  motivation: string;
  startDate: string;
  expectedSalary?: string;
}

// Complete form data
export interface CompleteFormData {
  step1: Step1Data;
  step2: Step2Data;
  step3: Step3Data;
  step4: Step4Data;
}

// Partial form data (for progress saving)
export interface FormData {
  step1?: Partial<Step1Data>;
  step2?: Partial<Step2Data>;
  step3?: Partial<Step3Data>;
  step4?: Partial<Step4Data>;
}

// Session types
export interface Session {
  userId: string;
  email: string;
  expiresAt: number;
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface AIAutofillResponse {
  extracted: Partial<FormData>;
  confidence: number;
}

export interface AIImproveResponse {
  improved: string;
  original: string;
}

export interface AIUsageStats {
  requestsUsed: number;
  requestsLimit: number;
  resetAt: number;
}

// Cloudflare bindings types
export interface Env {
  DB: D1Database;
  SESSIONS: KVNamespace;
  GEMINI_API_KEY: string;
}

