/**
 * Admin Operational Guide & Standard Operating Procedures (SOP)
 *
 * Modern Apple-style guide with interactive category navigation,
 * workflow diagrams, security rules, and pricing calculation cheat sheets.
 */

'use client';

import React, { useState } from 'react';

interface GuideSection {
  id: string;
  title: string;
  icon: string;
  badge: string;
  summary: string;
  steps?: { step: string; title: string; desc: string; tip?: string }[];
  details?: { label: string; text: string; code?: string }[];
  rules?: string[];
}

const GUIDE_SECTIONS: GuideSection[] = [
  {
    id: 'workflow',
    title: 'Piloting Workflow & Lifecycle',
    icon: '⚡',
    badge: 'Core SOP',
    summary: 'The standard step-by-step process for handling an order from Discord placement to completion.',
    steps: [
      {
        step: '01',
        title: 'Order Placement & Queue Review',
        desc: 'Customer uses /price in Discord to quote and place an order. Order is created in PENDING status and posted to #admin channel with private thread JK-XXXX.',
        tip: 'Check if queue is full or if customer is a first-timer exceeding Rp200,000 before accepting.',
      },
      {
        step: '02',
        title: 'Accept & Issue One-Time Form',
        desc: 'Click Accept on the dashboard or in Discord. The bot sends a single-use HTTPS link (/s/[token]) valid for 24 hours. Order shifts to ACCEPTED.',
        tip: 'Never ask for credentials directly in Discord chat.',
      },
      {
        step: '03',
        title: 'Credentials Received & Start Work',
        desc: 'When the customer submits their Hoyoverse login via HTTPS, it is encrypted with AES-256-GCM. Status moves to QUEUED. When ready to pilot, click Start.',
        tip: 'Clicking Start locks in work and logs your access to the audited AccountAccessLog table.',
      },
      {
        step: '04',
        title: 'Before Screenshot & Real % Inspection',
        desc: 'Log in to Genshin Impact. Take a screenshot of the map/exploration screen. Check actual progress % against customer claim.',
        tip: 'If real % is lower than stated, update the Real % field. The system auto-calculates the difference.',
      },
      {
        step: '05',
        title: 'Execute Pilot & 2FA Pings',
        desc: 'Complete all checklist items. If HoYoverse prompts for a device verification code, click "Need 2FA Code" on the work page to ping the customer in Discord.',
        tip: 'Put order ON_HOLD with reason "Waiting for 2FA" if customer takes more than 10 minutes.',
      },
      {
        step: '06',
        title: 'After Screenshot & Completion (Done)',
        desc: 'Upload proof screenshots. Click "Done: Complete Work". Game credentials are PERMANENTLY PURGED from the database instantly.',
        tip: 'Invoice is posted to the Discord thread with payment methods and 24-hour due timer.',
      },
      {
        step: '07',
        title: 'Payment Verification & Order Close',
        desc: 'Customer pays via QRIS/BCA/Bank Transfer and submits proof with /pay. Check your banking app. Click "Confirm Payment" to mark order COMPLETED.',
        tip: 'Customer receives an automated reminder to change their password and rate the service.',
      },
    ],
  },
  {
    id: 'security',
    title: 'Zero-Leak Security Protocol',
    icon: '🔒',
    badge: 'Security Standard',
    summary: 'Strict cryptographic controls ensuring client account safety, auditability, and immediate credential destruction.',
    rules: [
      'Zero Discord Exposure: Passwords never touch Discord messages, embeds, or threads under any circumstance.',
      'Single-Use Token: Form links (/s/[token]) expire in 30 minutes after issuance or immediately upon first submission.',
      'AES-256-GCM Authenticated Encryption: Credentials stored with unique salts, 16-byte IVs, and authentication tags. Master key resides exclusively in .env.',
      'Audited Decryption: Passwords are only decrypted on-demand when you click "Show Password" on the work page. Every reveal writes an immutable AccountAccessLog row.',
      'Instant Cryptographic Purge: Tapping "Done" or "Cancel" overwrites and removes ciphertext, iv, tag, and salt. Decrypting returns HTTP 410 Gone.',
      'Auto-Purge Cron: Nightly scheduled job sweeps and deletes all credential remnants older than 30 days regardless of order state.',
    ],
    details: [
      {
        label: 'Encryption Standard',
        text: 'AES-256-GCM with scrypt key derivation (32-byte key length).',
      },
      {
        label: 'Access Logging',
        text: 'Every admin decryption records timestamp, order ID, admin username, and client IP in AccountAccessLog.',
      },
    ],
  },
  {
    id: 'pricing',
    title: 'Pricing Engine & Exploration Math',
    icon: '🗺️',
    badge: 'Calculation Rules',
    summary: 'Formulas and rules governing exploration percent calculations, quest chapters, and flat services.',
    rules: [
      'Exploration Formula: Rate per percent = Area Full Price / 100. Price = Math.round((Target % - Current %) × Rate).',
      'Exploration Minimum: Minimum charge of Rp5,000 per area, even for a single 1% increment (e.g. 99% to 100%).',
      'Archon Quests: Full chapter price equals the sum of its individual acts (no forced multi-act bundle discount).',
      'Unfinished Work Policy: If an area cannot be completed, unfinished percentages are deducted from the final invoice before Done.',
      'First-Time Customer Cap: First order is capped at Rp200,000 maximum to limit financial exposure until customer has paid once.',
      'Exploration Cap: Target percentage cannot exceed 100%. Current percentage cannot be negative.',
    ],
    details: [
      {
        label: 'Example: Windwail Highland (Full Rp30,000)',
        text: '90% to 100% is 10% × Rp300 = Rp3,000. Under minimum rule, system charges Rp5,000.',
        code: 'Math.max(5000, Math.round((100 - 90) * (30000 / 100))) = Rp5,000',
      },
      {
        label: 'Example: Avidya Forest (Full Rp48,000)',
        text: '0% to 100% = 100 × Rp480 = Rp48,000. 63% to 100% = 37 × Rp480 = Rp17,760.',
        code: 'Math.max(5000, Math.round(37 * 480)) = Rp17,800 (rounded)',
      },
    ],
  },
  {
    id: 'payments',
    title: 'Invoicing, Timers & Overdue Rules',
    icon: '💳',
    badge: 'Financial SOP',
    summary: 'Guidelines on payment timing, automated reminders, and the 72-hour suspension rule.',
    steps: [
      {
        step: 'T+0h',
        title: 'Invoice Sent on Completion',
        desc: 'When pilot marks order Done, invoice is posted in Discord thread with QRIS barcode and bank transfer details. paymentDueAt is set to now + 24 hours.',
      },
      {
        step: 'T+12h',
        title: 'First Payment Reminder',
        desc: 'Automated background cron job checks unpaid orders at 12 hours and sends a courteous reminder in the Discord thread.',
      },
      {
        step: 'T+24h',
        title: 'Final Due Notice',
        desc: 'At 24 hours, bot sends a notice that payment is now due today.',
      },
      {
        step: 'T+72h',
        title: 'OVERDUE & Auto-Suspension',
        desc: 'If unpaid after 72 hours, cron marks order as OVERDUE and automatically sets blocked = true on the User record. Customer cannot place any new orders.',
        tip: 'Once the customer pays and admin confirms, the block is automatically lifted.',
      },
    ],
    rules: [
      'Always verify payment in your real banking application (BCA / Mandiri / GoPay / OVO / Dana) before clicking Confirm.',
      'If payment proof is unreadable or forged, click "Reject Payment" with a clear reason in the work page.',
      'Walk-in orders placed through WhatsApp or Instagram can be recorded directly using the "+ New Manual Order" button.',
    ],
  },
  {
    id: 'troubleshooting',
    title: 'Exceptions, 2FA & Hold States',
    icon: '🛠️',
    badge: 'Incident Handling',
    summary: 'How to handle common piloting roadblocks, verification codes, customer disputes, and holds.',
    rules: [
      'HoYoverse New Device 2FA: Go to the order work page, click "Ping 2FA Code". The customer is mentioned in the thread and enters code in a pop-up.',
      'Customer Logged In During Work: Immediately pause work, put order ON_HOLD with reason "Customer logged in during session". Remind customer in thread.',
      'Customer Reports Problem Before Paying: If customer reports an issue, order reverts to ACCEPTED and customer receives a new one-time login form to fix the issue.',
      'Free Cancellation Window: Customer can cancel free of charge before Start. After Start, cancellation requires paying for work already completed.',
    ],
    details: [
      {
        label: 'Valid ON_HOLD Reasons',
        text: 'Awaiting 2FA Verification Code · Customer Logged In · Server Maintenance / Game Update · Waiting for Customer Approval on Price Adjustment.',
      },
    ],
  },
];

export default function AdminGuidePage() {
  const [selectedSection, setSelectedSection] = useState<string>('workflow');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const currentSection = GUIDE_SECTIONS.find((s) => s.id === selectedSection) || GUIDE_SECTIONS[0];

  const filteredSections = searchQuery.trim()
    ? GUIDE_SECTIONS.filter(
        (s) =>
          s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.rules?.some((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : GUIDE_SECTIONS;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card in Apple Style */}
      <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-black/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20 ring-1 ring-black/5 text-2xl shrink-0">
              📖
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold tracking-tight text-[#1d1d1f]">
                  Operational Guide & SOP
                </h1>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-semibold border border-indigo-100">
                  Standard Operating Procedures
                </span>
              </div>
              <p className="text-xs text-[#86868b] leading-relaxed max-w-2xl">
                Comprehensive reference for piloting execution, zero-leak credential vault rules, pricing calculation math, and overdue payment handling.
              </p>
            </div>
          </div>

          {/* Quick Search Input */}
          <div className="relative min-w-[240px]">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guide & rules..."
              className="w-full px-4 py-2.5 bg-black/[0.03] border border-black/[0.08] rounded-2xl text-xs text-[#1d1d1f] placeholder:text-[#a1a1a6] focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all pl-9"
            />
            <svg
              className="w-4 h-4 text-[#86868b] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Section Pill Selectors (Apple Segmented Style) */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 mt-6 border-t border-black/[0.04] scrollbar-none">
          {filteredSections.map((sec) => (
            <button
              key={sec.id}
              onClick={() => setSelectedSection(sec.id)}
              className={`py-2 px-4 rounded-full text-xs font-medium tracking-tight whitespace-nowrap transition-all duration-200 flex items-center gap-2 ${
                selectedSection === sec.id
                  ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30 ring-1 ring-indigo-600'
                  : 'bg-black/[0.03] text-[#6e6e73] hover:text-[#1d1d1f] hover:bg-black/[0.06]'
              }`}
            >
              <span>{sec.icon}</span>
              <span>{sec.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Detailed SOP / Flow */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-black/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6 sm:p-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{currentSection.icon}</span>
                <h2 className="text-lg font-bold text-[#1d1d1f] tracking-tight">
                  {currentSection.title}
                </h2>
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                {currentSection.badge}
              </span>
            </div>
            <p className="text-xs text-[#6e6e73] leading-relaxed mb-6">
              {currentSection.summary}
            </p>

            {/* Step-by-Step Flow */}
            {currentSection.steps && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                  Sequence of Execution
                </h3>
                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-indigo-100">
                  {currentSection.steps.map((st, idx) => (
                    <div key={idx} className="relative group">
                      <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border-2 border-indigo-600 flex items-center justify-center text-[10px] font-bold text-indigo-600 shadow-sm">
                        {idx + 1}
                      </div>
                      <div className="bg-black/[0.02] hover:bg-black/[0.04] p-4 rounded-2xl border border-black/[0.04] transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="text-sm font-semibold text-[#1d1d1f] tracking-tight">
                            {st.title}
                          </h4>
                          <span className="text-[10px] font-mono text-[#86868b]">{st.step}</span>
                        </div>
                        <p className="text-xs text-[#6e6e73] leading-relaxed">{st.desc}</p>
                        {st.tip && (
                          <div className="mt-2.5 pt-2 border-t border-black/[0.04] flex items-center gap-1.5 text-[11px] text-amber-700 font-medium">
                            <span className="text-amber-500">💡</span>
                            <span>{st.tip}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Rules Checklist */}
            {currentSection.rules && (
              <div className="space-y-3 mt-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#86868b] mb-3">
                  Mandatory Operational Rules
                </h3>
                <div className="space-y-2.5">
                  {currentSection.rules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3.5 rounded-2xl bg-black/[0.02] border border-black/[0.04]"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="text-xs text-[#1d1d1f] leading-relaxed font-medium">
                        {rule}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Reference Cards & Calculation Examples */}
        <div className="space-y-6">
          {/* Quick Cheat Sheet Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-black/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6">
            <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight mb-4 flex items-center gap-2">
              <span>📋</span>
              <span>Quick Technical Reference</span>
            </h3>

            <div className="space-y-3">
              {currentSection.details?.map((det, idx) => (
                <div key={idx} className="p-3.5 rounded-2xl bg-black/[0.02] border border-black/[0.04]">
                  <span className="block text-[11px] font-bold text-[#86868b] uppercase tracking-wider mb-1">
                    {det.label}
                  </span>
                  <p className="text-xs text-[#1d1d1f] leading-relaxed">{det.text}</p>
                  {det.code && (
                    <pre className="mt-2 p-2 rounded-xl bg-black/[0.04] text-[10px] font-mono text-indigo-700 overflow-x-auto">
                      {det.code}
                    </pre>
                  )}
                </div>
              ))}

              <div className="p-3.5 rounded-2xl bg-indigo-50/50 border border-indigo-100/60">
                <span className="block text-[11px] font-bold text-indigo-700 uppercase tracking-wider mb-1">
                  Database & System Specs
                </span>
                <ul className="text-xs text-[#6e6e73] space-y-1 list-disc list-inside">
                  <li>PostgreSQL 18 on port 5433</li>
                  <li>Discord Bot v14 Slash Commands</li>
                  <li>Next.js 15 App Router + Tailwind</li>
                  <li>Automated Outbox Event Poller (2s)</li>
                  <li>Overdue Cron Scanner (every 15m)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Discord Bot Commands Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-[28px] border border-black/[0.06] shadow-[0_10px_30px_rgba(0,0,0,0.03)] p-6">
            <h3 className="text-sm font-bold text-[#1d1d1f] tracking-tight mb-4 flex items-center gap-2">
              <span>🤖</span>
              <span>Discord Slash Commands</span>
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                <code className="text-indigo-600 font-semibold font-mono">/price</code>
                <span className="text-[#86868b] text-[11px]">Interactive cart builder</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                <code className="text-indigo-600 font-semibold font-mono">/price-list</code>
                <span className="text-[#86868b] text-[11px]">View full sheet catalog</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                <code className="text-indigo-600 font-semibold font-mono">/guide</code>
                <span className="text-[#86868b] text-[11px]">Customer FAQ menu</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                <code className="text-indigo-600 font-semibold font-mono">/order</code>
                <span className="text-[#86868b] text-[11px]">Check order progress</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/[0.02] border border-black/[0.04] flex items-center justify-between">
                <code className="text-indigo-600 font-semibold font-mono">/pay</code>
                <span className="text-[#86868b] text-[11px]">Submit payment proof</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
