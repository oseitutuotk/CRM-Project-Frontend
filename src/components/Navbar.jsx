import React from 'react';
import { 
  Users, 
  Layers, 
  LayoutDashboard, 
  LogIn, 
  LogOut, 
  ShieldCheck, 
  User as UserIcon,
  Sparkles
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, user, onOpenAuth, onLogout }) {
  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'users', label: 'Members', icon: Users },
    { id: 'schemes', label: 'Pension Schemes', icon: Layers },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0f1d33] flex items-center justify-center text-white border border-[#182b49] shadow-xs group transition-transform hover:scale-105 duration-200">
              <span className="font-serif font-black text-xl text-[#c59b27] tracking-wider select-none">P</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-[#0f1d33] tracking-tight">Petra Trust</span>
                <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#fbf7ec] text-[#937119] border border-[#ecdab1]">
                  Trustee
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium -mt-0.5">Pension Administration Portal</p>
            </div>
          </div>

          {/* Clean Navigation Links with pronounced, elegant hover states */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-100/70 p-1 rounded-xl border border-slate-200/80">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all duration-150 ${
                    isActive
                      ? 'bg-[#0f1d33] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80 hover:shadow-2xs'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#c59b27]' : 'text-slate-400'}`} />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* User Profile / Session Control */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
                <div className="text-right hidden sm:block">
                  <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-slate-900">
                    <span>{user.email?.split('@')[0]}</span>
                    {user.role === 1 || user.role === 'Admin' ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#fbf7ec] text-[#937119] border border-[#ecdab1]">
                        Admin
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                        Member
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono truncate max-w-[150px]">{user.email}</p>
                </div>
                <button
                  onClick={onLogout}
                  title="Sign out of account"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all duration-150 active:scale-95"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#0f1d33] text-white hover:bg-[#182b49] transition-all duration-150 shadow-xs hover:shadow-sm active:scale-95"
              >
                <LogIn className="w-3.5 h-3.5 text-[#c59b27]" />
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
                className={`flex flex-col items-center gap-1 text-[11px] font-semibold py-1.5 px-3 rounded-lg transition-colors ${
                  isActive ? 'text-[#0f1d33] bg-slate-100' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#c59b27]' : ''}`} />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
}
