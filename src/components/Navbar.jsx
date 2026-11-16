import React, { useState } from 'react';
import { 
  Flame, 
  Users, 
  Layers, 
  Wallet, 
  LayoutDashboard, 
  LogIn, 
  LogOut, 
  Server, 
  Settings, 
  ShieldCheck, 
  User as UserIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from '../api';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout, onTestConnection, backendStatus }) {
  const [showSettings, setShowSettings] = useState(false);
  const [apiUrl, setApiUrl] = useState(getApiBaseUrl());

  const handleSaveApiUrl = (e) => {
    e.preventDefault();
    setApiBaseUrl(apiUrl);
    setShowSettings(false);
    onTestConnection();
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'Members', icon: Users },
    { id: 'schemes', label: 'Schemes & NAV', icon: Layers },
    { id: 'enrollments', label: 'Portfolios & Funds', icon: Wallet },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 to-rose-600 flex items-center justify-center text-white shadow-md shadow-rose-500/20">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg text-slate-900 tracking-tight">MicroPhoenix</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-slate-500 -mt-0.5">Pension & Scheme Management</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right side controls: Connection Status & Auth */}
          <div className="flex items-center gap-2.5">
            {/* Backend connection pill */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              title="Click to change backend API URL"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                backendStatus === 'online'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : backendStatus === 'offline'
                  ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {backendStatus === 'online' ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              ) : (
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
              )}
              <span className="hidden sm:inline">API:</span>
              <span className="font-mono text-[11px]">
                {backendStatus === 'online' ? 'Connected' : 'Offline'}
              </span>
              <Settings className="w-3 h-3 text-slate-400 ml-0.5 hover:text-slate-600" />
            </button>

            {/* Auth section */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-900 flex items-center justify-end gap-1">
                    {user.role === 1 || user.role === 'Admin' ? (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-purple-100 text-purple-700">
                        <ShieldCheck className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700">
                        <UserIcon className="w-3 h-3" /> Member
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 truncate max-w-[140px]">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-sm font-semibold bg-rose-600 text-white hover:bg-rose-700 shadow-xs shadow-rose-600/30 transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="flex md:hidden items-center justify-around py-2 border-t border-slate-100">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 text-[11px] font-medium py-1 px-2 rounded ${
                  isActive ? 'text-rose-600' : 'text-slate-500'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Backend URL Settings Dropdown Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 bg-slate-900/30 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-xl border border-slate-200">
            <div className="flex items-center gap-2 mb-4 text-slate-900 font-bold">
              <Server className="w-5 h-5 text-amber-500" />
              <h3>Backend API Connection</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Configure the base URL of the ASP.NET Core API. You can connect to your friend's tunnel via proxy (recommended) or direct URL.
            </p>
            <form onSubmit={handleSaveApiUrl} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  API Base URL (leave blank for Dev Tunnel proxy)
                </label>
                <input
                  type="text"
                  value={apiUrl}
                  onChange={(e) => setApiUrl(e.target.value)}
                  placeholder="Proxy (Default: https://vcc4ftq2-7293.uks1.devtunnels.ms)"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex flex-col gap-1.5 text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Quick Presets:</span>
                <div className="flex flex-wrap gap-1.5 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setApiUrl('')}
                    className="px-2 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded hover:bg-amber-100"
                  >
                    Friend's Tunnel (Proxy)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiUrl('https://vcc4ftq2-7293.uks1.devtunnels.ms')}
                    className="px-2 py-1 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200"
                  >
                    Tunnel (Direct)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiUrl('http://localhost:5173')}
                    className="px-2 py-1 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200"
                  >
                    Local 5173
                  </button>
                  <button
                    type="button"
                    onClick={() => setApiUrl('https://localhost:7293')}
                    className="px-2 py-1 bg-slate-100 border border-slate-200 rounded hover:bg-slate-200"
                  >
                    Local 7293
                  </button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettings(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800"
                >
                  Save & Reconnect
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </header>
  );
}
