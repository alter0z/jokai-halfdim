export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 flex flex-col justify-center items-center p-6 text-gray-900">
      <div className="max-w-xl w-full bg-white rounded-xl shadow-lg border border-gray-200 p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 text-indigo-600 mb-4 font-bold text-2xl">
          JH
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">
          Jokai Halfdim
        </h1>
        <p className="text-sm font-medium text-indigo-600 uppercase tracking-wider mb-4">
          Genshin Impact Piloting & Account Management
        </p>
        <p className="text-gray-600 text-sm leading-relaxed mb-8">
          Automated Discord bot quoting, audited zero-leak credential vault, and solo-admin order management.
        </p>

        <div className="space-y-3">
          <a
            href="/admin/orders"
            className="block w-full py-3 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm transition shadow-sm"
          >
            Go to Admin Dashboard &rarr;
          </a>
          <a
            href="/admin/catalog"
            className="block w-full py-3 px-4 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium text-sm transition"
          >
            View Services & Pricing Catalog
          </a>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-100 text-xs text-gray-400 flex justify-between items-center">
          <span>Discord Bot v0.3</span>
          <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            System Operational
          </span>
        </div>
      </div>
    </main>
  );
}

