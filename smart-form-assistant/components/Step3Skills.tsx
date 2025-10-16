'use client';

import { useState, useEffect } from 'react';
import { Step3Data } from '@/lib/types';
import { step3Schema } from '@/lib/schemas';
import { ZodError } from 'zod';
import AIImprove from './AIImprove';

interface Step3SkillsProps {
  data: Partial<Step3Data>;
  onChange: (data: Partial<Step3Data>) => void;
  onValidate: (isValid: boolean) => void;
}

export default function Step3Skills({ data, onChange, onValidate }: Step3SkillsProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    try {
      step3Schema.parse(data);
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

  const handleChange = (field: keyof Step3Data, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Technical Skills</h2>
        <p className="text-gray-600">Showcase your technical expertise</p>
      </div>

      <div>
        <label htmlFor="primarySkills" className="block text-sm font-medium text-gray-700 mb-2">
          Primary Skills <span className="text-red-500">*</span>
        </label>
        <textarea
          id="primarySkills"
          name="primarySkills"
          value={data.primarySkills || ''}
          onChange={(e) => handleChange('primarySkills', e.target.value)}
          rows={4}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.primarySkills ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Describe your main technical skills and areas of expertise..."
        />
        {errors.primarySkills && (
          <p className="mt-1 text-sm text-red-600">{errors.primarySkills}</p>
        )}
        {data.primarySkills && (
          <AIImprove
            text={data.primarySkills}
            field="primarySkills"
            onAccept={(improved) => handleChange('primarySkills', improved)}
          />
        )}
      </div>

      <div>
        <label htmlFor="programmingLanguages" className="block text-sm font-medium text-gray-700 mb-2">
          Programming Languages <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="programmingLanguages"
          name="programmingLanguages"
          value={data.programmingLanguages || ''}
          onChange={(e) => handleChange('programmingLanguages', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.programmingLanguages ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="TypeScript, Python, Go, SQL"
        />
        {errors.programmingLanguages && (
          <p className="mt-1 text-sm text-red-600">{errors.programmingLanguages}</p>
        )}
      </div>

      <div>
        <label htmlFor="frameworksAndTools" className="block text-sm font-medium text-gray-700 mb-2">
          Frameworks and Tools <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="frameworksAndTools"
          name="frameworksAndTools"
          value={data.frameworksAndTools || ''}
          onChange={(e) => handleChange('frameworksAndTools', e.target.value)}
          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent ${
            errors.frameworksAndTools ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="React, Next.js, FastAPI, PostgreSQL, Docker, Kubernetes"
        />
        {errors.frameworksAndTools && (
          <p className="mt-1 text-sm text-red-600">{errors.frameworksAndTools}</p>
        )}
      </div>
    </div>
  );
}

