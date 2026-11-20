import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  Mail, 
  Phone, 
  UserCheck, 
  Users, 
  Edit3, 
  Trash2, 
  X, 
  AlertCircle, 
  ArrowRight,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import { clientsApi } from '../api';

export default function ClientsTab({ 
  clients = [], 
  onRefresh, 
  onCreateClient, 
  onUpdateClient, 
  onDeleteClient,
  onSelectClient,
  onNavigateToCustomerWithClient,
  currentUser 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [clientCustomers, setClientCustomers] = useState([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Create Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newClient, setNewClient] = useState({
    name: '',
    phone: '',
    email: '',
    companyContact: '',
  });
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createError, setCreateError] = useState('');

  // Edit Modal
  const [editingClient, setEditingClient] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    companyContact: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Delete State
  const [deletingId, setDeletingId] = useState(null);

  const filteredClients = clients.filter((c) => {
    const term = searchTerm.toLowerCase();
    const name = (c.name || '').toLowerCase();
    const id = (c.petraID || c.petraId || '').toLowerCase();
    const email = (c.email || '').toLowerCase();
    const contact = (c.companyContact || '').toLowerCase();
    return name.includes(term) || id.includes(term) || email.includes(term) || contact.includes(term);
  });

  const handleOpenClientDetails = async (client) => {
    setSelectedClient(client);
    setLoadingCustomers(true);
    const petraId = client.petraID || client.petraId;
    const res = await clientsApi.getCustomers(petraId);
    if (res.ok) {
      setClientCustomers(res.data || []);
    } else {
      setClientCustomers([]);
    }
    setLoadingCustomers(false);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSubmitting(true);
    try {
      const res = await onCreateClient(newClient);
      if (res.ok) {
        setShowCreateModal(false);
        setNewClient({ name: '', phone: '', email: '', companyContact: '' });
        onRefresh();
      } else {
        setCreateError(res.error || 'Failed to create client.');
      }
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleStartEdit = (client) => {
    setEditingClient(client);
    setEditForm({
      name: client.name || '',
      phone: client.phone || '',
      email: client.email || '',
      companyContact: client.companyContact || '',
    });
    setEditError('');
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editingClient) return;
    setEditError('');
    setEditSubmitting(true);
    const petraId = editingClient.petraID || editingClient.petraId;
    try {
      const res = await onUpdateClient(petraId, editForm);
      if (res.ok) {
        setEditingClient(null);
        if (selectedClient && (selectedClient.petraID === petraId || selectedClient.petraId === petraId)) {
          setSelectedClient({ ...selectedClient, ...editForm });
        }
        onRefresh();
      } else {
        setEditError(res.error || 'Failed to update client.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (client) => {
    const petraId = client.petraID || client.petraId;
    if (!window.confirm(`Are you sure you want to delete "${client.name}" (${petraId})? Note: Clients with active employees/customers cannot be deleted.`)) {
      return;
    }
    setDeletingId(petraId);
    try {
      await onDeleteClient(petraId, client.name);
      if (selectedClient && (selectedClient.petraID === petraId || selectedClient.petraId === petraId)) {
        setSelectedClient(null);
      }
      onRefresh();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Corporate Directory</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f1d33] flex items-center gap-2 tracking-tight">
            <Building2 className="w-6 h-6 text-[#c59b27]" />
            Corporate Clients (Employers)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registered corporate sponsor organizations and employer trust partnerships
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white font-bold text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
        >
          <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
          Register Corporate Client
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search by company name, Petra ID (e.g. CO00000001), corporate email, or contact person..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33] transition-all"
        />
      </div>

      {/* Clients Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-slate-300 transition-all duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Petra ID</th>
                <th className="py-3.5 px-6">Company / Employer Name</th>
                <th className="py-3.5 px-6">Phone Number</th>
                <th className="py-3.5 px-6">Corporate Email</th>
                <th className="py-3.5 px-6">Company Contact</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No corporate clients found matching your search.
                  </td>
                </tr>
              ) : (
                filteredClients.map((client) => {
                  const petraId = client.petraID || client.petraId;
                  return (
                    <tr 
                      key={petraId}
                      onClick={() => onSelectClient ? onSelectClient(petraId) : handleOpenClientDetails(client)}
                      className="hover:bg-slate-50/90 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="py-3.5 px-6">
                        <span className="font-mono font-bold text-xs text-[#0f1d33] bg-slate-100 px-2 py-0.5 rounded border border-slate-200 group-hover:border-[#c59b27]/60 group-hover:bg-[#fbf7ec] group-hover:text-[#937119] transition-colors">
                          {petraId}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-slate-900 group-hover:text-[#0f1d33] text-xs">
                          {client.name}
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.phone}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                          <span>{client.companyContact}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => onSelectClient ? onSelectClient(petraId) : handleOpenClientDetails(client)}
                          title="View Dossier"
                          className="px-2.5 py-1.5 rounded-md text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white transition-all active:scale-95 inline-flex items-center gap-1"
                        >
                          Dossier
                          <ArrowRight className="w-3 h-3 text-[#c59b27]" />
                        </button>
                        <button
                          onClick={() => handleStartEdit(client)}
                          title="Edit Client"
                          className="p-1.5 rounded-md text-slate-600 hover:text-[#0f1d33] hover:bg-slate-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          disabled={deletingId === petraId}
                          title="Delete Client"
                          className="p-1.5 rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Client Detail & Employees Drawer */}
      {selectedClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-xl w-full border border-slate-200 max-h-[90vh] overflow-y-auto shadow-xl animate-fadeIn">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c59b27] block mb-0.5">
                  Corporate Client Profile
                </span>
                <h3 className="text-lg font-bold text-[#0f1d33]">
                  {selectedClient.name}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  Petra ID: {selectedClient.petraID || selectedClient.petraId}
                </p>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Company Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Corporate Email</span>
                  <span className="font-bold text-slate-800">{selectedClient.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Telephone</span>
                  <span className="font-bold text-slate-800">{selectedClient.phone}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Company Contact</span>
                  <span className="font-bold text-slate-800">{selectedClient.companyContact}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Registered Date</span>
                  <span className="font-bold text-slate-800">
                    {selectedClient.createdAt ? new Date(selectedClient.createdAt).toLocaleDateString() : '—'}
                  </span>
                </div>
              </div>

              {/* Employee Customers */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#c59b27]" />
                    Registered Employees ({clientCustomers.length})
                  </h4>
                  <button
                    onClick={() => {
                      const cid = selectedClient.petraID || selectedClient.petraId;
                      setSelectedClient(null);
                      onNavigateToCustomerWithClient(cid);
                    }}
                    className="text-xs font-bold text-[#c59b27] hover:text-[#937119] flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Employee
                  </button>
                </div>

                {loadingCustomers ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading company employees...</div>
                ) : clientCustomers.length === 0 ? (
                  <div className="p-6 rounded-lg border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-500 mb-2 font-medium">No employees registered under this client yet.</p>
                    <button
                      onClick={() => {
                        const cid = selectedClient.petraID || selectedClient.petraId;
                        setSelectedClient(null);
                        onNavigateToCustomerWithClient(cid);
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white rounded-lg shadow-2xs transition-all active:scale-95"
                    >
                      Add First Employee
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto border border-slate-200 rounded-lg">
                    {clientCustomers.map((cust) => (
                      <div key={cust.petraID || cust.petraId} className="p-3 text-xs flex items-center justify-between hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{cust.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Pension #{cust.pensionNumber} · ID: {cust.petraID || cust.petraId}
                          </div>
                        </div>
                        <div className="text-right text-[11px] text-slate-500">
                          {cust.email}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
              <button
                onClick={() => handleStartEdit(selectedClient)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-[#0f1d33] hover:bg-slate-100 rounded flex items-center gap-1"
              >
                <Edit3 className="w-3.5 h-3.5" /> Edit Information
              </button>
              <button
                onClick={() => setSelectedClient(null)}
                className="px-4 py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Register Client Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0f1d33] flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#c59b27]" />
                Register Corporate Client (Employer)
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

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Acme Ghana Ltd"
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Telephone *
                </label>
                <input
                  type="text"
                  required
                  placeholder="+233 30 200 0000"
                  value={newClient.phone}
                  onChange={(e) => setNewClient({ ...newClient, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  placeholder="info@acme.example.com"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Contact Person / Email *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. hr@acme.example.com or Jane Doe (HR Director)"
                  value={newClient.companyContact}
                  onChange={(e) => setNewClient({ ...newClient, companyContact: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white rounded shadow-xs hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {createSubmitting ? 'Registering...' : 'Register Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0f1d33] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#c59b27]" />
                Update Corporate Client ({editingClient.petraID || editingClient.petraId})
              </h3>
              <button
                onClick={() => setEditingClient(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Telephone *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Corporate Email *
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Contact Person / Email *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.companyContact}
                  onChange={(e) => setEditForm({ ...editForm, companyContact: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingClient(null)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editSubmitting}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white rounded shadow-xs hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
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
