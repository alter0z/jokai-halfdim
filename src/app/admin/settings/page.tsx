/**
 * Admin Settings Page (/admin/settings)
 *
 * Configure global store parameters:
 * - Shop open / closed status
 * - Queue capacity limit
 * - First-time order monetary cap
 * - Exploration minimum charge per area
 * - Automation timers (login expiry, payment due, overdue)
 */

'use client';

import React, { useState, useEffect } from 'react';

export default function AdminSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [isOpen, setIsOpen] = useState(true);
  const [queueLimit, setQueueLimit] = useState(10);
  const [firstOrderLimitEnabled, setFirstOrderLimitEnabled] = useState(true);
  const [firstOrderLimit, setFirstOrderLimit] = useState(200000);
  const [explorationMinimum, setExplorationMinimum] = useState(5000);

  const [loginExpiresHours, setLoginExpiresHours] = useState(24);
  const [paymentDueHours, setPaymentDueHours] = useState(24);
  const [overdueHours, setOverdueHours] = useState(72);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      if (!res.ok) throw new Error('Failed to load settings');
      const data = await res.json();

      setIsOpen(data.shopStatus?.isOpen ?? true);
      setQueueLimit(data.queueLimit?.limit ?? 10);
      setFirstOrderLimitEnabled(data.firstOrderLimit?.enabled ?? true);
      setFirstOrderLimit(data.firstOrderLimit?.limit ?? 200000);
      setExplorationMinimum(data.explorationMinimum?.amount ?? 5000);

      setLoginExpiresHours(data.timers?.loginExpiresHours ?? 24);
      setPaymentDueHours(data.timers?.paymentDueHours ?? 24);
      setOverdueHours(data.timers?.overdueHours ?? 72);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSavedSuccess(false);
      setError('');

      const res = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopStatus: { isOpen },
          queueLimit: { limit: Number(queueLimit) },
          firstOrderLimit: { limit: Number(firstOrderLimit), enabled: firstOrderLimitEnabled },
          explorationMinimum: { amount: Number(explorationMinimum) },
          timers: {
            loginExpiresHours: Number(loginExpiresHours),
            paymentDueHours: Number(paymentDueHours),
            overdueHours: Number(overdueHours),
            reminderHours: [12, 24],
          },
        }),
      });

      if (!res.ok) throw new Error('Failed to save settings');
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">System Settings</h1>
        <p className="text-xs text-[#6e6e73]">Manage store availability, limits, pricing thresholds, and automation schedules</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200">
          ✓ Settings saved successfully!
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Operation Status */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-black/[0.06] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#1d1d1f]">Store Status & Capacity</h2>

          <div className="flex items-center justify-between py-2 border-b border-black/[0.06]">
            <div>
              <span className="font-semibold text-xs text-[#1d1d1f]">Store Open for Orders</span>
              <p className="text-[11px] text-[#6e6e73]">When disabled, customers cannot submit new orders via Discord</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                isOpen ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  isOpen ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Max Active Queue Capacity</label>
              <input
                type="number"
                min="1"
                max="100"
                value={queueLimit}
                onChange={e => setQueueLimit(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3.5 py-2.5 border border-black/[0.08] rounded-xl text-xs font-semibold bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <p className="text-[11px] text-[#86868b] mt-1">Maximum active jobs permitted at any given time</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Min Charge Per Area (Rp)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={explorationMinimum}
                onChange={e => setExplorationMinimum(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3.5 py-2.5 border border-black/[0.08] rounded-xl text-xs font-semibold bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <p className="text-[11px] text-[#86868b] mt-1">Base minimum charge for any exploration area (default Rp5.000)</p>
            </div>
          </div>
        </div>

        {/* Risk & Fraud Prevention */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-black/[0.06] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#1d1d1f]">Fraud & First-Time Risk Control</h2>

          <div className="flex items-center justify-between py-2 border-b border-black/[0.06]">
            <div>
              <span className="font-semibold text-xs text-[#1d1d1f]">Enforce First Order Spending Cap</span>
              <p className="text-[11px] text-[#6e6e73]">Requires split payments or caps cart for accounts with zero completed orders</p>
            </div>
            <button
              type="button"
              onClick={() => setFirstOrderLimitEnabled(!firstOrderLimitEnabled)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                firstOrderLimitEnabled ? 'bg-indigo-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  firstOrderLimitEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">First Order Limit Amount (Rp)</label>
            <input
              type="number"
              min="10000"
              step="10000"
              disabled={!firstOrderLimitEnabled}
              value={firstOrderLimit}
              onChange={e => setFirstOrderLimit(parseInt(e.target.value, 10))}
              className="mt-1 w-full max-w-sm px-3.5 py-2.5 border border-black/[0.08] rounded-xl text-xs font-semibold bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm disabled:opacity-50"
            />
          </div>
        </div>

        {/* Automation Timers */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-black/[0.06] shadow-sm space-y-4">
          <h2 className="text-base font-bold text-[#1d1d1f]">Automation Timers & Deadlines</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Credential Link Expiry (Hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={loginExpiresHours}
                onChange={e => setLoginExpiresHours(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3.5 py-2.5 border border-black/[0.08] rounded-xl text-xs font-semibold bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <p className="text-[11px] text-[#86868b] mt-1">Single-use form validity period</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Payment Due Deadline (Hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={paymentDueHours}
                onChange={e => setPaymentDueHours(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3.5 py-2.5 border border-black/[0.08] rounded-xl text-xs font-semibold bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <p className="text-[11px] text-[#86868b] mt-1">Time customer has to pay invoice</p>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider">Overdue Grace Period (Hours)</label>
              <input
                type="number"
                min="1"
                max="720"
                value={overdueHours}
                onChange={e => setOverdueHours(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3.5 py-2.5 border border-black/[0.08] rounded-xl text-xs font-semibold bg-white/80 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
              <p className="text-[11px] text-[#86868b] mt-1">Automatic blacklist threshold</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 shadow-sm transition-all"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
