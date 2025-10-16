'use client';

import { FormData } from '@/lib/types';

interface ReviewPageProps {
  formData: FormData;
  onEdit: (step: number) => void;
  onSubmit: () => void;
}

export default function ReviewPage({ formData, onEdit, onSubmit }: ReviewPageProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review Your Application</h2>
        <p className="text-gray-600">Please review all information before submitting</p>
      </div>

      {/* Step 1 Review */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
          <button
            onClick={() => onEdit(1)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        {formData.step1 && (
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step1.fullName}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Email</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step1.email}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Phone</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step1.phone}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Location</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step1.location}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Step 2 Review */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Work Experience</h3>
          <button
            onClick={() => onEdit(2)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        {formData.step2 && (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Position</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step2.currentPosition}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Company</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step2.company}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Years of Experience</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step2.yearsOfExperience} years</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Key Achievements</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{formData.step2.keyAchievements}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Step 3 Review */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Technical Skills</h3>
          <button
            onClick={() => onEdit(3)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        {formData.step3 && (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Primary Skills</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{formData.step3.primarySkills}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Programming Languages</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step3.programmingLanguages}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Frameworks and Tools</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step3.frameworksAndTools}</dd>
            </div>
          </dl>
        )}
      </div>

      {/* Step 4 Review */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Motivation</h3>
          <button
            onClick={() => onEdit(4)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Edit
          </button>
        </div>
        {formData.step4 && (
          <dl className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Why this role?</dt>
              <dd className="mt-1 text-sm text-gray-900 whitespace-pre-wrap">{formData.step4.motivation}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Start Date</dt>
              <dd className="mt-1 text-sm text-gray-900">{formData.step4.startDate}</dd>
            </div>
            {formData.step4.expectedSalary && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Expected Salary</dt>
                <dd className="mt-1 text-sm text-gray-900">{formData.step4.expectedSalary}</dd>
              </div>
            )}
          </dl>
        )}
      </div>

      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={() => onEdit(4)}
          className="px-6 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
        >
          Back to Edit
        </button>
        <button
          onClick={onSubmit}
          className="px-8 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
        >
          Submit Application
        </button>
      </div>
    </div>
  );
}

