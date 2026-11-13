'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { FolderLock, Plus, Trash2, Folder, Lock, Globe } from 'lucide-react';

export default function FileCategoriesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Academic Materials');
  const [allowedRoles, setAllowedRoles] = useState('ALL');
  const [saving, setSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  const fetchFolders = async () => {
    try {
      const res = await fetch('/api/files/folders');
      const data = await res.json();
      setFolders(data.folders || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load folders', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFolders();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/files/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, allowedRoles }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Category folder created', 'success');
      setModalOpen(false);
      setName('');
      fetchFolders();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!folderToDelete) return;
    try {
      const res = await fetch(`/api/files/folders?id=${folderToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Folder deleted', 'success');
      setDeleteDialogOpen(false);
      setFolderToDelete(null);
      fetchFolders();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Digital File Categories & Folders
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Configure root folder repositories and role-based permissions
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-royal-600 hover:bg-royal-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition"
        >
          <Plus className="w-4 h-4" /> Add Root Category
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {folders.map((f) => (
          <div
            key={f.id}
            className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center shrink-0">
                  <Folder className="w-5 h-5 fill-current" />
                </div>
                <div className="flex items-center gap-1.5">
                  {f.allowedRoles !== 'ALL' ? (
                    <Badge variant="warning">
                      <Lock className="w-3 h-3 mr-1 inline" /> Staff Only
                    </Badge>
                  ) : (
                    <Badge variant="teal">Public</Badge>
                  )}
                </div>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1">{f.name}</h3>
              <p className="text-xs text-slate-400">Category: {f.category}</p>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {f._count?.files || 0} Documents
              </span>
              <button
                onClick={() => {
                  setFolderToDelete(f);
                  setDeleteDialogOpen(true);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                title="Delete folder"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* New Root Folder Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="New Category Folder">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Folder Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Master Theses & Dissertations"
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            >
              <option value="Academic Materials">Academic Materials</option>
              <option value="Research Papers">Research Papers</option>
              <option value="Question Papers">Question Papers</option>
              <option value="Assignments">Assignments</option>
              <option value="E-Books">E-Books</option>
              <option value="Notes">Notes</option>
              <option value="Administrative Documents">Administrative Documents</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Permissions
            </label>
            <select
              value={allowedRoles}
              onChange={(e) => setAllowedRoles(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            >
              <option value="ALL">Public to All Students & Staff</option>
              <option value="ADMIN_LIBRARIAN">Restricted to Library Staff</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-royal-600 hover:bg-royal-700 text-white disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Folder Dialog */}
      <ConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Folder"
        message={`Are you sure you want to delete folder "${folderToDelete?.name}"?`}
        confirmText="Confirm Delete"
      />
    </div>
  );
}
