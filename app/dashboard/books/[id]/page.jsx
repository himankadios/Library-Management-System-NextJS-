'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import {
  ArrowLeft,
  BookOpen,
  Edit,
  Trash2,
  BookmarkCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  MapPin,
  Calendar,
  Layers,
  Globe,
  Hash,
} from 'lucide-react';

export default function BookDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const isAdmin = user?.role === 'ADMIN';

  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  // Reservation modal
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [reserveNotes, setReserveNotes] = useState('');
  const [reserving, setReserving] = useState(false);

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetch(`/api/books/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error('Book not found');
        return res.json();
      })
      .then((data) => setBook(data.book))
      .catch((err) => {
        showToast(err.message, 'error');
        router.push('/dashboard/books');
      })
      .finally(() => setLoading(false));
  }, [id, router, showToast]);

  const handleReserve = async (e) => {
    e.preventDefault();
    setReserving(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookId: id, notes: reserveNotes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setReserveModalOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReserving(false);
    }
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`/api/books/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Book deleted successfully', 'success');
      router.push('/dashboard/books');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-12 text-center text-slate-400">
        Loading book catalog details...
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-200">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/books"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-royal-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Catalog
        </Link>

        <div className="flex items-center gap-2">
          {!isStaff && (
            <button
              onClick={() => setReserveModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs font-semibold shadow-sm transition"
            >
              <BookmarkCheck className="w-4 h-4" /> Reserve Title
            </button>
          )}

          {isStaff && (
            <>
              <Link
                href={`/dashboard/circulation/issue?bookId=${book.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm transition"
              >
                <ArrowUpRight className="w-4 h-4" /> Issue This Book
              </Link>

              <Link
                href={`/dashboard/books/${book.id}/edit`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                <Edit className="w-4 h-4" /> Edit
              </Link>
            </>
          )}

          {isAdmin && (
            <button
              onClick={() => setDeleteDialogOpen(true)}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-rose-200 dark:border-rose-900/50 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 text-xs font-semibold transition"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          )}
        </div>
      </div>

      {/* Main Details Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-8">
        {/* Cover Preview */}
        <div className="w-full md:w-64 shrink-0 flex flex-col items-center">
          <div className="w-48 md:w-full aspect-[3/4] rounded-2xl overflow-hidden shadow-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800">
            <img
              src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="mt-4 w-full text-center">
            <Badge
              variant={book.availableCopies > 0 ? 'success' : 'danger'}
              size="md"
            >
              {book.availableCopies > 0
                ? `${book.availableCopies} of ${book.totalCopies} Copies Available`
                : 'All Copies Currently Checked Out'}
            </Badge>
          </div>
        </div>

        {/* Content Details */}
        <div className="flex-1 space-y-6">
          <div>
            <div className="inline-block text-xs font-bold uppercase tracking-wider text-royal-600 dark:text-royal-400 mb-2">
              {book.category?.name || 'General Collection'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              {book.title}
            </h1>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-1">
              Authored by <span className="font-bold text-slate-800 dark:text-slate-100">{book.author}</span>
            </p>
          </div>

          {/* Quick Specifications */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">ISBN</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-100">{book.isbn}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Publisher</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{book.publisher}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Year</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{book.pubYear}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Shelf Bay</span>
              <span className="font-mono font-bold text-royal-600 dark:text-royal-400">{book.shelfNumber || 'Open Stacks'}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Language</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">{book.language}</span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Catalog Date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-100">
                {new Date(book.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Book Synopsis
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-line">
              {book.description || 'No detailed description provided for this catalog volume.'}
            </p>
          </div>
        </div>
      </div>

      {/* Staff View: Active Borrowers for this title */}
      {isStaff && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Current Active Borrowers ({book.transactions?.length || 0})
            </h3>
            <Link
              href="/dashboard/circulation/issued"
              className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline"
            >
              Circulation Dashboard
            </Link>
          </div>

          {book.transactions && book.transactions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {book.transactions.map((tx) => (
                <div key={tx.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {tx.member?.user?.name} ({tx.member?.rollNumber})
                    </div>
                    <div className="text-xs text-slate-400">
                      Issued: {new Date(tx.issueDate).toLocaleDateString()} · Due:{' '}
                      <span className="font-semibold text-amber-600 dark:text-amber-400">
                        {new Date(tx.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Badge variant={tx.status === 'OVERDUE' ? 'danger' : 'primary'}>
                    {tx.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-xs text-slate-400">
              No active borrowers. All physical copies are in the stacks.
            </div>
          )}
        </div>
      )}

      {/* Reserve Modal */}
      <Modal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        title="Reserve Book"
      >
        <form onSubmit={handleReserve} className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Placing a hold will notify library circulation staff to hold a copy for you when available.
          </p>
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Reservation Notes
            </label>
            <textarea
              value={reserveNotes}
              onChange={(e) => setReserveNotes(e.target.value)}
              placeholder="e.g. Needed for upcoming term paper"
              rows={3}
              className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setReserveModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={reserving}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-royal-600 hover:bg-royal-700 text-white disabled:opacity-50"
            >
              {reserving ? 'Submitting...' : 'Confirm Hold'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Book Record"
        message={`Are you sure you want to permanently delete "${book.title}"?`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
