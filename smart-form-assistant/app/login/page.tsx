'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  const errorParam = searchParams.get('error');
  const errorMessages: Record<string, string> = {
    invalid_token: 'Invalid magic link token',
    expired_token: 'Magic link has expired. Please request a new one.',
    user_not_found: 'User not found',
    verification_failed: 'Verification failed. Please try again.',
    server_error: 'Server error. Please try again later.',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMagicLink(null);

    try {
      const response = await fetch('/api/auth/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setMagicLink(data.data.magicLink);
      } else {
        setError(data.error || 'Failed to send magic link');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Smart Form Assistant
          </h1>
          <p className="text-gray-600">
            AI-powered job application form with auto-save
          </p>
        </div>

        {errorParam && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">
              {errorMessages[errorParam] || 'An error occurred'}
            </p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {!magicLink ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="you@example.com"
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Sending...' : 'Send Magic Link'}
            </button>
          </form>
        ) : (
          <div className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800 font-medium mb-2">
                ✓ Magic link generated!
              </p>
              <p className="text-green-700 text-sm mb-4">
                In production, this would be sent to your email. For testing,
                click the link below:
              </p>
              <a
                href={magicLink}
                data-testid="magic-link"
                className="block p-3 bg-white border border-green-300 rounded text-sm break-all text-indigo-600 hover:bg-green-50 transition-colors"
              >
                {magicLink}
              </a>
            </div>

            <button
              onClick={() => {
                setMagicLink(null);
                setEmail('');
              }}
              className="w-full text-gray-600 py-2 px-4 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              Send Another
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>No password needed. We'll send you a secure link to sign in.</p>
        </div>
      </div>
    </div>
  );
}

