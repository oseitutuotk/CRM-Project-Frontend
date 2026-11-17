import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  X, 
  AlertCircle, 
  Lock, 
  Mail
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onLogin, onRegister }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerForm, setRegisterForm] = useState({
    lastName: '',
    otherNames: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: 0, // 0 = Member, 1 = Admin
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await onLogin(email, password);
      if (res.ok) {
        onClose();
      } else {
        setError(res.error || 'Invalid credentials or user record not found.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await onRegister(registerForm);
      if (res.ok) {
        const loginRes = await onLogin(registerForm.email, registerForm.password);
        if (loginRes.ok) {
          onClose();
        } else {
          setMode('login');
          setEmail(registerForm.email);
          setPassword(registerForm.password);
        }
      } else {
        setError(res.error || 'Registration failed. Please check the provided information.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 sm:p-7 max-w-sm w-full border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#0f1d33] flex items-center justify-center text-white">
              <span className="font-serif font-black text-xs text-[#c59b27]">P</span>
            </div>
            <h3 className="text-sm font-bold text-[#0f1d33]">
              {mode === 'login' ? 'Trustee Portal Sign In' : 'Register Contributor'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg mt-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-1.5 rounded transition-all ${
              mode === 'login' ? 'bg-white text-[#0f1d33] font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-1.5 rounded transition-all ${
              mode === 'register' ? 'bg-white text-[#0f1d33] font-semibold shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Create Account
          </button>
        </div>

        {error && (
          <div className="mt-3 p-2.5 rounded bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-3 mt-4">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="email"
                  required
                  placeholder="name@petratrust.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f1d33]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f1d33]"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-[#0f1d33] hover:bg-[#182b49] text-white font-semibold text-xs rounded shadow-xs transition-colors disabled:opacity-50 mt-2"
            >
              {submitting ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">First Names *</label>
                <input
                  type="text"
                  required
                  placeholder="Kwabena"
                  value={registerForm.otherNames}
                  onChange={(e) => setRegisterForm({ ...registerForm, otherNames: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f1d33]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Osei"
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f1d33]"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Email Address *</label>
              <input
                type="email"
                required
                placeholder="member@petratrust.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f1d33]"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Telephone</label>
                <input
                  type="text"
                  placeholder="+233 24..."
                  value={registerForm.phoneNumber}
                  onChange={(e) => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f1d33]"
                />
              </div>
              <div>
                <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Account Role</label>
                <select
                  value={registerForm.role}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs bg-white focus:outline-hidden focus:ring-1 focus:ring-[#0f1d33]"
                >
                  <option value={0}>Member</option>
                  <option value={1}>Administrator</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-0.5">Password *</label>
              <input
                type="password"
                required
                placeholder="Password123!"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-xs focus:outline-hidden focus:ring-1 focus:ring-[#0f1d33]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2 bg-[#0f1d33] hover:bg-[#182b49] text-white font-semibold text-xs rounded shadow-xs transition-colors disabled:opacity-50 mt-1"
            >
              {submitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
