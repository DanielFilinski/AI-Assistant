import { z } from 'zod';

// Step 1 - Personal Information
export const step1Schema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  location: z.string().min(2, 'Location must be at least 2 characters'),
});

// Step 2 - Work Experience
export const step2Schema = z.object({
  currentPosition: z.string().min(2, 'Position is required'),
  company: z.string().min(2, 'Company name is required'),
  yearsOfExperience: z.number().min(0, 'Years of experience must be positive').max(70, 'Invalid years'),
  keyAchievements: z.string().min(10, 'Please provide key achievements (at least 10 characters)'),
});

// Step 3 - Technical Skills
export const step3Schema = z.object({
  primarySkills: z.string().min(5, 'Please describe your primary skills'),
  programmingLanguages: z.string().min(2, 'Please list programming languages'),
  frameworksAndTools: z.string().min(2, 'Please list frameworks and tools'),
});

// Step 4 - Motivation
export const step4Schema = z.object({
  motivation: z.string().min(20, 'Please provide more details about your motivation (at least 20 characters)'),
  startDate: z.string().min(1, 'Start date is required'),
  expectedSalary: z.string().optional(),
});

// Complete form schema
export const completeFormSchema = z.object({
  step1: step1Schema,
  step2: step2Schema,
  step3: step3Schema,
  step4: step4Schema,
});

// Auth schemas
export const authStartSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const authVerifySchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

// AI request schemas
export const aiAutofillSchema = z.object({
  resumeText: z.string().min(50, 'Resume text must be at least 50 characters'),
});

export const aiImproveSchema = z.object({
  text: z.string().min(5, 'Text must be at least 5 characters'),
  field: z.enum(['keyAchievements', 'primarySkills', 'motivation']),
});

export const aiValidateSchema = z.object({
  formData: completeFormSchema,
});

// Form save schema
export const formSaveSchema = z.object({
  currentStep: z.number().min(1).max(4),
  formData: z.object({
    step1: step1Schema.partial().optional(),
    step2: step2Schema.partial().optional(),
    step3: step3Schema.partial().optional(),
    step4: step4Schema.partial().optional(),
  }),
});

