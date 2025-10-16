'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { FormData } from './types';

interface FormContextType {
  formData: FormData;
  currentStep: number;
  updateFormData: (step: keyof FormData, data: any) => void;
  setCurrentStep: (step: number) => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  submitForm: () => Promise<void>;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
}

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [formData, setFormData] = useState<FormData>({});
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoSaveTimer, setAutoSaveTimer] = useState<NodeJS.Timeout | null>(null);

  const updateFormData = useCallback(
    (step: keyof FormData, data: any) => {
      setFormData((prev) => ({
        ...prev,
        [step]: data,
      }));

      // Auto-save with debounce
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }

      const timer = setTimeout(() => {
        saveProgress();
      }, 500);

      setAutoSaveTimer(timer);
    },
    [autoSaveTimer]
  );

  const saveProgress = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/forms/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentStep,
          formData,
        }),
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (!data.success) {
        throw new Error(data.error || 'Failed to save progress');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [currentStep, formData]);

  const loadProgress = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/forms/progress');
      const data = await response.json() as { success: boolean; data?: { formData: FormData; currentStep: number } };

      if (data.success && data.data) {
        setFormData(data.data.formData);
        setCurrentStep(data.data.currentStep);
      }
    } catch (err) {
      console.error('Load error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load progress');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitForm = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/forms/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json() as { success: boolean; error?: string };

      if (!data.success) {
        throw new Error(data.error || 'Failed to submit form');
      }

      // Clear form data after successful submission
      setFormData({});
      setCurrentStep(1);
    } catch (err) {
      console.error('Submit error:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [formData]);

  // Load progress on mount
  useEffect(() => {
    loadProgress();
  }, [loadProgress]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
      }
    };
  }, [autoSaveTimer]);

  return (
    <FormContext.Provider
      value={{
        formData,
        currentStep,
        updateFormData,
        setCurrentStep,
        saveProgress,
        loadProgress,
        submitForm,
        isSaving,
        isLoading,
        error,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (context === undefined) {
    throw new Error('useForm must be used within a FormProvider');
  }
  return context;
}

