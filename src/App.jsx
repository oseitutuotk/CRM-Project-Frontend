import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import UsersTab from './components/UsersTab';
import SchemesTab from './components/SchemesTab';
import AuthModal from './components/AuthModal';
import { 
  authApi, 
  usersApi, 
  schemesApi, 
  enrollmentsApi, 
  getCurrentUser, 
  setAuthSession 
} from './api';
import { 
  AlertCircle, 
  CheckCircle2, 
  Info, 
  RefreshCw
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Data lists
  const [users, setUsers] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Quick Action Modal states
  const [prefilledUserForEnroll, setPrefilledUserForEnroll] = useState(null);

  // Notification Toast
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4000);
  };

  // Fetch data from API
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [schemesRes, usersRes] = await Promise.all([
        schemesApi.getAll(),
        usersApi.getAll()
      ]);

      if (schemesRes.ok) setSchemes(schemesRes.data || []);

      let allEnrollments = [];
      if (usersRes.ok && Array.isArray(usersRes.data)) {
        const userList = usersRes.data;
        setUsers(userList);

        // Retrieve scheme enrollments for each user using the supported /api/users/{id}/enrollments endpoint
        const enrollmentPromises = userList.map((u) => usersApi.getUserEnrollments(u.id));
        const enrollmentResults = await Promise.all(enrollmentPromises);

        allEnrollments = enrollmentResults
          .filter((res) => res.ok && Array.isArray(res.data))
          .flatMap((res) => res.data);
      } else {
        const fallbackRes = await enrollmentsApi.getAll();
        if (fallbackRes.ok && Array.isArray(fallbackRes.data)) {
          allEnrollments = fallbackRes.data;
        }
      }

      setEnrollments(allEnrollments);
    } catch (err) {
      console.error('Data sync error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Authentication
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
      showToast('Signed in successfully.', 'success');
      await fetchData();
      return { ok: true };
    }
    return { ok: false, error: res.error || 'Authentication failed' };
  };

  const handleRegister = async (formData) => {
    const res = await authApi.register(formData);
    if (res.ok) {
      showToast('Account registered successfully.', 'success');
      await fetchData();
      return { ok: true };
    }
    return { ok: false, error: res.error || 'Registration failed' };
  };

  const handleLogout = () => {
    setAuthSession(null);
    setCurrentUser(null);
    showToast('Signed out of session.', 'info');
  };

  // Quick Action Handlers
  const handleQuickAction = (action) => {
    if (action === 'add-member') {
      setActiveTab('users');
    } else if (action === 'add-scheme') {
      setActiveTab('schemes');
    } else if (action === 'enroll-member') {
      setActiveTab('users');
      if (users.length > 0) {
        setPrefilledUserForEnroll(users[0]);
      }
    } else if (action === 'contribution') {
      setActiveTab('users');
    }
  };

  const handleCreateScheme = async (schemeData) => {
    const res = await schemesApi.create(schemeData);
    if (res.ok) {
      showToast(`Scheme "${schemeData.name}" created successfully.`, 'success');
      await fetchData();
      return { ok: true };
    }
    return { ok: false, error: res.error };
  };

  const handleCreateUser = async (userData) => {
    const res = await authApi.register(userData);
    if (res.ok) {
      showToast(`Member "${userData.otherNames} ${userData.lastName}" registered.`, 'success');
      await fetchData();
      return { ok: true };
    }
    return { ok: false, error: res.error };
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

      {/* Floating Notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-slideUp">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold text-white border ${
              toast.type === 'success'
                ? 'bg-[#0f1d33] border-slate-700'
                : toast.type === 'error'
                ? 'bg-rose-900 border-rose-800'
                : 'bg-slate-800 border-slate-700'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-[#c59b27]" />
            ) : toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300" />
            ) : (
              <Info className="w-4 h-4 text-slate-300" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Guest Session Bar (Subtle & Professional) */}
        {!currentUser && (
          <div className="mb-6 p-4 rounded-xl bg-white border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs hover:border-slate-300 transition-all duration-200">
            <div className="text-xs text-slate-600">
              <strong className="text-slate-900">Guest Access:</strong> You are viewing read-only records. Sign in with trustee credentials to record contributions, manage schemes, or enroll members.
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
            schemes={schemes}
            onRefresh={fetchData}
            onAddUser={handleCreateUser}
            prefilledUserForEnroll={prefilledUserForEnroll}
            onClearPrefilledUser={() => setPrefilledUserForEnroll(null)}
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
              Sync Records
            </button>
            <span>·</span>
            <span>Confidential & Proprietary</span>
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
