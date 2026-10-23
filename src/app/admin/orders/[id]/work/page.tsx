/**
 * Order Work Page (/admin/orders/[id]/work)
 *
 * Dedicated admin execution interface:
 * - Audited credential revelation
 * - Discord 2FA verification ping
 * - Live checklist with percentage adjustment & dynamic price recalculation
 * - Before / After proof upload
 * - Mark Done & credential purge trigger
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

export default function OrderWorkPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Credentials state
  const [credentials, setCredentials] = useState<{ username?: string; password?: string } | null>(null);
  const [revealingCreds, setRevealingCreds] = useState(false);
  const [credsError, setCredsError] = useState('');

  // Files / Screenshots
  const [uploadingKind, setUploadingKind] = useState<'BEFORE_SCREENSHOT' | 'AFTER_SCREENSHOT' | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);

  // Price adjustment
  const [adjustment, setAdjustment] = useState<number>(0);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data.order);
      setAdjustment(data.order.adjustment || 0);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleRevealCredentials = async () => {
    try {
      setRevealingCreds(true);
      setCredsError('');
      const res = await fetch(`/api/admin/orders/${orderId}/credentials`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to reveal credentials');
      }
      setCredentials(data);
    } catch (err: any) {
      setCredsError(err.message);
    } finally {
      setRevealingCreds(false);
    }
  };

  const handleRequest2FACode = async () => {
    if (!confirm('Ping customer on Discord for Hoyoverse verification code? Order will be placed ON HOLD.')) return;
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/work`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ requestCode: true }),
      });
      if (!res.ok) throw new Error('Failed to request verification code');
      alert('Verification code request sent to customer Discord thread!');
      fetchOrder();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleItemDone = async (itemId: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/work`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action: 'TOGGLE_DONE' }),
      });
      if (!res.ok) throw new Error('Failed to toggle item');
      fetchOrder();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleItemRemoved = async (itemId: string, currentRemoved: boolean) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/work`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, action: 'TOGGLE_REMOVED', removed: !currentRemoved }),
      });
      if (!res.ok) throw new Error('Failed to update item');
      fetchOrder();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleUpdateRealPercent = async (itemId: string, realPercent: number) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/work`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, realPercent }),
      });
      if (!res.ok) throw new Error('Failed to update percentage');
      fetchOrder();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: 'BEFORE_SCREENSHOT' | 'AFTER_SCREENSHOT') => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadLoading(true);
      const formData = new FormData();
      formData.append('file', file);
      formData.append('kind', kind);

      const res = await fetch(`/api/admin/orders/${orderId}/files`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('File upload failed');
      fetchOrder();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setUploadLoading(false);
      setUploadingKind(null);
    }
  };

  const handleOrderStatus = async (action: string, reason?: string) => {
    if (action === 'DONE') {
      const uncompletedItems = order.orderItems?.filter((i: any) => !i.removed && !i.doneAt) || [];
      if (uncompletedItems.length > 0) {
        if (!confirm(`Warning: ${uncompletedItems.length} active item(s) are not marked done yet. Proceed to complete?`)) {
          return;
        }
      }
      if (!confirm('Mark work DONE? This will:\n1. Purge all game credentials from the database\n2. Issue final invoice to customer Discord thread\n3. Set 24h payment timer')) {
        return;
      }
    }

    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason, adjustment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update order status');
      fetchOrder();
      if (action === 'DONE') {
        alert('Work marked as done! Credentials have been purged.');
      }
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading work session...</div>;
  if (error || !order) return <div className="p-8 text-center text-red-600">{error || 'Order not found'}</div>;

  const activeItems = order.orderItems?.filter((i: any) => !i.removed) || [];
  const activeTotal = activeItems.reduce((acc: number, it: any) => acc + it.copiedPrice * it.qty, 0);
  const finalCalculatedTotal = activeTotal + adjustment;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-16">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold font-mono text-indigo-600">{order.code}</h1>
            <span className="px-3 py-0.5 text-xs font-bold rounded-full bg-indigo-100 text-indigo-800">
              {order.status}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Customer: <strong className="text-gray-800">{order.customer?.username}</strong> · Discord ID: {order.customer?.discordId}
          </p>
          <p className="text-sm text-gray-500">
            Game UID: <strong className="text-gray-800">{order.uid || '—'}</strong> · Server: <strong className="text-gray-800">{order.server || '—'}</strong>
          </p>
        </div>

        {/* Global Action Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {order.status === 'IN_PROGRESS' && (
            <>
              <button
                onClick={handleRequest2FACode}
                className="px-3 py-2 bg-amber-500 text-white text-xs font-semibold rounded hover:bg-amber-600 shadow-sm"
              >
                🔑 Minta Kode 2FA
              </button>
              <button
                onClick={() => {
                  const r = prompt('Reason for hold?');
                  if (r !== null) handleOrderStatus('HOLD', r);
                }}
                className="px-3 py-2 bg-orange-100 text-orange-800 text-xs font-semibold rounded hover:bg-orange-200"
              >
                Put On Hold
              </button>
              <button
                onClick={() => handleOrderStatus('DONE')}
                className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 shadow-sm"
              >
                ✓ Selesai (Mark Done & Purge)
              </button>
            </>
          )}

          {order.status === 'ON_HOLD' && (
            <button
              onClick={() => handleOrderStatus('RESUME')}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 shadow-sm"
            >
              Resume Piloting
            </button>
          )}

          {order.status === 'QUEUED' && (
            <button
              onClick={() => handleOrderStatus('START')}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-700 shadow-sm"
            >
              Start Piloting
            </button>
          )}

          {order.status === 'AWAITING_PAYMENT' && (
            <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-3 py-1.5 rounded border border-amber-200">
              Awaiting Payment Proof
            </span>
          )}

          {order.status === 'PAYMENT_REVIEW' && (
            <button
              onClick={() => handleOrderStatus('CONFIRM_PAYMENT')}
              className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded hover:bg-green-700 shadow-sm"
            >
              Confirm Payment
            </button>
          )}
        </div>
      </div>

      {/* Account Credentials Vault (§10) */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Game Account Credentials</h2>
            <p className="text-xs text-gray-500">
              AES-256-GCM encrypted. Every reveal is logged to the security audit trail.
            </p>
          </div>
          {order.accountAccess?.purgedAt ? (
            <span className="text-xs font-bold text-red-600 bg-red-50 px-3 py-1 rounded border border-red-200">
              PURGED ON {new Date(order.accountAccess.purgedAt).toLocaleString('id-ID')}
            </span>
          ) : (
            <button
              onClick={handleRevealCredentials}
              disabled={revealingCreds}
              className="px-4 py-2 bg-red-600 text-white text-xs font-bold rounded hover:bg-red-700 shadow-sm"
            >
              {revealingCreds ? 'Decrypting...' : '👁 Reveal Credentials (Audited)'}
            </button>
          )}
        </div>

        {credsError && (
          <div className="p-3 bg-red-50 text-red-700 text-xs rounded border border-red-100">
            {credsError}
          </div>
        )}

        {credentials && (
          <div className="p-4 bg-gray-50 rounded border border-gray-200 font-mono text-sm grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-500 block uppercase font-sans font-bold">Username / Email</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="font-semibold text-gray-900 select-all">{credentials.username}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(credentials.username || '')}
                  className="text-xs text-indigo-600 hover:underline font-sans"
                >
                  Copy
                </button>
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 block uppercase font-sans font-bold">Password</span>
              <div className="flex items-center space-x-2 mt-1">
                <span className="font-semibold text-gray-900 select-all">{credentials.password}</span>
                <button
                  onClick={() => navigator.clipboard.writeText(credentials.password || '')}
                  className="text-xs text-indigo-600 hover:underline font-sans"
                >
                  Copy
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Work Checklist (§5.3.3) */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Task Checklist</h2>
            <p className="text-xs text-gray-500">
              Check off completed items. For exploration, verify in-game % and update real % if lower.
            </p>
          </div>
          <div className="text-xs text-gray-600">
            Completed: <strong className="text-indigo-600">{activeItems.filter((i: any) => i.doneAt).length}</strong> / {activeItems.length}
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {order.orderItems?.map((item: any) => {
            const isExploration = item.statedPercent !== null && item.statedPercent !== undefined;
            return (
              <div
                key={item.id}
                className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  item.removed ? 'bg-gray-100 opacity-60' : item.doneAt ? 'bg-green-50/50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    disabled={item.removed || order.status === 'COMPLETED' || order.status === 'CANCELLED'}
                    checked={Boolean(item.doneAt)}
                    onChange={() => handleToggleItemDone(item.id)}
                    className="h-5 w-5 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500 cursor-pointer"
                  />
                  <div>
                    <span className={`font-semibold text-sm ${item.doneAt ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                      {item.copiedName}
                    </span>
                    <span className="text-xs text-gray-400 ml-2">({item.pricingType})</span>
                    {item.doneAt && (
                      <span className="text-xs text-green-600 block mt-0.5">
                        Completed at {new Date(item.doneAt).toLocaleTimeString('id-ID')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs">
                  {/* Exploration Percent Breakdown */}
                  {isExploration && (
                    <div className="flex items-center space-x-2 bg-white px-2.5 py-1.5 rounded border border-gray-200">
                      <span className="text-gray-500">Stated: {item.statedPercent}%</span>
                      <span className="text-gray-400">|</span>
                      <span className="text-gray-700 font-medium">Real:</span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        defaultValue={item.realPercent ?? item.statedPercent}
                        onBlur={e => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 0 && val <= 100 && val !== (item.realPercent ?? item.statedPercent)) {
                            handleUpdateRealPercent(item.id, val);
                          }
                        }}
                        className="w-14 px-1.5 py-0.5 border border-gray-300 rounded text-center text-xs font-bold"
                      />
                      <span>%</span>
                    </div>
                  )}

                  {/* Price */}
                  <div className="font-mono font-bold text-gray-800 text-sm">
                    Rp{(item.copiedPrice * item.qty).toLocaleString('id-ID')}
                  </div>

                  {/* Remove / Reinstate */}
                  <button
                    onClick={() => handleToggleItemRemoved(item.id, item.removed)}
                    className={`text-xs px-2 py-1 rounded font-medium ${
                      item.removed
                        ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600'
                    }`}
                  >
                    {item.removed ? 'Reinstate' : 'Remove'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Proof Screenshots (§5.3.6) */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Before & After Proof Screenshots</h2>
        <p className="text-xs text-gray-500">
          Upload screenshots for before/after exploration % or quest completion proofs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before Screenshots */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-gray-600">Before Screenshots</span>
              <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:underline">
                + Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'BEFORE_SCREENSHOT')}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {order.files?.filter((f: any) => f.kind === 'BEFORE_SCREENSHOT').map((f: any) => (
                <a key={f.id} href={f.path} target="_blank" rel="noreferrer" className="block w-24 h-24 border rounded overflow-hidden relative group">
                  <img src={f.path} alt="Before" className="w-full h-full object-cover" />
                </a>
              ))}
              {order.files?.filter((f: any) => f.kind === 'BEFORE_SCREENSHOT').length === 0 && (
                <span className="text-xs text-gray-400 italic">No before screenshots uploaded</span>
              )}
            </div>
          </div>

          {/* After Screenshots */}
          <div className="border border-dashed border-gray-300 rounded-lg p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase text-gray-600">After Screenshots</span>
              <label className="cursor-pointer text-xs font-medium text-indigo-600 hover:underline">
                + Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => handleFileUpload(e, 'AFTER_SCREENSHOT')}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2">
              {order.files?.filter((f: any) => f.kind === 'AFTER_SCREENSHOT').map((f: any) => (
                <a key={f.id} href={f.path} target="_blank" rel="noreferrer" className="block w-24 h-24 border rounded overflow-hidden relative group">
                  <img src={f.path} alt="After" className="w-full h-full object-cover" />
                </a>
              ))}
              {order.files?.filter((f: any) => f.kind === 'AFTER_SCREENSHOT').length === 0 && (
                <span className="text-xs text-gray-400 italic">No after screenshots uploaded</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Financial Summary & Adjustments (§5.3.8) */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Financial Summary & Adjustments</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <span className="text-xs text-gray-500 uppercase block font-semibold">Quoted Total</span>
            <span className="text-lg font-bold text-gray-700">
              Rp{order.quoteTotal.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <span className="text-xs text-gray-500 uppercase block font-semibold">Active Items Total</span>
            <span className="text-lg font-bold text-indigo-600">
              Rp{activeTotal.toLocaleString('id-ID')}
            </span>
          </div>

          <div className="p-3 bg-gray-50 rounded border border-gray-200">
            <span className="text-xs text-gray-500 uppercase block font-semibold">Manual Adjustment (Rp)</span>
            <input
              type="number"
              value={adjustment}
              onChange={e => setAdjustment(parseInt(e.target.value, 10) || 0)}
              className="mt-1 w-full px-2 py-1 text-sm font-bold border border-gray-300 rounded"
              placeholder="+/- Rp"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-gray-200">
          <span className="text-base font-semibold text-gray-800">Final Total Due:</span>
          <span className="text-2xl font-black font-mono text-green-700">
            Rp{finalCalculatedTotal.toLocaleString('id-ID')}
          </span>
        </div>
      </div>
    </div>
  );
}
