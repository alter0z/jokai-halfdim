/**
 * Apple-inspired Modern Admin Login Page for Jokai Halfdim
 *
 * Features:
 * - Apple squircle curvatures (rounded-3xl, rounded-2xl)
 * - Frosted glassmorphism (backdrop-blur-2xl, subtle hairline borders)
 * - iOS-style segmented controls & switch toggles
 * - Passkey/Password & Discord OAuth tab options
 * - Instant error feedback & loading states
 */

'use client';

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get('from') || '/admin/orders';
  const urlError = searchParams.get('error');

  const [activeTab, setActiveTab] = useState<'password' | 'discord'>('password');
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>(() => {
    if (urlError === 'discord_not_configured') {
      return 'Discord OAuth is not configured yet in .env. Use Admin Passcode below.';
    }
    if (urlError === 'not_an_admin') {
      return 'Your Discord account does not have Admin privileges.';
    }
    if (urlError) {
      return 'Authentication failed. Please try again.';
    }
    return '';
  });

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid credentials. Default is: jokai2026!');
        setLoading(false);
        return;
      }

      router.push(from);
      router.refresh();
    } catch {
      setError('Unable to connect to authentication service.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-indigo-500/20">
      {/* Apple-style subtle ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-blue-200/20 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-indigo-100/40 to-transparent blur-2xl pointer-events-none rounded-full" />

      {/* Main Glassmorphic Squircle Card */}
      <div className="relative w-full max-w-[420px] bg-white/80 backdrop-blur-2xl rounded-[32px] border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-8 sm:p-9 transition-all">
        {/* Header with Apple Squircle Icon */}
        <div className="flex flex-col items-center text-center mb-7">
          <div className="relative w-16 h-16 rounded-[22px] bg-gradient-to-b from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25 mb-4 ring-1 ring-white/30">
            <svg
              className="w-8 h-8 text-white drop-shadow-sm"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <rect x="3" y="11" width="18" height="11" rx="4" ry="4" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-white flex items-center justify-center">
              <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
            Jokai Halfdim
          </h1>
          <p className="text-xs font-medium text-[#86868b] mt-1 tracking-tight">
            Administrator Portal · Pilot Operations
          </p>
        </div>

        {/* Apple Segmented Control */}
        <div className="bg-black/[0.04] p-1 rounded-full flex mb-6 border border-black/[0.04]">
          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium tracking-tight transition-all duration-200 ${
              activeTab === 'password'
                ? 'bg-white text-[#1d1d1f] shadow-sm shadow-black/[0.08]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Admin Key
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('discord')}
            className={`flex-1 py-1.5 px-3 rounded-full text-xs font-medium tracking-tight transition-all duration-200 ${
              activeTab === 'discord'
                ? 'bg-white text-[#1d1d1f] shadow-sm shadow-black/[0.08]'
                : 'text-[#86868b] hover:text-[#1d1d1f]'
            }`}
          >
            Discord OAuth
          </button>
        </div>

        {/* Error Alert Pill */}
        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 text-xs font-medium flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
            <svg className="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <span className="leading-tight">{error}</span>
          </div>
        )}

        {/* Tab 1: Password / Key Form */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#6e6e73] mb-1.5 ml-1">
                Admin Username
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.08] rounded-2xl text-sm text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all"
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 ml-1 mr-1">
                <label className="text-xs font-semibold text-[#6e6e73]">
                  Admin Passcode
                </label>
                <span className="text-[10px] text-indigo-600 font-medium">
                  Default: jokai2026!
                </span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passcode"
                  className="w-full px-4 py-3 bg-black/[0.03] border border-black/[0.08] rounded-2xl text-sm text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#86868b] hover:text-[#1d1d1f] p-1 rounded-full transition"
                  title={showPassword ? 'Hide password' : 'Show password'}
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

            {/* Apple iOS-Style Switch Toggle */}
            <div className="flex items-center justify-between py-1 px-1">
              <span className="text-xs text-[#6e6e73] font-medium">
                Keep signed in on this device
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={rememberMe}
                onClick={() => setRememberMe(!rememberMe)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  rememberMe ? 'bg-indigo-600' : 'bg-[#e5e5ea]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                    rememberMe ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Apple-style Primary Action Pill Button */}
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
                  Authenticating...
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </>
              )}
            </button>
          </form>
        )}

        {/* Tab 2: Discord OAuth */}
        {activeTab === 'discord' && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-[#6e6e73] leading-relaxed text-center mb-3">
              Sign in using the Discord account authorized as Admin for this Jokai server.
            </p>

            <a
              href="/api/auth/discord"
              className="w-full py-3.5 px-6 rounded-2xl bg-[#5865F2] hover:bg-[#4752c4] active:scale-[0.98] text-white font-medium text-sm shadow-md shadow-[#5865F2]/25 transition-all duration-200 flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              <span>Continue with Discord</span>
            </a>

            <div className="pt-2 text-center">
              <span className="text-[11px] text-[#86868b]">
                Requires DISCORD_OAUTH_CLIENT_ID configured in .env
              </span>
            </div>
          </div>
        )}

        {/* Apple Security Footer */}
        <div className="mt-7 pt-5 border-t border-black/[0.06] text-center">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-[#86868b]">
            <svg className="w-3.5 h-3.5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>AES-256-GCM Vault & HMAC Session Security</span>
          </div>
        </div>
      </div>

      {/* Direct link back to Home */}
      <div className="mt-6 text-center">
        <a
          href="/"
          className="text-xs text-[#86868b] hover:text-[#1d1d1f] transition tracking-tight"
        >
          &larr; Return to Jokai Homepage
        </a>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-600 border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
