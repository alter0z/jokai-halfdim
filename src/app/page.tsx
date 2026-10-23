/**
 * Modern Apple-styled Landing Page for Jokai Halfdim
 */

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden selection:bg-indigo-500/20">
      {/* Ambient glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[650px] bg-gradient-to-tr from-indigo-200/40 via-purple-100/30 to-blue-200/20 blur-3xl pointer-events-none rounded-full" />
      <div className="absolute -bottom-10 right-1/4 w-[400px] h-[400px] bg-gradient-to-br from-indigo-100/30 to-transparent blur-2xl pointer-events-none rounded-full" />

      {/* Main Glassmorphic Card with high Apple radius */}
      <div className="relative max-w-lg w-full bg-white/80 backdrop-blur-2xl rounded-[32px] border border-black/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.06),0_1px_2px_rgba(0,0,0,0.04)] p-8 sm:p-10 text-center transition-all">
        {/* Apple Squircle Icon */}
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[26px] bg-gradient-to-b from-indigo-500 to-indigo-600 text-white shadow-xl shadow-indigo-500/25 mb-6 ring-1 ring-white/40">
          <span className="font-bold text-2xl tracking-tight">JH</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold text-[#1d1d1f] tracking-tight mb-2">
          Jokai Halfdim
        </h1>
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider mb-4">
          Genshin Impact Piloting & Account Service
        </p>
        <p className="text-[#6e6e73] text-sm leading-relaxed mb-8 max-w-md mx-auto">
          Automated Discord quoting engine, audited zero-leak credential vault, and streamlined single-operator order queue.
        </p>

        {/* Action Buttons with high radius pills */}
        <div className="space-y-3">
          <a
            href="/admin/orders"
            className="w-full py-3.5 px-6 rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-medium text-sm shadow-md shadow-indigo-600/20 transition-all duration-200 flex items-center justify-center gap-2"
          >
            <span>Open Admin Dashboard</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </a>

          <a
            href="/login"
            className="w-full py-3.5 px-6 rounded-2xl bg-black/[0.04] hover:bg-black/[0.08] active:scale-[0.98] text-[#1d1d1f] font-medium text-sm border border-black/[0.04] transition-all duration-200 flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 text-[#86868b]" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="4" ry="4" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span>Admin Authentication</span>
          </a>

          <div className="flex items-center justify-center gap-4 pt-2 text-xs text-[#86868b]">
            <a
              href="/admin/catalog"
              className="hover:text-[#1d1d1f] transition tracking-tight"
            >
              Services & Pricing &rarr;
            </a>
            <span>&bull;</span>
            <a
              href="/admin/guide"
              className="hover:text-[#1d1d1f] transition tracking-tight"
            >
              Piloting Guide & SOP &rarr;
            </a>
          </div>
        </div>

        {/* Status Pill Footer */}
        <div className="mt-8 pt-6 border-t border-black/[0.06] text-xs text-[#86868b] flex justify-between items-center">
          <span className="font-medium">Bot & API v0.3</span>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-emerald-700 font-medium text-[11px]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live
          </span>
        </div>
      </div>
    </main>
  );
}
