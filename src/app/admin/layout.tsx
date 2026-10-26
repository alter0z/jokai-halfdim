/**
 * Apple-inspired Modern Admin Dashboard Layout & Navigation
 */

'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [adminUser, setAdminUser] = useState<string>('Admin');
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user?.username) {
          setAdminUser(data.user.username);
        }
      })
      .catch(() => {});
  }, []);

  const handleLogout = async () => {
    try {
      setLoggingOut(true);
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch {
      router.push('/login');
    } finally {
      setLoggingOut(false);
    }
  };

  const navItems = [
    { label: 'Dashboard', href: '/admin/dashboard', active: pathname.startsWith('/admin/dashboard') },
    { label: 'Orders Queue', href: '/admin/orders', active: pathname.startsWith('/admin/orders') },
    { label: 'Catalog & Pricing', href: '/admin/catalog', active: pathname.startsWith('/admin/catalog') },
    { label: 'Customers', href: '/admin/customers', active: pathname.startsWith('/admin/customers') },
    { label: 'Shop Settings', href: '/admin/settings', active: pathname.startsWith('/admin/settings') },
    { label: 'Guide & SOP', href: '/admin/guide', active: pathname.startsWith('/admin/guide') },
  ];

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-indigo-500/20">
      {/* Apple-style Frosted Glass Navigation Bar */}
      <header className="sticky top-0 z-40 w-full bg-white/75 backdrop-blur-2xl border-b border-black/[0.06] transition-all">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Brand Logo & Squircle Icon */}
          <div className="flex items-center gap-3">
            <a href="/admin/orders" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-200 ring-1 ring-black/5">
                <span className="font-bold text-sm tracking-tight">JH</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-sm tracking-tight text-[#1d1d1f] group-hover:text-indigo-600 transition-colors">
                  Jokai Halfdim
                </span>
                <span className="text-[10px] text-[#86868b] tracking-tight">
                  Admin Workspace
                </span>
              </div>
            </a>
          </div>

          {/* Navigation Pills (Apple Segmented Style) */}
          <nav className="hidden md:flex items-center bg-black/[0.04] p-1 rounded-full border border-black/[0.04]">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className={`py-1.5 px-4 rounded-full text-xs font-medium tracking-tight transition-all duration-200 ${
                  item.active
                    ? 'bg-white text-[#1d1d1f] shadow-sm shadow-black/[0.06]'
                    : 'text-[#6e6e73] hover:text-[#1d1d1f]'
                }`}
              >
                {item.label}
              </a>
            ))}
          </nav>

          {/* Admin Profile & Sign Out Pill */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/80 border border-black/[0.06] shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-medium text-[#1d1d1f] tracking-tight">
                {adminUser}
              </span>
              <span className="text-[10px] bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full font-semibold">
                Solo Admin
              </span>
            </div>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="py-1.5 px-3.5 rounded-full bg-black/[0.04] hover:bg-black/[0.08] active:scale-[0.97] text-xs font-medium text-[#1d1d1f] border border-black/[0.04] transition-all flex items-center gap-1.5"
              title="Sign Out of Admin Dashboard"
            >
              <svg className="w-3.5 h-3.5 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{loggingOut ? 'Signing out...' : 'Sign Out'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex overflow-x-auto px-4 py-2 border-t border-black/[0.04] gap-1 scrollbar-none">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`py-1 px-3 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                item.active
                  ? 'bg-white text-[#1d1d1f] shadow-sm border border-black/[0.06]'
                  : 'text-[#6e6e73]'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
      </header>

      {/* Main Workspace */}
      <main className="max-w-7xl mx-auto py-8 px-4 sm:px-6 animate-in fade-in duration-300">
        {children}
      </main>
    </div>
  );
}
