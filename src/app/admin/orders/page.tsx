/**
 * Admin Orders Dashboard
 *
 * Queue management, status filters, quick actions (Accept/Decline/Start/Work).
 */

'use client';

import React, { useState, useEffect } from 'react';

const STATUS_FILTERS = [
  'ALL',
  'PENDING',
  'ACCEPTED',
  'QUEUED',
  'IN_PROGRESS',
  'ON_HOLD',
  'AWAITING_PAYMENT',
  'PAYMENT_REVIEW',
  'COMPLETED',
  'OVERDUE',
  'CANCELLED',
];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (statusFilter !== 'ALL') query.append('status', statusFilter);
      if (search) query.append('search', search);

      const res = await fetch(`/api/admin/orders?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleAction = async (orderId: string, action: string, reason?: string) => {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update order');
      }
      fetchOrders();
    } catch (err: any) {
      alert(`Action failed: ${err.message}`);
    }
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      ACCEPTED: 'bg-blue-100 text-blue-800 border-blue-200',
      QUEUED: 'bg-purple-100 text-purple-800 border-purple-200',
      IN_PROGRESS: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      ON_HOLD: 'bg-orange-100 text-orange-800 border-orange-200',
      AWAITING_PAYMENT: 'bg-amber-100 text-amber-800 border-amber-200',
      PAYMENT_REVIEW: 'bg-teal-100 text-teal-800 border-teal-200',
      COMPLETED: 'bg-green-100 text-green-800 border-green-200',
      OVERDUE: 'bg-red-100 text-red-800 border-red-200',
      CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
      DECLINED: 'bg-red-50 text-red-700 border-red-100',
    };
    return (
      <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${colors[status] || 'bg-gray-100 text-gray-800'}`}>
        {status.replace('_', ' ')}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Orders Queue</h1>
          <p className="text-xs text-[#6e6e73]">Manage incoming requests, active piloting jobs, and invoices</p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin/orders/new"
            className="px-3.5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm whitespace-nowrap transition-all"
          >
            + New Order
          </a>
          <input
            type="text"
            placeholder="Search code, UID, customer..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && fetchOrders()}
            className="px-3.5 py-2 border border-black/[0.08] bg-white/80 backdrop-blur-xl rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
          />
          <button
            onClick={fetchOrders}
            className="px-3.5 py-2 bg-white/80 backdrop-blur-xl border border-black/[0.08] rounded-xl text-xs font-medium hover:bg-black/[0.04] transition-all"
          >
            Search
          </button>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex overflow-x-auto pb-2 gap-1.5 border-b border-black/[0.06] text-xs">
        {STATUS_FILTERS.map(st => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3.5 py-1.5 rounded-xl whitespace-nowrap font-medium transition-all ${
              statusFilter === st
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-black/[0.02] text-[#6e6e73] hover:bg-black/[0.06] hover:text-[#1d1d1f]'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl">{error}</div>}

      {/* KPI Statistics Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Total Orders</div>
          <div className="text-3xl font-bold text-[#1d1d1f] mt-3">{orders.length}</div>
          <div className="text-[11px] text-[#86868b] mt-1">All time orders in queue</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Review</div>
          <div className="text-3xl font-bold text-amber-600 mt-3">
            {orders.filter(o => o.status === 'PENDING').length}
          </div>
          <div className="text-[11px] text-amber-700 mt-1">Requires admin acceptance</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Active / In Progress</div>
          <div className="text-3xl font-bold text-indigo-600 mt-3">
            {orders.filter(o => ['ACCEPTED', 'QUEUED', 'IN_PROGRESS'].includes(o.status)).length}
          </div>
          <div className="text-[11px] text-indigo-700 mt-1">Currently being piloted</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</div>
          <div className="text-3xl font-bold text-emerald-600 mt-3">
            {orders.filter(o => o.status === 'COMPLETED').length}
          </div>
          <div className="text-[11px] text-emerald-700 mt-1">Successfully fulfilled</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Total Revenue</div>
          <div className="text-2xl font-bold text-purple-700 mt-3">
            Rp{orders
              .filter(o => ['COMPLETED', 'IN_PROGRESS', 'ACCEPTED', 'AWAITING_PAYMENT'].includes(o.status))
              .reduce((sum, o) => sum + (o.finalTotal || o.quoteTotal || 0), 0)
              .toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-purple-600 mt-1">Estimated order value</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white/80 backdrop-blur-xl border border-black/[0.06] rounded-[28px] shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading orders...</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No orders found.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Code</th>
                <th className="px-6 py-3 text-left">Customer</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Items</th>
                <th className="px-6 py-3 text-left">Total</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {orders.map(order => (
                <tr key={order.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap font-mono font-bold text-indigo-600">
                    <a href={`/admin/orders/${order.id}/work`} className="hover:underline">
                      {order.code}
                    </a>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{order.customer?.username || 'Guest'}</div>
                    <div className="text-xs text-gray-500">
                      UID: {order.uid || '—'} · {order.server || 'Server N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                  <td className="px-6 py-4 text-xs text-gray-600 max-w-xs truncate">
                    {order.orderItems?.map((it: any) => it.copiedName).join(', ') || 'No items'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                    Rp{(order.finalTotal || order.quoteTotal).toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleAction(order.id, 'ACCEPT')}
                          className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for declining?');
                            if (reason !== null) handleAction(order.id, 'DECLINE', reason);
                          }}
                          className="px-2.5 py-1 bg-red-100 text-red-700 text-xs font-medium rounded hover:bg-red-200"
                        >
                          Decline
                        </button>
                      </>
                    )}

                    {order.status === 'QUEUED' && (
                      <button
                        onClick={() => handleAction(order.id, 'START')}
                        className="px-2.5 py-1 bg-indigo-600 text-white text-xs font-medium rounded hover:bg-indigo-700"
                      >
                        Start Work
                      </button>
                    )}

                    {order.status === 'PAYMENT_REVIEW' && (
                      <button
                        onClick={() => handleAction(order.id, 'CONFIRM_PAYMENT')}
                        className="px-2.5 py-1 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700"
                      >
                        Confirm Payment
                      </button>
                    )}

                    <a
                      href={`/admin/orders/${order.id}/work`}
                      className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded hover:bg-gray-200 inline-block"
                    >
                      Work Page →
                    </a>
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
