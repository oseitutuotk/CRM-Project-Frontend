import React from 'react';
import { 
  Users, 
  Layers, 
  Wallet, 
  TrendingUp, 
  PlusCircle, 
  ArrowUpRight, 
  ShieldCheck, 
  Activity, 
  Database,
  Building2,
  CheckCircle,
  PiggyBank
} from 'lucide-react';

export default function Dashboard({ 
  users = [], 
  schemes = [], 
  enrollments = [], 
  onNavigate, 
  onQuickAction,
  currentUser 
}) {
  const totalBalance = enrollments.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0);
  const tier2Count = schemes.filter(s => s.tier === 0 || s.tier === 'Tier2').length;
  const tier3Count = schemes.filter(s => s.tier === 1 || s.tier === 'Tier3').length;

  const stats = [
    {
      title: 'Total Members',
      value: users.length,
      change: 'Active clients',
      icon: Users,
      color: 'from-blue-500 to-indigo-600',
      actionTab: 'users'
    },
    {
      title: 'Pension Schemes',
      value: schemes.length,
      change: `${tier2Count} Tier-2 · ${tier3Count} Tier-3`,
      icon: Layers,
      color: 'from-amber-500 to-orange-600',
      actionTab: 'schemes'
    },
    {
      title: 'Active Enrollments',
      value: enrollments.length,
      change: 'Portfolio accounts',
      icon: Wallet,
      color: 'from-emerald-500 to-teal-600',
      actionTab: 'enrollments'
    },
    {
      title: 'Total Funds Managed',
      value: `GH₵ ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: 'Sum of member balances',
      icon: PiggyBank,
      color: 'from-rose-500 to-pink-600',
      actionTab: 'enrollments'
    },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-8 shadow-xl">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/90 text-xs font-medium backdrop-blur-md mb-4 border border-white/10">
            <Activity className="w-3.5 h-3.5 text-amber-400" />
            <span>ASP.NET Core 9 + PostgreSQL + React Live Demo</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Pension CRM Dashboard
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Welcome to the MicroPhoenix management console. Monitor member enrollments, track scheme unit values, and process contributions and redemptions seamlessly.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              onClick={() => onQuickAction('add-member')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-sm transition-all shadow-md shadow-amber-500/20"
            >
              <PlusCircle className="w-4 h-4" />
              Register Member
            </button>
            <button
              onClick={() => onQuickAction('enroll-member')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition-all border border-white/10"
            >
              <Wallet className="w-4 h-4" />
              Enroll in Scheme
            </button>
            <button
              onClick={() => onQuickAction('contribution')}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition-all shadow-md shadow-emerald-600/20"
            >
              <TrendingUp className="w-4 h-4" />
              Deposit Contribution
            </button>
          </div>
        </div>
        
        {/* Decorative background glow */}
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-linear-to-l from-rose-500/20 to-transparent pointer-events-none" />
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div
              key={idx}
              onClick={() => onNavigate(stat.actionTab)}
              className="cursor-pointer group bg-white p-6 rounded-2xl border border-slate-200/80 hover:border-slate-300 shadow-xs hover:shadow-lg transition-all duration-200 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  {stat.title}
                </span>
                <div className={`w-10 h-10 rounded-xl bg-linear-to-tr ${stat.color} flex items-center justify-center text-white shadow-xs`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mb-1">
                {stat.value}
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{stat.change}</span>
                <span className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform text-slate-400 group-hover:text-slate-900 font-medium inline-flex items-center">
                  View <ArrowUpRight className="w-3.5 h-3.5 ml-0.5" />
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Two Column Layout: Schemes Summary & Quick Test Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Schemes Preview */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Available Pension Schemes</h2>
              <p className="text-xs text-slate-500">Active pension products managed by the system</p>
            </div>
            <button
              onClick={() => onNavigate('schemes')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 hover:underline"
            >
              Manage all ({schemes.length})
            </button>
          </div>

          {schemes.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
              <Building2 className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-slate-600">No schemes registered yet</p>
              <p className="text-xs text-slate-400 mt-1">Create your first scheme to start enrolling members.</p>
              <button
                onClick={() => onQuickAction('add-scheme')}
                className="mt-3 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                Create Scheme
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {schemes.slice(0, 4).map((scheme) => (
                <div
                  key={scheme.id}
                  className="p-4 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-bold text-sm text-slate-900 line-clamp-1">{scheme.name}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      scheme.tier === 0 || scheme.tier === 'Tier2'
                        ? 'bg-purple-100 text-purple-700 border border-purple-200'
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {scheme.tier === 0 || scheme.tier === 'Tier2' ? 'Tier 2' : 'Tier 3'}
                    </span>
                  </div>
                  <div className="text-xs font-mono text-slate-500 mb-2">Code: {scheme.code}</div>
                  <p className="text-xs text-slate-600 line-clamp-2">{scheme.description || 'No description provided.'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column: Demo Checklist & System Architecture */}
        <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              <h2 className="text-base font-bold text-white">System Architecture</h2>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed mb-4">
              This frontend directly talks to your ASP.NET Core Web API with JWT-protected endpoints:
            </p>
            <ul className="space-y-2.5 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Role-Based Security:</strong> AdminOnly & Member policies</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>PostgreSQL Database:</strong> Entity Framework Core</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Ledger Operations:</strong> Contributions & Redemptions</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span><strong>Market NAV:</strong> Historic unit valuation tracking</span>
              </li>
            </ul>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 text-xs text-slate-400">
            <span className="text-slate-200 font-semibold">Logged in as:</span>{' '}
            {currentUser ? (
              <span className="font-mono text-amber-400">{currentUser.email}</span>
            ) : (
              <span className="italic text-slate-400">Anonymous (Sign in to unlock all operations)</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
