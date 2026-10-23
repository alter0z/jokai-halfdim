/**
 * Secure Customer Login Form (/s/[token])
 *
 * HTTPS one-time form where customers securely submit game credentials
 * which are immediately encrypted with AES-256-GCM.
 */

'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

export default function SecureLoginForm() {
  const params = useParams();
  const token = params.token as string;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('You must agree not to log in while work is in progress.');
      return;
    }

    try {
      const res = await fetch(`/api/s/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit login details');
      }

      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow text-center">
          <h2 className="text-2xl font-bold text-green-600 mb-2">Login Details Received!</h2>
          <p className="text-gray-600">
            Thank you. Your credentials have been encrypted securely. You can now close this tab.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow">
        <h2 className="text-2xl font-bold mb-1 text-gray-900">Jokai Secure Login</h2>
        <p className="text-sm text-gray-500 mb-6">Enter your Genshin Impact account credentials for piloting.</p>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Username / Email / Phone</label>
            <input
              type="text"
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-start pt-2">
            <input
              type="checkbox"
              id="agreed"
              checked={agreed}
              onChange={e => setAgreed(e.target.checked)}
              className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="agreed" className="ml-2 text-sm text-gray-600">
              I agree <span className="font-semibold">not to log into the game</span> while work is in progress.
            </label>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition font-medium"
          >
            Submit Credentials Securely
          </button>
        </form>
      </div>
    </div>
  );
}
