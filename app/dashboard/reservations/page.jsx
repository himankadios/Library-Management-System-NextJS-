'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import { BookmarkCheck, CheckCircle2, XCircle, Clock, BookOpen } from 'lucide-react';

export default function ReservationsPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchReservations = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({ status: statusFilter });
      const res = await fetch(`/api/reservations?${q}`);
      const data = await res.json();
      setReservations(data.reservations || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load reservations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReservations();
  }, [statusFilter]);

  const handleUpdateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/reservations/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Reservation marked as ${status}`, 'success');
      fetchReservations();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return <Badge variant="success">APPROVED</Badge>;
      case 'REJECTED':
        return <Badge variant="danger">REJECTED</Badge>;
      case 'FULFILLED':
        return <Badge variant="primary">FULFILLED</Badge>;
      case 'CANCELLED':
        return <Badge variant="default">CANCELLED</Badge>;
      default:
        return <Badge variant="warning">PENDING</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BookmarkCheck className="w-6 h-6 text-royal-600" />
            <span>{isStaff ? 'Book Reservation Requests' : 'My Book Reservations'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {reservations.length} hold requests recorded
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-royal-500 shadow-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="PENDING">Pending Holds</option>
          <option value="APPROVED">Approved Holds</option>
          <option value="FULFILLED">Fulfilled (Issued)</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={6} cols={6} />
      ) : reservations.length === 0 ? (
        <EmptyState
          icon={BookmarkCheck}
          title="No reservations found"
          description="There are no book hold requests matching your selection."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Book Title</th>
                  <th className="px-5 py-3.5">Requested By</th>
                  <th className="px-5 py-3.5">Request Date</th>
                  <th className="px-5 py-3.5">Notes</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {reservations.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        {r.book?.title}
                      </div>
                      <div className="text-xs text-slate-400">
                        {r.book?.author} · Avail: {r.book?.availableCopies}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {r.member?.user?.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        Roll: {r.member?.rollNumber}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                      {new Date(r.requestDate).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-xs truncate">
                      {r.notes || '-'}
                    </td>
                    <td className="px-5 py-4">{getStatusBadge(r.status)}</td>
                    <td className="px-5 py-4 text-right">
                      {isStaff && r.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'APPROVED')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(r.id, 'REJECTED')}
                            className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold"
                          >
                            Reject
                          </button>
                        </div>
                      ) : !isStaff && r.status === 'PENDING' ? (
                        <button
                          onClick={() => handleUpdateStatus(r.id, 'CANCELLED')}
                          className="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-100 text-xs text-slate-600"
                        >
                          Cancel Hold
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
