'use client';

import { useState } from 'react';
import { FormData } from '@/lib/types';

interface ResumeImportProps {
  onImport: (data: Partial<FormData>) => void;
}

export default function ResumeImport({ onImport }: ResumeImportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [resumeText, setResumeText] = useState('');
  const [loading, setLoading] = useState(false);
  const [extracted, setExtracted] = useState<Partial<FormData> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/autofill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeText }),
      });

      const data = await response.json();

      if (data.success) {
        setExtracted(data.data.extracted);
      } else {
        setError(data.error || 'Failed to extract data');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Extract error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (extracted) {
      onImport(extracted);
      setIsOpen(false);
      setResumeText('');
      setExtracted(null);
    }
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="mb-6 w-full py-3 px-4 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 font-medium hover:border-indigo-400 hover:bg-indigo-50 transition-colors"
      >
        📄 Import from Resume
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-bold text-gray-900">Import from Resume</h3>
          <button
            onClick={() => {
              setIsOpen(false);
              setExtracted(null);
              setError(null);
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!extracted ? (
          <>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Paste your resume text here
              </label>
              <textarea
                name="resumeText"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                rows={12}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Paste your resume text here..."
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setResumeText('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleExtract}
                disabled={loading || resumeText.length < 50}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Extracting...' : 'Extract Information'}
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="mb-4" data-testid="extracted-data">
              <h4 className="font-medium text-gray-900 mb-3">Extracted Information</h4>
              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                {extracted.step1 && (
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-2">Personal Info</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      {extracted.step1.fullName && <p>Name: {extracted.step1.fullName}</p>}
                      {extracted.step1.email && <p>Email: {extracted.step1.email}</p>}
                      {extracted.step1.phone && <p>Phone: {extracted.step1.phone}</p>}
                      {extracted.step1.location && <p>Location: {extracted.step1.location}</p>}
                    </div>
                  </div>
                )}

                {extracted.step2 && (
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-2">Work Experience</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      {extracted.step2.currentPosition && <p>Position: {extracted.step2.currentPosition}</p>}
                      {extracted.step2.company && <p>Company: {extracted.step2.company}</p>}
                      {extracted.step2.yearsOfExperience !== undefined && <p>Experience: {extracted.step2.yearsOfExperience} years</p>}
                      {extracted.step2.keyAchievements && (
                        <p className="whitespace-pre-wrap">Achievements: {extracted.step2.keyAchievements}</p>
                      )}
                    </div>
                  </div>
                )}

                {extracted.step3 && (
                  <div>
                    <h5 className="font-medium text-sm text-gray-700 mb-2">Skills</h5>
                    <div className="text-sm text-gray-600 space-y-1">
                      {extracted.step3.primarySkills && <p className="whitespace-pre-wrap">Primary: {extracted.step3.primarySkills}</p>}
                      {extracted.step3.programmingLanguages && <p>Languages: {extracted.step3.programmingLanguages}</p>}
                      {extracted.step3.frameworksAndTools && <p>Frameworks: {extracted.step3.frameworksAndTools}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setExtracted(null);
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Back
              </button>
              <button
                onClick={handleAccept}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700"
              >
                Accept & Fill Form
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

