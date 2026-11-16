import React, { useState } from 'react';
import { 
  LogIn, 
  UserPlus, 
  X, 
  AlertCircle, 
  ShieldCheck, 
  User, 
  Lock, 
  Mail, 
  Sparkles,
  Phone
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
        setError(res.error || 'Invalid credentials or user not found');
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
        // Automatically attempt login with new credentials
        const loginRes = await onLogin(registerForm.email, registerForm.password);
        if (loginRes.ok) {
          onClose();
        } else {
          setMode('login');
          setEmail(registerForm.email);
          setPassword(registerForm.password);
        }
      } else {
        setError(res.error || 'Registration failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-500 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {mode === 'login' ? 'Sign In to MicroPhoenix' : 'Create an Account'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex bg-slate-100 p-1 rounded-xl mt-4 text-xs font-semibold">
          <button
            type="button"
            onClick={() => { setMode('login'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode('register'); setError(''); }}
            className={`flex-1 py-2 rounded-lg transition-all ${
              mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Register
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {mode === 'login' ? (
          <form onSubmit={handleLoginSubmit} className="space-y-4 mt-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="email"
                  required
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            {/* Quick Demo Credentials */}
            <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl">
              <div className="text-[11px] font-bold text-amber-900 flex items-center gap-1 mb-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                Demo Credentials Shortcut
              </div>
              <p className="text-[11px] text-amber-800 mb-2">
                Click below to auto-fill sample credentials from your backend:
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleFillDemo('david@example.com', 'Password123!')}
                  className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100/50"
                >
                  david@example.com
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all disabled:opacity-50"
            >
              {submitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegisterSubmit} className="space-y-3.5 mt-4">
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">First Names *</label>
                <input
                  type="text"
                  required
                  placeholder="Kwabena"
                  value={registerForm.otherNames}
                  onChange={(e) => setRegisterForm({ ...registerForm, otherNames: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Last Name *</label>
                <input
                  type="text"
                  required
                  placeholder="Osei"
                  value={registerForm.lastName}
                  onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Email *</label>
              <input
                type="email"
                required
                placeholder="kwabena@example.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Phone</label>
                <input
                  type="text"
                  placeholder="+233 24..."
                  value={registerForm.phoneNumber}
                  onChange={(e) => setRegisterForm({ ...registerForm, phoneNumber: e.target.value })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">Role</label>
                <select
                  value={registerForm.role}
                  onChange={(e) => setRegisterForm({ ...registerForm, role: Number(e.target.value) })}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                >
                  <option value={0}>Member</option>
                  <option value={1}>Admin</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">Password *</label>
              <input
                type="password"
                required
                placeholder="Password123!"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-sm focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all disabled:opacity-50 mt-2"
            >
              {submitting ? 'Registering...' : 'Complete Registration'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
