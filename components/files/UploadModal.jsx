'use client';

import React, { useState } from 'react';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/providers/ToastProvider';
import { UploadCloud, FileText, CheckCircle2, AlertCircle } from 'lucide-react';

const CATEGORIES = [
  'Academic Materials',
  'Research Papers',
  'Question Papers',
  'Assignments',
  'E-Books',
  'Notes',
  'Administrative Documents',
];

export default function UploadModal({ isOpen, onClose, folders = [], currentFolderId = null, onUploaded }) {
  const { showToast } = useToast();
  const [file, setFile] = useState(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Academic Materials');
  const [folderId, setFolderId] = useState(currentFolderId || 'root');
  const [description, setDescription] = useState('');
  const [allowedRoles, setAllowedRoles] = useState('ALL');
  const [uploading, setUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = (selected) => {
    if (selected) {
      setFile(selected);
      if (!name) {
        setName(selected.name);
      }
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast('Please select a file to upload', 'warning');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('name', name || file.name);
      formData.append('category', category);
      formData.append('folderId', folderId === 'root' ? '' : folderId);
      formData.append('description', description);
      formData.append('allowedRoles', allowedRoles);

      const res = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Document uploaded successfully!', 'success');
      onUploaded && onUploaded(data.file);
      onClose();
      // Reset form
      setFile(null);
      setName('');
      setDescription('');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Upload Digital Document" maxWidth="max-w-2xl">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Drag and Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-3xl p-6 sm:p-8 text-center transition cursor-pointer ${
            isDragOver
              ? 'border-royal-500 bg-royal-50/50 dark:bg-royal-950/30'
              : 'border-slate-300 dark:border-slate-700 hover:border-royal-400 bg-slate-50/60 dark:bg-slate-800/40'
          }`}
        >
          <input
            type="file"
            id="fileInput"
            onChange={(e) => handleFileChange(e.target.files[0])}
            className="hidden"
          />
          <label htmlFor="fileInput" className="cursor-pointer">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-royal-100 dark:bg-royal-950/60 flex items-center justify-center text-royal-600 mb-3">
              <UploadCloud className="w-7 h-7" />
            </div>
            {file ? (
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB · Click to choose different file
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  Drag and drop your file here, or{' '}
                  <span className="text-royal-600 dark:text-royal-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  Supported: PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, JPG, PNG, ZIP (Max 50MB)
                </p>
              </div>
            )}
          </label>
        </div>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Document Display Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="e.g. Distributed Systems Syllabus 2026"
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Target Folder
            </label>
            <select
              value={folderId}
              onChange={(e) => setFolderId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            >
              <option value="root">Root (Digital Library)</option>
              {folders.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.category})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Access Permission *
            </label>
            <select
              value={allowedRoles}
              onChange={(e) => setAllowedRoles(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            >
              <option value="ALL">Public (All Students & Staff)</option>
              <option value="ADMIN_LIBRARIAN">Restricted (Staff Only)</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Description / Notes
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Brief summary of document content, author, course code..."
              className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!file || uploading}
            className="px-6 py-2.5 text-xs font-semibold rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white disabled:opacity-50 transition shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            {uploading ? 'Processing & Storing...' : 'Upload Document'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
