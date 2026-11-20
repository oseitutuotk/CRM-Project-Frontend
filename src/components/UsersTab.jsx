import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  ShieldCheck, 
  Wallet, 
  X, 
  AlertCircle, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Receipt,
  CheckCircle2,
  Calendar,
  Coins
} from 'lucide-react';
import { usersApi, enrollmentsApi } from '../api';

export default function UsersTab({ 
  users = [], 
  schemes = [], 
  onRefresh, 
  onAddUser,
  prefilledUserForEnroll,
  onClearPrefilledUser
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  // Selected Member & Detail Drawer
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  
  // Register Member Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newUser, setNewUser] = useState({
    lastName: '',
    otherNames: '',
    email: '',
    phoneNumber: '',
    password: 'Password123!',
    role: 0,
  });
  const [submittingUser, setSubmittingUser] = useState(false);
  const [formError, setFormError] = useState('');

  // Enroll In Scheme Modal
  const [enrollModalUser, setEnrollModalUser] = useState(null);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [enrolling, setEnrolling] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Transaction Modal (Deposit or Redemption)
  const [txModal, setTxModal] = useState({
    isOpen: false,
    type: 'contribution', // 'contribution' | 'redemption'
    enrollment: null,
    amount: '100',
    submitting: false,
    error: '',
  });

  // Watch for external trigger (e.g. from Dashboard or shortcuts)
  React.useEffect(() => {
    if (prefilledUserForEnroll) {
      setEnrollModalUser(prefilledUserForEnroll);
      setSelectedSchemeId(schemes.length > 0 ? schemes[0].id : '');
    }
  }, [prefilledUserForEnroll, schemes]);

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.otherNames || ''} ${u.lastName || ''}`.toLowerCase();
    const email = (u.email || '').toLowerCase();
    const phone = (u.phoneNumber || '').toLowerCase();
    const term = searchTerm.toLowerCase();

    const matchesSearch = fullName.includes(term) || email.includes(term) || phone.includes(term);
    if (roleFilter === 'ADMIN') return matchesSearch && (u.role === 1 || u.role === 'Admin');
    if (roleFilter === 'MEMBER') return matchesSearch && (u.role === 0 || u.role === 'Member');
    return matchesSearch;
  });

  const loadUserPortfolio = async (user) => {
    setLoadingEnrollments(true);
    const res = await usersApi.getUserEnrollments(user.id);
    if (res.ok) {
      setUserEnrollments(res.data || []);
    } else {
      setUserEnrollments([]);
    }
    setLoadingEnrollments(false);
  };

  const handleOpenUserDetail = async (user) => {
    setSelectedUser(user);
    await loadUserPortfolio(user);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmittingUser(true);
    try {
      const res = await onAddUser(newUser);
      if (res.ok) {
        setShowAddModal(false);
        setNewUser({
          lastName: '',
          otherNames: '',
          email: '',
          phoneNumber: '',
          password: 'Password123!',
          role: 0,
        });
        onRefresh();
      } else {
        setFormError(res.error || 'Failed to create user record.');
      }
    } finally {
      setSubmittingUser(false);
    }
  };

  const handleEnrollSubmit = async (e) => {
    e.preventDefault();
    if (!enrollModalUser || !selectedSchemeId) return;
    setEnrollError('');
    setEnrolling(true);
    try {
      const res = await enrollmentsApi.create({
        userId: enrollModalUser.id,
        schemeId: Number(selectedSchemeId),
      });
      if (res.ok) {
        setEnrollModalUser(null);
        if (onClearPrefilledUser) onClearPrefilledUser();
        if (selectedUser?.id === enrollModalUser.id) {
          await loadUserPortfolio(selectedUser);
        }
        onRefresh();
      } else {
        setEnrollError(res.error || 'Enrollment failed.');
      }
    } finally {
      setEnrolling(false);
    }
  };

  const handleExecuteTransaction = async (e) => {
    e.preventDefault();
    if (!txModal.enrollment) return;
    setTxModal((prev) => ({ ...prev, submitting: true, error: '' }));

    try {
      let res;
      if (txModal.type === 'contribution') {
        res = await enrollmentsApi.addContribution(txModal.enrollment.id, parseFloat(txModal.amount));
      } else {
        res = await enrollmentsApi.addRedemption(txModal.enrollment.id, parseFloat(txModal.amount));
      }

      if (res.ok) {
        setTxModal((prev) => ({ ...prev, isOpen: false, submitting: false }));
        if (selectedUser) {
          await loadUserPortfolio(selectedUser);
        }
        onRefresh();
      } else {
        setTxModal((prev) => ({
          ...prev,
          submitting: false,
          error: res.error || 'Transaction failed',
        }));
      }
    } catch (err) {
      setTxModal((prev) => ({ ...prev, submitting: false, error: err.message }));
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Member Management</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#0f1d33] flex items-center gap-2 tracking-tight">
            <Users className="w-6 h-6 text-[#c59b27]" />
            Contributor Registry
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            View active contributors, manage scheme enrollments, and track individual balances
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white font-bold text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
        >
          <UserPlus className="w-3.5 h-3.5 text-[#c59b27]" />
          Register Member
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by contributor name, email, or telephone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-xs font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33] transition-all"
          />
        </div>
        <div className="flex gap-1 bg-white p-1 rounded-lg border border-slate-200 text-xs font-semibold shadow-2xs">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-md transition-all duration-150 ${
              roleFilter === 'ALL' ? 'bg-[#0f1d33] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('MEMBER')}
            className={`px-3 py-1.5 rounded-md transition-all duration-150 ${
              roleFilter === 'MEMBER' ? 'bg-[#0f1d33] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-md transition-all duration-150 ${
              roleFilter === 'ADMIN' ? 'bg-[#0f1d33] text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs hover:border-slate-300 transition-all duration-200">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-6">Contributor Name</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Phone</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No contributor records found matching your search.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 1 || u.role === 'Admin';
                  return (
                    <tr 
                      key={u.id} 
                      onClick={() => handleOpenUserDetail(u)}
                      className="hover:bg-slate-50/90 transition-colors duration-150 cursor-pointer group"
                    >
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#0f1d33] group-hover:bg-[#fbf7ec] group-hover:text-[#c59b27] flex items-center justify-center font-bold text-xs border border-slate-200 transition-colors duration-150">
                            {(u.otherNames?.[0] || 'M').toUpperCase()}
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs group-hover:text-[#0f1d33]">
                              {u.otherNames} {u.lastName}
                            </span>
                            <span className="text-[10px] font-mono text-slate-400">
                              ID: {u.id?.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6 text-slate-700">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.phoneNumber || '—'}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          isAdmin 
                            ? 'bg-[#fbf7ec] text-[#937119] border border-[#ecdab1]' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          {isAdmin ? <ShieldCheck className="w-3 h-3 text-[#c59b27]" /> : null}
                          {isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 text-right space-x-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleOpenUserDetail(u)}
                          className="px-3 py-1.5 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 text-[#0f1d33] border border-slate-200/80 hover:border-slate-300 transition-all duration-150 active:scale-95"
                        >
                          View Profile
                        </button>
                        <button
                          onClick={() => {
                            setEnrollModalUser(u);
                            setSelectedSchemeId(schemes.length > 0 ? schemes[0].id : '');
                          }}
                          className="px-3 py-1.5 rounded-md text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white transition-all duration-150 active:scale-95 shadow-2xs"
                        >
                          + Enroll
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

      {/* Member Details Drawer (Holding Portfolios & Ledger Under The Hood) */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-xl w-full border border-slate-200 max-h-[90vh] overflow-y-auto shadow-xl animate-fadeIn">
            <div className="flex items-start justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#c59b27] block mb-0.5">
                  Contributor Profile & Scheme Portfolios
                </span>
                <h3 className="text-lg font-bold text-[#0f1d33]">
                  {selectedUser.otherNames} {selectedUser.lastName}
                </h3>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ID: {selectedUser.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              {/* Member Meta */}
              <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-lg border border-slate-200/80">
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Email Address</span>
                  <span className="font-bold text-slate-800">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px] font-medium">Telephone</span>
                  <span className="font-bold text-slate-800">{selectedUser.phoneNumber || '—'}</span>
                </div>
              </div>

              {/* Enrolled Schemes / Portfolios */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-[#c59b27]" />
                    Scheme Portfolios & Balances
                  </h4>
                  <button
                    onClick={() => {
                      const u = selectedUser;
                      setEnrollModalUser(u);
                      setSelectedSchemeId(schemes.length > 0 ? schemes[0].id : '');
                    }}
                    className="text-xs font-bold text-[#c59b27] hover:text-[#937119] flex items-center gap-1 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" /> Enroll in Scheme
                  </button>
                </div>

                {loadingEnrollments ? (
                  <div className="py-8 text-center text-xs text-slate-400">Loading portfolio data...</div>
                ) : userEnrollments.length === 0 ? (
                  <div className="p-6 rounded-lg border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-500 mb-2 font-medium">This member is not enrolled in any pension schemes yet.</p>
                    <button
                      onClick={() => {
                        const u = selectedUser;
                        setEnrollModalUser(u);
                        setSelectedSchemeId(schemes.length > 0 ? schemes[0].id : '');
                      }}
                      className="px-3.5 py-1.5 text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white rounded-lg shadow-2xs transition-all active:scale-95"
                    >
                      Enroll in Scheme Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {userEnrollments.map((enr) => (
                      <div
                        key={enr.id}
                        className="p-4 rounded-xl border border-slate-200/90 hover:border-slate-300 bg-white hover:shadow-2xs transition-all duration-150"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="font-bold text-sm text-[#0f1d33]">
                              {enr.scheme?.name || `Scheme #${enr.schemeId}`}
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                              Account #{enr.id} · Enrolled {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : '—'}
                            </div>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block font-semibold uppercase">Current Balance</span>
                            <span className="text-base font-extrabold text-[#0f1d33]">
                              GH₵ {Number(enr.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>

                        {/* Direct Contribution / Redemption Operations */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">Direct Actions:</span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setTxModal({
                                  isOpen: true,
                                  type: 'contribution',
                                  enrollment: enr,
                                  amount: '100',
                                  submitting: false,
                                  error: '',
                                });
                              }}
                              className="px-3 py-1 rounded-md text-xs font-bold bg-[#fbf7ec] hover:bg-[#f5edd6] text-[#937119] border border-[#ecdab1] transition-all flex items-center gap-1 active:scale-95"
                            >
                              <ArrowUpRight className="w-3.5 h-3.5 text-[#c59b27]" />
                              Deposit
                            </button>
                            <button
                              onClick={() => {
                                setTxModal({
                                  isOpen: true,
                                  type: 'redemption',
                                  enrollment: enr,
                                  amount: '50',
                                  submitting: false,
                                  error: '',
                                });
                              }}
                              className="px-3 py-1 rounded-md text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all flex items-center gap-1 active:scale-95"
                            >
                              <ArrowDownLeft className="w-3.5 h-3.5 text-slate-500" />
                              Redeem
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Enroll In Scheme Modal */}
      {enrollModalUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0f1d33] flex items-center gap-2">
                <Wallet className="w-4 h-4 text-[#c59b27]" />
                Enroll Contributor in Scheme
              </h3>
              <button
                onClick={() => {
                  setEnrollModalUser(null);
                  if (onClearPrefilledUser) onClearPrefilledUser();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 bg-slate-50 rounded-lg text-xs border border-slate-100">
              <span className="text-slate-500 block">Enrolling Member:</span>
              <span className="font-bold text-slate-900">
                {enrollModalUser.otherNames} {enrollModalUser.lastName} ({enrollModalUser.email})
              </span>
            </div>

            {enrollError && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{enrollError}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Select Pension Scheme *
                </label>
                <select
                  required
                  value={selectedSchemeId}
                  onChange={(e) => setSelectedSchemeId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs bg-white font-medium focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                >
                  <option value="" disabled>-- Select an approved scheme --</option>
                  {schemes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.code}) - {s.tier === 0 || s.tier === 'Tier2' ? 'Tier 2' : 'Tier 3'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setEnrollModalUser(null);
                    if (onClearPrefilledUser) onClearPrefilledUser();
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrolling}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white rounded-lg shadow-xs hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {enrolling ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal (Contribution / Redemption) */}
      {txModal.isOpen && txModal.enrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0f1d33] flex items-center gap-2">
                {txModal.type === 'contribution' ? (
                  <>
                    <ArrowUpRight className="w-4 h-4 text-[#c59b27]" />
                    Record Contribution Deposit
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-4 h-4 text-slate-700" />
                    Record Member Redemption
                  </>
                )}
              </h3>
              <button
                onClick={() => setTxModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-3 p-3 bg-slate-50 rounded-lg text-xs space-y-1.5 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Scheme Account:</span>
                <span className="font-semibold text-slate-800">
                  {txModal.enrollment.scheme?.name || `Scheme #${txModal.enrollment.schemeId}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-extrabold text-[#0f1d33]">
                  GH₵ {Number(txModal.enrollment.balance || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {txModal.error && (
              <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{txModal.error}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransaction} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount (GH₵) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-semibold text-xs">GH₵</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txModal.amount}
                    onChange={(e) => setTxModal({ ...txModal, amount: e.target.value })}
                    className="w-full pl-11 pr-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
              </div>

              {/* Quick amount shortcuts */}
              <div className="flex gap-2">
                {[50, 100, 250, 500].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setTxModal({ ...txModal, amount: String(amt) })}
                    className="flex-1 py-1 text-xs font-mono font-semibold bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                  >
                    +GH₵{amt}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setTxModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={txModal.submitting}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white rounded shadow-xs hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {txModal.submitting ? 'Posting...' : txModal.type === 'contribution' ? 'Post Deposit' : 'Process Redemption'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Register Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 sm:p-7 max-w-md w-full border border-slate-200 shadow-xl animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0f1d33] flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#c59b27]" />
                Register New Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-3.5 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Other Names *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwabena"
                    value={newUser.otherNames}
                    onChange={(e) => setNewUser({ ...newUser, otherNames: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mensah"
                    value={newUser.lastName}
                    onChange={(e) => setNewUser({ ...newUser, lastName: e.target.value })}
                    className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="member@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Telephone Number
                </label>
                <input
                  type="text"
                  placeholder="+233 24 000 0000"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Password *
                </label>
                <input
                  type="password"
                  required
                  placeholder="Password123!"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Role Permission
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                >
                  <option value={0}>Member (Standard Pension Contributor)</option>
                  <option value={1}>Administrator (Trustee & Operations)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUser}
                  className="px-4 py-1.5 text-xs font-bold bg-[#0f1d33] hover:bg-[#182b49] text-white rounded shadow-xs hover:shadow-sm active:scale-95 transition-all disabled:opacity-50"
                >
                  {submittingUser ? 'Creating...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
