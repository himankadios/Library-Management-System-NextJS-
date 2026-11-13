'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import { History, Search, Download } from 'lucide-react';

export default function CirculationHistoryPage() {
  const { user } = useAuth();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        status: statusFilter,
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
    fetchHistory();
  }, [page, search, statusFilter]);

  const getStatusBadge = (status) => {
    switch (status) {
      case 'RETURNED':
        return <Badge variant="success">RETURNED</Badge>;
      case 'OVERDUE':
        return <Badge variant="danger">OVERDUE</Badge>;
      default:
        return <Badge variant="primary">ISSUED</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <History className="w-6 h-6 text-royal-600" />
            <span>Circulation & Borrowing History</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {totalCount} total circulation transactions recorded
          </p>
        </div>

        {isStaff && (
          <a
            href="/api/reports/export"
            download
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-slate-400" />
            <span>Export Circulation Log</span>
          </a>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by book title, student name, roll number..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-royal-500"
        >
          <option value="ALL">All Statuses</option>
          <option value="ISSUED">Currently Issued</option>
          <option value="OVERDUE">Overdue</option>
          <option value="RETURNED">Successfully Returned</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : transactions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No circulation history found"
          description="No transaction records match the current filter selection."
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
                  <th className="px-5 py-3.5">Return Date</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Fine</th>
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
                        ISBN: {tx.book?.isbn}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {tx.member?.user?.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {tx.member?.rollNumber} · {tx.member?.department}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {new Date(tx.issueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {new Date(tx.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-slate-300">
                      {tx.returnDate ? new Date(tx.returnDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(tx.status)}</td>
                    <td className="px-5 py-4 text-right">
                      {tx.fineAmount > 0 ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          ${tx.fineAmount.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
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
