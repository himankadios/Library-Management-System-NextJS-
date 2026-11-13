'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/providers/ToastProvider';
import { Library, Mail, ArrowRight, ArrowLeft, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoCode, setDemoCode] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      if (data.demoCode) {
        setDemoCode(data.demoCode);
      }
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-dark p-4 sm:p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-royal-600 to-tealAccent-500 flex items-center justify-center text-white shadow-lg shadow-royal-900/30">
              <Library className="w-6 h-6" />
            </div>
          </Link>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Forgot Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Enter your registered university email to receive a password reset verification code
          </p>
        </div>

        {demoCode && (
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5">
              <KeyRound className="w-4 h-4" /> Demo Reset Code Generated:
            </div>
            <div className="font-mono text-xl font-black text-emerald-600 dark:text-emerald-400">
              {demoCode}
            </div>
            <Link
              href={`/reset-password?email=${encodeURIComponent(email)}&code=${demoCode}`}
              className="inline-block font-bold text-royal-600 dark:text-royal-400 hover:underline pt-1"
            >
              Click here to proceed to Reset Password form →
            </Link>
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Registered Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="student@library.com"
                className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-royal-900/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Generating Code...' : 'Request Reset Code'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
