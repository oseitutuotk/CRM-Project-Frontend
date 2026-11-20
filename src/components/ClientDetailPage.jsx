import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ArrowLeft, 
  Mail, 
  Phone, 
  UserCheck, 
  Users, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  ExternalLink,
  ShieldCheck,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { clientsApi } from '../api';

export default function ClientDetailPage({ 
  clientId, 
  onBack, 
  onNavigateToCustomer, 
  onNavigateToSchemes,
  onOpenCreateCustomerModal,
  onOpenCreateSchemeModal,
  onUpdateClient,
  onDeleteClient,
  onDeleteScheme,
  currentUser 
}) {
  const [client, setClient] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [standaloneSchemes, setStandaloneSchemes] = useState([]);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', companyContact: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  const isAdmin = currentUser && (currentUser.role === 1 || currentUser.role === 'Admin');

  const loadClientData = async () => {
    setLoading(true);
    setError('');
    try {
      const [clientRes, empRes, schemesRes] = await Promise.all([
        clientsApi.getById(clientId),
        clientsApi.getCustomers(clientId, includeInactive),
        clientsApi.getSchemes(clientId)
      ]);

      if (clientRes.ok && clientRes.data) {
        setClient(clientRes.data);
        setEditForm({
          name: clientRes.data.name || '',
          phone: clientRes.data.phone || '',
          email: clientRes.data.email || '',
          companyContact: clientRes.data.companyContact || '',
        });
      } else {
        setError(clientRes.error || 'Failed to load corporate client record.');
      }

      if (empRes.ok && Array.isArray(empRes.data)) {
        setEmployees(empRes.data);
      } else {
        setEmployees([]);
      }

      if (schemesRes.ok && Array.isArray(schemesRes.data)) {
        setStandaloneSchemes(schemesRes.data);
      } else {
        setStandaloneSchemes([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while loading client details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId, includeInactive]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      const res = await onUpdateClient(clientId, editForm);
      if (res.ok) {
        setShowEditModal(false);
        setClient((prev) => ({ ...prev, ...editForm }));
      } else {
        setEditError(res.error || 'Failed to update client.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!client) return;
    if (employees.length > 0 || standaloneSchemes.length > 0) {
      alert('This client has associated employments or pension schemes. All employee associations and schemes must be resolved before deleting.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete "${client.name}" (${clientId})? This action cannot be undone.`)) {
      const res = await onDeleteClient(clientId, client.name);
      if (res.ok) {
        onBack();
      }
    }
  };

  const handleDeleteScheme = async (scheme) => {
    if (!window.confirm(`Are you sure you want to delete scheme "${scheme.name}" (${scheme.code})? Note: Schemes with active enrolled contributors cannot be deleted.`)) {
      return;
    }
    if (onDeleteScheme) {
      const res = await onDeleteScheme(scheme.id, scheme.name);
      if (res.ok) {
        setStandaloneSchemes((prev) => prev.filter((s) => s.id !== scheme.id));
      }
    }
  };

  if (loading && !client) {
    return (
      <div className="py-20 text-center animate-fadeIn">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-[#0f1d33] rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading corporate client dossier...</p>
      </div>
    );
  }

  if (error && !client) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
        <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Client Record Not Found</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-[#0f1d33] text-white text-xs font-bold hover:bg-[#182b49] transition-all"
        >
          Return to Corporate Directory
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0f1d33] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Corporate Clients
        </button>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Edit Client
              </button>
              <button
                onClick={handleDelete}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-600 transition-all shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Corporate Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs hover:border-slate-300 transition-all">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#0f1d33] flex items-center justify-center text-[#c59b27] shadow-sm shrink-0">
              <Building2 className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f1d33] tracking-tight">
                  {client?.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {client?.petraID || clientId}
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 inline-flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Sponsor Employer
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Institutional Corporate Sponsor Partnership · Registered {client?.createdAt ? new Date(client.createdAt).toLocaleDateString() : 'N/A'}
              </p>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <UserCheck className="w-4 h-4 text-[#c59b27] shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Key Contact</span>
                    <span className="font-semibold text-slate-800">{client?.companyContact || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-[#c59b27] shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Email</span>
                    <a href={`mailto:${client?.email}`} className="font-semibold text-slate-800 hover:text-[#0f1d33] underline">
                      {client?.email || '—'}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-[#c59b27] shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Phone</span>
                    <span className="font-semibold text-slate-800">{client?.phone || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-row md:flex-col gap-2 shrink-0">
            {isAdmin && (
              <>
                <button
                  onClick={() => onOpenCreateCustomerModal(clientId)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
                  Enroll Employee
                </button>
                <button
                  onClick={() => onOpenCreateSchemeModal(clientId)}
                  className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all shadow-2xs"
                >
                  <Layers className="w-3.5 h-3.5 text-[#c59b27]" />
                  Add Standalone Scheme
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Standalone Pension Schemes Sponsoring */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#c59b27]" />
              Standalone Schemes ({standaloneSchemes.length})
            </h3>
            <p className="text-xs text-slate-500">
              Pension schemes designated exclusively for employees of {client?.name}
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => onOpenCreateSchemeModal(clientId)}
              className="inline-flex items-center gap-1 text-xs font-bold text-[#c59b27] hover:text-[#a8821f] transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Scheme
            </button>
          )}
        </div>

        {standaloneSchemes.length === 0 ? (
          <div className="p-6 rounded-lg bg-slate-50 border border-dashed border-slate-200 text-center">
            <p className="text-xs text-slate-500">
              No standalone schemes configured. Employees under this company participate in open master trust schemes unless a company-specific scheme is created.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {standaloneSchemes.map((s) => (
              <div 
                key={s.id} 
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    s.tier === 0 
                      ? 'bg-blue-50 text-blue-700 border-blue-200' 
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  }`}>
                    {s.tier === 0 ? 'Tier 2 (Occupational)' : 'Tier 3 (Voluntary)'}
                  </span>
                  <span className="font-mono text-[11px] text-slate-500">{s.code}</span>
                </div>
                <h4 className="text-xs font-bold text-slate-900 mt-2">{s.name}</h4>
                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1">{s.description || 'No description provided.'}</p>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100">
                  <span className="font-mono text-[10px] text-slate-400">Scheme #{s.id}</span>
                  {isAdmin && (
                    <button
                      onClick={() => handleDeleteScheme(s)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Delete Standalone Scheme"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Employees / Contributor Roster */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
              <Users className="w-4 h-4 text-[#c59b27]" />
              Staff & Employee Contributors ({employees.length})
            </h3>
            <p className="text-xs text-slate-500">
              Enrolled personnel registered under {client?.name}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="rounded border-slate-300 text-[#0f1d33] focus:ring-[#0f1d33] w-3.5 h-3.5"
              />
              Show Former Employees
            </label>
            {isAdmin && (
              <button
                onClick={() => onOpenCreateCustomerModal(clientId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f1d33] text-white text-xs font-bold hover:bg-[#182b49] transition-all shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
                Enroll Contributor
              </button>
            )}
          </div>
        </div>

        {employees.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            No employee contributors registered under this client yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Petra ID</th>
                  <th className="py-3 px-6">Pension #</th>
                  <th className="py-3 px-6">Contributor Name</th>
                  <th className="py-3 px-6">Contact Email & Phone</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Period</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employees.map((emp) => (
                  <tr 
                    key={emp.employmentId || emp.petraID} 
                    className="hover:bg-slate-50 transition-colors group cursor-pointer"
                    onClick={() => onNavigateToCustomer(emp.petraID)}
                  >
                    <td className="py-3 px-6 font-mono font-bold text-slate-800">
                      {emp.petraID}
                    </td>
                    <td className="py-3 px-6 font-mono text-slate-700">
                      {emp.pensionNumber || '—'}
                    </td>
                    <td className="py-3 px-6 font-bold text-[#0f1d33]">
                      {emp.name}
                    </td>
                    <td className="py-3 px-6 text-slate-500">
                      <div>{emp.email}</div>
                      <div className="text-[11px] text-slate-400">{emp.phone}</div>
                    </td>
                    <td className="py-3 px-6">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                        emp.isActive 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}>
                        {emp.isActive ? 'Active' : 'Former'}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-[11px] text-slate-500">
                      <div>From: {emp.startDate ? new Date(emp.startDate).toLocaleDateString() : '—'}</div>
                      {!emp.isActive && emp.endDate && (
                        <div className="text-slate-400">To: {new Date(emp.endDate).toLocaleDateString()}</div>
                      )}
                    </td>
                    <td className="py-3 px-6 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToCustomer(emp.petraID);
                        }}
                        className="inline-flex items-center gap-1 text-xs font-bold text-[#0f1d33] hover:text-[#c59b27] group-hover:underline"
                      >
                        View Profile
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Corporate Client Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#c59b27]" />
                Edit Corporate Client Details
              </h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              {editError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name *</label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Phone *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email *</label>
                  <input
                    type="email"
                    required
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Company Contact Person / Trustee Representative *</label>
                <input
                  type="text"
                  required
                  value={editForm.companyContact}
                  onChange={(e) => setEditForm({ ...editForm, companyContact: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold disabled:opacity-50"
                >
                  {editSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
