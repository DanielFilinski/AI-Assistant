'use client';

import { useState, useEffect } from 'react';
import { Step4Data } from '@/lib/types';
import { step4Schema } from '@/lib/schemas';
import { ZodError } from 'zod';
import AIImprove from './AIImprove';

interface Step4MotivationProps {
  data: Partial<Step4Data>;
  onChange: (data: Partial<Step4Data>) => void;
  onValidate: (isValid: boolean) => void;
}

export default function Step4Motivation({ data, onChange, onValidate }: Step4MotivationProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      step4Schema.parse(data);
      setErrors({});
      onValidate(true);
    } catch (error) {
      if (error instanceof ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(fieldErrors);
        onValidate(false);
      }
    }
  }, [data, onValidate]);

  const handleChange = (field: keyof Step4Data, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Motivation</h2>
        <p className="text-gray-600">Tell us why you're excited about this opportunity</p>
      </div>

      <div>
        <label htmlFor="motivation" className="block text-sm font-medium text-gray-700 mb-2">
          Why are you interested in this role? <span className="text-red-500">*</span>
        </label>
        <textarea
          id="motivation"
          name="motivation"
          value={data.motivation || ''}
          onChange={(e) => handleChange('motivation', e.target.value)}
          rows={6}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.motivation ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Explain your interest in this position and what motivates you..."
        />
        {errors.motivation && (
          <p className="mt-1 text-sm text-red-600">{errors.motivation}</p>
        )}
        {data.motivation && (
          <AIImprove
            text={data.motivation}
            field="motivation"
            onAccept={(improved) => handleChange('motivation', improved)}
          />
        )}
      </div>

      <div>
        <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
          When can you start? <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="startDate"
          name="startDate"
          value={data.startDate || ''}
          onChange={(e) => handleChange('startDate', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.startDate ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Immediately / 2 weeks notice / Specific date"
        />
        {errors.startDate && (
          <p className="mt-1 text-sm text-red-600">{errors.startDate}</p>
        )}
      </div>

      <div>
        <label htmlFor="expectedSalary" className="block text-sm font-medium text-gray-700 mb-2">
          Expected Salary (Optional)
        </label>
        <input
          type="text"
          id="expectedSalary"
          name="expectedSalary"
          value={data.expectedSalary || ''}
          onChange={(e) => handleChange('expectedSalary', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          placeholder="$120,000 - $150,000"
        />
      </div>
    </div>
  );
}

