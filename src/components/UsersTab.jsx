import React, { useState } from 'react';
import { 
  Users, 
  Search, 
  UserPlus, 
  Mail, 
  Phone, 
  Shield, 
  ShieldCheck, 
  Wallet, 
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Plus
} from 'lucide-react';
import { usersApi } from '../api';

export default function UsersTab({ 
  users = [], 
  onRefresh, 
  onAddUser, 
  onEnrollUser, 
  onContribute 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [selectedUser, setSelectedUser] = useState(null);
  const [userEnrollments, setUserEnrollments] = useState([]);
  const [loadingEnrollments, setLoadingEnrollments] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New user form state
  const [newUser, setNewUser] = useState({
    lastName: '',
    otherNames: '',
    email: '',
    phoneNumber: '',
    password: 'Password123!',
    role: 0, // 0 = Member, 1 = Admin
  });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

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

  const handleOpenUserDetail = async (user) => {
    setSelectedUser(user);
    setLoadingEnrollments(true);
    const res = await usersApi.getUserEnrollments(user.id);
    if (res.ok) {
      setUserEnrollments(res.data || []);
    } else {
      setUserEnrollments([]);
    }
    setLoadingEnrollments(false);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError('');
    setSubmitting(true);
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
        setFormError(res.error || 'Failed to create user');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Members & User Directory
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage scheme beneficiaries, trustees, and administrative staff
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm shadow-xs transition-all"
          >
            <UserPlus className="w-4 h-4" />
            Add Member
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by name, email, or phone number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="flex gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-semibold">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              roleFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            All ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter('MEMBER')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              roleFilter === 'MEMBER' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Members
          </button>
          <button
            onClick={() => setRoleFilter('ADMIN')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              roleFilter === 'ADMIN' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            Admins
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Member Name</th>
                <th className="py-3 px-6">Email Address</th>
                <th className="py-3 px-6">Phone Number</th>
                <th className="py-3 px-6">Role</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No members match your criteria. Click "Add Member" to create one.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const isAdmin = u.role === 1 || u.role === 'Admin';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                            isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {(u.otherNames?.[0] || 'U').toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {u.otherNames} {u.lastName}
                            </span>
                            <span className="text-[11px] font-mono text-slate-400">
                              {u.id.substring(0, 8)}...
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Mail className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-slate-700">
                        <div className="flex items-center gap-1.5 text-xs">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{u.phoneNumber || '—'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          isAdmin 
                            ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                          {isAdmin ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                          {isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenUserDetail(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors"
                        >
                          Portfolio
                        </button>
                        <button
                          onClick={() => onEnrollUser(u)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors"
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

      {/* Member Portfolio Drawer / Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-xl font-bold text-slate-900">
                  {selectedUser.otherNames} {selectedUser.lastName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">
                  ID: {selectedUser.id}
                </p>
              </div>
              <button
                onClick={() => setSelectedUser(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl">
                <div>
                  <span className="text-slate-400 block mb-0.5">Email</span>
                  <span className="font-semibold text-slate-800">{selectedUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5">Phone</span>
                  <span className="font-semibold text-slate-800">{selectedUser.phoneNumber || 'N/A'}</span>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Wallet className="w-4 h-4 text-indigo-600" />
                    Enrolled Schemes & Balances
                  </h4>
                  <button
                    onClick={() => {
                      const u = selectedUser;
                      setSelectedUser(null);
                      onEnrollUser(u);
                    }}
                    className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-0.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Enroll in another
                  </button>
                </div>

                {loadingEnrollments ? (
                  <div className="py-6 text-center text-xs text-slate-400">Loading portfolio data...</div>
                ) : userEnrollments.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center">
                    <p className="text-xs text-slate-500 mb-2">This member is not enrolled in any pension scheme yet.</p>
                    <button
                      onClick={() => {
                        const u = selectedUser;
                        setSelectedUser(null);
                        onEnrollUser(u);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Enroll Now
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {userEnrollments.map((enr) => (
                      <div
                        key={enr.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50/50"
                      >
                        <div>
                          <div className="font-semibold text-sm text-slate-900">
                            {enr.scheme?.name || `Scheme #${enr.schemeId}`}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Enrollment ID: #{enr.id} · Enrolled {new Date(enr.enrolledAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-emerald-600">
                            GH₵ {Number(enr.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </div>
                          <button
                            onClick={() => {
                              setSelectedUser(null);
                              onContribute(enr);
                            }}
                            className="text-[11px] font-semibold text-indigo-600 hover:underline mt-0.5"
                          >
                            + Deposit
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-indigo-600" />
                Register New Member
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    First / Other Names *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kwabena"
                    value={newUser.otherNames}
                    onChange={(e) => setNewUser({ ...newUser, otherNames: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
                  placeholder="kwabena@example.com"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+233 24 000 0000"
                  value={newUser.phoneNumber}
                  onChange={(e) => setNewUser({ ...newUser, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
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
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Role
                </label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                >
                  <option value={0}>Member (Standard Pension Client)</option>
                  <option value={1}>Admin (Scheme Administrator)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Register User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
