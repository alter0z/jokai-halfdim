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
        <h1 className="text-2xl font-bold text-gray-900">System Settings</h1>
        <p className="text-sm text-gray-500">Manage store availability, limits, pricing thresholds, and automation schedules</p>
      </div>

      {savedSuccess && (
        <div className="p-4 bg-green-50 text-green-700 text-sm rounded-md border border-green-200">
          ✓ Settings saved successfully!
        </div>
      )}

      {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Store Operation Status */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Store Status & Capacity</h2>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <span className="font-semibold text-sm text-gray-900">Store Open for Orders</span>
              <p className="text-xs text-gray-500">When disabled, customers cannot submit new orders via Discord</p>
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
              <label className="block text-xs font-bold text-gray-700 uppercase">Max Active Queue Capacity</label>
              <input
                type="number"
                min="1"
                max="100"
                value={queueLimit}
                onChange={e => setQueueLimit(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Maximum active jobs permitted at any given time</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Min Charge Per Area (Rp)</label>
              <input
                type="number"
                min="0"
                step="1000"
                value={explorationMinimum}
                onChange={e => setExplorationMinimum(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Base minimum charge for any exploration area (default Rp5.000)</p>
            </div>
          </div>
        </div>

        {/* Risk & Fraud Prevention */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Fraud & First-Time Risk Control</h2>

          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <div>
              <span className="font-semibold text-sm text-gray-900">Enforce First Order Spending Cap</span>
              <p className="text-xs text-gray-500">Requires split payments or caps cart for accounts with zero completed orders</p>
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
            <label className="block text-xs font-bold text-gray-700 uppercase">First Order Limit Amount (Rp)</label>
            <input
              type="number"
              min="10000"
              step="10000"
              disabled={!firstOrderLimitEnabled}
              value={firstOrderLimit}
              onChange={e => setFirstOrderLimit(parseInt(e.target.value, 10))}
              className="mt-1 w-full max-w-sm px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold disabled:bg-gray-100"
            />
          </div>
        </div>

        {/* Automation Timers */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Automation Timers & Deadlines</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Credential Link Expiry (Hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={loginExpiresHours}
                onChange={e => setLoginExpiresHours(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Single-use form validity period</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Payment Due Deadline (Hours)</label>
              <input
                type="number"
                min="1"
                max="168"
                value={paymentDueHours}
                onChange={e => setPaymentDueHours(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Time customer has to pay invoice</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Overdue Grace Period (Hours)</label>
              <input
                type="number"
                min="1"
                max="720"
                value={overdueHours}
                onChange={e => setOverdueHours(parseInt(e.target.value, 10))}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-semibold"
              />
              <p className="text-xs text-gray-500 mt-1">Automatic blacklist threshold</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-md hover:bg-indigo-700 shadow-sm"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </form>
    </div>
  );
}
