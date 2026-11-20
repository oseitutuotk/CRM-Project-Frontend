import React, { useState, useEffect } from 'react';
import { 
  Users, 
  ArrowLeft, 
  Mail, 
  Phone, 
  MapPin, 
  CreditCard, 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Layers, 
  AlertTriangle, 
  Coins, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Calendar,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { customersApi, enrollmentsApi, schemesApi } from '../api';

export default function CustomerDetailPage({ 
  customerId, 
  clients = [], 
  schemes = [], 
  onBack, 
  onNavigateToClient, 
  onUpdateCustomer, 
  onDeleteCustomer, 
  currentUser,
  showToast 
}) {
  const [customer, setCustomer] = useState(null);
  const [employments, setEmployments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Customer Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', email: '', address: '' });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState('');

  // Add Employment Modal State
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);
  const [newEmpClientId, setNewEmpClientId] = useState('');
  const [newEmpStartDate, setNewEmpStartDate] = useState('');
  const [empSubmitting, setEmpSubmitting] = useState(false);
  const [empError, setEmpError] = useState('');

  // End Employment Modal State
  const [endingEmp, setEndingEmp] = useState(null);
  const [endDateInput, setEndDateInput] = useState('');
  const [endEmpSubmitting, setEndEmpSubmitting] = useState(false);

  // Enroll in Scheme Modal State
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('');
  const [enrollSubmitting, setEnrollSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Transaction Modal State (Contribution / Redemption)
  const [txModal, setTxModal] = useState({ open: false, type: 'contribution', enrollment: null });
  const [txAmount, setTxAmount] = useState('');
  const [txSubmitting, setTxSubmitting] = useState(false);
  const [txError, setTxError] = useState('');

  const isAdmin = currentUser && (currentUser.role === 1 || currentUser.role === 'Admin');

  // Client lookup map
  const clientMap = new Map();
  clients.forEach((c) => {
    const id = c.petraID || c.petraId;
    if (id) clientMap.set(id, c.name);
  });

  const loadCustomerData = async () => {
    setLoading(true);
    setError('');
    try {
      const [custRes, empRes, enrRes] = await Promise.all([
        customersApi.getById(customerId),
        customersApi.getEmployments(customerId),
        customersApi.getEnrollments(customerId)
      ]);

      if (custRes.ok && custRes.data) {
        setCustomer(custRes.data);
        setEditForm({
          name: custRes.data.name || '',
          phone: custRes.data.phone || '',
          email: custRes.data.email || '',
          address: custRes.data.address || '',
        });
      } else {
        setError(custRes.error || 'Failed to load contributor record.');
      }

      if (empRes.ok && Array.isArray(empRes.data)) {
        setEmployments(empRes.data);
      } else {
        setEmployments([]);
      }

      if (enrRes.ok && enrRes.data) {
        setEnrollments(enrRes.data.enrollments || []);
        setWarnings(enrRes.data.warnings || []);
      } else {
        setEnrollments([]);
        setWarnings([]);
      }
    } catch (err) {
      setError('An unexpected error occurred while loading contributor data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadCustomerData();
    }
  }, [customerId]);

  // Active client IDs for this customer
  const activeClientIds = employments.filter((e) => e.isActive).map((e) => e.clientPetraID);

  // Filter schemes available for enrollment:
  // Must not already be enrolled in it, AND
  // (scheme is open OR scheme belongs to one of customer's active employers)
  const enrolledSchemeIds = new Set(enrollments.map((enr) => enr.schemeId));
  const availableSchemes = schemes.filter((s) => {
    if (enrolledSchemeIds.has(s.id)) return false;
    if (!s.clientPetraID) return true; // Open to all
    return activeClientIds.includes(s.clientPetraID); // Standalone for active employer
  });

  // Check if selected scheme causes a Tier 2 duplicate warning
  const selectedSchemeObj = schemes.find((s) => s.id === Number(selectedSchemeId));
  const currentTier2Enrollments = enrollments.filter((enr) => enr.tier === 0 || enr.tier === 'Tier2');
  const willTriggerTier2Warning = selectedSchemeObj && (selectedSchemeObj.tier === 0 || selectedSchemeObj.tier === 'Tier2') && currentTier2Enrollments.length > 0;

  // Handle Edit Submit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError('');
    setEditSubmitting(true);
    try {
      const res = await onUpdateCustomer(customerId, editForm);
      if (res.ok) {
        setShowEditModal(false);
        setCustomer((prev) => ({ ...prev, ...editForm }));
      } else {
        setEditError(res.error || 'Failed to update customer profile.');
      }
    } finally {
      setEditSubmitting(false);
    }
  };

  // Handle Add Employment
  const handleAddEmployment = async (e) => {
    e.preventDefault();
    if (!newEmpClientId) return;
    setEmpError('');
    setEmpSubmitting(true);
    try {
      const res = await customersApi.addEmployment(customerId, {
        clientPetraID: newEmpClientId,
        startDate: newEmpStartDate || new Date().toISOString(),
      });
      if (res.ok) {
        const empName = clientMap.get(newEmpClientId) || newEmpClientId;
        showToast(`Added employer ${empName} to ${customer.name}.`, 'success');
        setShowAddEmpModal(false);
        setNewEmpClientId('');
        setNewEmpStartDate('');
        await loadCustomerData();
      } else {
        setEmpError(res.error || 'Failed to add employer.');
      }
    } finally {
      setEmpSubmitting(false);
    }
  };

  // Handle End Employment
  const handleEndEmployment = async (e) => {
    e.preventDefault();
    if (!endingEmp) return;
    setEndEmpSubmitting(true);
    try {
      const res = await customersApi.endEmployment(customerId, endingEmp.id, {
        endDate: endDateInput || new Date().toISOString(),
      });
      if (res.ok) {
        const empName = clientMap.get(endingEmp.clientPetraID) || endingEmp.clientPetraID;
        showToast(`Ended employment with ${empName}.`, 'info');
        setEndingEmp(null);
        setEndDateInput('');
        await loadCustomerData();
      } else {
        showToast(res.error || 'Failed to end employment.', 'error');
      }
    } finally {
      setEndEmpSubmitting(false);
    }
  };

  // Handle Enroll in Scheme
  const handleEnrollInScheme = async (e) => {
    e.preventDefault();
    if (!selectedSchemeId) return;
    setEnrollError('');
    setEnrollSubmitting(true);
    try {
      const res = await customersApi.enroll(customerId, { schemeId: Number(selectedSchemeId) });
      if (res.ok) {
        const sName = selectedSchemeObj?.name || `Scheme #${selectedSchemeId}`;
        showToast(`Customer enrolled in ${sName}.`, 'success');
        if (res.data?.warnings && res.data.warnings.length > 0) {
          showToast(`Warning: ${res.data.warnings.join(' ')}`, 'error');
        }
        setShowEnrollModal(false);
        setSelectedSchemeId('');
        await loadCustomerData();
      } else {
        setEnrollError(res.error || 'Failed to enroll customer in scheme.');
      }
    } finally {
      setEnrollSubmitting(false);
    }
  };

  // Handle Transaction Submit (Contribution / Redemption)
  const handleTxSubmit = async (e) => {
    e.preventDefault();
    if (!txModal.enrollment || !txAmount) return;
    setTxError('');
    setTxSubmitting(true);
    try {
      const amt = parseFloat(txAmount);
      if (isNaN(amt) || amt <= 0) {
        setTxError('Please enter a valid amount greater than zero.');
        return;
      }

      const res = txModal.type === 'contribution'
        ? await enrollmentsApi.addContribution(txModal.enrollment.id, amt)
        : await enrollmentsApi.addRedemption(txModal.enrollment.id, amt);

      if (res.ok) {
        showToast(
          `${txModal.type === 'contribution' ? 'Contribution' : 'Redemption'} of GH₵ ${amt.toFixed(2)} recorded for ${customer.name}.`,
          'success'
        );
        setTxModal({ open: false, type: 'contribution', enrollment: null });
        setTxAmount('');
        await loadCustomerData();
      } else {
        setTxError(res.error || 'Transaction failed.');
      }
    } finally {
      setTxSubmitting(false);
    }
  };

  // Handle Delete Customer
  const handleDeleteCustomer = async () => {
    if (!customer) return;
    if (enrollments.length > 0) {
      alert('This customer is actively enrolled in one or more pension schemes and cannot be deleted.');
      return;
    }
    if (window.confirm(`Are you sure you want to delete customer "${customer.name}" (${customerId})?`)) {
      const res = await onDeleteCustomer(customerId, customer.name);
      if (res.ok) {
        onBack();
      }
    }
  };

  if (loading && !customer) {
    return (
      <div className="py-20 text-center animate-fadeIn">
        <div className="inline-block w-8 h-8 border-4 border-slate-200 border-t-[#0f1d33] rounded-full animate-spin mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading contributor dossier...</p>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center max-w-lg mx-auto space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-600 mx-auto" />
        <h3 className="text-base font-bold text-slate-900">Contributor Record Not Found</h3>
        <p className="text-xs text-slate-500">{error}</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-lg bg-[#0f1d33] text-white text-xs font-bold hover:bg-[#182b49] transition-all"
        >
          Return to Customer Directory
        </button>
      </div>
    );
  }

  const totalFundBalance = enrollments.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Navigation & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-[#0f1d33] transition-colors py-1.5 px-3 rounded-lg hover:bg-slate-100"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Directory
        </button>

        <div className="flex items-center gap-2">
          {isAdmin && (
            <>
              <button
                onClick={() => setShowEditModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:text-slate-900 transition-all shadow-2xs"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Edit Profile
              </button>
              <button
                onClick={handleDeleteCustomer}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-600 transition-all shadow-2xs"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contributor Header Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-xl bg-[#0f1d33] flex items-center justify-center text-[#c59b27] shadow-sm shrink-0">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-extrabold text-[#0f1d33] tracking-tight">
                  {customer?.name}
                </h1>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                  {customer?.petraID || customerId}
                </span>
                <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-[#c59b27]" />
                  Pension #{customer?.pensionNumber || 'Pending'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Individual Contributor Member · Registered {customer?.createdAt ? new Date(customer.createdAt).toLocaleDateString() : 'N/A'}
              </p>

              {/* Meta Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-xs">
                <div className="flex items-center gap-2 text-slate-600">
                  <Mail className="w-4 h-4 text-[#c59b27] shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Email</span>
                    <a href={`mailto:${customer?.email}`} className="font-semibold text-slate-800 hover:text-[#0f1d33] underline">
                      {customer?.email || '—'}
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <Phone className="w-4 h-4 text-[#c59b27] shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Phone</span>
                    <span className="font-semibold text-slate-800">{customer?.phone || '—'}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-slate-600">
                  <MapPin className="w-4 h-4 text-[#c59b27] shrink-0" />
                  <div>
                    <span className="text-[10px] text-slate-400 block uppercase font-bold">Address</span>
                    <span className="font-semibold text-slate-800">{customer?.address || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Balance Widget */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 min-w-48 text-right shrink-0">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-0.5">
              Total Enrolled Balance
            </span>
            <div className="text-xl font-extrabold text-[#0f1d33] font-mono">
              GH₵ {totalFundBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-slate-500 mt-1 block">
              Across {enrollments.length} pension {enrollments.length === 1 ? 'scheme' : 'schemes'}
            </span>
          </div>
        </div>
      </div>

      {/* Regulatory Warnings Alert (if multiple Tier 2 schemes) */}
      {warnings.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start gap-3 shadow-xs">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <strong className="font-bold block text-sm">Regulatory Notice (NPRA Compliance)</strong>
            <p className="mt-0.5 leading-relaxed">
              {warnings.join(' ')}
            </p>
            <p className="text-[11px] text-amber-700 mt-1">
              Note: Under National Pensions Regulatory Authority guidelines, contributors are expected to maintain one primary Tier 2 mandatory scheme. Multiple active Tier 2 schemes should only occur under verified multiple concurrent employments.
            </p>
          </div>
        </div>
      )}

      {/* Employers & Employments (Multiple Employers Support) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#c59b27]" />
              Employers & Sponsoring Clients ({employments.length})
            </h3>
            <p className="text-xs text-slate-500">
              Corporate organizations sponsoring or employing this contributor (supports multiple concurrent and past employers)
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                setNewEmpClientId(clients[0]?.petraID || clients[0]?.petraId || '');
                setShowAddEmpModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f1d33] text-white text-xs font-bold hover:bg-[#182b49] transition-all shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
              Add Employer
            </button>
          )}
        </div>

        {employments.length === 0 ? (
          <div className="py-10 text-center text-xs text-slate-500">
            No employment records found for this contributor.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Client Petra ID</th>
                  <th className="py-3 px-6">Company / Employer Name</th>
                  <th className="py-3 px-6">Status</th>
                  <th className="py-3 px-6">Start Date</th>
                  <th className="py-3 px-6">End Date</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employments.map((emp) => {
                  const companyName = clientMap.get(emp.clientPetraID) || 'Corporate Client';
                  return (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-6 font-mono font-bold text-slate-800">
                        {emp.clientPetraID}
                      </td>
                      <td className="py-3 px-6 font-bold text-[#0f1d33]">
                        <button
                          onClick={() => onNavigateToClient(emp.clientPetraID)}
                          className="hover:text-[#c59b27] hover:underline inline-flex items-center gap-1.5"
                        >
                          {companyName}
                        </button>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          emp.isActive 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {emp.isActive ? 'Active Employment' : 'Ended (History)'}
                        </span>
                      </td>
                      <td className="py-3 px-6 text-slate-600">
                        {emp.startDate ? new Date(emp.startDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-6 text-slate-500">
                        {emp.endDate ? new Date(emp.endDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onNavigateToClient(emp.clientPetraID)}
                            className="text-xs font-bold text-slate-600 hover:text-[#0f1d33]"
                          >
                            View Client
                          </button>
                          {isAdmin && emp.isActive && (
                            <button
                              onClick={() => {
                                setEndingEmp(emp);
                                setEndDateInput(new Date().toISOString().split('T')[0]);
                              }}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline"
                            >
                              End Employment
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enrolled Pension Schemes & Balances */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#c59b27]" />
              Enrolled Pension Schemes ({enrollments.length})
            </h3>
            <p className="text-xs text-slate-500">
              Schemes this contributor is currently enrolled in, their ledger balance, and contribution actions
            </p>
          </div>

          {isAdmin && (
            <button
              onClick={() => {
                if (availableSchemes.length > 0) {
                  setSelectedSchemeId(availableSchemes[0].id.toString());
                }
                setShowEnrollModal(true);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0f1d33] text-white text-xs font-bold hover:bg-[#182b49] transition-all shadow-2xs self-start sm:self-auto"
            >
              <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
              Enroll in Scheme
            </button>
          )}
        </div>

        {enrollments.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-500">
            This customer is not yet enrolled in any pension schemes.
            {isAdmin && (
              <div className="mt-3">
                <button
                  onClick={() => {
                    if (availableSchemes.length > 0) {
                      setSelectedSchemeId(availableSchemes[0].id.toString());
                    }
                    setShowEnrollModal(true);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0f1d33] text-white text-xs font-bold hover:bg-[#182b49] transition-all"
                >
                  Enroll in First Scheme
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-6">Scheme</th>
                  <th className="py-3 px-6">Tier</th>
                  <th className="py-3 px-6">Classification</th>
                  <th className="py-3 px-6">Balance</th>
                  <th className="py-3 px-6">Enrolled Date</th>
                  <th className="py-3 px-6 text-right">Fund Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {enrollments.map((enr) => {
                  const isTier2 = enr.tier === 0 || enr.tier === 'Tier2';
                  const isStandalone = !!enr.schemeClientPetraID;
                  const sponsorClientName = isStandalone ? clientMap.get(enr.schemeClientPetraID) : null;

                  return (
                    <tr key={enr.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-6">
                        <div className="font-bold text-[#0f1d33]">{enr.schemeName}</div>
                        <div className="text-[11px] font-mono text-slate-400">{enr.schemeCode}</div>
                      </td>
                      <td className="py-3.5 px-6">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border ${
                          isTier2 
                            ? 'bg-blue-50 text-blue-700 border-blue-200' 
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        }`}>
                          {isTier2 ? 'Tier 2 (Occupational)' : 'Tier 3 (Voluntary)'}
                        </span>
                      </td>
                      <td className="py-3.5 px-6">
                        {isStandalone ? (
                          <div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                              Standalone
                            </span>
                            <div className="text-[11px] text-slate-500 mt-0.5">
                              {sponsorClientName || enr.schemeClientPetraID}
                            </div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            Master Trust (Open)
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900 text-sm">
                        GH₵ {(Number(enr.balance) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-6 text-slate-500">
                        {enr.enrolledAt ? new Date(enr.enrolledAt).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {isAdmin && (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                setTxModal({ open: true, type: 'contribution', enrollment: enr });
                                setTxAmount('100.00');
                                setTxError('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-[#0f1d33] hover:bg-[#182b49] text-white font-bold text-[11px] shadow-2xs"
                              title="Deposit Contribution"
                            >
                              <ArrowDownLeft className="w-3 h-3 text-[#c59b27]" />
                              Contribute
                            </button>
                            <button
                              onClick={() => {
                                setTxModal({ open: true, type: 'redemption', enrollment: enr });
                                setTxAmount('50.00');
                                setTxError('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-[11px]"
                              title="Record Redemption"
                            >
                              <ArrowUpRight className="w-3 h-3 text-slate-500" />
                              Redeem
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Enroll in Scheme Modal */}
      {showEnrollModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#c59b27]" />
                Enroll Contributor in Pension Scheme
              </h3>
              <button 
                onClick={() => setShowEnrollModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEnrollInScheme} className="p-6 space-y-4">
              {enrollError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {enrollError}
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                Enrolling <strong className="text-slate-900">{customer?.name}</strong> (Pension #{customer?.pensionNumber}).
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Select Scheme *</label>
                {availableSchemes.length === 0 ? (
                  <p className="text-xs text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                    No eligible schemes available. The contributor is already enrolled in all available open schemes, or belongs to no employers sponsoring standalone schemes.
                  </p>
                ) : (
                  <select
                    value={selectedSchemeId}
                    onChange={(e) => setSelectedSchemeId(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  >
                    {availableSchemes.map((s) => {
                      const tierLabel = s.tier === 0 ? 'Tier 2 (Occupational)' : 'Tier 3 (Voluntary)';
                      const typeLabel = s.clientPetraID 
                        ? `Standalone (${clientMap.get(s.clientPetraID) || s.clientPetraID})` 
                        : 'Open Master Trust';
                      return (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code}) — {tierLabel} · {typeLabel}
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Duplicate Tier 2 Warning Banner */}
              {willTriggerTier2Warning && (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-bold block">Regulatory Warning: Multiple Tier 2 Schemes</strong>
                    <p className="mt-0.5 leading-relaxed text-[11px]">
                      This contributor is already enrolled in a Tier 2 scheme (<strong>{currentTier2Enrollments[0]?.schemeName}</strong>).
                      Under NPRA guidelines, a contributor usually maintains only one Tier 2 scheme across their primary employment.
                      Are you sure you want to add a second Tier 2 scheme?
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEnrollModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enrollSubmitting || availableSchemes.length === 0}
                  className="px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold disabled:opacity-50"
                >
                  {enrollSubmitting ? 'Enrolling...' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Employer Modal */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#c59b27]" />
                Add Concurrent Employer
              </h3>
              <button 
                onClick={() => setShowAddEmpModal(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEmployment} className="p-6 space-y-4">
              {empError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {empError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Corporate Sponsor / Employer *</label>
                <select
                  value={newEmpClientId}
                  onChange={(e) => setNewEmpClientId(e.target.value)}
                  required
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

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Employment Start Date</label>
                <input
                  type="date"
                  value={newEmpStartDate}
                  onChange={(e) => setNewEmpStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={empSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold disabled:opacity-50"
                >
                  {empSubmitting ? 'Adding...' : 'Attach Employer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* End Employment Confirmation Modal */}
      {endingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                End Employment Record
              </h3>
              <button 
                onClick={() => setEndingEmp(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEndEmployment} className="p-6 space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed">
                Ending employment with <strong>{clientMap.get(endingEmp.clientPetraID) || endingEmp.clientPetraID}</strong>. The record will be archived into employment history and the contributor will no longer be eligible for this company's standalone schemes.
              </p>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Effective End Date</label>
                <input
                  type="date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEndingEmp(null)}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={endEmpSubmitting}
                  className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold disabled:opacity-50"
                >
                  {endEmpSubmitting ? 'Ending...' : 'End Employment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction Modal (Contribution or Redemption) */}
      {txModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
                <Coins className="w-4 h-4 text-[#c59b27]" />
                {txModal.type === 'contribution' ? 'Record Scheme Contribution' : 'Record Scheme Redemption'}
              </h3>
              <button 
                onClick={() => setTxModal({ open: false, type: 'contribution', enrollment: null })}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTxSubmit} className="p-6 space-y-4">
              {txError && (
                <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
                  {txError}
                </div>
              )}

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheme:</span>
                  <span className="font-bold text-slate-900">{txModal.enrollment?.schemeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Current Balance:</span>
                  <span className="font-mono font-bold text-slate-900">
                    GH₵ {(Number(txModal.enrollment?.balance) || 0).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount in Ghana Cedis (GH₵) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">GH₵</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full pl-12 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTxModal({ open: false, type: 'contribution', enrollment: null })}
                  className="px-4 py-2 rounded-lg border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={txSubmitting}
                  className="px-4 py-2 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white text-xs font-bold disabled:opacity-50"
                >
                  {txSubmitting ? 'Posting...' : txModal.type === 'contribution' ? 'Post Contribution' : 'Post Redemption'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slideUp">
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#0f1d33] flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-[#c59b27]" />
                Edit Contributor Profile
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
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
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#0f1d33]/20 focus:border-[#0f1d33]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Email Address *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1">Residential Address / City</label>
                <input
                  type="text"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
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
