'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useToast } from '@/components/providers/ToastProvider';
import {
  ArrowLeft,
  ArrowUpRight,
  BookOpen,
  User,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

function IssueBookForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookId = searchParams.get('bookId') || '';

  const { showToast } = useToast();
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Default due date: 14 days from today
  const defaultDueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [form, setForm] = useState({
    bookId: preselectedBookId,
    memberId: '',
    dueDate: defaultDueDate,
    notes: '',
  });

  useEffect(() => {
    Promise.all([
      fetch('/api/books?limit=100').then((r) => r.json()),
      fetch('/api/members?limit=100').then((r) => r.json()),
    ])
      .then(([booksData, membersData]) => {
        setBooks(booksData.books || []);
        setMembers(membersData.members || []);
      })
      .catch((err) => {
        console.error(err);
        showToast('Failed to load circulation options', 'error');
      })
      .finally(() => setLoading(false));
  }, [showToast]);

  const selectedBook = books.find((b) => b.id === form.bookId);
  const selectedMember = members.find((m) => m.id === form.memberId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.bookId || !form.memberId) {
      showToast('Please select both a book and a member', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/circulation/issue', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      router.push('/dashboard/circulation/issued');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm p-6 sm:p-8 space-y-6">
      {/* Book Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
          1. Select Catalog Book *
        </label>
        <select
          value={form.bookId}
          onChange={(e) => setForm({ ...form, bookId: e.target.value })}
          required
          className="w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
        >
          <option value="">-- Choose a book title --</option>
          {books.map((b) => (
            <option
              key={b.id}
              value={b.id}
              disabled={b.availableCopies <= 0}
            >
              {b.title} (ISBN: {b.isbn}) — [{b.availableCopies} available / {b.totalCopies} total] {b.availableCopies <= 0 ? '- (OUT OF STOCK)' : ''}
            </option>
          ))}
        </select>

        {selectedBook && (
          <div className="mt-3 p-4 rounded-2xl bg-royal-50/60 dark:bg-royal-950/30 border border-royal-100 dark:border-royal-900/50 flex items-center gap-4">
            <img
              src={selectedBook.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
              alt={selectedBook.title}
              className="w-12 h-16 object-cover rounded-lg shadow-sm"
            />
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {selectedBook.title}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                by {selectedBook.author} · Shelf: <span className="font-mono font-bold text-royal-600 dark:text-royal-400">{selectedBook.shelfNumber || 'Open'}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{selectedBook.availableCopies} physical copies available for circulation</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Member Selector */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
          2. Select Library Member (Student) *
        </label>
        <select
          value={form.memberId}
          onChange={(e) => setForm({ ...form, memberId: e.target.value })}
          required
          className="w-full px-4 py-3 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
        >
          <option value="">-- Choose member / student --</option>
          {members.map((m) => (
            <option key={m.id} value={m.id} disabled={m.status !== 'ACTIVE'}>
              {m.user?.name} (Roll: {m.rollNumber}) — {m.department} [{m.activeLoansCount}/{m.maxBooksAllowed} books borrowed]
            </option>
          ))}
        </select>

        {selectedMember && (
          <div className="mt-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedMember.user?.name} ({selectedMember.rollNumber})
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {selectedMember.department} · {selectedMember.course}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Loans: {selectedMember.activeLoansCount} / {selectedMember.maxBooksAllowed}
              </div>
              {selectedMember.activeLoansCount >= selectedMember.maxBooksAllowed ? (
                <span className="text-[11px] font-bold text-rose-500">Borrowing Limit Reached</span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-500">Eligible to Borrow</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Due Date & Notes */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Scheduled Return Due Date *
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            required
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
            Internal Circulation Notes (Optional)
          </label>
          <input
            type="text"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            placeholder="e.g. Special reference loan for semester research"
            className="w-full px-4 py-2.5 text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100 dark:border-slate-800">
        <Link
          href="/dashboard/circulation/issued"
          className="px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-sm font-semibold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={submitting || !selectedBook || selectedBook.availableCopies <= 0}
          className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 disabled:opacity-50 text-white font-semibold text-sm shadow-md hover:shadow-lg transition active:scale-[0.98]"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>{submitting ? 'Recording Circulation...' : 'Confirm Book Issuance'}</span>
        </button>
      </div>
    </form>
  );
}

export default function IssueBookPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center gap-3">
        <Link
          href="/dashboard/circulation/issued"
          className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Issue Book to Member
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Circulate an available catalog title, set return due date, and log physical handover
          </p>
        </div>
      </div>

      <Suspense fallback={<div className="p-12 text-center text-slate-400">Loading form...</div>}>
        <IssueBookForm />
      </Suspense>
    </div>
  );
}
