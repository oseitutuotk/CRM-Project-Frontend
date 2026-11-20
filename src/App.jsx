import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import ClientsTab from './components/ClientsTab';
import CustomersTab from './components/CustomersTab';
import SchemesTab from './components/SchemesTab';
import ClientDetailPage from './components/ClientDetailPage';
import CustomerDetailPage from './components/CustomerDetailPage';
import AuthModal from './components/AuthModal';
import { 
  authApi, 
  clientsApi, 
  customersApi, 
  schemesApi, 
  usersApi, 
  enrollmentsApi, 
  getCurrentUser, 
  setAuthSession 
} from './api';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  RefreshCw,
  X,
  Building2,
  UserPlus,
  Layers,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard' | 'clients' | 'customers' | 'schemes' | 'client-detail' | 'customer-detail'
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState(null);

  // Authentication State
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Core Data Lists
  const [clients, setClients] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [users, setUsers] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quick Action In-Place Modals on Overview
  const [overviewModal, setOverviewModal] = useState(null); // null | 'add-client' | 'add-customer' | 'add-scheme'
  const [initialClientForCustomerModal, setInitialClientForCustomerModal] = useState('');
  const [initialClientForSchemeModal, setInitialClientForSchemeModal] = useState('');

  // Toast Notification State
  const [toasts, setToasts] = useState([]);

  const showToast = (message, type = 'success', action = null) => {
    const id = Date.now() + Math.random().toString();
    const newToast = { id, message, type, action };
    setToasts((prev) => [...prev, newToast]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch all data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [clientsRes, customersRes, schemesRes, usersRes] = await Promise.all([
        clientsApi.getAll(),
        customersApi.getAll(),
        schemesApi.getAll(),
        usersApi.getAll()
      ]);

      if (clientsRes.ok && Array.isArray(clientsRes.data)) setClients(clientsRes.data);
      if (customersRes.ok && Array.isArray(customersRes.data)) setCustomers(customersRes.data);
      if (schemesRes.ok && Array.isArray(schemesRes.data)) setSchemes(schemesRes.data);
      if (usersRes.ok && Array.isArray(usersRes.data)) setUsers(usersRes.data);

      // Aggregate enrollments if customers/users exist
      if (customersRes.ok && Array.isArray(customersRes.data) && customersRes.data.length > 0) {
        const custEnrollmentPromises = customersRes.data.map((c) => customersApi.getEnrollments(c.petraID || c.petraId));
        const custEnrollmentResults = await Promise.all(custEnrollmentPromises);
        const allCustEnrollments = custEnrollmentResults
          .filter((res) => res.ok && res.data && Array.isArray(res.data.enrollments))
          .flatMap((res) => res.data.enrollments);
        setEnrollments(allCustEnrollments);
      } else {
        const fallbackRes = await enrollmentsApi.getAll();
        if (fallbackRes.ok && Array.isArray(fallbackRes.data)) {
          setEnrollments(fallbackRes.data);
        }
      }
    } catch (err) {
      console.error('Data sync error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Authentication Handlers
  const handleLogin = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.ok && res.data) {
      const session = {
        accessToken: res.data.accessToken || res.data.token,
        userId: res.data.userID || res.data.userId || res.data.id,
        email: res.data.email,
        role: res.data.role,
      };
      setAuthSession(session);
      setCurrentUser(session);
      showToast(`Welcome back, ${session.email}! Signed in successfully.`, 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Authentication failed. Please verify credentials.', 'error');
    return { ok: false, error: res.error || 'Authentication failed' };
  };

  const handleRegister = async (formData) => {
    const res = await authApi.register(formData);
    if (res.ok) {
      showToast('Account registered successfully. You can now sign in.', 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Registration failed.', 'error');
    return { ok: false, error: res.error || 'Registration failed' };
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentUser(null);
    showToast('Signed out of session.', 'info');
  };

  // Client (Employer) Handlers with Toast notifications
  const handleCreateClient = async (clientData) => {
    const res = await clientsApi.create(clientData);
    if (res.ok && res.data) {
      const petraId = res.data.petraID || res.data.petraId;
      showToast(
        `Corporate client "${clientData.name}" created (${petraId}).`,
        'success',
        {
          label: 'View Dossier',
          onClick: () => handleSelectClient(petraId),
        }
      );
      await fetchData();
      return { ok: true, data: res.data };
    }
    showToast(res.error || 'Failed to create client.', 'error');
    return { ok: false, error: res.error };
  };

  const handleUpdateClient = async (petraId, clientData) => {
    const res = await clientsApi.update(petraId, clientData);
    if (res.ok) {
      showToast(`Client "${clientData.name}" updated successfully.`, 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Failed to update client.', 'error');
    return { ok: false, error: res.error };
  };

  const handleDeleteClient = async (petraId, clientName) => {
    const res = await clientsApi.delete(petraId);
    if (res.ok) {
      showToast(`Client "${clientName}" (${petraId}) deleted successfully.`, 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Cannot delete client with active employees or schemes.', 'error');
    return { ok: false, error: res.error };
  };

  // Customer (Employee Contributor) Handlers with Toast notifications
  const handleCreateCustomer = async (custData) => {
    const res = await customersApi.create(custData);
    if (res.ok && res.data) {
      const pNum = res.data.pensionNumber;
      const petraId = res.data.petraID || res.data.petraId;
      showToast(
        `Customer "${custData.name}" enrolled with Pension #${pNum}.`,
        'success',
        {
          label: 'View Profile',
          onClick: () => handleSelectCustomer(petraId),
        }
      );
      await fetchData();
      return { ok: true, data: res.data };
    }
    showToast(res.error || 'Failed to enroll customer.', 'error');
    return { ok: false, error: res.error };
  };

  const handleUpdateCustomer = async (petraId, custData) => {
    const res = await customersApi.update(petraId, custData);
    if (res.ok) {
      showToast(`Customer "${custData.name}" updated successfully.`, 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Failed to update customer.', 'error');
    return { ok: false, error: res.error };
  };

  const handleDeleteCustomer = async (petraId, custName) => {
    const res = await customersApi.delete(petraId);
    if (res.ok) {
      showToast(`Customer "${custName}" deleted successfully.`, 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Cannot delete customer actively enrolled in schemes.', 'error');
    return { ok: false, error: res.error };
  };

  // Scheme Handlers with Toast notifications
  const handleCreateScheme = async (schemeData) => {
    const res = await schemesApi.create(schemeData);
    if (res.ok) {
      const typeLabel = schemeData.clientPetraID ? 'Standalone' : 'Master Trust';
      showToast(`Scheme "${schemeData.name}" (${schemeData.code}) created successfully (${typeLabel}).`, 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Failed to create scheme.', 'error');
    return { ok: false, error: res.error };
  };

  const handleAddNav = async (schemeId, schemeName, navData) => {
    const res = await schemesApi.createNav(schemeId, navData);
    if (res.ok) {
      showToast(`NAV valuation rate of GH₵${Number(navData.unitPrice).toFixed(4)} recorded for ${schemeName}.`, 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Failed to record NAV valuation.', 'error');
    return { ok: false, error: res.error };
  };

  const handleDeleteScheme = async (schemeId, schemeName) => {
    const res = await schemesApi.delete(schemeId);
    if (res.ok) {
      showToast(`Scheme "${schemeName}" deleted successfully.`, 'success');
      await fetchData();
      return { ok: true };
    }
    showToast(res.error || 'Cannot delete scheme with active contributor enrollments.', 'error');
    return { ok: false, error: res.error };
  };

  // Dedicated Detail Navigation
  const handleSelectClient = (petraId) => {
    setSelectedClientId(petraId);
    setActiveTab('client-detail');
  };

  const handleSelectCustomer = (petraId) => {
    setSelectedCustomerId(petraId);
    setActiveTab('customer-detail');
  };

  // In-Place Quick Action Handler from Dashboard (Without leaving Overview)
  const handleQuickAction = (action) => {
    if (!currentUser) {
      setAuthModalOpen(true);
      return;
    }
    setOverviewModal(action);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-[#0f1d33] selection:text-white">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Floating Toast Notification Stack with Action Support */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-xl shadow-xl text-xs font-semibold text-white border animate-slideUp transition-all ${
              toast.type === 'success'
                ? 'bg-[#0f1d33] border-[#182b49] text-white shadow-[#0f1d33]/20'
                : toast.type === 'error'
                ? 'bg-rose-900 border-rose-800 text-rose-50 shadow-rose-900/20'
                : 'bg-slate-800 border-slate-700 text-slate-100'
            }`}
          >
            <div className="flex items-start gap-2.5">
              {toast.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-[#c59b27] shrink-0 mt-0.5" />
              ) : toast.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0 mt-0.5" />
              ) : (
                <Info className="w-4 h-4 text-slate-300 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <span className="leading-relaxed block">{toast.message}</span>
                {toast.action && (
                  <button
                    onClick={() => {
                      toast.action.onClick();
                      removeToast(toast.id);
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-bold text-[#c59b27] hover:underline"
                  >
                    {toast.action.label}
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="p-0.5 text-slate-400 hover:text-white transition-colors shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guest Session Bar */}
        {!currentUser && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all duration-200">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900">Guest Mode:</strong> You are viewing read-only records. Sign in with trustee credentials to manage corporate clients, enroll customers, or create schemes.
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white shrink-0 self-start sm:self-auto transition-all shadow-2xs active:scale-95"
            >
              Sign In
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <Dashboard
            clients={clients}
            customers={customers}
            schemes={schemes}
            enrollments={enrollments}
            onNavigate={setActiveTab}
            onQuickAction={handleQuickAction}
            onNavigateToClient={handleSelectClient}
            onNavigateToCustomer={handleSelectCustomer}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'clients' && (
          <ClientsTab
            clients={clients}
            onRefresh={fetchData}
            onCreateClient={handleCreateClient}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onSelectClient={handleSelectClient}
            onNavigateToCustomerWithClient={(cId) => {
              setSelectedClientId(cId);
              setActiveTab('client-detail');
            }}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'customers' && (
          <CustomersTab
            customers={customers}
            clients={clients}
            schemes={schemes}
            onRefresh={fetchData}
            onCreateCustomer={handleCreateCustomer}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            onSelectCustomer={handleSelectCustomer}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}

        {activeTab === 'schemes' && (
          <SchemesTab
            schemes={schemes}
            clients={clients}
            onRefresh={fetchData}
            onCreateScheme={handleCreateScheme}
            onAddNav={handleAddNav}
            onDeleteScheme={handleDeleteScheme}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'client-detail' && (
          <ClientDetailPage
            clientId={selectedClientId}
            onBack={() => setActiveTab('clients')}
            onNavigateToCustomer={handleSelectCustomer}
            onNavigateToSchemes={() => setActiveTab('schemes')}
            onOpenCreateCustomerModal={(cId) => {
              setInitialClientForCustomerModal(cId);
              setOverviewModal('add-customer');
            }}
            onOpenCreateSchemeModal={(cId) => {
              setInitialClientForSchemeModal(cId);
              setOverviewModal('add-scheme');
            }}
            onUpdateClient={handleUpdateClient}
            onDeleteClient={handleDeleteClient}
            onDeleteScheme={handleDeleteScheme}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'customer-detail' && (
          <CustomerDetailPage
            customerId={selectedCustomerId}
            clients={clients}
            schemes={schemes}
            onBack={() => setActiveTab('customers')}
            onNavigateToClient={handleSelectClient}
            onUpdateCustomer={handleUpdateCustomer}
            onDeleteCustomer={handleDeleteCustomer}
            currentUser={currentUser}
            showToast={showToast}
          />
        )}
      </main>

      {/* Corporate Institutional Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-700">Petra Trust Company Limited</span>
            <span>·</span>
            <span>Licensed Corporate Trustee</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1.5 font-semibold text-slate-600 hover:text-slate-900 transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#c59b27]' : ''}`} />
              Sync Ledger
            </button>
            <span>·</span>
            <span>Confidential & Proprietary</span>
          </div>
        </div>
      </footer>

      {/* In-Place Quick Action Modal: Register Corporate Client */}
      {overviewModal === 'add-client' && (
        <OverviewRegisterClientModal
          onClose={() => setOverviewModal(null)}
          onCreateClient={handleCreateClient}
        />
      )}

      {/* In-Place Quick Action Modal: Enroll Customer (with optional scheme) */}
      {overviewModal === 'add-customer' && (
        <OverviewRegisterCustomerModal
          clients={clients}
          schemes={schemes}
          initialClientId={initialClientForCustomerModal}
          onClose={() => {
            setOverviewModal(null);
            setInitialClientForCustomerModal('');
          }}
          onCreateCustomer={handleCreateCustomer}
          showToast={showToast}
        />
      )}

      {/* In-Place Quick Action Modal: Create Scheme */}
      {overviewModal === 'add-scheme' && (
        <OverviewCreateSchemeModal
          clients={clients}
          initialClientId={initialClientForSchemeModal}
          onClose={() => {
            setOverviewModal(null);
            setInitialClientForSchemeModal('');
          }}
          onCreateScheme={handleCreateScheme}
        />
      )}

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}

// In-place Quick Action Dialog for Registering Corporate Client
function OverviewRegisterClientModal({ onClose, onCreateClient }) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', companyContact: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await onCreateClient(form);
      if (res.ok) {
        onClose();
      } else {
        setError(res.error || 'Failed to create client.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#c59b27]" />
            Register Corporate Sponsor Client
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company / Organization Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Acme Ghana Ltd"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Phone *</label>
              <input
                type="tel"
                required
                placeholder="+233 30 000 0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Email *</label>
              <input
                type="email"
                required
                placeholder="pensions@acme.com.gh"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Company Contact Person / Trustee Representative *</label>
            <input
              type="text"
              required
              placeholder="e.g. HR Director / Finance Head"
              value={form.companyContact}
              onChange={(e) => setForm({ ...form, companyContact: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Register Corporate Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// In-place Quick Action Dialog for Enrolling Customer (with optional scheme)
function OverviewRegisterCustomerModal({ clients, schemes, initialClientId, onClose, onCreateCustomer, showToast }) {
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    clientPetraID: initialClientId || (clients[0]?.petraID || clients[0]?.petraId || ''),
  });
  const [alsoEnrollScheme, setAlsoEnrollScheme] = useState(false);
  const [initialSchemeId, setInitialSchemeId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const eligibleSchemes = schemes.filter((s) => {
    if (!s.clientPetraID) return true;
    return s.clientPetraID === form.clientPetraID;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await onCreateCustomer(form);
      if (res.ok && res.data) {
        const petraId = res.data.petraID || res.data.petraId;
        if (alsoEnrollScheme && initialSchemeId && petraId) {
          const enrollRes = await customersApi.enroll(petraId, { schemeId: Number(initialSchemeId) });
          if (enrollRes.ok && enrollRes.data?.warnings && enrollRes.data.warnings.length > 0) {
            showToast?.(`Warning: ${enrollRes.data.warnings.join(' ')}`, 'error');
          }
        }
        onClose();
      } else {
        setError(res.error || 'Failed to enroll customer.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-[#c59b27]" />
            Enroll Pension Customer
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Full Contributor Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Kwame Mensah"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Primary Employer / Sponsoring Client *</label>
            <select
              required
              value={form.clientPetraID}
              onChange={(e) => setForm({ ...form, clientPetraID: e.target.value })}
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
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+233 24 000 0000"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                placeholder="kwame.mensah@acme.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address</label>
            <input
              type="text"
              placeholder="e.g. 14 Independence Ave, Accra"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
            />
          </div>

          {/* Optional Immediate Scheme Enrollment */}
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={alsoEnrollScheme}
                onChange={(e) => {
                  setAlsoEnrollScheme(e.target.checked);
                  if (e.target.checked && eligibleSchemes.length > 0 && !initialSchemeId) {
                    setInitialSchemeId(eligibleSchemes[0].id.toString());
                  }
                }}
                className="rounded border-slate-300 text-[#0f1d33] focus:ring-[#0f1d33] w-4 h-4"
              />
              <span className="text-xs font-bold text-slate-800">
                Also enroll contributor into a scheme now
              </span>
            </label>

            {alsoEnrollScheme && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Scheme</label>
                <select
                  value={initialSchemeId}
                  onChange={(e) => setInitialSchemeId(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                >
                  {eligibleSchemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) — {s.tier === 0 ? 'Tier 2 (Occupational)' : 'Tier 3 (Voluntary)'}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold disabled:opacity-50"
            >
              {submitting ? 'Registering...' : 'Complete Enrollment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// In-place Quick Action Dialog for Creating Pension Scheme
function OverviewCreateSchemeModal({ clients, initialClientId, onClose, onCreateScheme }) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    description: '',
    tier: 0,
    clientPetraID: initialClientId || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const payload = {
        ...form,
        clientPetraID: form.clientPetraID ? form.clientPetraID : null,
      };
      const res = await onCreateScheme(payload);
      if (res.ok) {
        onClose();
      } else {
        setError(res.error || 'Failed to create scheme.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#c59b27]" />
            Create Approved Pension Scheme
          </h3>
          <button onClick={onClose} className="p-1 rounded-md text-slate-400 hover:text-slate-600">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5">
          {error && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Name *</label>
            <input
              type="text"
              required
              placeholder="e.g. Petra Master Trust Scheme"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Code *</label>
              <input
                type="text"
                required
                placeholder="e.g. PTR-T2-01"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs uppercase font-mono focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Pension Tier</label>
              <select
                value={form.tier}
                onChange={(e) => setForm({ ...form, tier: Number(e.target.value) })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
              >
                <option value={0}>Tier 2 (Occupational)</option>
                <option value={1}>Tier 3 (Voluntary)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Classification / Sponsorship</label>
            <select
              value={form.clientPetraID || ''}
              onChange={(e) => setForm({ ...form, clientPetraID: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
            >
              <option value="">Open Master Trust (Available to any employer)</option>
              {clients.map((c) => {
                const id = c.petraID || c.petraId;
                return (
                  <option key={id} value={id}>
                    Standalone Scheme for {c.name} ({id})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Scheme Description</label>
            <textarea
              rows={2}
              placeholder="Eligibility criteria and asset mandate..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-1.5 bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold rounded shadow-xs active:scale-95 transition-all disabled:opacity-50"
            >
              {submitting ? 'Creating...' : 'Create Scheme'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
