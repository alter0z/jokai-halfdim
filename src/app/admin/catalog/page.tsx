/**
 * Admin Catalog Management Page (/admin/catalog)
 *
 * CRUD interface for exploration areas, archon quests, material items, and pricing rules.
 */

'use client';

import React, { useState, useEffect } from 'react';

export default function AdminCatalogPage() {
  const [items, setItems] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedService, setSelectedService] = useState('exploration');
  const [selectedRegion, setSelectedRegion] = useState('');
  const [search, setSearch] = useState('');

  // New Item Modal
  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState(50000);
  const [newMinCharge, setNewMinCharge] = useState(5000);
  const [newPricingType, setNewPricingType] = useState('PERCENT');

  const fetchCatalog = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams();
      if (selectedService) query.append('serviceKey', selectedService);
      if (selectedRegion) query.append('regionKey', selectedRegion);
      if (search) query.append('search', search);

      const res = await fetch(`/api/admin/catalog?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to load catalog');
      const data = await res.json();
      setItems(data.items || []);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchMeta = async () => {
    try {
      const [srvRes, regRes] = await Promise.all([
        fetch('/api/admin/catalog?type=services'),
        fetch('/api/admin/catalog?type=regions'),
      ]);
      const srvData = await srvRes.json();
      const regData = await regRes.json();
      setServices(srvData.services || []);
      setRegions(regData.regions || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchMeta();
  }, []);

  useEffect(() => {
    fetchCatalog();
  }, [selectedService, selectedRegion]);

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/catalog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'item',
          serviceKey: selectedService,
          regionKey: selectedRegion || undefined,
          name: newName,
          price: newPrice,
          minCharge: newMinCharge,
          pricingType: newPricingType,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create item');

      setShowNewModal(false);
      setNewName('');
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/admin/catalog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive }),
      });
      if (!res.ok) throw new Error('Failed to update status');
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleArchive = async (id: string, name: string) => {
    if (!confirm(`Archive catalog item "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/catalog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ARCHIVE' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to archive');
      }
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete catalog item "${name}" permanently? (Fails if used in past orders)`)) return;
    try {
      const res = await fetch(`/api/admin/catalog/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'DELETE' }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to delete');
      }
      fetchCatalog();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Catalog & Pricing Management</h1>
          <p className="text-sm text-gray-500">Manage exploration areas, quests, materials, and pricing tiers</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-bold hover:bg-indigo-700 shadow-sm"
        >
          + Add Catalog Item
        </button>
      </div>

      {/* Service & Region Filter Tabs */}
      <div className="flex flex-wrap gap-2 items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {services.map(s => (
            <button
              key={s.key}
              onClick={() => {
                setSelectedService(s.key);
                if (s.key !== 'exploration') setSelectedRegion('');
              }}
              className={`px-3 py-1.5 rounded text-xs font-semibold transition ${
                selectedService === s.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {s.name}
            </button>
          ))}
        </div>

        {selectedService === 'exploration' && (
          <select
            value={selectedRegion}
            onChange={e => setSelectedRegion(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded text-xs font-semibold bg-white"
          >
            <option value="">All Regions</option>
            {regions.map(r => (
              <option key={r.key} value={r.key}>
                {r.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Catalog Items Table */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500 text-sm">Loading catalog items...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No catalog items found for this filter.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200 text-sm">
            <thead className="bg-gray-50 text-gray-600 font-semibold text-xs uppercase tracking-wider">
              <tr>
                <th className="px-6 py-3 text-left">Name</th>
                <th className="px-6 py-3 text-left">Service / Region</th>
                <th className="px-6 py-3 text-left">Pricing Type</th>
                <th className="px-6 py-3 text-left">Price (Rp)</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 font-medium text-gray-900">{item.name}</td>
                  <td className="px-6 py-4 text-xs text-gray-600">
                    <span className="uppercase font-semibold">{item.serviceKey}</span>
                    {item.regionKey && <span className="text-gray-400"> · {item.regionKey}</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-gray-600 font-mono">
                    {item.pricingType}
                    {item.minCharge && <span className="block text-gray-400">Min: Rp{item.minCharge.toLocaleString('id-ID')}</span>}
                  </td>
                  <td className="px-6 py-4 font-mono font-bold text-gray-900">
                    Rp{item.price.toLocaleString('id-ID')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleActive(item.id, item.active)}
                      className={`px-2 py-0.5 text-xs font-bold rounded-full ${
                        item.active
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      {item.active ? 'ACTIVE' : 'INACTIVE'}
                    </button>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <button
                      onClick={() => handleArchive(item.id, item.name)}
                      className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded hover:bg-amber-100"
                    >
                      Archive
                    </button>
                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded hover:bg-red-100"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* New Item Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-900">Add New Catalog Item</h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fontaine - Beryl Region 100%"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm font-semibold"
                />
              </div>

              {selectedService === 'exploration' && (
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Region Key *</label>
                  <select
                    value={selectedRegion}
                    onChange={e => setSelectedRegion(e.target.value)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm bg-white"
                  >
                    <option value="">Select Region</option>
                    {regions.map(r => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Price (Rp) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    step="1000"
                    value={newPrice}
                    onChange={e => setNewPrice(parseInt(e.target.value, 10) || 0)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase">Min Charge (Rp)</label>
                  <input
                    type="number"
                    min="0"
                    step="1000"
                    value={newMinCharge}
                    onChange={e => setNewMinCharge(parseInt(e.target.value, 10) || 0)}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded text-sm font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold hover:bg-indigo-700 shadow-sm"
                >
                  Create Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
