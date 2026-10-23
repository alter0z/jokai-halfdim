/**
 * Admin Customers Management Page
 *
 * View client profiles, piloting history, spending stats, and block/unblock controls.
 */

'use client';

import React, { useState, useEffect } from 'react';

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (search) query.append('search', search);

      const res = await fetch(`/api/admin/customers?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to load customers');
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleToggleBlock = async (userId: string, currentBlocked: boolean, username: string) => {
    let reason = '';
    if (!currentBlocked) {
      const input = prompt(`Reason for blocking customer @${username}?`);
      if (input === null) return;
      reason = input;
    } else {
      if (!confirm(`Unblock customer @${username}?`)) return;
    }

    try {
      const res = await fetch('/api/admin/customers', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          blocked: !currentBlocked,
          reason,
        }),
      });
      if (!res.ok) throw new Error('Failed to update customer block status');
      fetchCustomers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customer Management</h1>
          <p className="text-sm text-gray-500">View customer order statistics and manage blacklist</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search username or Discord ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchCustomers()}
            className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 w-64"
          />
          <button
            onClick={fetchCustomers}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm font-medium hover:bg-gray-50"
          >
            Search
          </button>
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading customers...</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No customers found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Discord ID</th>
                <th className="px-6 py-3 text-left">Orders</th>
                <th className="px-6 py-3 text-left">Total Spent</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    <div className="flex items-center space-x-2">
                      <span>{c.username}</span>
                      {c.role === 'ADMIN' && (
                        <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.5 rounded">
                          ADMIN
                        </span>
                      )}
                    </div>
                    {c.blockReason && (
                      <span className="text-xs text-red-600 block mt-0.5">
                        Reason: {c.blockReason}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-500">
                    {c.discordId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {c.totalOrders} order(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-medium text-gray-900">
                    Rp{c.totalSpent.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {c.blocked ? (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-red-100 text-red-800 border border-red-200">
                        BLOCKED
                      </span>
                    ) : c.hasUnpaid ? (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                        HAS UNPAID
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-green-100 text-green-800 border border-green-200">
                        ACTIVE
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <button
                      onClick={() => handleToggleBlock(c.id, c.blocked, c.username)}
                      className={`px-3 py-1 text-xs font-medium rounded ${
                        c.blocked
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-50 text-red-700 hover:bg-red-100'
                      }`}
                    >
                      {c.blocked ? 'Unblock' : 'Block'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
