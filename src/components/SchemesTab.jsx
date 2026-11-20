import React, { useState } from 'react';
import { 
  Layers, 
  Plus, 
  TrendingUp, 
  Calendar, 
  X, 
  AlertCircle, 
  Building2, 
  Clock, 
  CheckCircle2,
  Coins,
  Filter,
  Trash2
} from 'lucide-react';
import { schemesApi } from '../api';

export default function SchemesTab({ 
  schemes = [], 
  clients = [],
  onRefresh, 
  onCreateScheme, 
  onAddNav,
  onDeleteScheme,
  currentUser 
}) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchemeForNav, setSelectedSchemeForNav] = useState(null);
  const [navHistory, setNavHistory] = useState([]);
  const [loadingNav, setLoadingNav] = useState(false);
  const [filterType, setFilterType] = useState('ALL'); // 'ALL' | 'OPEN' | 'STANDALONE'
  const [deletingSchemeId, setDeletingSchemeId] = useState(null);

  // New Scheme Form
  const [newScheme, setNewScheme] = useState({
    name: '',
    code: '',
    description: '',
    tier: 0, // 0 = Tier2, 1 = Tier3
    clientPetraID: '', // null or empty string = open master trust
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // New NAV Form
  const [newNavPrice, setNewNavPrice] = useState('1.25');
  const [navSubmitting, setNavSubmitting] = useState(false);
  const [navError, setNavError] = useState('');

  const isAdmin = currentUser && (currentUser.role === 1 || currentUser.role === 'Admin');

  const clientMap = new Map();
  clients.forEach((c) => {
    const id = c.petraID || c.petraId;
    if (id) clientMap.set(id, c.name);
  });

  const filteredSchemes = schemes.filter((s) => {
    if (filterType === 'OPEN') return !s.clientPetraID;
    if (filterType === 'STANDALONE') return !!s.clientPetraID;
    return true;
  });

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
      const payload = {
        ...newScheme,
        clientPetraID: newScheme.clientPetraID ? newScheme.clientPetraID : null,
      };
      const res = await onCreateScheme(payload);
      if (res.ok) {
        setShowCreateModal(false);
        setNewScheme({ name: '', code: '', description: '', tier: 0, clientPetraID: '' });
        onRefresh();
      } else {
        setCreateError(res.error || 'Failed to create scheme. Administrator permissions required.');
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
      const navData = {
        unitPrice: parseFloat(newNavPrice),
        effectiveDate: new Date().toISOString(),
      };
      const res = onAddNav
        ? await onAddNav(selectedSchemeForNav.id, selectedSchemeForNav.name, navData)
        : await schemesApi.createNav(selectedSchemeForNav.id, navData);

      if (res.ok) {
        const refreshed = await schemesApi.getNavHistory(selectedSchemeForNav.id);
        if (refreshed.ok) setNavHistory(refreshed.data || []);
        setNewNavPrice('');
      } else {
        setNavError(res.error || 'Failed to record NAV valuation.');
      }
    } finally {
      setNavSubmitting(false);
    }
  };

  const handleDelete = async (scheme) => {
    if (!window.confirm(`Are you sure you want to delete scheme "${scheme.name}" (${scheme.code})? Note: Schemes with active enrolled contributors cannot be deleted.`)) {
      return;
    }
    setDeletingSchemeId(scheme.id);
    try {
      if (onDeleteScheme) {
        const res = await onDeleteScheme(scheme.id, scheme.name);
        if (res.ok) {
          onRefresh();
        }
      }
    } finally {
      setDeletingSchemeId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Product Catalog</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f1d33] flex items-center gap-2 tracking-tight">
            <Layers className="w-6 h-6 text-[#c59b27]" />
            Pension Schemes & Unit Pricing
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered Tier 2 mandatory occupational schemes and Tier 3 voluntary provident funds (Open Master Trusts & Standalone)
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white font-bold text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
            Create Scheme
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-semibold">
        <button
          onClick={() => setFilterType('ALL')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterType === 'ALL'
              ? 'bg-[#0f1d33] text-white font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          All Schemes ({schemes.length})
        </button>
        <button
          onClick={() => setFilterType('OPEN')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterType === 'OPEN'
              ? 'bg-[#0f1d33] text-white font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Master Trust Schemes ({schemes.filter(s => !s.clientPetraID).length})
        </button>
        <button
          onClick={() => setFilterType('STANDALONE')}
          className={`px-3 py-1.5 rounded-lg transition-all ${
            filterType === 'STANDALONE'
              ? 'bg-[#0f1d33] text-white font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          Standalone Corporate Schemes ({schemes.filter(s => !!s.clientPetraID).length})
        </button>
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs">
          <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <h3 className="text-sm font-bold text-slate-800">No Schemes Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            No pension schemes match the selected category.
          </p>
          {isAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold rounded-lg shadow-xs hover:shadow-sm transition-all"
            >
              Create Scheme
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchemes.map((scheme) => {
            const isTier2 = scheme.tier === 0 || scheme.tier === 'Tier2';
            const isStandalone = !!scheme.clientPetraID;
            const sponsorName = isStandalone ? clientMap.get(scheme.clientPetraID) : null;

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-xl border border-slate-200/90 hover:border-[#c59b27]/60 p-5 flex flex-col justify-between hover:shadow-md hover:-translate-y-1 transition-all duration-200 group relative"
              >
                <div>
                  {/* Card Title & Icon Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-[#fbf7ec] border border-[#ecdab1] flex items-center justify-center text-[#c59b27] group-hover:scale-105 transition-transform">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="flex items-center gap-1.5 flex-wrap justify-end">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isTier2 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}>
                        {isTier2 ? 'Tier 2 (Occupational)' : 'Tier 3 (Voluntary)'}
                      </span>
                      <span className="font-mono text-[11px] font-semibold text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {scheme.code}
                      </span>
                    </div>
                  </div>

                  {/* Standalone vs Master Trust Badge */}
                  <div className="mb-2">
                    {isStandalone ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                        <Building2 className="w-3 h-3 text-purple-600" />
                        Standalone: {sponsorName || scheme.clientPetraID}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                        Open Master Trust Scheme
                      </span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[#0f1d33] mb-1.5">
                    {scheme.name}
                  </h3>
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                    {scheme.description || 'Institutional retirement and provident fund product.'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-mono text-[11px]">Scheme #{scheme.id}</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenNavModal(scheme)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-bold bg-slate-100 hover:bg-[#0f1d33] text-slate-800 hover:text-white transition-all duration-150 active:scale-95 shadow-2xs"
                    >
                      <TrendingUp className="w-3.5 h-3.5 text-[#c59b27]" />
                      NAV History
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(scheme)}
                        disabled={deletingSchemeId === scheme.id}
                        title="Delete Scheme"
                        className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* NAV History & Valuation Modal */}
      {selectedSchemeForNav && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-lg w-full border border-slate-200 max-h-[90vh] overflow-y-auto shadow-xl animate-fadeIn">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c59b27] block mb-0.5">
                  Net Asset Value Tracking
                </span>
                <h3 className="text-base font-bold text-[#0f1d33]">{selectedSchemeForNav.name}</h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">Code: {selectedSchemeForNav.code}</p>
              </div>
              <button
                onClick={() => setSelectedSchemeForNav(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Record NAV Form */}
            {isAdmin && (
              <div className="my-4 p-3.5 rounded-lg bg-slate-50 border border-slate-200">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5 text-[#c59b27]" />
                  Record Daily Valuation Rate
                </h4>

                {navError && (
                  <div className="mb-2.5 p-2 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{navError}</span>
                  </div>
                )}

                <form onSubmit={handleAddNav} className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-2 text-slate-400 text-xs font-semibold">GH₵</span>
                    <input
                      type="number"
                      step="0.0001"
                      min="0.0001"
                      required
                      placeholder="1.2500"
                      value={newNavPrice}
                      onChange={(e) => setNewNavPrice(e.target.value)}
                      className="w-full pl-11 pr-3 py-1.5 bg-white border border-slate-300 rounded text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={navSubmitting}
                    className="px-3.5 py-1.5 bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold rounded shadow-xs active:scale-95 transition-all disabled:opacity-50"
                  >
                    {navSubmitting ? 'Posting...' : 'Update NAV'}
                  </button>
                </form>
              </div>
            )}

            {/* NAV List */}
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Historical Rates
              </h4>

              {loadingNav ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading historical valuations...</div>
              ) : navHistory.length === 0 ? (
                <div className="p-4 rounded border border-dashed border-slate-200 text-center text-xs text-slate-400">
                  No historical NAV rates published yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-52 overflow-y-auto border border-slate-200 rounded-lg">
                  {navHistory.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-2.5 text-xs hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-slate-600 font-medium">
                          {new Date(item.effectiveDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}
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

            <div className="pt-3 border-t border-slate-100 flex justify-end mt-4">
              <button
                onClick={() => setSelectedSchemeForNav(null)}
                className="px-3.5 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded transition-colors"
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
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0f1d33] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c59b27]" />
                Create Pension Scheme
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleCreateScheme} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scheme Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Petra Master Trust Scheme"
                  value={newScheme.name}
                  onChange={(e) => setNewScheme({ ...newScheme, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Scheme Code *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PTR-T2-01"
                    value={newScheme.code}
                    onChange={(e) => setNewScheme({ ...newScheme, code: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Pension Tier
                  </label>
                  <select
                    value={newScheme.tier}
                    onChange={(e) => setNewScheme({ ...newScheme, tier: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  >
                    <option value={0}>Tier 2 (Occupational)</option>
                    <option value={1}>Tier 3 (Voluntary)</option>
                  </select>
                </div>
              </div>

              {/* Standalone Corporate Client Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Classification / Sponsorship
                </label>
                <select
                  value={newScheme.clientPetraID || ''}
                  onChange={(e) => setNewScheme({ ...newScheme, clientPetraID: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                >
                  <option value="">Open Master Trust (Available to any employer's workers)</option>
                  {clients.map((c) => {
                    const id = c.petraID || c.petraId;
                    return (
                      <option key={id} value={id}>
                        Standalone Scheme for {c.name} ({id})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Standalone schemes are restricted strictly to active employees of that designated employer.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Scheme Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Eligibility criteria, asset mandate, and trustee terms..."
                  value={newScheme.description}
                  onChange={(e) => setNewScheme({ ...newScheme, description: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-1.5 bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold rounded shadow-xs active:scale-95 transition-all disabled:opacity-50"
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
