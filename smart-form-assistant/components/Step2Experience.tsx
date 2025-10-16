'use client';

import { useState, useEffect } from 'react';
import { Step2Data } from '@/lib/types';
import { step2Schema } from '@/lib/schemas';
import { ZodError } from 'zod';
import AIImprove from './AIImprove';

interface Step2ExperienceProps {
  data: Partial<Step2Data>;
  onChange: (data: Partial<Step2Data>) => void;
  onValidate: (isValid: boolean) => void;
}

export default function Step2Experience({ data, onChange, onValidate }: Step2ExperienceProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      step2Schema.parse(data);
      setErrors({});
      onValidate(true);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        onValidate(false);
      }
    }
  }, [data, onValidate]);

  const handleChange = (field: keyof Step2Data, value: string | number) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Work Experience</h2>
        <p className="text-gray-600">Tell us about your professional background</p>
      </div>

      <div>
        <label htmlFor="currentPosition" className="block text-sm font-medium text-gray-700 mb-2">
          Current/Last Position <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="currentPosition"
          name="currentPosition"
          value={data.currentPosition || ''}
          onChange={(e) => handleChange('currentPosition', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.currentPosition ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Senior Software Engineer"
        />
        {errors.currentPosition && (
          <p className="mt-1 text-sm text-red-600">{errors.currentPosition}</p>
        )}
      </div>

      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-2">
          Company <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="company"
          name="company"
          value={data.company || ''}
          onChange={(e) => handleChange('company', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.company ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="TechCorp"
        />
        {errors.company && (
          <p className="mt-1 text-sm text-red-600">{errors.company}</p>
        )}
      </div>

      <div>
        <label htmlFor="yearsOfExperience" className="block text-sm font-medium text-gray-700 mb-2">
          Years of Experience <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          id="yearsOfExperience"
          name="yearsOfExperience"
          value={data.yearsOfExperience || ''}
          onChange={(e) => handleChange('yearsOfExperience', parseInt(e.target.value) || 0)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.yearsOfExperience ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="5"
          min="0"
          max="70"
        />
        {errors.yearsOfExperience && (
          <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>
        )}
      </div>

      <div>
        <label htmlFor="keyAchievements" className="block text-sm font-medium text-gray-700 mb-2">
          Key Achievements <span className="text-red-500">*</span>
        </label>
        <textarea
          id="keyAchievements"
          name="keyAchievements"
          value={data.keyAchievements || ''}
          onChange={(e) => handleChange('keyAchievements', e.target.value)}
          rows={5}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.keyAchievements ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="• Led development of microservices architecture serving 10M users&#10;• Reduced API latency by 60% through optimization&#10;• Mentored team of 5 junior engineers"
        />
        {errors.keyAchievements && (
          <p className="mt-1 text-sm text-red-600">{errors.keyAchievements}</p>
        )}
        {data.keyAchievements && (
          <AIImprove
            text={data.keyAchievements}
            field="keyAchievements"
            onAccept={(improved) => handleChange('keyAchievements', improved)}
          />
        )}
      </div>
    </div>
  );
}

