'use client';

import { useState, useCallback, useEffect } from 'react';
import { FormProvider, useForm } from '@/lib/form-context';
import StepIndicator from '@/components/StepIndicator';
import FormNavigation from '@/components/FormNavigation';
import SaveIndicator from '@/components/SaveIndicator';
import ResumeImport from '@/components/ResumeImport';
import Step1Personal from '@/components/Step1Personal';
import Step2Experience from '@/components/Step2Experience';
import Step3Skills from '@/components/Step3Skills';
import Step4Motivation from '@/components/Step4Motivation';
import ReviewPage from '@/components/ReviewPage';
import { useRouter } from 'next/navigation';
import { FormData } from '@/lib/types';

function FormContent() {
  const {
    formData,
    currentStep,
    updateFormData,
    setCurrentStep,
    saveProgress,
    submitForm,
    isSaving,
    isLoading,
  } = useForm();

  const [isStepValid, setIsStepValid] = useState(false);
  const [isReviewMode, setIsReviewMode] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const router = useRouter();

  const handleImport = useCallback(
    (data: Partial<FormData>) => {
      if (data.step1) updateFormData('step1', data.step1);
      if (data.step2) updateFormData('step2', data.step2);
      if (data.step3) updateFormData('step3', data.step3);
      if (data.step4) updateFormData('step4', data.step4);
    },
    [updateFormData]
  );

  const handleNext = async () => {
    await saveProgress();
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
      setIsStepValid(false);
    } else {
      setIsReviewMode(true);
    }
  };

  const handlePrevious = () => {
    if (isReviewMode) {
      setIsReviewMode(false);
    } else if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setIsStepValid(false);
    }
  };

  const handleEditFromReview = (step: number) => {
    setIsReviewMode(false);
    setCurrentStep(step);
    setIsStepValid(false);
  };

  const handleSubmit = async () => {
    try {
      await submitForm();
      setSubmitSuccess(true);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading your progress...</p>
        </div>
      </div>
    );
  }

  if (submitSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h2>
          <p className="text-gray-600 mb-6">
            Thank you for your application. We'll review it and get back to you soon.
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Job Application Form</h1>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Logout
            </button>
          </div>

          {!isReviewMode && (
            <>
              <StepIndicator currentStep={currentStep} totalSteps={4} />
              {currentStep === 1 && <ResumeImport onImport={handleImport} />}
            </>
          )}

          {!isReviewMode && currentStep === 1 && (
            <Step1Personal
              data={formData.step1 || {}}
              onChange={(data) => updateFormData('step1', data)}
              onValidate={setIsStepValid}
            />
          )}

          {!isReviewMode && currentStep === 2 && (
            <Step2Experience
              data={formData.step2 || {}}
              onChange={(data) => updateFormData('step2', data)}
              onValidate={setIsStepValid}
            />
          )}

          {!isReviewMode && currentStep === 3 && (
            <Step3Skills
              data={formData.step3 || {}}
              onChange={(data) => updateFormData('step3', data)}
              onValidate={setIsStepValid}
            />
          )}

          {!isReviewMode && currentStep === 4 && (
            <Step4Motivation
              data={formData.step4 || {}}
              onChange={(data) => updateFormData('step4', data)}
              onValidate={setIsStepValid}
            />
          )}

          {isReviewMode && (
            <ReviewPage
              formData={formData}
              onEdit={handleEditFromReview}
              onSubmit={handleSubmit}
            />
          )}

          {!isReviewMode && (
            <FormNavigation
              currentStep={currentStep}
              totalSteps={4}
              onPrevious={handlePrevious}
              onNext={handleNext}
              canGoNext={isStepValid}
              isLastStep={currentStep === 4}
            />
          )}
        </div>
      </div>

      <SaveIndicator isSaving={isSaving} />
    </div>
  );
}

export default function FormPage() {
  return (
    <FormProvider>
      <FormContent />
    </FormProvider>
  );
}

