import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import UsersTab from './components/UsersTab';
import SchemesTab from './components/SchemesTab';
import EnrollmentsTab from './components/EnrollmentsTab';
import AuthModal from './components/AuthModal';
import { 
  authApi, 
  usersApi, 
  schemesApi, 
  enrollmentsApi, 
  getCurrentUser, 
  setAuthSession, 
  getApiBaseUrl 
} from './api';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  RefreshCw, 
  Server,
  Sparkles
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking'); // 'online' | 'offline' | 'checking'

  // Data lists
  const [users, setUsers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quick Action Modal states
  const [activeEnrollModal, setActiveEnrollModal] = useState(false);
  const [prefilledUserForEnroll, setPrefilledUserForEnroll] = useState(null);
  const [activeDepositEnrollment, setActiveDepositEnrollment] = useState(null);

  // Toast / notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Test backend connection & fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch schemes (requires auth, or returns 401 if not logged in)
      const schemesRes = await schemesApi.getAll();
      if (schemesRes.ok) {
        setSchemes(schemesRes.data || []);
        setBackendStatus('online');
      } else if (schemesRes.status === 401) {
        setBackendStatus('online'); // API responded, just unauthorized
      } else {
        setBackendStatus('offline');
      }

      // 2. Fetch users
      const usersRes = await usersApi.getAll();
      if (usersRes.ok) {
        setUsers(usersRes.data || []);
      }

      // 3. Fetch enrollments
      const enrollmentsRes = await enrollmentsApi.getAll();
      if (enrollmentsRes.ok) {
        setEnrollments(enrollmentsRes.data || []);
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setBackendStatus('offline');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Authentication
  const handleLogin = async (email, password) => {
    const res = await authApi.login(email, password);
    if (res.ok && res.data) {
      // Backend returns LoginResponse: { accessToken, expiresAt, userID/userId, email, role }
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
    return { ok: false, error: res.error || 'Login failed' };
  };

  const handleRegister = async (formData) => {
    const res = await authApi.register(formData);
    if (res.ok) {
      showToast('Registration successful! You can now log in.', 'success');
      await fetchData();
      return { ok: true };
    }
    return { ok: false, error: res.error || 'Registration failed' };
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentUser(null);
    showToast('Signed out of MicroPhoenix.', 'info');
  };

  // Quick Action Handlers
  const handleQuickAction = (action) => {
    if (action === 'add-member') {
      setActiveTab('users');
    } else if (action === 'add-scheme') {
      setActiveTab('schemes');
    } else if (action === 'enroll-member') {
      setActiveTab('enrollments');
      setActiveEnrollModal(true);
    } else if (action === 'contribution') {
      setActiveTab('enrollments');
      if (enrollments.length > 0) {
        setActiveDepositEnrollment(enrollments[0]);
      } else {
        showToast('Please enroll a member in a scheme first.', 'info');
      }
    }
  };

  const handleEnrollUserShortcut = (user) => {
    setPrefilledUserForEnroll(user);
    setActiveTab('enrollments');
    setActiveEnrollModal(true);
  };

  const handleContributeShortcut = (enrollment) => {
    setActiveDepositEnrollment(enrollment);
    setActiveTab('enrollments');
  };

  const handleCreateScheme = async (schemeData) => {
    const res = await schemesApi.create(schemeData);
    if (res.ok) {
      showToast(`Scheme "${schemeData.name}" created successfully!`, 'success');
      await fetchData();
      return { ok: true };
    }
    return { ok: false, error: res.error };
  };

  const handleCreateUser = async (userData) => {
    const res = await authApi.register(userData);
    if (res.ok) {
      showToast(`Member "${userData.otherNames} ${userData.lastName}" added!`, 'success');
      await fetchData();
      return { ok: true };
    }
    return { ok: false, error: res.error };
  };

  const handleNewEnrollment = async (enrollData) => {
    if (enrollData.isPromptOnly) {
      setActiveEnrollModal(true);
      return;
    }
    const res = await enrollmentsApi.create(enrollData);
    if (res.ok) {
      showToast('Member successfully enrolled in scheme!', 'success');
      await fetchData();
      return { ok: true };
    }
    return { ok: false, error: res.error };
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        user={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
        onTestConnection={fetchData}
        backendStatus={backendStatus}
      />

      {/* Backend Offline Warning Banner */}
      {backendStatus === 'offline' && (
        <div className="bg-amber-500 text-slate-950 px-4 py-3 text-xs sm:text-sm font-semibold flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <Server className="w-4 h-4 shrink-0 animate-bounce" />
            <span>
              Backend is not reachable at <code>{getApiBaseUrl() || 'Dev Tunnel (https://vcc4ftq2-7293.uks1.devtunnels.ms)'}</code>. Make sure your friend's tunnel or your local backend is running!
            </span>
          </div>
          <button
            onClick={fetchData}
            className="px-2.5 py-1 rounded bg-slate-900 text-white text-xs hover:bg-slate-800 transition-colors ml-4 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-medium text-white border ${
              toast.type === 'success'
                ? 'bg-emerald-600 border-emerald-500'
                : toast.type === 'error'
                ? 'bg-rose-600 border-rose-500'
                : 'bg-slate-900 border-slate-800'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-200" />
            ) : (
              <Info className="w-4 h-4 text-blue-200" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* If user is not logged in, show an informative banner with 1-click test button */}
        {!currentUser && (
          <div className="mb-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
              <div className="text-xs text-indigo-950">
                <strong>You are currently browsing anonymously.</strong> Sign in as an Admin or Member to unlock protected endpoints, create schemes, and manage pension funds.
              </div>
            </div>
            <button
              onClick={() => setAuthModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shrink-0 self-start sm:self-auto shadow-xs"
            >
              Sign In / Quick Demo
            </button>
          </div>
        )}

        {/* Tab Views */}
        {activeTab === 'dashboard' && (
          <Dashboard
            users={users}
            schemes={schemes}
            enrollments={enrollments}
            onNavigate={setActiveTab}
            onQuickAction={handleQuickAction}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'users' && (
          <UsersTab
            users={users}
            onRefresh={fetchData}
            onAddUser={handleCreateUser}
            onEnrollUser={handleEnrollUserShortcut}
            onContribute={handleContributeShortcut}
          />
        )}

        {activeTab === 'schemes' && (
          <SchemesTab
            schemes={schemes}
            onRefresh={fetchData}
            onCreateScheme={handleCreateScheme}
            currentUser={currentUser}
          />
        )}

        {activeTab === 'enrollments' && (
          <EnrollmentsTab
            enrollments={enrollments}
            users={users}
            schemes={schemes}
            onRefresh={fetchData}
            onNewEnrollment={handleNewEnrollment}
            activeEnrollModal={activeEnrollModal}
            onCloseEnrollModal={() => {
              setActiveEnrollModal(false);
              setPrefilledUserForEnroll(null);
            }}
            prefilledUser={prefilledUserForEnroll}
            activeDepositEnrollment={activeDepositEnrollment}
            onCloseDepositModal={() => setActiveDepositEnrollment(null)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            <strong>MicroPhoenix CRM</strong> · ASP.NET Core Web API + PostgreSQL Backend & React Frontend
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              className="inline-flex items-center gap-1 hover:text-slate-800"
            >
              <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </button>
            <span>·</span>
            <span>Local Dev Environment</span>
          </div>
        </div>
      </footer>

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
