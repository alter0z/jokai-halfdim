/**
 * Next.js Admin Dashboard Layout & Navigation
 */

import React from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <span className="font-bold text-xl text-indigo-600">Jokai Halfdim</span>
          <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">Admin Dashboard</span>
        </div>
        <div className="flex items-center space-x-6 text-sm font-medium">
          <a href="/admin/orders" className="hover:text-indigo-600">Orders</a>
          <a href="/admin/catalog" className="hover:text-indigo-600">Data & Catalog</a>
          <a href="/admin/customers" className="hover:text-indigo-600">Customers</a>
          <a href="/admin/settings" className="hover:text-indigo-600">Settings</a>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto py-8 px-6">{children}</main>
    </div>
  );
}
