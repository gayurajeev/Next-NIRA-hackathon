'use client';

import React, { useState } from 'react';
import { useAuth, UserRole } from '@/lib/authContext';
import { X, ShieldCheck, User, Lock, Mail, CheckCircle2, ArrowRight, AlertCircle, Building2 } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: UserRole;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  defaultRole = 'CITIZEN',
}) => {
  const { signInWithGoogle, signInAuthority } = useAuth();
  const [activeTab, setActiveTab] = useState<UserRole>(defaultRole);
  const [email, setEmail] = useState<string>('admin@nira.in');
  const [password, setPassword] = useState<string>('nira@123');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleAuthorityLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');

    const res = await signInAuthority(email, password);
    setIsSubmitting(false);

    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Login failed. Please check credentials.');
    }
  };

  const handleGoogleClick = async () => {
    setIsSubmitting(true);
    setErrorMsg('');
    const res = await signInWithGoogle();
    setIsSubmitting(false);

    if (res && !res.success && res.error) {
      setErrorMsg(res.error);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-md bg-white rounded-[32px] p-6 sm:p-8 border border-blue-100 shadow-2xl space-y-6">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1">
          <div className="w-12 h-12 rounded-2xl bg-[#256BF5] text-white mx-auto flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
            <ShieldCheck className="w-7 h-7 text-[#FFC800]" />
          </div>
          <h3 className="text-2xl font-black text-slate-900">
            Welcome to NIRA
          </h3>
          <p className="text-xs text-slate-500 font-bold">
            Neighborhood Intelligence & Response Assistant
          </p>
        </div>

        {/* Role Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#EDF4FF] p-1.5 rounded-2xl border border-blue-100">
          <button
            type="button"
            onClick={() => {
              setActiveTab('CITIZEN');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'CITIZEN'
                ? 'bg-[#256BF5] text-white shadow-md shadow-blue-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            Citizen
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('GOVERNMENT');
              setErrorMsg('');
            }}
            className={`py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'GOVERNMENT'
                ? 'bg-[#FFC800] text-slate-950 shadow-md shadow-yellow-500/25'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            Government
          </button>
        </div>

        {/* CITIZEN TAB: GOOGLE AUTH */}
        {activeTab === 'CITIZEN' && (
          <div className="space-y-4 text-center">
            <p className="text-xs text-slate-600 font-medium leading-relaxed">
              Sign in with your Google account to submit photo drainage reports, receive municipal status updates, and track resolution timelines.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#EF4444] text-xs font-bold flex items-center gap-2 text-left">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Official Google Button */}
            <button
              onClick={handleGoogleClick}
              disabled={isSubmitting}
              className="w-full py-3.5 px-4 rounded-2xl border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm shadow-sm flex items-center justify-center gap-3 transition-all hover:scale-[1.01] active:scale-95"
            >
              {/* Google G Logo SVG */}
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>{isSubmitting ? 'Connecting Google...' : 'Sign in with Google'}</span>
            </button>
          </div>
        )}

        {/* GOVERNMENT AUTHORITY TAB: EMAIL / PASSWORD */}
        {activeTab === 'GOVERNMENT' && (
          <form onSubmit={handleAuthorityLogin} className="space-y-4 text-left">
            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold">
              Municipal Officer Credentials: <br />
              <span className="font-mono font-black text-slate-900">admin@nira.in</span> / <span className="font-mono font-black text-slate-900">nira@123</span>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-[#EF4444] text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-[#256BF5]" /> Authority Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#256BF5]"
              />
            </div>

            <div>
              <label className="block text-xs font-black text-slate-700 mb-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#256BF5]" /> Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold focus:outline-none focus:border-[#256BF5]"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-2xl bg-[#FFC800] hover:bg-amber-400 text-slate-950 font-black text-sm shadow-md shadow-yellow-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>Login as Municipal Authority</span>
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
