/**
 * Secure Customer Login Form (/s/[token])
 *
 * HTTPS one-time form where customers securely submit game credentials
 * which are immediately encrypted with AES-256-GCM.
 *
 * Styled in modern Apple aesthetic with smooth high-radius cards & pills.
 */

'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';

export default function SecureLoginForm() {
  const params = useParams();
  const token = params.token as string;
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) {
      setError('Please agree not to log in while piloting work is underway.');
      return;
    }

    try {
      setLoading(true);
      setError('');
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
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center px-4 py-12 relative overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-emerald-100/40 via-indigo-100/30 to-blue-100/20 blur-3xl pointer-events-none rounded-full" />

        <div className="relative max-w-md w-full bg-white/85 backdrop-blur-2xl p-8 sm:p-10 rounded-[32px] border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.06)] text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-br from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/25 ring-1 ring-white/30">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-2">
            Credentials Received
          </h2>
          <p className="text-[#6e6e73] text-sm leading-relaxed mb-6">
            Your login details have been securely encrypted with AES-256-GCM. The link has now expired and cannot be reused.
          </p>
          <div className="p-3.5 rounded-2xl bg-black/[0.03] border border-black/[0.04] text-xs text-[#86868b] text-left space-y-1.5">
            <div className="flex items-center gap-1.5 font-medium text-[#1d1d1f]">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              What happens next:
            </div>
            <p>1. The pilot will begin your order in the private Discord thread.</p>
            <p>2. If a verification code is needed, you will get a Discord ping.</p>
            <p>3. Password will be purged as soon as work is completed.</p>
          </div>
          <div className="mt-6 pt-5 border-t border-black/[0.06]">
            <p className="text-xs text-[#86868b]">You can safely close this browser window now.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center px-4 py-12 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-blue-200/20 blur-3xl pointer-events-none rounded-full" />

      {/* Main Apple Squircle Card */}
      <div className="relative max-w-[430px] w-full bg-white/80 backdrop-blur-2xl p-8 sm:p-9 rounded-[32px] border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)]">
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-14 h-14 rounded-[20px] bg-gradient-to-b from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/25 mb-3.5 ring-1 ring-white/30">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            One-Time Secure Login
          </h2>
          <p className="text-xs text-[#86868b] mt-1">
            End-to-end encrypted · Purged on completion
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#6e6e73] mb-1.5 ml-1">
              Username / Hoyoverse Email / Phone
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="e.g. traveler@hoyoverse.com"
              className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.08] rounded-2xl text-sm text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#6e6e73] mb-1.5 ml-1">
              Game Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.08] rounded-2xl text-sm text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all pr-11"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] p-1 rounded-full transition"
              >
                {showPassword ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          {/* iOS-Style Agreement Checkbox */}
          <div
            onClick={() => setAgreed(!agreed)}
            className="flex items-start gap-3 p-3 rounded-2xl bg-black/[0.03] border border-black/[0.06] cursor-pointer hover:bg-black/[0.05] transition-colors select-none"
          >
            <div className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center transition-all ${agreed ? 'bg-indigo-600 text-white' : 'border border-gray-300 bg-white'}`}>
              {agreed && (
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <label className="text-xs text-[#6e6e73] leading-relaxed cursor-pointer">
              I agree <span className="font-semibold text-[#1d1d1f]">not to log into the game</span> while work is in progress.
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-sm shadow-md shadow-indigo-600/20 disabled:opacity-50 disabled:pointer-events-none transition-all duration-200 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Encrypting & Sending...
              </>
            ) : (
              <>
                <span>Submit Credentials Securely</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-black/[0.06] text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#86868b]">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>Single-use HTTPS token · Zero Discord exposure</span>
          </div>
        </div>
      </div>
    </div>
  );
}
