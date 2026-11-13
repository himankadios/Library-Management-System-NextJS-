'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import { Library, Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      showToast('Signed in successfully!', 'success');
      router.push('/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-dark p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        {/* Brand */}
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-royal-600 to-tealAccent-500 flex items-center justify-center text-white shadow-lg shadow-royal-900/30">
              <Library className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Sign In to AuraLib Pro
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Access circulation, academic materials, and system portals
          </p>
        </div>

        {/* Demo Fast Fill Buttons */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5 px-1">
            <KeyRound className="w-3.5 h-3.5 text-royal-600 dark:text-royal-400" />
            <span>Preset Demonstration Credentials</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('admin@library.com', 'admin123')}
              className="px-2.5 py-2 rounded-xl border border-royal-200 dark:border-royal-900 bg-royal-50/70 dark:bg-royal-950/40 text-royal-700 dark:text-royal-300 text-[11px] font-bold hover:bg-royal-100 dark:hover:bg-royal-900/50 shadow-sm transition active:scale-[0.98]"
            >
              Admin
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('librarian@library.com', 'librarian123')}
              className="px-2.5 py-2 rounded-xl border border-teal-200 dark:border-teal-900 bg-teal-50/70 dark:bg-teal-950/40 text-teal-700 dark:text-teal-300 text-[11px] font-bold hover:bg-teal-100 dark:hover:bg-teal-900/50 shadow-sm transition active:scale-[0.98]"
            >
              Librarian
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('student@library.com', 'student123')}
              className="px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 text-[11px] font-bold hover:bg-slate-100 dark:hover:bg-slate-700 shadow-sm transition active:scale-[0.98]"
            >
              Student
            </button>
          </div>
        </div>

        {/* Main Login Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@university.edu"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Password
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-royal-900/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          New student?{' '}
          <Link href="/register" className="font-bold text-royal-600 dark:text-royal-400 hover:underline">
            Register for library membership
          </Link>
        </p>
      </div>
    </div>
  );
}
