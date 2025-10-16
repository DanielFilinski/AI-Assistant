'use client';

import { useState } from 'react';

interface AIImproveProps {
  text: string;
  field: 'keyAchievements' | 'primarySkills' | 'motivation';
  onAccept: (improved: string) => void;
}

export default function AIImprove({ text, field, onAccept }: AIImproveProps) {
  const [loading, setLoading] = useState(false);
  const [improved, setImproved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleImprove = async () => {
    if (!text || text.trim().length < 5) {
      setError('Please enter at least 5 characters before improving');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/improve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, field }),
      });

      const data = await response.json() as { success: boolean; data?: { improved: string }; error?: string };

      if (data.success && data.data) {
        setImproved(data.data.improved);
      } else {
        setError(data.error || 'Failed to improve text');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Improve error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = () => {
    if (improved) {
      onAccept(improved);
      setImproved(null);
    }
  };

  return (
    <div className="mt-2">
      {error && (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      {!improved ? (
        <button
          type="button"
          onClick={handleImprove}
          disabled={loading || !text}
          className="text-sm text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? '✨ Improving...' : '✨ Improve with AI'}
        </button>
      ) : (
        <div className="mt-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <h4 className="text-sm font-medium text-indigo-900">AI Suggestion</h4>
            <button
              onClick={() => setImproved(null)}
              className="text-indigo-600 hover:text-indigo-700 text-xs"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-700 mb-3 whitespace-pre-wrap">{improved}</p>
          <div className="flex justify-end space-x-2">
            <button
              onClick={() => setImproved(null)}
              className="px-3 py-1 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
            >
              Reject
            </button>
            <button
              onClick={handleAccept}
              className="px-3 py-1 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Accept
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

