import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  Building2, 
  CreditCard, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle, 
  MapPin, 
  Filter,
  CheckCircle2,
  ShieldCheck,
  UserPlus,
  ArrowRight,
  ExternalLink,
  Layers
} from 'lucide-react';
import { customersApi, schemesApi } from '../api';

export default function CustomersTab({ 
  customers = [], 
  clients = [], 
  schemes = [], 
  onRefresh, 
  onCreateCustomer, 
  onUpdateCustomer, 
  onDeleteCustomer,
  onSelectCustomer,
  initialClientFilter = '',
  onClearInitialClientFilter,
  currentUser,
  showToast 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientFilter, setSelectedClientFilter] = useState(initialClientFilter || 'ALL');
  
  // Register Customer Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    clientPetraID: clients.length > 0 ? (clients[0].petraID || clients[0].petraId) : '',
  });
  const [alsoEnrollScheme, setAlsoEnrollScheme] = useState(false);
  const [initialSchemeId, setInitialSchemeId] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Standalone Enroll Modal for an existing customer
  const [enrollingCustomer, setEnrollingCustomer] = useState(null);
  const [quickSchemeId, setQuickSchemeId] = useState('');
  const [quickEnrollSubmitting, setQuickEnrollSubmitting] = useState(false);
  const [quickEnrollError, setQuickEnrollError] = useState('');

  const isAdmin = currentUser && (currentUser.role === 1 || currentUser.role === 'Admin');

  useEffect(() => {
    if (initialClientFilter) {
      setSelectedClientFilter(initialClientFilter);
      setNewCustomer((prev) => ({
        ...prev,
        clientPetraID: initialClientFilter,
      }));
    }
  }, [initialClientFilter]);

  const clientMap = new Map();
  clients.forEach((c) => {
    const id = c.petraID || c.petraId;
    if (id) clientMap.set(id, c.name);
  });

  // Schemes eligible for the currently selected employer in the create modal
  const eligibleSchemesForNewCustomer = schemes.filter((s) => {
    if (!s.clientPetraID) return true; // Open to all
    return s.clientPetraID === newCustomer.clientPetraID;
  });

  const filteredCustomers = customers.filter((cust) => {
    const term = searchTerm.toLowerCase();
    const name = (cust.name || '').toLowerCase();
    const id = (cust.petraID || cust.petraId || '').toLowerCase();
    const pNumber = (cust.pensionNumber || '').toLowerCase();
    const email = (cust.email || '').toLowerCase();
    const phone = (cust.phone || '').toLowerCase();

    // Check employer names or IDs
    const activeEmps = cust.employments ? cust.employments.filter(e => e.isActive) : [];
    const empMatches = activeEmps.some(e => {
      const cName = (clientMap.get(e.clientPetraID) || '').toLowerCase();
      return e.clientPetraID.toLowerCase().includes(term) || cName.includes(term);
    });

    const matchesSearch = name.includes(term) || id.includes(term) || pNumber.includes(term) || email.includes(term) || phone.includes(term) || empMatches;

    if (selectedClientFilter !== 'ALL') {
      const hasClient = activeEmps.some(e => e.clientPetraID.toUpperCase() === selectedClientFilter.toUpperCase()) ||
        ((cust.clientPetraID || '').toUpperCase() === selectedClientFilter.toUpperCase());
      return matchesSearch && hasClient;
    }

    return matchesSearch;
  });

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const res = await onCreateCustomer(newCustomer);
      if (res.ok && res.data) {
        const createdPetraId = res.data.petraID || res.data.petraId;

        // If user also wanted to enroll in a scheme immediately:
        if (alsoEnrollScheme && initialSchemeId && createdPetraId) {
          const enrollRes = await customersApi.enroll(createdPetraId, { schemeId: Number(initialSchemeId) });
          if (enrollRes.ok && enrollRes.data?.warnings && enrollRes.data.warnings.length > 0) {
            showToast?.(`Warning: ${enrollRes.data.warnings.join(' ')}`, 'error');
          }
        }

        setShowCreateModal(false);
        setNewCustomer({
          name: '',
          phone: '',
          email: '',
          address: '',
          clientPetraID: clients.length > 0 ? (clients[0].petraID || clients[0].petraId) : '',
        });
        setAlsoEnrollScheme(false);
        setInitialSchemeId('');
        if (onClearInitialClientFilter) onClearInitialClientFilter();
        onRefresh();
      } else {
        setCreateError(res.error || 'Failed to register contributor.');
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleQuickEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollingCustomer || !quickSchemeId) return;
    setQuickEnrollError('');
    setQuickEnrollSubmitting(true);
    try {
      const res = await customersApi.enroll(enrollingCustomer.petraID, { schemeId: Number(quickSchemeId) });
      if (res.ok) {
        showToast?.(`Contributor enrolled in scheme successfully.`, 'success');
        if (res.data?.warnings && res.data.warnings.length > 0) {
          showToast?.(`Warning: ${res.data.warnings.join(' ')}`, 'error');
        }
        setEnrollingCustomer(null);
        setQuickSchemeId('');
        onRefresh();
      } else {
        setQuickEnrollError(res.error || 'Failed to enroll contributor in scheme.');
      }
    } finally {
      setQuickEnrollSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Contributor Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f1d33] flex items-center gap-2 tracking-tight">
            <Users className="w-6 h-6 text-[#c59b27]" />
            Customers & Individual Contributors
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual employee members enrolled across corporate sponsor trust funds
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              if (clients.length > 0) {
                setNewCustomer((prev) => ({
                  ...prev,
                  clientPetraID: prev.clientPetraID || (clients[0].petraID || clients[0].petraId),
                }));
              }
              setShowCreateModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white font-bold text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
            Register Contributor
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, Petra ID (HI...), Pension # (PN...), phone, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33] transition-all"
          />
        </div>

        {/* Employer Filter */}
        <div className="relative sm:w-72">
          <Filter className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <select
            value={selectedClientFilter}
            onChange={(e) => setSelectedClientFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33] transition-all"
          >
            <option value="ALL">All Employer Organizations ({clients.length})</option>
            {clients.map((c) => {
              const id = c.petraID || c.petraId;
              return (
                <option key={id} value={id}>
                  {c.name} ({id})
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Contributor Roster Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-slate-300 transition-all duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Petra ID</th>
                <th className="py-3.5 px-6">Pension Number</th>
                <th className="py-3.5 px-6">Contributor Name</th>
                <th className="py-3.5 px-6">Active Employer(s)</th>
                <th className="py-3.5 px-6">Contact Info</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-xs text-slate-400">
                    No contributors found matching current filter.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => {
                  const activeEmps = (cust.employments || []).filter((e) => e.isActive);
                  const firstEmpName = activeEmps.length > 0 ? (clientMap.get(activeEmps[0].clientPetraID) || activeEmps[0].clientPetraID) : (clientMap.get(cust.clientPetraID) || 'Unassigned');

                  return (
                    <tr 
                      key={cust.petraID || cust.pensionNumber}
                      onClick={() => onSelectCustomer(cust.petraID)}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    >
                      <td className="py-3.5 px-6 font-mono font-bold text-[#0f1d33]">
                        {cust.petraID}
                      </td>
                      <td className="py-3.5 px-6">
                        <span className="font-mono font-bold text-slate-800 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-[#c59b27]" />
                          {cust.pensionNumber || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900">
                        {cust.name}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-slate-700">
                            {firstEmpName}
                          </span>
                          {activeEmps.length > 1 && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              +{activeEmps.length - 1} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
                        <div>{cust.email}</div>
                        <div className="text-[11px] text-slate-400">{cust.phone}</div>
                      </td>
                      <td className="py-3.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-2">
                          {isAdmin && (
                            <button
                              onClick={() => {
                                setEnrollingCustomer(cust);
                                const available = schemes.filter(s => {
                                  if (!s.clientPetraID) return true;
                                  return activeEmps.some(e => e.clientPetraID === s.clientPetraID);
                                });
                                if (available.length > 0) setQuickSchemeId(available[0].id.toString());
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-[11px] font-bold text-slate-700 shadow-2xs"
                              title="Enroll in Scheme"
                            >
                              <Layers className="w-3 h-3 text-[#c59b27]" />
                              Enroll
                            </button>
                          )}
                          <button
                            onClick={() => onSelectCustomer(cust.petraID)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0f1d33] hover:bg-[#182b49] text-white text-[11px] font-bold transition-all shadow-2xs"
                          >
                            View
                            <ArrowRight className="w-3 h-3 text-[#c59b27]" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Customer Modal (with optional immediate scheme enrollment) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#c59b27]" />
                Register New Contributor
              </h3>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Contributor Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Kwame Mensah"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Primary Employer / Sponsoring Client *</label>
                <select
                  required
                  value={newCustomer.clientPetraID}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setNewCustomer({ ...newCustomer, clientPetraID: cid });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                >
                  {clients.map((c) => {
                    const id = c.petraID || c.petraId;
                    return (
                      <option key={id} value={id}>
                        {c.name} ({id})
                      </option>
                    );
                  })}
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  Establishes the contributor's first active employment record. Additional employers can be attached later.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+233 24 000 0000"
                    value={newCustomer.phone}
                    onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="kwame.mensah@acme.com"
                    value={newCustomer.email}
                    onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address / City</label>
                <input
                  type="text"
                  placeholder="e.g. 14 Independence Ave, Ridge, Accra"
                  value={newCustomer.address}
                  onChange={(e) => setNewCustomer({ ...newCustomer, address: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              {/* Optional Immediate Scheme Enrollment Checkbox */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={alsoEnrollScheme}
                    onChange={(e) => {
                      setAlsoEnrollScheme(e.target.checked);
                      if (e.target.checked && eligibleSchemesForNewCustomer.length > 0 && !initialSchemeId) {
                        setInitialSchemeId(eligibleSchemesForNewCustomer[0].id.toString());
                      }
                    }}
                    className="rounded border-slate-300 text-[#0f1d33] focus:ring-[#0f1d33] w-4 h-4"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    Also enroll contributor in a pension scheme immediately
                  </span>
                </label>

                {alsoEnrollScheme && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Choose Pension Scheme</label>
                    {eligibleSchemesForNewCustomer.length === 0 ? (
                      <p className="text-xs text-amber-700">No schemes currently available.</p>
                    ) : (
                      <select
                        value={initialSchemeId}
                        onChange={(e) => setInitialSchemeId(e.target.value)}
                        required={alsoEnrollScheme}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                      >
                        {eligibleSchemesForNewCustomer.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code}) — {s.tier === 0 ? 'Tier 2 (Occupational)' : 'Tier 3 (Voluntary)'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold disabled:opacity-50"
                >
                  {createSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Scheme Enrollment Modal for existing customer */}
      {enrollingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c59b27]" />
                Enroll Contributor in Scheme
              </h3>
              <button 
                onClick={() => setEnrollingCustomer(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleQuickEnrollSubmit} className="p-6 space-y-4">
              {quickEnrollError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {quickEnrollError}
                </div>
              )}

              <p className="text-xs text-slate-600">
                Enrolling <strong>{enrollingCustomer.name}</strong> (Pension #{enrollingCustomer.pensionNumber}).
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Pension Scheme *</label>
                <select
                  value={quickSchemeId}
                  onChange={(e) => setQuickSchemeId(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                >
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — {s.tier === 0 ? 'Tier 2' : 'Tier 3'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEnrollingCustomer(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={quickEnrollSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold disabled:opacity-50"
                >
                  {quickEnrollSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
