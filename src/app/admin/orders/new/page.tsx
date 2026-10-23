/**
 * Admin Manual Order Creation Page (/admin/orders/new)
 *
 * For piloting requests submitted via WhatsApp, direct DM, or walk-ins.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewOrderPage() {
  const router = useRouter();

  const [customerUsername, setCustomerUsername] = useState('');
  const [customerDiscordId, setCustomerDiscordId] = useState('');
  const [uid, setUid] = useState('');
  const [server, setServer] = useState('Asia');
  const [inGameName, setInGameName] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<Array<{ name: string; price: number; qty: number; statedPercent?: number }>>([
    { name: '', price: 0, qty: 1 },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddItem = () => {
    setItems([...items, { name: '', price: 0, qty: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    (updated[index] as any)[field] = value;
    setItems(updated);
  };

  const quoteTotal = items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerUsername.trim()) {
      alert('Customer name is required');
      return;
    }
    if (items.some(it => !it.name.trim())) {
      alert('Please fill out all item names or remove empty rows');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const res = await fetch('/api/admin/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerUsername,
          customerDiscordId: customerDiscordId || null,
          uid,
          server,
          inGameName,
          notes,
          quoteTotal,
          items: items.map(it => ({
            name: it.name,
            price: Number(it.price) || 0,
            qty: Number(it.qty) || 1,
            statedPercent: it.statedPercent ? Number(it.statedPercent) : null,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      router.push(`/admin/orders/${data.order.id}/work`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create Manual Order</h1>
          <p className="text-sm text-gray-500">Record a custom order from WhatsApp, DM, or walk-in</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Customer Information */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Customer & Account Info</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Customer Name / Handle *</label>
              <input
                type="text"
                required
                placeholder="e.g. John (WhatsApp)"
                value={customerUsername}
                onChange={e => setCustomerUsername(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm font-semibold"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Discord User ID (Optional)</label>
              <input
                type="text"
                placeholder="e.g. 123456789012345678"
                value={customerDiscordId}
                onChange={e => setCustomerDiscordId(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Genshin UID</label>
              <input
                type="text"
                placeholder="800123456"
                value={uid}
                onChange={e => setUid(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase">Server</label>
              <select
                value={server}
                onChange={e => setServer(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm font-semibold bg-white"
              >
                <option value="Asia">Asia</option>
                <option value="America">America</option>
                <option value="Europe">Europe</option>
                <option value="SAR">TW, HK, MO (SAR)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Order Items</h2>
            <button
              type="button"
              onClick={handleAddItem}
              className="text-xs font-bold text-indigo-600 hover:underline"
            >
              + Add Item
            </button>
          </div>

          <div className="space-y-3">
            {items.map((it, idx) => (
              <div key={idx} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-gray-50 p-3 rounded border border-gray-200">
                <input
                  type="text"
                  placeholder="Item name (e.g. Fontaine 100%, Daily 7 Hari)"
                  value={it.name}
                  onChange={e => handleItemChange(idx, 'name', e.target.value)}
                  className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm font-medium bg-white"
                  required
                />
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Qty:</span>
                  <input
                    type="number"
                    min="1"
                    value={it.qty}
                    onChange={e => handleItemChange(idx, 'qty', parseInt(e.target.value, 10) || 1)}
                    className="w-16 px-2 py-1.5 border border-gray-300 rounded text-sm text-center bg-white"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Rp:</span>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="Price"
                    value={it.price}
                    onChange={e => handleItemChange(idx, 'price', parseInt(e.target.value, 10) || 0)}
                    className="w-28 px-2 py-1.5 border border-gray-300 rounded text-sm font-bold bg-white"
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(idx)}
                    className="text-red-600 text-xs hover:underline font-bold px-2 py-1"
                  >
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 flex justify-between items-center border-t border-gray-200">
            <span className="text-sm font-semibold text-gray-700">Calculated Total:</span>
            <span className="text-xl font-bold font-mono text-indigo-600">
              Rp{quoteTotal.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Notes */}
        <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm space-y-2">
          <label className="block text-xs font-bold text-gray-700 uppercase">Order Notes</label>
          <textarea
            rows={3}
            placeholder="Additional requirements, customer preferences, or scheduling notes..."
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold text-sm rounded-md hover:bg-indigo-700 shadow-sm"
          >
            {loading ? 'Creating Order...' : 'Create Order & Open Work Page →'}
          </button>
        </div>
      </form>
    </div>
  );
}
