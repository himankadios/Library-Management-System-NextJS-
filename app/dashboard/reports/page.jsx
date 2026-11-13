'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import StatCard from '@/components/ui/StatCard';
import MonthlyActivityChart from '@/components/charts/MonthlyActivityChart';
import CategoryPieChart from '@/components/charts/CategoryPieChart';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import Badge from '@/components/ui/Badge';
import {
  BarChart3,
  Download,
  Printer,
  Calendar,
  BookOpen,
  ArrowUpRight,
  ArrowDownLeft,
  AlertTriangle,
  FileText,
  DollarSign,
  TrendingUp,
} from 'lucide-react';

export default function ReportsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (startDate) q.append('startDate', startDate);
      if (endDate) q.append('endDate', endDate);

      const res = await fetch(`/api/reports?${q}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
      showToast('Failed to load reports', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return <LoadingSkeleton />;
  }

  const summary = data?.summary || {};
  const mostBorrowed = data?.mostBorrowedBooks || [];
  const categories = data?.categoryDistribution || [];
  const fileDist = data?.fileDistribution || [];
  const monthlyStats = data?.monthlyStats || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200 print:p-0">
      {/* Header and Print/Export controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-royal-600" />
            <span>Reports & Analytics Intelligence</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Real-time circulation aggregates, inventory velocity, and digital repository statistics
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            <Printer className="w-4 h-4 text-slate-400" />
            <span>Print Report</span>
          </button>

          <a
            href="/api/reports/export"
            download
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </a>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-wrap items-center gap-4 print:hidden">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-royal-500" />
          <span>Filter Date Range:</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          />
          <span className="text-xs text-slate-400">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none"
          />
          <button
            onClick={fetchReports}
            className="px-3.5 py-1.5 rounded-xl bg-royal-600 text-white text-xs font-semibold hover:bg-royal-700 transition"
          >
            Apply
          </button>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Catalog Stock"
          value={summary.totalCopies || 0}
          icon={BookOpen}
          color="royal"
          subtitle={`${summary.totalBooks || 0} unique titles`}
        />
        <StatCard
          title="Copies Available"
          value={summary.availableCopies || 0}
          icon={TrendingUp}
          color="emerald"
          subtitle={`${summary.issuedCopies || 0} checked out`}
        />
        <StatCard
          title="Successful Returns"
          value={summary.returnedCount || 0}
          icon={ArrowDownLeft}
          color="teal"
          subtitle="Processed & reshelved"
        />
        <StatCard
          title="Fines Assessed"
          value={`$${(summary.totalFines || 0).toFixed(2)}`}
          icon={AlertTriangle}
          color="rose"
          subtitle="Late return fees"
        />
      </div>

      {/* Interactive Activity Chart */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Monthly Circulation Velocity Breakdown
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comparing books issued, returned, and items past scheduled due dates
          </p>
        </div>
        <MonthlyActivityChart data={monthlyStats} />
      </div>

      {/* Two Column Section: Most Borrowed Books & Digital Upload Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Borrowed Books */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Most Borrowed Academic Volumes
          </h3>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {mostBorrowed.map((b, i) => (
              <div key={b.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-royal-100 dark:bg-royal-950/60 text-royal-600 font-bold text-xs flex items-center justify-center shrink-0">
                    #{i + 1}
                  </div>
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900 dark:text-white truncate">
                      {b.title}
                    </div>
                    <div className="text-xs text-slate-400 truncate">
                      {b.author} · {b.category}
                    </div>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <Badge variant="primary">{b.borrowCount} Loans</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Files by Category */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Digital Asset Repository Distribution
          </h3>

          <div className="space-y-3">
            {fileDist.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-royal-500" />
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {item.category}
                  </span>
                </div>
                <Badge variant="teal">{item.count} Files</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
