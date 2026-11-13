'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import ThemeToggle from '@/components/layout/ThemeToggle';
import {
  Library,
  BookOpen,
  FolderLock,
  ArrowRight,
  ShieldCheck,
  BarChart3,
  Users,
  CheckCircle2,
  Layers,
  Compass,
} from 'lucide-react';

export default function HomePage() {
  const router = useRouter();
  const { user, login } = useAuth();
  const { showToast } = useToast();
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleQuickLogin = async (email, password, roleLabel) => {
    setLoggingIn(true);
    try {
      await login(email, password);
      showToast(`Welcome back! Logged in as ${roleLabel}`, 'success');
      router.push('/dashboard');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-dark text-slate-800 dark:text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="h-20 border-b border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-royal-600 to-tealAccent-500 flex items-center justify-center text-white shadow-md shadow-royal-900/30">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-lg text-slate-900 dark:text-white tracking-tight flex items-center gap-1.5">
                AuraLib <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-royal-500/10 text-royal-600 dark:text-royal-400 border border-royal-500/20">PRO</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Digital Library Platform</div>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white shadow-md shadow-royal-600/20 hover:shadow-royal-600/30 transition active:scale-[0.98]"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 lg:py-20 flex flex-col justify-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-royal-50 dark:bg-royal-950/60 border border-royal-200/90 dark:border-royal-800 text-royal-700 dark:text-royal-300 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-royal-600 dark:text-royal-400" />
              <span>Institutional University Library & Digital Repository</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tight leading-[1.1]">
              Next-Generation <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-royal-600 via-royal-500 to-tealAccent-500">
                Library & Digital Asset
              </span>{' '}
              Management.
            </h1>

            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
              A comprehensive system uniting physical book circulation with an institutional digital document repository. Features automated fine calculation, desktop-like file explorer, PDF & image previews, role-based authorization, and real-time analytics.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-royal-600 via-royal-700 to-royal-800 hover:from-royal-500 hover:to-royal-700 text-white font-bold text-sm shadow-lg shadow-royal-600/25 hover:shadow-royal-600/35 transition active:scale-[0.98]"
              >
                <span>Launch Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-sm shadow-sm transition active:scale-[0.98]"
              >
                <span>Register as Student</span>
              </Link>
            </div>
          </div>

          {/* Right Card: Quick Demonstration Gateway */}
          <div className="lg:col-span-5">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-xl space-y-6">
              <div>
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 mb-1">
                  <Compass className="w-4 h-4" /> Demonstration Portals
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white">
                  Test-Drive Role Portals
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Select any institutional role to sign in directly with pre-seeded data:
                </p>
              </div>

              <div className="space-y-3">
                {/* Admin */}
                <button
                  type="button"
                  disabled={loggingIn}
                  onClick={() => handleQuickLogin('admin@library.com', 'admin123', 'Chief Administrator')}
                  className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-royal-500 dark:hover:border-royal-500 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-royal-50/50 dark:hover:bg-royal-950/30 transition text-left flex items-center justify-between group active:scale-[0.99]"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Administrator Portal</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-royal-100 text-royal-700 dark:bg-royal-950 dark:text-royal-300">
                        ADMIN
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Full access · Catalog CRUD · Staff control · Analytics · System settings
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-royal-600 transition shrink-0" />
                </button>

                {/* Librarian */}
                <button
                  type="button"
                  disabled={loggingIn}
                  onClick={() => handleQuickLogin('librarian@library.com', 'librarian123', 'Senior Librarian')}
                  className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-teal-500 dark:hover:border-teal-500 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-teal-50/50 dark:hover:bg-teal-950/30 transition text-left flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Librarian Portal</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                        LIBRARIAN
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Circulation desk · Issue & return books · Member management · Uploads
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition shrink-0" />
                </button>

                {/* Student */}
                <button
                  type="button"
                  disabled={loggingIn}
                  onClick={() => handleQuickLogin('student@library.com', 'student123', 'Student Member')}
                  className="w-full p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-500 dark:hover:border-amber-500 bg-slate-50/70 dark:bg-slate-800/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/30 transition text-left flex items-center justify-between group"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>Student Portal</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300">
                        STUDENT
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Browse catalog · Reserve books · View loan due dates · Download files
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-600 transition shrink-0" />
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline"
                >
                  Or log in with an existing custom account →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Showcase Grid */}
      <section className="border-t border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900/50 py-16 px-6">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Architected for University Excellence
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">
              Every major module is fully connected to the SQLite persistent database with Prisma ORM.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-royal-100 dark:bg-royal-950/60 text-royal-600 flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Catalog & Inventory</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Add, edit, bulk import CSVs, shelf bays, ISBN checking, and real-time physical stock counts.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                <ArrowRight className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Circulation & Fines</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Transactional issuance, automatic stock decrements, overdue calculation, and late fine records.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-teal-100 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center">
                <FolderLock className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Digital Document Hub</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Desktop-like file explorer, folder hierarchies, in-browser PDF preview, and secure streaming.
              </p>
            </div>

            <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">Analytics & Reports</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                Monthly loan trends, category distribution charts, CSV exports, and print-ready sheets.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 dark:border-slate-800 py-8 px-6 text-center text-xs text-slate-500 dark:text-slate-400">
        AuraLib Pro © 2026. Academic Final-Year Project Demonstration Platform.
      </footer>
    </div>
  );
}
