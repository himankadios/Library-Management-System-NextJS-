'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import {
  AlertTriangle,
  Search,
  ArrowDownLeft,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export default function OverdueBooksPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOverdue, setTotalOverdue] = useState(0);
  const [fineRate, setFineRate] = useState(1.0);

  const fetchOverdue = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: 'OVERDUE',
        page: String(page),
        limit: '15',
        search,
      });
      const res = await fetch(`/api/circulation/transactions?${q}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalOverdue(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      showToast('Failed to load overdue records', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch fine rate from settings
  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((data) => {
        if (data.settings?.FINE_PER_DAY) {
          setFineRate(parseFloat(data.settings.FINE_PER_DAY) || 1.0);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    fetchOverdue();
  }, [page, search]);

  const calculateOverdueDays = (dueDate) => {
    const diff = new Date() - new Date(dueDate);
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const calculateFine = (dueDate) => {
    return (calculateOverdueDays(dueDate) * fineRate).toFixed(2);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            <span>Overdue Book Loans</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {totalOverdue} active loans currently exceeding permitted borrowing schedules
          </p>
        </div>

        {isStaff && (
          <Link
            href="/dashboard/circulation/return"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-semibold shadow-sm transition"
          >
            <ArrowDownLeft className="w-4 h-4" /> Process Return
          </Link>
        )}
      </div>

      {/* Search Filter */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search overdue records by book title, member or roll number..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
          />
        </div>
      </div>

      {/* Overdue Table */}
      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No overdue books!"
          description="All active borrowed books are currently within their permitted loan periods."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Book Title</th>
                  <th className="px-5 py-3.5">Borrower</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Days Overdue</th>
                  <th className="px-5 py-3.5">Accrued Fine</th>
                  {isStaff && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => {
                  const days = calculateOverdueDays(tx.dueDate);
                  const fine = calculateFine(tx.dueDate);

                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {tx.book?.title}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          ISBN: {tx.book?.isbn}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {tx.member?.user?.name}
                        </div>
                        <div className="text-xs text-slate-400">
                          Roll: {tx.member?.rollNumber} · {tx.member?.department}
                        </div>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                        {new Date(tx.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 font-bold text-rose-600 dark:text-rose-400">
                          {days} day(s) late
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-rose-600 dark:text-rose-400">
                        ${fine}
                      </td>
                      {isStaff && (
                        <td className="px-5 py-4 text-right">
                          <Link
                            href={`/dashboard/circulation/return`}
                            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-royal-600 hover:bg-royal-700 text-white text-xs font-semibold transition"
                          >
                            <ArrowDownLeft className="w-3.5 h-3.5" /> Return Now
                          </Link>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
