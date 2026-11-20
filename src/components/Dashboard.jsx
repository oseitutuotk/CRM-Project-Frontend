import React from 'react';
import { 
  Building2, 
  Users, 
  Layers, 
  Coins, 
  Plus, 
  ArrowRight, 
  ShieldCheck, 
  UserPlus, 
  Briefcase
} from 'lucide-react';

export default function Dashboard({ 
  clients = [], 
  customers = [], 
  schemes = [], 
  enrollments = [], 
  onNavigate, 
  onQuickAction,
  onNavigateToClient,
  onNavigateToCustomer,
  currentUser 
}) {
  const totalBalance = enrollments.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  const tier2Count = schemes.filter(s => s.tier === 0 || s.tier === 'Tier2').length;
  const tier3Count = schemes.filter(s => s.tier === 1 || s.tier === 'Tier3').length;

  const stats = [
    {
      title: 'Corporate Clients',
      value: clients.length.toLocaleString(),
      description: 'Sponsor companies & employers',
      icon: Building2,
      iconBg: 'bg-[#fbf7ec] text-[#c59b27] border-[#ecdab1]',
      actionTab: 'clients',
    },
    {
      title: 'Pension Customers',
      value: customers.length.toLocaleString(),
      description: 'Active employee contributors',
      icon: Users,
      iconBg: 'bg-slate-100 text-[#0f1d33] border-slate-200',
      actionTab: 'customers',
    },
    {
      title: 'Approved Schemes',
      value: schemes.length.toLocaleString(),
      description: `${tier2Count} Tier 2 (Occupational) · ${tier3Count} Tier 3 (Voluntary)`,
      icon: Layers,
      iconBg: 'bg-slate-100 text-[#0f1d33] border-slate-200',
      actionTab: 'schemes',
    },
    {
      title: 'Total Funds Managed',
      value: `GH₵ ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      description: 'Aggregate portfolio ledger',
      icon: Coins,
      iconBg: 'bg-[#fbf7ec] text-[#c59b27] border-[#ecdab1]',
      actionTab: 'customers',
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Executive Welcome & Actions Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xs hover:border-slate-300 transition-all duration-200">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-50"></span>
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Petra Trust Operations</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0f1d33] tracking-tight">
            Executive Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl">
            Real-time management of corporate sponsor clients, employee pension customers, approved schemes, and unit pricing.
          </p>
        </div>

        {/* Primary Action Buttons - Triggering functions directly in-place */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onQuickAction('add-client')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0f1d33] font-bold text-xs border border-slate-200 hover:border-slate-300 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
          >
            <Building2 className="w-3.5 h-3.5 text-[#0f1d33]" />
            Register Corporate Client
          </button>
          <button
            onClick={() => onQuickAction('add-customer')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#0f1d33] hover:bg-[#182b49] text-white font-bold text-xs shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
          >
            <UserPlus className="w-3.5 h-3.5 text-[#c59b27]" />
            Enroll Customer
          </button>
          <button
            onClick={() => onQuickAction('add-scheme')}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-200 shadow-2xs hover:shadow-xs hover:-translate-y-0.5 active:translate-y-0 active:scale-95 transition-all duration-150"
          >
            <Plus className="w-3.5 h-3.5 text-[#c59b27]" />
            Create Scheme
          </button>
        </div>
      </div>

      {/* Institutional KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(stat.actionTab)}
              className="bg-white border border-slate-200 hover:border-[#c59b27]/60 rounded-xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-md group relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center border shadow-2xs transition-transform duration-200 group-hover:scale-110 ${stat.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="text-2xl font-black text-[#0f1d33] tracking-tight mb-1">
                {stat.value}
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                <span className="truncate pr-2">{stat.description}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#c59b27] group-hover:translate-x-1 transition-all duration-150 shrink-0" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Columns: Corporate Clients Summary & Pension Schemes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top Corporate Clients */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl p-6 hover:border-slate-300 transition-all duration-200 shadow-2xs">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-[#fbf7ec] border border-[#ecdab1] flex items-center justify-center text-[#c59b27]">
                <Building2 className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#0f1d33]">Corporate Sponsor Clients</h2>
                <p className="text-xs text-slate-500">Registered employer organizations</p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('clients')}
              className="text-xs font-bold text-[#c59b27] hover:text-[#937119] flex items-center gap-1 hover:translate-x-0.5 transition-all duration-150"
            >
              All Clients ({clients.length}) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {clients.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-lg">
              <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-semibold text-slate-600">No corporate clients registered yet.</p>
              <button
                onClick={() => onQuickAction('add-client')}
                className="mt-3 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#0f1d33] text-white hover:bg-[#182b49] transition-all"
              >
                Register First Client
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {clients.slice(0, 4).map((client) => {
                const petraId = client.petraID || client.petraId;
                return (
                  <div
                    key={petraId}
                    onClick={() => onNavigateToClient ? onNavigateToClient(petraId) : onNavigate('clients')}
                    className="p-4 rounded-lg border border-slate-200/80 hover:border-[#c59b27]/60 bg-slate-50/50 hover:bg-white hover:shadow-xs hover:-translate-y-0.5 cursor-pointer transition-all duration-200"
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-bold text-xs text-[#0f1d33] truncate">{client.name}</span>
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200/80 text-slate-700">
                        {petraId}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 truncate mb-1">
                      Contact: {client.companyContact}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      {client.email} · {client.phone}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Recent Customers */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between hover:border-slate-300 transition-all duration-200 shadow-2xs">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-[#0f1d33]">
                  <Users className="w-4 h-4" />
                </div>
                <h2 className="text-sm font-bold text-[#0f1d33]">Recent Customers</h2>
              </div>
              <button
                onClick={() => onNavigate('customers')}
                className="text-xs font-bold text-[#c59b27] hover:text-[#937119] flex items-center gap-0.5 hover:translate-x-0.5 transition-all duration-150"
              >
                All ({customers.length}) <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {customers.length === 0 ? (
              <p className="text-xs text-slate-400 py-8 text-center italic">
                No customer contributors registered yet. Enroll customers under corporate clients to view them here.
              </p>
            ) : (
              <div className="space-y-2">
                {customers.slice(0, 4).map((cust) => {
                  const petraId = cust.petraID || cust.petraId;
                  return (
                    <div
                      key={petraId}
                      onClick={() => onNavigateToCustomer ? onNavigateToCustomer(petraId) : onNavigate('customers')}
                      className="flex items-center justify-between p-3 rounded-lg border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-2xs text-xs cursor-pointer transition-all duration-150"
                    >
                      <div>
                        <div className="font-bold text-slate-900 truncate max-w-[140px]">
                          {cust.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {cust.petraID}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono font-bold text-xs bg-[#fbf7ec] text-[#937119] border border-[#ecdab1] px-1.5 py-0.5 rounded">
                          {cust.pensionNumber}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span className="font-semibold text-slate-600">Trustee Ledger</span>
            <span className="font-mono text-slate-500">{new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
