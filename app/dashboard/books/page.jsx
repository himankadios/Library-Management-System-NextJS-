'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonCard, SkeletonTable } from '@/components/ui/LoadingSkeleton';
import {
  BookOpen,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  LayoutGrid,
  List,
  Edit,
  Trash2,
  BookmarkCheck,
  CheckCircle2,
  Clock,
} from 'lucide-react';

export default function BooksPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const isAdmin = user?.role === 'ADMIN';

  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Filters & Pagination
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [availability, setAvailability] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);

  // Modals
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState(null);
  const [reservationModalOpen, setReservationModalOpen] = useState(false);
  const [bookToReserve, setBookToReserve] = useState(null);
  const [reserveNotes, setReserveNotes] = useState('');
  const [reserving, setReserving] = useState(false);

  // Fetch Categories
  useEffect(() => {
    fetch('/api/books/categories')
      .then((res) => res.json())
      .then((data) => setCategories(data.categories || []))
      .catch(console.error);
  }, []);

  // Fetch Books
  const fetchBooks = useCallback(async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: String(page),
        limit: viewMode === 'grid' ? '12' : '15',
        search,
        category: selectedCategory,
        availability,
        sortBy,
        order,
      });

      const res = await fetch(`/api/books?${query}`);
      if (res.ok) {
        const data = await res.json();
        setBooks(data.books || []);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalBooks(data.pagination.total || 0);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load catalog books', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, search, selectedCategory, availability, sortBy, order, viewMode, showToast]);

  useEffect(() => {
    fetchBooks();
  }, [fetchBooks]);

  // Handle Delete
  const handleDeleteBook = async () => {
    if (!bookToDelete) return;
    try {
      const res = await fetch(`/api/books/${bookToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Book deleted successfully', 'success');
      setDeleteConfirmOpen(false);
      setBookToDelete(null);
      fetchBooks();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle CSV Import
  const handleImportSubmit = async (e) => {
    e.preventDefault();
    if (!importFile) return;

    setImporting(true);
    try {
      const formData = new FormData();
      formData.append('file', importFile);

      const res = await fetch('/api/books/import', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setImportModalOpen(false);
      setImportFile(null);
      fetchBooks();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setImporting(false);
    }
  };

  // Handle Reserve Book (for student)
  const handleReserveSubmit = async (e) => {
    e.preventDefault();
    if (!bookToReserve) return;

    setReserving(true);
    try {
      const res = await fetch('/api/reservations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: bookToReserve.id,
          notes: reserveNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setReservationModalOpen(false);
      setBookToReserve(null);
      setReserveNotes('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setReserving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Book Inventory & Catalog
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {totalBooks} titles recorded in library collection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isStaff && (
            <>
              <a
                href="/api/books/export"
                download
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                <Download className="w-4 h-4 text-slate-400" />
                <span>Export CSV</span>
              </a>

              <button
                onClick={() => setImportModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                <Upload className="w-4 h-4 text-slate-400" />
                <span>Import CSV</span>
              </button>

              <Link
                href="/dashboard/books/new"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition active:scale-[0.98]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Book</span>
              </Link>
            </>
          )}

          {/* View switcher */}
          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-xl p-1 bg-white dark:bg-slate-900">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'grid'
                  ? 'bg-royal-600 text-white'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg ${
                viewMode === 'list'
                  ? 'bg-royal-600 text-white'
                  : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by title, author, ISBN or publisher..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:border-royal-500 text-slate-800 dark:text-slate-100 placeholder-slate-400 transition"
          />
        </div>

        {/* Category filter */}
        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-royal-500"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Availability filter */}
          <select
            value={availability}
            onChange={(e) => {
              setAvailability(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-royal-500"
          >
            <option value="">All Availability</option>
            <option value="available">In Stock (Available)</option>
            <option value="unavailable">Checked Out (0 Available)</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}-${order}`}
            onChange={(e) => {
              const [sb, ord] = e.target.value.split('-');
              setSortBy(sb);
              setOrder(ord);
              setPage(1);
            }}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-royal-500"
          >
            <option value="createdAt-desc">Newest Added</option>
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
            <option value="availableCopies-desc">Most Available</option>
            <option value="pubYear-desc">Publication Year</option>
          </select>
        </div>
      </div>

      {/* Main Catalog View */}
      {loading ? (
        viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <SkeletonTable rows={8} cols={6} />
        )
      ) : books.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title="No books found"
          description="Try adjusting your keyword search, category filter, or availability options."
          actionLabel={isStaff ? 'Add New Book' : 'Reset Filters'}
          onAction={() => {
            setSearch('');
            setSelectedCategory('');
            setAvailability('');
          }}
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {books.map((book) => (
            <div
              key={book.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm hover:shadow-md transition duration-200 flex flex-col group"
            >
              {/* Cover Image Container */}
              <div className="relative aspect-[3/4] bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <img
                  src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                  alt={book.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                />
                <div className="absolute top-3 left-3">
                  <Badge variant={book.availableCopies > 0 ? 'success' : 'danger'}>
                    {book.availableCopies > 0 ? `${book.availableCopies} Available` : 'Out of Stock'}
                  </Badge>
                </div>
                {book.shelfNumber && (
                  <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[11px] font-mono">
                    Shelf: {book.shelfNumber}
                  </div>
                )}
              </div>

              {/* Book Details */}
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-semibold text-royal-600 dark:text-royal-400 uppercase tracking-wider mb-1 truncate">
                    {book.category?.name || 'General'}
                  </div>
                  <Link
                    href={`/dashboard/books/${book.id}`}
                    className="block text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-royal-600 dark:hover:text-royal-400 transition"
                  >
                    {book.title}
                  </Link>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                    by {book.author}
                  </p>
                  <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                    ISBN: {book.isbn}
                  </div>
                </div>

                {/* Card Actions */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  <Link
                    href={`/dashboard/books/${book.id}`}
                    className="text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline"
                  >
                    View Details
                  </Link>

                  <div className="flex items-center gap-1">
                    {!isStaff && (
                      <button
                        onClick={() => {
                          setBookToReserve(book);
                          setReservationModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-royal-600 hover:bg-royal-50 dark:hover:bg-royal-950/40 transition"
                        title="Reserve Title"
                      >
                        <BookmarkCheck className="w-4 h-4" />
                      </button>
                    )}

                    {isStaff && (
                      <Link
                        href={`/dashboard/books/${book.id}/edit`}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit Book"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => {
                          setBookToDelete(book);
                          setDeleteConfirmOpen(true);
                        }}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete Book"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Title & Author</th>
                  <th className="px-5 py-3.5">ISBN</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Shelf</th>
                  <th className="px-5 py-3.5">Copies</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {books.map((book) => (
                  <tr key={book.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={book.coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'}
                          alt={book.title}
                          className="w-9 h-12 object-cover rounded shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/books/${book.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-royal-600 dark:hover:text-royal-400 truncate block max-w-md"
                          >
                            {book.title}
                          </Link>
                          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                            {book.author} · {book.pubYear}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                      {book.isbn}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant="primary">{book.category?.name || 'General'}</Badge>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-500 dark:text-slate-400">
                      {book.shelfNumber || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`font-semibold ${
                          book.availableCopies > 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {book.availableCopies} / {book.totalCopies}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/books/${book.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                        >
                          View
                        </Link>
                        {isStaff && (
                          <Link
                            href={`/dashboard/books/${book.id}/edit`}
                            className="p-1 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setBookToDelete(book);
                              setDeleteConfirmOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* CSV Bulk Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Bulk Import Books via CSV"
      >
        <form onSubmit={handleImportSubmit} className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            Upload a CSV file containing books. The file must include columns for{' '}
            <strong className="text-slate-700 dark:text-slate-200">Title</strong>,{' '}
            <strong className="text-slate-700 dark:text-slate-200">Author</strong>, and{' '}
            <strong className="text-slate-700 dark:text-slate-200">ISBN</strong>. Optional columns
            include Publisher, Year, Category, Copies, and Shelf.
          </p>

          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-2xl p-6 text-center hover:border-royal-500 transition cursor-pointer">
            <input
              type="file"
              accept=".csv"
              onChange={(e) => setImportFile(e.target.files[0])}
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-royal-50 file:text-royal-700 hover:file:bg-royal-100"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setImportModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!importFile || importing}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 disabled:opacity-50 text-white shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              {importing ? 'Processing CSV...' : 'Import Records'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Student Book Reservation Modal */}
      <Modal
        isOpen={reservationModalOpen}
        onClose={() => setReservationModalOpen(false)}
        title="Reserve Book Title"
      >
        {bookToReserve && (
          <form onSubmit={handleReserveSubmit} className="space-y-4">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex gap-3">
              <img
                src={bookToReserve.coverImage}
                alt={bookToReserve.title}
                className="w-12 h-16 object-cover rounded-lg"
              />
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900 dark:text-white truncate">
                  {bookToReserve.title}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  by {bookToReserve.author}
                </div>
                <div className="text-xs text-slate-400 font-mono mt-1">
                  ISBN: {bookToReserve.isbn}
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Notes for Librarian (Optional)
              </label>
              <textarea
                value={reserveNotes}
                onChange={(e) => setReserveNotes(e.target.value)}
                placeholder="e.g. Needed for semester research project next week..."
                rows={3}
                className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setReservationModalOpen(false)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={reserving}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 disabled:opacity-50 text-white shadow-sm hover:shadow-md transition active:scale-[0.98]"
              >
                {reserving ? 'Placing Hold...' : 'Confirm Hold Request'}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDeleteBook}
        title="Delete Book Record"
        message={`Are you sure you want to delete "${bookToDelete?.title}"? This permanently removes the catalog record.`}
        confirmText="Delete Title"
      />
    </div>
  );
}
