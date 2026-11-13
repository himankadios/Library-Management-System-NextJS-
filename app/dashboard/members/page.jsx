'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
  BookOpen,
  DollarSign,
} from 'lucide-react';

export default function MembersPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isAdmin = user?.role === 'ADMIN';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Add Member Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: 'Computer Science & Engineering',
    course: 'B.Tech',
    phone: '',
    address: '',
    maxBooksAllowed: 4,
    status: 'ACTIVE',
  });
  const [savingMember, setSavingMember] = useState(false);

  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: '10',
        search,
        status: statusFilter,
      });
      const res = await fetch(`/api/members?${q}`);
      const data = await res.json();
      setMembers(data.members || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
      showToast('Failed to load members', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [page, search, statusFilter]);

  const handleCreateMember = async (e) => {
    e.preventDefault();
    setSavingMember(true);
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMember),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast(data.message, 'success');
      setAddModalOpen(false);
      setNewMember({
        name: '',
        email: '',
        rollNumber: '',
        department: 'Computer Science & Engineering',
        course: 'B.Tech',
        phone: '',
        address: '',
        maxBooksAllowed: 4,
        status: 'ACTIVE',
      });
      fetchMembers();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSavingMember(false);
    }
  };

  const handleDeleteMember = async () => {
    if (!memberToDelete) return;
    try {
      const res = await fetch(`/api/members/${memberToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Member removed successfully', 'success');
      setDeleteDialogOpen(false);
      setMemberToDelete(null);
      fetchMembers();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Users className="w-6 h-6 text-royal-600" />
            <span>Library Member Directory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            {totalCount} registered students and institutional borrowers
          </p>
        </div>

        <button
          onClick={() => setAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white text-xs sm:text-sm font-semibold shadow-sm hover:shadow-md transition active:scale-[0.98]"
        >
          <UserPlus className="w-4 h-4" /> Add Member
        </button>
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
            placeholder="Search by name, email, roll number, department..."
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
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="EXPIRED">Expired</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <SkeletonTable rows={8} cols={7} />
      ) : members.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members found"
          description="Try adjusting your keyword query or status filter."
          actionLabel="Add Member"
          onAction={() => setAddModalOpen(true)}
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Student / Member</th>
                  <th className="px-5 py-3.5">Roll Number</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Active Loans</th>
                  <th className="px-5 py-3.5">Fines</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-royal-100 dark:bg-royal-950/60 text-royal-600 font-bold flex items-center justify-center shrink-0">
                          {m.user?.name?.charAt(0) || 'U'}
                        </div>
                        <div className="min-w-0">
                          <Link
                            href={`/dashboard/members/${m.id}`}
                            className="font-bold text-slate-900 dark:text-white hover:text-royal-600 truncate block"
                          >
                            {m.user?.name}
                          </Link>
                          <div className="text-xs text-slate-400 truncate">
                            {m.user?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
                      {m.rollNumber}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-400">
                      <div>{m.department}</div>
                      <div className="text-[11px] text-slate-400">{m.course}</div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {m.activeLoansCount} / {m.maxBooksAllowed}
                      </span>
                      {m.overdueLoansCount > 0 && (
                        <span className="block text-[11px] text-rose-500 font-bold">
                          ({m.overdueLoansCount} overdue)
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      {m.unpaidFinesTotal > 0 ? (
                        <span className="font-bold text-rose-600 dark:text-rose-400">
                          ${m.unpaidFinesTotal.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">None</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <Badge variant={m.status === 'ACTIVE' ? 'success' : 'danger'}>
                        {m.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/dashboard/members/${m.id}`}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                        >
                          View Profile
                        </Link>
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setMemberToDelete(m);
                              setDeleteDialogOpen(true);
                            }}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Delete Member"
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

      {/* Add Member Modal */}
      <Modal isOpen={addModalOpen} onClose={() => setAddModalOpen(false)} title="Register New Member">
        <form onSubmit={handleCreateMember} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Full Legal Name *
              </label>
              <input
                type="text"
                value={newMember.name}
                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                required
                placeholder="e.g. Alexander Vance"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Institutional Email *
              </label>
              <input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                required
                placeholder="student@university.edu"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Student Roll / ID Number *
              </label>
              <input
                type="text"
                value={newMember.rollNumber}
                onChange={(e) => setNewMember({ ...newMember, rollNumber: e.target.value })}
                required
                placeholder="CS-2026-088"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Department *
              </label>
              <input
                type="text"
                value={newMember.department}
                onChange={(e) => setNewMember({ ...newMember, department: e.target.value })}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Academic Course *
              </label>
              <input
                type="text"
                value={newMember.course}
                onChange={(e) => setNewMember({ ...newMember, course: e.target.value })}
                required
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Phone Number
              </label>
              <input
                type="tel"
                value={newMember.phone}
                onChange={(e) => setNewMember({ ...newMember, phone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                Max Allowed Borrowings
              </label>
              <input
                type="number"
                value={newMember.maxBooksAllowed}
                onChange={(e) => setNewMember({ ...newMember, maxBooksAllowed: parseInt(e.target.value, 10) || 4 })}
                min={1}
                max={15}
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setAddModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={savingMember}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white disabled:opacity-50 shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              {savingMember ? 'Registering...' : 'Complete Registration'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Member Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteMember}
        title="Delete Member Account"
        message={`Are you sure you want to delete member profile for "${memberToDelete?.user?.name}" (${memberToDelete?.rollNumber})?`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
