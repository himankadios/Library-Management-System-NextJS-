'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import {
  ArrowLeft,
  User,
  BookOpen,
  Clock,
  AlertTriangle,
  DollarSign,
  Edit,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';

export default function MemberDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { showToast } = useToast();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    department: '',
    course: '',
    maxBooksAllowed: 4,
    status: 'ACTIVE',
  });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchMember = async () => {
    try {
      const res = await fetch(`/api/members/${id}`);
      if (!res.ok) throw new Error('Member not found');
      const data = await res.json();
      setMember(data.member);
      if (data.member) {
        setEditForm({
          name: data.member.user?.name || '',
          phone: data.member.phone || '',
          address: data.member.address || '',
          department: data.member.department || '',
          course: data.member.course || '',
          maxBooksAllowed: data.member.maxBooksAllowed || 4,
          status: data.member.status || 'ACTIVE',
        });
      }
    } catch (err) {
      showToast(err.message, 'error');
      router.push('/dashboard/members');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
  }, [id]);

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setSavingEdit(true);
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Member profile updated', 'success');
      setEditModalOpen(false);
      fetchMember();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingEdit(false);
    }
  };

  const handleSettleFine = async (fineId, action) => {
    try {
      const res = await fetch('/api/circulation/fines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fineId, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(`Fine marked as ${action === 'PAY' ? 'Paid' : 'Waived'}`, 'success');
      fetchMember();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-slate-400">Loading member profile...</div>;
  }

  if (!member) return null;

  const activeLoans = member.transactions?.filter((t) => ['ISSUED', 'OVERDUE'].includes(t.status)) || [];
  const pastLoans = member.transactions?.filter((t) => t.status === 'RETURNED') || [];
  const unpaidFines = member.fines?.filter((f) => f.status === 'UNPAID') || [];
  const totalFinesOwed = unpaidFines.reduce((sum, f) => sum + (f.amount || 0), 0);

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-200">
      <div className="flex items-center justify-between">
        <Link
          href="/dashboard/members"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-royal-600 transition"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Members Directory
        </Link>

        {isStaff && (
          <button
            onClick={() => setEditModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
          >
            <Edit className="w-4 h-4" /> Edit Profile
          </button>
        )}
      </div>

      {/* Profile Header Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 sm:p-8 shadow-sm flex flex-col md:flex-row gap-6 items-start">
        <div className="w-20 h-20 rounded-3xl bg-royal-600 text-white font-black text-2xl flex items-center justify-center shrink-0 shadow-md">
          {member.user?.name?.charAt(0) || 'U'}
        </div>

        <div className="flex-1 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                {member.user?.name}
              </h1>
              <p className="text-xs font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                Roll ID: <strong className="text-slate-800 dark:text-slate-200">{member.rollNumber}</strong> · Reg: {member.regNumber || 'N/A'}
              </p>
            </div>
            <Badge variant={member.status === 'ACTIVE' ? 'success' : 'danger'} size="md">
              {member.status} ACCOUNT
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-slate-400 block mb-0.5">Department & Course</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{member.department}</span>
              <div className="text-[11px] text-slate-400">{member.course}</div>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Contact</span>
              <div className="text-slate-700 dark:text-slate-300">{member.user?.email}</div>
              <div className="text-slate-400">{member.phone || 'No phone'}</div>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Borrowing Allowance</span>
              <span className="font-semibold text-royal-600 dark:text-royal-400">
                {activeLoans.length} active of {member.maxBooksAllowed} max books
              </span>
              <div className="text-[11px] text-slate-400">
                Joined: {new Date(member.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active Borrowed Books */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center justify-between">
          <span>Active Borrowed Books ({activeLoans.length})</span>
          {activeLoans.length > 0 && isStaff && (
            <Link
              href="/dashboard/circulation/return"
              className="text-xs font-semibold text-royal-600 hover:underline"
            >
              Return a book
            </Link>
          )}
        </h3>

        {activeLoans.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No books currently checked out.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {activeLoans.map((tx) => (
              <div key={tx.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {tx.book?.title}
                  </div>
                  <div className="text-xs text-slate-400">
                    Issued: {new Date(tx.issueDate).toLocaleDateString()} · Due:{' '}
                    <span className="font-semibold text-royal-600 dark:text-royal-400">
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
        )}
      </div>

      {/* Fines Management */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Late Fines & Penalties
          </h3>
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
            Outstanding: ${totalFinesOwed.toFixed(2)}
          </span>
        </div>

        {member.fines && member.fines.length > 0 ? (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {member.fines.map((f) => (
              <div key={f.id} className="py-3 flex items-center justify-between text-xs sm:text-sm">
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    ${f.amount.toFixed(2)} — {f.transaction?.book?.title}
                  </div>
                  <div className="text-xs text-slate-400">{f.notes}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={f.status === 'PAID' ? 'success' : f.status === 'WAIVED' ? 'default' : 'danger'}>
                    {f.status}
                  </Badge>
                  {isStaff && f.status === 'UNPAID' && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleSettleFine(f.id, 'PAY')}
                        className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-semibold"
                      >
                        Paid
                      </button>
                      <button
                        onClick={() => handleSettleFine(f.id, 'WAIVE')}
                        className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-semibold"
                      >
                        Waive
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-400">
            No fine history recorded. Account in good standing.
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <Modal isOpen={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Member Profile">
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Member Name
            </label>
            <input
              type="text"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              required
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Department
              </label>
              <input
                type="text"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Course
              </label>
              <input
                type="text"
                value={editForm.course}
                onChange={(e) => setEditForm({ ...editForm, course: e.target.value })}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Max Allowed Books
              </label>
              <input
                type="number"
                value={editForm.maxBooksAllowed}
                onChange={(e) => setEditForm({ ...editForm, maxBooksAllowed: parseInt(e.target.value, 10) || 4 })}
                min={1}
                max={15}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Account Status
              </label>
              <select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100"
              >
                <option value="ACTIVE">ACTIVE</option>
                <option value="BLOCKED">BLOCKED</option>
                <option value="EXPIRED">EXPIRED</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingEdit}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-royal-600 hover:bg-royal-700 text-white disabled:opacity-50"
            >
              {savingEdit ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
