import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  TrendingUp, 
  Calendar, 
  DollarSign, 
  X, 
  AlertCircle, 
  Building2,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { schemesApi } from '../api';

export default function SchemesTab({ 
  schemes = [], 
  onRefresh, 
  onCreateScheme, 
  currentUser 
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchemeForNav, setSelectedSchemeForNav] = useState(null);
  const [navHistory, setNavHistory] = useState([]);
  const [loadingNav, setLoadingNav] = useState(false);

  // New Scheme Form
  const [newScheme, setNewScheme] = useState({
    name: '',
    code: '',
    description: '',
    tier: 0, // 0 = Tier2, 1 = Tier3
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // New NAV Form
  const [newNavPrice, setNewNavPrice] = useState('1.25');
  const [navSubmitting, setNavSubmitting] = useState(false);
  const [navError, setNavError] = useState('');

  const isAdmin = currentUser && (currentUser.role === 1 || currentUser.role === 'Admin');

  const handleOpenNavModal = async (scheme) => {
    setSelectedSchemeForNav(scheme);
    setLoadingNav(true);
    setNavError('');
    const res = await schemesApi.getNavHistory(scheme.id);
    if (res.ok) {
      setNavHistory(res.data || []);
    } else {
      setNavHistory([]);
    }
    setLoadingNav(false);
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const res = await onCreateScheme(newScheme);
      if (res.ok) {
        setShowCreateModal(false);
        setNewScheme({ name: '', code: '', description: '', tier: 0 });
        onRefresh();
      } else {
        setCreateError(res.error || 'Failed to create scheme. Make sure you are logged in as an Admin.');
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleAddNav = async (e) => {
    e.preventDefault();
    if (!selectedSchemeForNav) return;
    setNavError('');
    setNavSubmitting(true);
    try {
      const res = await schemesApi.createNav(selectedSchemeForNav.id, {
        unitPrice: parseFloat(newNavPrice),
        effectiveDate: new Date().toISOString(),
      });
      if (res.ok) {
        // Refresh NAV history
        const refreshed = await schemesApi.getNavHistory(selectedSchemeForNav.id);
        if (refreshed.ok) setNavHistory(refreshed.data || []);
        setNewNavPrice('');
      } else {
        setNavError(res.error || 'Failed to record NAV. (Admin privileges required)');
      }
    } finally {
      setNavSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-5 h-5 text-amber-500" />
            Pension Schemes & Unit Pricing (NAV)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage Tier 2 mandatory and Tier 3 voluntary provident funds and historical NAV rates
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          Create Scheme
        </button>
      </div>

      {/* Schemes Grid */}
      {schemes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Schemes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            Get started by adding your first pension or provident scheme to the platform.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-semibold rounded-xl"
          >
            Create Scheme Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => {
            const isTier2 = scheme.tier === 0 || scheme.tier === 'Tier2';
            return (
              <div
                key={scheme.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                      isTier2
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isTier2 ? 'Tier 2 (Occupational)' : 'Tier 3 (Voluntary)'}
                    </span>
                    <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {scheme.code}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1">{scheme.name}</h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {scheme.description || 'No description provided for this pension scheme.'}
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">Scheme #{scheme.id}</div>
                  <button
                    onClick={() => handleOpenNavModal(scheme)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 text-white hover:bg-slate-800 transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    NAV History
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NAV History & Update Modal */}
      {selectedSchemeForNav && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block mb-1">
                  Net Asset Value Tracking
                </span>
                <h3 className="text-xl font-bold text-slate-900">{selectedSchemeForNav.name}</h3>
                <p className="text-xs text-slate-500 font-mono mt-0.5">Code: {selectedSchemeForNav.code}</p>
              </div>
              <button
                onClick={() => setSelectedSchemeForNav(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record NAV Form (Admin) */}
            <div className="my-5 p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-amber-500" />
                Record Daily NAV Valuation
              </h4>

              {navError && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{navError}</span>
                </div>
              )}

              <form onSubmit={handleAddNav} className="flex gap-2">
                <div className="relative flex-1">
                  <span className="absolute left-3 top-2.5 text-slate-400 text-xs font-semibold">GH₵</span>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    required
                    placeholder="1.2500"
                    value={newNavPrice}
                    onChange={(e) => setNewNavPrice(e.target.value)}
                    className="w-full pl-11 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={navSubmitting}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-xs disabled:opacity-50"
                >
                  {navSubmitting ? 'Posting...' : 'Update NAV'}
                </button>
              </form>
              {!isAdmin && (
                <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
                  Note: Backend requires <strong>Admin</strong> role to update NAV.
                </p>
              )}
            </div>

            {/* NAV List */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Historical Valuations
              </h4>

              {loadingNav ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading NAV rates...</div>
              ) : navHistory.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No historical NAV recorded yet for this scheme.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto border border-slate-200 rounded-xl">
                  {navHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-600">
                          {new Date(item.effectiveDate).toLocaleString()}
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-900">
                        GH₵ {Number(item.unitPrice).toFixed(4)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-5 border-t border-slate-100 flex justify-end mt-4">
              <button
                onClick={() => setSelectedSchemeForNav(null)}
                className="px-4 py-2 text-sm font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Scheme Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers className="w-5 h-5 text-amber-500" />
                Create Pension Scheme
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateScheme} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Phoenix Tier 2 Master Trust"
                  value={newScheme.name}
                  onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Scheme Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PHX-T2-01"
                    value={newScheme.code}
                    onChange={(e) => setNewScheme({ ...newScheme, code: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Pension Tier
                  </label>
                  <select
                    value={newScheme.tier}
                    onChange={(e) => setNewScheme({ ...newScheme, tier: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                  >
                    <option value={0}>Tier 2 (Occupational)</option>
                    <option value={1}>Tier 3 (Voluntary)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Details regarding scheme eligibility, trustee info, and asset allocation..."
                  value={newScheme.description}
                  onChange={(e) => setNewScheme({ ...newScheme, description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>

              {!isAdmin && (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600" />
                  <span>Only authenticated <strong>Admin</strong> users can create schemes.</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-5 py-2 text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {createSubmitting ? 'Creating...' : 'Create Scheme'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
