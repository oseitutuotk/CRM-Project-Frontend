import React, { useState } from 'react';
import { 
  Wallet, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  History, 
  Search, 
  X, 
  AlertCircle, 
  CheckCircle2,
  Calendar,
  DollarSign,
  TrendingUp,
  Receipt
} from 'lucide-react';
import { enrollmentsApi } from '../api';

export default function EnrollmentsTab({ 
  enrollments = [], 
  users = [], 
  schemes = [], 
  onRefresh, 
  onNewEnrollment,
  activeEnrollModal,
  onCloseEnrollModal,
  prefilledUser,
  activeDepositEnrollment,
  onCloseDepositModal
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEnrollmentForHistory, setSelectedEnrollmentForHistory] = useState(null);
  const [enrollmentDetails, setEnrollmentDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // New Enrollment state
  const [enrollForm, setEnrollForm] = useState({
    userId: prefilledUser ? prefilledUser.id : '',
    schemeId: schemes.length > 0 ? schemes[0].id : '',
  });
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Transaction Modal state (Deposit / Redemption)
  const [txModal, setTxModal] = useState({
    isOpen: !!activeDepositEnrollment,
    type: 'contribution', // 'contribution' | 'redemption'
    enrollment: activeDepositEnrollment || null,
    amount: '100',
    error: '',
    submitting: false,
  });

  // Watch for external trigger
  React.useEffect(() => {
    if (activeDepositEnrollment) {
      setTxModal({
        isOpen: true,
        type: 'contribution',
        enrollment: activeDepositEnrollment,
        amount: '100',
        error: '',
        submitting: false,
      });
    }
  }, [activeDepositEnrollment]);

  React.useEffect(() => {
    if (prefilledUser) {
      setEnrollForm((prev) => ({
        ...prev,
        userId: prefilledUser.id,
      }));
    }
  }, [prefilledUser]);

  const filteredEnrollments = enrollments.filter((e) => {
    const term = searchTerm.toLowerCase();
    const schemeName = (e.scheme?.name || '').toLowerCase();
    const schemeCode = (e.scheme?.code || '').toLowerCase();
    const id = String(e.id);
    return schemeName.includes(term) || schemeCode.includes(term) || id.includes(term);
  });

  const handleOpenHistory = async (enrollment) => {
    setSelectedEnrollmentForHistory(enrollment);
    setLoadingDetails(true);
    const res = await enrollmentsApi.getById(enrollment.id);
    if (res.ok) {
      setEnrollmentDetails(res.data);
    } else {
      setEnrollmentDetails(null);
    }
    setLoadingDetails(false);
  };

  const handleCreateEnrollment = async (e) => {
    e.preventDefault();
    setEnrollError('');
    setEnrollSubmitting(true);
    try {
      const res = await onNewEnrollment(enrollForm);
      if (res.ok) {
        onCloseEnrollModal();
        setEnrollForm({
          userId: '',
          schemeId: schemes.length > 0 ? schemes[0].id : '',
        });
        onRefresh();
      } else {
        setEnrollError(res.error || 'Failed to enroll member in scheme');
      }
    } finally {
      setEnrollSubmitting(false);
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
        if (onCloseDepositModal) onCloseDepositModal();
        onRefresh();
        // If history modal is also open, refresh it
        if (selectedEnrollmentForHistory?.id === txModal.enrollment.id) {
          handleOpenHistory(txModal.enrollment);
        }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Portfolios & Account Ledger
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active scheme enrollments, contribution deposits, and redemption disbursements
          </p>
        </div>

        <button
          onClick={() => {
            setEnrollForm({
              userId: users.length > 0 ? users[0].id : '',
              schemeId: schemes.length > 0 ? schemes[0].id : '',
            });
            onNewEnrollment({ isPromptOnly: true });
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-xs transition-all"
        >
          <Plus className="w-4 h-4" />
          Enroll Member
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        <input
          type="text"
          placeholder="Search enrollments by scheme name, code, or enrollment ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Enrollments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Account / ID</th>
                <th className="py-3 px-6">Scheme</th>
                <th className="py-3 px-6">Enrolled Date</th>
                <th className="py-3 px-6 text-right">Available Balance</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredEnrollments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No active scheme enrollments found. Click "Enroll Member" to link a user to a pension scheme.
                  </td>
                </tr>
              ) : (
                filteredEnrollments.map((enr) => {
                  const balanceNum = Number(enr.balance || 0);
                  return (
                    <tr key={enr.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-4 px-6">
                        <div className="font-mono font-bold text-xs text-slate-900">
                          #{enr.id}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          User: {enr.userId ? `${enr.userId.substring(0, 8)}...` : 'Unknown'}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="font-semibold text-slate-900">
                          {enr.scheme?.name || `Scheme #${enr.schemeId}`}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {enr.scheme?.code}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-xs text-slate-500">
                        {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-4 px-6 text-right">
                        <span className="font-bold text-emerald-600 text-sm">
                          GH₵ {balanceNum.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-1.5">
                        <button
                          onClick={() => handleOpenHistory(enr)}
                          title="View Contributions & Redemptions ledger"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors inline-flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5 text-slate-500" />
                          Ledger
                        </button>
                        <button
                          onClick={() => {
                            setTxModal({
                              isOpen: true,
                              type: 'contribution',
                              enrollment: enr,
                              amount: '100',
                              error: '',
                              submitting: false,
                            });
                          }}
                          title="Deposit funds"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors inline-flex items-center gap-1"
                        >
                          <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                          Deposit
                        </button>
                        <button
                          onClick={() => {
                            setTxModal({
                              isOpen: true,
                              type: 'redemption',
                              enrollment: enr,
                              amount: '50',
                              error: '',
                              submitting: false,
                            });
                          }}
                          title="Redeem/Withdraw funds"
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors inline-flex items-center gap-1"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5 text-rose-600" />
                          Redeem
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

      {/* Transaction Modal (Contribution or Redemption) */}
      {txModal.isOpen && txModal.enrollment && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {txModal.type === 'contribution' ? (
                  <>
                    <ArrowUpRight className="w-5 h-5 text-emerald-600" />
                    Record Contribution Deposit
                  </>
                ) : (
                  <>
                    <ArrowDownLeft className="w-5 h-5 text-rose-600" />
                    Record Member Redemption
                  </>
                )}
              </h3>
              <button
                onClick={() => {
                  setTxModal((prev) => ({ ...prev, isOpen: false }));
                  if (onCloseDepositModal) onCloseDepositModal();
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="my-4 p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Account ID:</span>
                <span className="font-mono font-bold text-slate-800">#{txModal.enrollment.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheme:</span>
                <span className="font-semibold text-slate-800">
                  {txModal.enrollment.scheme?.name || `Scheme #${txModal.enrollment.schemeId}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Current Balance:</span>
                <span className="font-bold text-emerald-600">
                  GH₵ {Number(txModal.enrollment.balance || 0).toFixed(2)}
                </span>
              </div>
            </div>

            {txModal.error && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{txModal.error}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Amount (GH₵) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-2.5 text-slate-400 font-semibold text-xs">GH₵</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txModal.amount}
                    onChange={(e) => setTxModal({ ...txModal, amount: e.target.value })}
                    className="w-full pl-12 pr-4 py-2 border border-slate-300 rounded-xl text-sm font-semibold focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
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
                    className="flex-1 py-1 text-xs font-mono bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
                  >
                    +GH₵{amt}
                  </button>
                ))}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setTxModal((prev) => ({ ...prev, isOpen: false }));
                    if (onCloseDepositModal) onCloseDepositModal();
                  }}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={txModal.submitting}
                  className={`px-5 py-2 text-sm font-semibold text-white rounded-xl shadow-xs disabled:opacity-50 ${
                    txModal.type === 'contribution'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  {txModal.submitting ? 'Processing...' : txModal.type === 'contribution' ? 'Confirm Deposit' : 'Confirm Redemption'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ledger History Modal */}
      {selectedEnrollmentForHistory && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-xl w-full shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider block mb-0.5">
                  Account Ledger & Audit Trail
                </span>
                <h3 className="text-xl font-bold text-slate-900">
                  Account #{selectedEnrollmentForHistory.id}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  Scheme: {selectedEnrollmentForHistory.scheme?.name || selectedEnrollmentForHistory.schemeId}
                </p>
              </div>
              <button
                onClick={() => setSelectedEnrollmentForHistory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-5">
              <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                <div>
                  <span className="text-xs text-emerald-800 font-medium block">Current Account Balance</span>
                  <span className="text-2xl font-extrabold text-emerald-700">
                    GH₵ {Number(selectedEnrollmentForHistory.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setTxModal({
                        isOpen: true,
                        type: 'contribution',
                        enrollment: selectedEnrollmentForHistory,
                        amount: '100',
                        error: '',
                        submitting: false,
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    + Deposit
                  </button>
                  <button
                    onClick={() => {
                      setTxModal({
                        isOpen: true,
                        type: 'redemption',
                        enrollment: selectedEnrollmentForHistory,
                        amount: '50',
                        error: '',
                        submitting: false,
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                  >
                    - Redeem
                  </button>
                </div>
              </div>

              {loadingDetails ? (
                <div className="py-6 text-center text-xs text-slate-400">Loading ledger data...</div>
              ) : enrollmentDetails ? (
                <div className="space-y-4">
                  {/* Contributions List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                      Contributions Made ({enrollmentDetails.contributions?.length || 0})
                    </h4>
                    {(!enrollmentDetails.contributions || enrollmentDetails.contributions.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No contributions recorded yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                        {enrollmentDetails.contributions.map((c) => (
                          <div key={c.id} className="flex items-center justify-between p-2.5 text-xs">
                            <span className="text-slate-500">
                              {c.contributedAt ? new Date(c.contributedAt).toLocaleString() : 'Recent'}
                            </span>
                            <span className="font-bold text-emerald-600 font-mono">
                              +GH₵ {Number(c.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Redemptions List */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <ArrowDownLeft className="w-4 h-4 text-rose-500" />
                      Redemptions Paid ({enrollmentDetails.redemptions?.length || 0})
                    </h4>
                    {(!enrollmentDetails.redemptions || enrollmentDetails.redemptions.length === 0) ? (
                      <p className="text-xs text-slate-400 italic">No redemptions recorded yet.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 max-h-40 overflow-y-auto border border-slate-200 rounded-xl">
                        {enrollmentDetails.redemptions.map((r) => (
                          <div key={r.id} className="flex items-center justify-between p-2.5 text-xs">
                            <span className="text-slate-500">
                              {r.redeemedAt ? new Date(r.redeemedAt).toLocaleString() : 'Recent'}
                            </span>
                            <span className="font-bold text-rose-600 font-mono">
                              -GH₵ {Number(r.amount).toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedEnrollmentForHistory(null)}
                className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Scheme Enrollment Modal */}
      {activeEnrollModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-600" />
                Enroll Member in Scheme
              </h3>
              <button
                onClick={onCloseEnrollModal}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enrollError && (
              <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{enrollError}</span>
              </div>
            )}

            <form onSubmit={handleCreateEnrollment} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Member *
                </label>
                <select
                  required
                  value={enrollForm.userId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, userId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>-- Select a member --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.otherNames} {u.lastName} ({u.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Pension Scheme *
                </label>
                <select
                  required
                  value={enrollForm.schemeId}
                  onChange={(e) => setEnrollForm({ ...enrollForm, schemeId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="" disabled>-- Select a scheme --</option>
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
                  onClick={onCloseEnrollModal}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollSubmitting}
                  className="px-5 py-2 text-sm font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-xs disabled:opacity-50"
                >
                  {enrollSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
