'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import StatCard from '@/components/ui/StatCard';
import BookIssuanceChart from '@/components/charts/BookIssuanceChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Badge from '@/components/ui/Badge';
import {
  BookOpen,
  Users,
  FolderLock,
  Clock,
  AlertTriangle,
  BookmarkCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  ShieldCheck,
  FileText,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch('/api/dashboard/stats');
        if (res.ok) {
          const json = await res.json();
          setData(json);
        }
      } catch (err) {
        console.error('Failed to load dashboard statistics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const metrics = data?.metrics || {};
  const charts = data?.charts || {};
  const recent = data?.recentActivity || {};
  const studentStats = data?.studentStats;

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-navy via-slate-900 to-royal-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-royal-500/20 text-royal-300 text-xs font-semibold border border-royal-500/30 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Welcome to AuraLib Pro Management Hub</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mb-2">
            Hello, {user?.name}
          </h1>
          <p className="text-sm text-slate-300 leading-relaxed">
            {isStaff
              ? 'Complete institutional circulation oversight, catalog administration, and secured digital repository control.'
              : 'Browse physical library books, check your active loan due dates, reserve copies, and access official academic resources.'}
          </p>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-royal-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Student Personal Highlights (if role === STUDENT) */}
      {!isStaff && studentStats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            title="My Active Loans"
            value={studentStats.activeLoansCount}
            icon={BookOpen}
            color="royal"
            subtitle={`${user?.memberProfile?.maxBooksAllowed || 4} books maximum allowed`}
          />
          <StatCard
            title="Overdue Books"
            value={studentStats.overdueCount}
            icon={AlertTriangle}
            color={studentStats.overdueCount > 0 ? 'rose' : 'emerald'}
            subtitle={studentStats.overdueCount > 0 ? 'Please return to avoid fines' : 'No overdue loans'}
          />
          <StatCard
            title="Active Reservations"
            value={studentStats.reservationsCount}
            icon={BookmarkCheck}
            color="amber"
            subtitle="Holds placed on library titles"
          />
          <StatCard
            title="Outstanding Fines"
            value={`$${studentStats.unpaidFinesTotal.toFixed(2)}`}
            icon={Clock}
            color={studentStats.unpaidFinesTotal > 0 ? 'rose' : 'emerald'}
            subtitle={studentStats.unpaidFinesTotal > 0 ? 'Pay at library helpdesk' : 'All clear'}
          />
        </div>
      )}

      {/* Primary Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Total Catalog Titles"
          value={metrics.totalBooks || 0}
          icon={BookOpen}
          color="royal"
          subtitle={`${metrics.totalCopies || 0} total physical copies in library`}
        />
        <StatCard
          title="Available Books"
          value={metrics.availableCopies || 0}
          icon={CheckCircle2}
          color="emerald"
          subtitle="Ready for immediate circulation"
        />
        <StatCard
          title="Currently Issued"
          value={metrics.issuedCopies || 0}
          icon={ArrowUpRight}
          color="indigo"
          subtitle={`${metrics.issuedTransactions || 0} active loans`}
        />
        <StatCard
          title="Overdue Returns"
          value={metrics.overdueTransactions || 0}
          icon={AlertTriangle}
          color="rose"
          subtitle="Late returns incurring fines"
        />
      </div>

      {/* Secondary Metrics Row (Members, Digital Files, Reservations) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <StatCard
          title="Registered Members"
          value={metrics.totalMembers || 0}
          icon={Users}
          color="teal"
          subtitle="Students and academic faculty"
        />
        <StatCard
          title="Digital Repository Files"
          value={metrics.totalFiles || 0}
          icon={FolderLock}
          color="royal"
          subtitle="Syllabi, papers, exams, notes"
        />
        <StatCard
          title="Pending Reservations"
          value={metrics.pendingReservations || 0}
          icon={BookmarkCheck}
          color="amber"
          subtitle="Member book hold requests"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Circulation Trends */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Circulation Activity Trends
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Monthly comparison of book issuances vs successful returns
              </p>
            </div>
            <div className="flex items-center gap-3 text-xs font-medium">
              <span className="flex items-center gap-1.5 text-royal-600 dark:text-royal-400">
                <span className="w-2.5 h-2.5 rounded-full bg-royal-600"></span> Issued
              </span>
              <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Returned
              </span>
            </div>
          </div>
          <BookIssuanceChart data={charts.monthlyTrends || []} />
        </div>

        {/* Category Breakdown */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col">
          <div className="mb-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Category Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Inventory breakdown across academic disciplines
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <CategoryPieChart data={charts.categoryDistribution || []} />
          </div>
          <div className="mt-2 space-y-1.5 max-h-36 overflow-y-auto text-xs">
            {charts.categoryDistribution?.slice(0, 5).map((cat, i) => (
              <div key={i} className="flex items-center justify-between py-1 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
                <span className="text-slate-600 dark:text-slate-300 truncate max-w-[170px]">{cat.name}</span>
                <span className="font-bold text-slate-800 dark:text-slate-100">{cat.value} books</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Circulation Transactions */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recent Circulation Events
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Latest active book issues and returns
              </p>
            </div>
            <Link
              href="/dashboard/circulation/history"
              className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline flex items-center gap-1"
            >
              View All <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recent.recentIssues && recent.recentIssues.length > 0 ? (
              recent.recentIssues.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-royal-100 dark:bg-royal-950/60 flex items-center justify-center text-royal-600 shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.book?.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        Issued to {tx.member?.user?.name}
                      </div>
                    </div>
                  </div>
                  <Badge variant={tx.status === 'OVERDUE' ? 'danger' : 'primary'}>
                    {tx.status}
                  </Badge>
                </div>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No circulation activity yet.</div>
            )}
          </div>
        </div>

        {/* Recently Added Books */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Recently Added Titles
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                New acquisitions in the central catalog
              </p>
            </div>
            <Link
              href="/dashboard/books"
              className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline flex items-center gap-1"
            >
              View Catalog <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recent.recentBooks && recent.recentBooks.length > 0 ? (
              recent.recentBooks.map((b) => (
                <Link
                  key={b.id}
                  href={`/dashboard/books/${b.id}`}
                  className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 hover:bg-slate-100/70 dark:hover:bg-slate-800 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={b.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                      alt={b.title}
                      className="w-10 h-13 object-cover rounded-lg shadow-sm shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {b.title}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {b.author} · {b.category?.name}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                    {b.availableCopies}/{b.totalCopies} Avail
                  </span>
                </Link>
              ))
            ) : (
              <div className="p-6 text-center text-xs text-slate-400">No books cataloged yet.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
