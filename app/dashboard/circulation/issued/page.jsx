'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import { Clock, Search, ArrowUpRight, ArrowDownLeft, AlertTriangle } from 'lucide-react';

export default function IssuedBooksPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: 'ISSUED',
        page: String(page),
        limit: '15',
        search,
      });
      const res = await fetch(`/api/circulation/transactions?${q}`);
      const data = await res.json();
      setTransactions(data.transactions || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [page, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {isStaff ? 'Currently Issued Books' : 'My Active Borrowed Books'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {totalCount} active items currently checked out on loan
          </p>
        </div>

        {isStaff && (
          <div className="flex items-center gap-2.5">
            <Link
              href="/dashboard/circulation/return"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
            >
              <ArrowDownLeft className="w-4 h-4 text-royal-500" /> Return Book
            </Link>
            <Link
              href="/dashboard/circulation/issue"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <ArrowUpRight className="w-4 h-4" /> Issue Book
            </Link>
          </div>
        )}
      </div>

      {/* Search Bar */}
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
            placeholder="Search by book title, ISBN, student name, or roll number..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={6} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No currently issued books"
          description="There are no active circulation records matching your query."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Book Title</th>
                  <th className="px-5 py-3.5">Borrower</th>
                  <th className="px-5 py-3.5">Issue Date</th>
                  <th className="px-5 py-3.5">Due Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  {isStaff && <th className="px-5 py-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {tx.book?.title}
                      </div>
                      <div className="text-xs text-slate-400 font-mono">
                        ISBN: {tx.book?.isbn} · Shelf: {tx.book?.shelfNumber || 'Open'}
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
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(tx.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-semibold text-royal-600 dark:text-royal-400">
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="primary">ISSUED</Badge>
                    </td>
                    {isStaff && (
                      <td className="px-5 py-4 text-right">
                        <Link
                          href="/dashboard/circulation/return"
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-royal-50 dark:bg-royal-950/40 hover:bg-royal-100 text-royal-600 dark:text-royal-400 text-xs font-semibold transition"
                        >
                          <ArrowDownLeft className="w-3.5 h-3.5" /> Return
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
