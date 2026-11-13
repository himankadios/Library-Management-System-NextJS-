'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import {
  ArrowLeft,
  ArrowDownLeft,
  Search,
  BookOpen,
  User,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';

export default function ReturnBookPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [activeLoans, setActiveLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedTx, setSelectedTx] = useState(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [fineRate, setFineRate] = useState(1.0);

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

  // Fetch active loans (ISSUED or OVERDUE)
  const fetchActiveLoans = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/circulation/transactions?status=ACTIVE&limit=100');
      const data = await res.json();
      setActiveLoans(data.transactions || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load active loans', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveLoans();
  }, []);

  const filteredLoans = activeLoans.filter((tx) => {
    const q = search.toLowerCase();
    return (
      tx.book?.title?.toLowerCase().includes(q) ||
      tx.book?.isbn?.toLowerCase().includes(q) ||
      tx.member?.user?.name?.toLowerCase().includes(q) ||
      tx.member?.rollNumber?.toLowerCase().includes(q)
    );
  });

  // Calculate overdue details for selected loan
  let overdueDays = 0;
  let fineAmount = 0.0;
  if (selectedTx) {
    const now = new Date();
    const dueDate = new Date(selectedTx.dueDate);
    if (now > dueDate) {
      const diffMs = Math.abs(now - dueDate);
      overdueDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      fineAmount = overdueDays * fineRate;
    }
  }

  const handleReturnSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTx) {
      showToast('Please select a book transaction to return', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/circulation/return', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionId: selectedTx.id,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setSelectedTx(null);
      setNotes('');
      fetchActiveLoans();
      router.push('/dashboard/circulation/history');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/circulation/issued"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Process Book Return
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Accept returned volume, automatically recalculate overdue days, and update stack counts
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Active Loans Search & Selection */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by title, ISBN, student name, or roll number..."
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            />
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Loading active circulation transactions...
              </div>
            ) : filteredLoans.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                No active borrowed books match your search.
              </div>
            ) : (
              filteredLoans.map((tx) => {
                const isSelected = selectedTx?.id === tx.id;
                const isOverdue = new Date() > new Date(tx.dueDate);

                return (
                  <div
                    key={tx.id}
                    onClick={() => setSelectedTx(tx)}
                    className={`p-4 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-4 ${
                      isSelected
                        ? 'border-royal-600 bg-royal-50/50 dark:bg-royal-950/30'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <img
                        src={tx.book?.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                        alt={tx.book?.title}
                        className="w-10 h-13 object-cover rounded-lg shadow-sm shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {tx.book?.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          Held by: <span className="font-semibold text-slate-700 dark:text-slate-300">{tx.member?.user?.name}</span> ({tx.member?.rollNumber})
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Due: {new Date(tx.dueDate).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div className="shrink-0 text-right">
                      <Badge variant={isOverdue ? 'danger' : 'primary'}>
                        {isOverdue ? 'OVERDUE' : 'ISSUED'}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Return Confirmation & Fine Calculator */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between">
          <div className="space-y-5">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Return Summary
            </h3>

            {selectedTx ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Book</span>
                    <span className="font-bold text-slate-900 dark:text-white">{selectedTx.book?.title}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Borrower</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {selectedTx.member?.user?.name} ({selectedTx.member?.rollNumber})
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Scheduled Due Date</span>
                    <span className="font-mono text-slate-700 dark:text-slate-300">
                      {new Date(selectedTx.dueDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {/* Overdue Calculation */}
                <div className={`p-4 rounded-2xl border ${overdueDays > 0 ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    {overdueDays > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    <span className={`text-xs font-bold ${overdueDays > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {overdueDays > 0 ? `${overdueDays} Days Overdue` : 'Returned On Time'}
                    </span>
                  </div>
                  {overdueDays > 0 ? (
                    <div className="text-xs text-rose-600 dark:text-rose-400">
                      Late Fine: <span className="font-bold text-base">${fineAmount.toFixed(2)}</span> (${fineRate}/day)
                    </div>
                  ) : (
                    <div className="text-xs text-emerald-600 dark:text-emerald-400">
                      No late fees applicable.
                    </div>
                  )}
                </div>

                {/* Return Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                    Return Condition / Remarks
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Good condition, returned to Shelf A-04"
                    rows={2}
                    className="w-full p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
                  />
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                Select a borrowed book from the list on the left to process its return.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleReturnSubmit}
              disabled={!selectedTx || submitting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white font-semibold text-xs sm:text-sm disabled:opacity-40 transition shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{submitting ? 'Processing Return...' : 'Confirm Book Return'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
