/**
 * Admin Analytics & Statistics Dashboard
 *
 * Visual charts, KPI metrics, date-range filters, and revenue/status breakdowns.
 */

'use client';

import React, { useState, useEffect } from 'react';

type DateFilter = 'all' | 'today' | '7days' | '30days';

export default function AdminDashboardPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/orders');
      if (!res.ok) throw new Error('Failed to load orders');
      const data = await res.json();
      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Filter orders by date range
  const filteredOrders = orders.filter(order => {
    if (dateFilter === 'all') return true;
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    if (dateFilter === 'today') {
      return orderDate.toDateString() === now.toDateString();
    }
    if (dateFilter === '7days') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return orderDate >= sevenDaysAgo;
    }
    if (dateFilter === '30days') {
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return orderDate >= thirtyDaysAgo;
    }
    return true;
  });

  // KPI Calculations
  const totalOrders = filteredOrders.length;
  const pendingOrders = filteredOrders.filter(o => o.status === 'PENDING').length;
  const activeOrders = filteredOrders.filter(o => ['ACCEPTED', 'QUEUED', 'IN_PROGRESS', 'ON_HOLD'].includes(o.status)).length;
  const completedOrders = filteredOrders.filter(o => o.status === 'COMPLETED').length;

  const totalRevenue = filteredOrders
    .filter(o => ['COMPLETED', 'IN_PROGRESS', 'ACCEPTED', 'AWAITING_PAYMENT'].includes(o.status))
    .reduce((sum, o) => sum + (o.finalTotal || o.quoteTotal || 0), 0);

  // Status breakdown
  const statusCounts: Record<string, number> = {};
  filteredOrders.forEach(o => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  // Revenue by date (grouped by day)
  const revenueByDate: Record<string, number> = {};
  filteredOrders.forEach(o => {
    if (['COMPLETED', 'IN_PROGRESS', 'ACCEPTED', 'AWAITING_PAYMENT'].includes(o.status)) {
      const dateStr = new Date(o.createdAt).toISOString().split('T')[0];
      revenueByDate[dateStr] = (revenueByDate[dateStr] || 0) + (o.finalTotal || o.quoteTotal || 0);
    }
  });

  const sortedDates = Object.keys(revenueByDate).sort();

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Date Filter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f] tracking-tight">Analytics Dashboard</h1>
          <p className="text-xs text-[#6e6e73]">Business intelligence, revenue analytics, and order fulfillment metrics</p>
        </div>

        {/* Date Filter Segmented Control */}
        <div className="flex items-center bg-black/[0.04] p-1 rounded-xl border border-black/[0.04]">
          {(['all', 'today', '7days', '30days'] as DateFilter[]).map(filter => (
            <button
              key={filter}
              onClick={() => setDateFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                dateFilter === filter
                  ? 'bg-white text-[#1d1d1f] shadow-sm'
                  : 'text-[#6e6e73] hover:text-[#1d1d1f]'
              }`}
            >
              {filter === 'all' && 'All Time'}
              {filter === 'today' && 'Today'}
              {filter === '7days' && 'Last 7 Days'}
              {filter === '30days' && 'Last 30 Days'}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-700 text-sm rounded-xl">{error}</div>}

      {/* KPI Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-[#86868b] uppercase tracking-wider">Total Orders</div>
          <div className="text-3xl font-bold text-[#1d1d1f] mt-3">{totalOrders}</div>
          <div className="text-[11px] text-indigo-600 font-medium mt-1">Filtered timeframe</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Review</div>
          <div className="text-3xl font-bold text-amber-600 mt-3">{pendingOrders}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">Awaiting admin action</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Active Piloting</div>
          <div className="text-3xl font-bold text-indigo-600 mt-3">{activeOrders}</div>
          <div className="text-[11px] text-indigo-700 font-medium mt-1">In progress / queued</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Completed</div>
          <div className="text-3xl font-bold text-emerald-600 mt-3">{completedOrders}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">Successfully fulfilled</div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-5 rounded-[24px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Total Revenue</div>
          <div className="text-2xl font-bold text-purple-700 mt-3">
            Rp{totalRevenue.toLocaleString('id-ID')}
          </div>
          <div className="text-[11px] text-purple-600 font-medium mt-1">Gross order value</div>
        </div>
      </div>

      {/* Charts & Breakdowns Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend Chart */}
        <div className="lg:col-span-2 bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-base font-bold text-[#1d1d1f]">Revenue Trend</h2>
              <p className="text-xs text-[#6e6e73]">Daily gross revenue generated</p>
            </div>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-600">
              Gross IDR
            </span>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#86868b]">Loading chart data...</div>
          ) : sortedDates.length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#86868b]">No revenue data in this range</div>
          ) : (
            <div className="space-y-3">
              {sortedDates.map(dateStr => {
                const amount = revenueByDate[dateStr];
                const maxAmount = Math.max(...Object.values(revenueByDate), 1);
                const percentage = Math.round((amount / maxAmount) * 100);

                return (
                  <div key={dateStr} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium text-[#1d1d1f]">{dateStr}</span>
                      <span className="font-bold text-purple-700">Rp{amount.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="w-full h-3 bg-black/[0.04] rounded-full overflow-hidden p-0.5">
                      <div
                        className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 4)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Order Status Distribution */}
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-[28px] border border-black/[0.06] shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-[#1d1d1f] mb-1">Status Distribution</h2>
            <p className="text-xs text-[#6e6e73] mb-6">Orders grouped by workflow state</p>
          </div>

          {loading ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#86868b]">Loading distribution...</div>
          ) : Object.keys(statusCounts).length === 0 ? (
            <div className="h-64 flex items-center justify-center text-xs text-[#86868b]">No orders found</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(statusCounts).map(([status, count]) => {
                const percent = Math.round((count / (totalOrders || 1)) * 100);
                return (
                  <div key={status} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-[#1d1d1f]">{status.replace('_', ' ')}</span>
                      <span className="text-[#6e6e73]">{count} ({percent}%)</span>
                    </div>
                    <div className="w-full h-2 bg-black/[0.04] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
