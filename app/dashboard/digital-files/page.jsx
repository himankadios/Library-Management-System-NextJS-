'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import { useToast } from '@/components/providers/ToastProvider';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import EmptyState from '@/components/ui/EmptyState';
import FilePreviewModal from '@/components/files/FilePreviewModal';
import UploadModal from '@/components/files/UploadModal';
import {
  Folder,
  FolderPlus,
  Upload,
  Download,
  Eye,
  Edit2,
  Trash2,
  Search,
  LayoutGrid,
  List,
  ChevronRight,
  Home,
  FileText,
  FileSpreadsheet,
  FileArchive,
  Image as ImageIcon,
  FileCode,
  File,
  Lock,
  Globe,
  SlidersHorizontal,
} from 'lucide-react';

export default function DigitalFilesPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentFolder, setCurrentFolder] = useState(null); // null = root
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'list'

  // Filters
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedFileType, setSelectedFileType] = useState('ALL');
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');

  // Modals
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  const [fileToPreview, setFileToPreview] = useState(null);
  const [newFolderModalOpen, setNewFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [newFolderCategory, setNewFolderCategory] = useState('Academic Materials');
  const [newFolderRole, setNewFolderRole] = useState('ALL');
  const [creatingFolder, setCreatingFolder] = useState(false);

  // File edit / rename modal
  const [renameModalOpen, setRenameModalOpen] = useState(false);
  const [fileToRename, setFileToRename] = useState(null);
  const [renamedName, setRenamedName] = useState('');
  const [renamedDesc, setRenamedDesc] = useState('');
  const [renaming, setRenaming] = useState(false);

  // Delete Dialogs
  const [deleteFileDialogOpen, setDeleteFileDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState(null);
  const [deleteFolderDialogOpen, setDeleteFolderDialogOpen] = useState(false);
  const [folderToDelete, setFolderToDelete] = useState(null);

  // Load Folders
  const loadFolders = async () => {
    try {
      const res = await fetch('/api/files/folders');
      const data = await res.json();
      setFolders(data.folders || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Files
  const loadFiles = useCallback(async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        folderId: currentFolder ? currentFolder.id : 'root',
        category: selectedCategory,
        fileType: selectedFileType,
        search,
        sortBy,
        order,
      });

      const res = await fetch(`/api/files?${q}`);
      const data = await res.json();
      setFiles(data.files || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load files', 'error');
    } finally {
      setLoading(false);
    }
  }, [currentFolder, selectedCategory, selectedFileType, search, sortBy, order, showToast]);

  useEffect(() => {
    loadFolders();
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Current folder's subfolders
  const currentSubfolders = folders.filter((f) => {
    if (!currentFolder) {
      return !f.parentId;
    }
    return f.parentId === currentFolder.id;
  });

  // Handle Folder Creation
  const handleCreateFolder = async (e) => {
    e.preventDefault();
    setCreatingFolder(true);
    try {
      const res = await fetch('/api/files/folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newFolderName,
          parentId: currentFolder?.id || null,
          category: newFolderCategory,
          allowedRoles: newFolderRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Folder created successfully', 'success');
      setNewFolderModalOpen(false);
      setNewFolderName('');
      loadFolders();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setCreatingFolder(false);
    }
  };

  // Handle Delete Folder
  const handleDeleteFolder = async () => {
    if (!folderToDelete) return;
    try {
      const res = await fetch(`/api/files/folders?id=${folderToDelete.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('Folder deleted successfully', 'success');
      setDeleteFolderDialogOpen(false);
      setFolderToDelete(null);
      loadFolders();
      loadFiles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Handle Rename File
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!fileToRename) return;
    setRenaming(true);
    try {
      const res = await fetch(`/api/files/${fileToRename.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: renamedName,
          description: renamedDesc,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('File details updated', 'success');
      setRenameModalOpen(false);
      setFileToRename(null);
      loadFiles();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setRenaming(false);
    }
  };

  // Handle Delete File
  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    try {
      const res = await fetch(`/api/files/${fileToDelete.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      showToast('File deleted successfully', 'success');
      setDeleteFileDialogOpen(false);
      setFileToDelete(null);
      loadFiles();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const getFileIcon = (fileType) => {
    switch (fileType) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-rose-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-8 h-8 text-royal-500" />;
      case 'xls':
      case 'xlsx':
        return <FileSpreadsheet className="w-8 h-8 text-emerald-500" />;
      case 'ppt':
      case 'pptx':
        return <FileText className="w-8 h-8 text-orange-500" />;
      case 'jpg':
      case 'jpeg':
      case 'png':
        return <ImageIcon className="w-8 h-8 text-purple-500" />;
      case 'zip':
        return <FileArchive className="w-8 h-8 text-amber-500" />;
      case 'txt':
        return <FileCode className="w-8 h-8 text-slate-500" />;
      default:
        return <File className="w-8 h-8 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>Digital Document Library</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Securely access, organize, preview, and download institutional academic files
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {isStaff && (
            <>
              <button
                onClick={() => setNewFolderModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-semibold transition"
              >
                <FolderPlus className="w-4 h-4 text-royal-500" />
                <span>New Folder</span>
              </button>

              <button
                onClick={() => setUploadModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white text-xs font-semibold shadow-sm hover:shadow-md transition active:scale-[0.98]"
              >
                <Upload className="w-4 h-4" />
                <span>Upload File</span>
              </button>
            </>
          )}

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

      {/* Explorer Breadcrumb Bar */}
      <div className="bg-white dark:bg-slate-900 px-5 py-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex items-center justify-between gap-4">
        <div className="flex items-center text-xs font-semibold text-slate-500 dark:text-slate-400 gap-1.5 overflow-x-auto">
          <button
            onClick={() => setCurrentFolder(null)}
            className={`flex items-center gap-1 hover:text-royal-600 transition ${
              !currentFolder ? 'text-royal-600 font-bold' : ''
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Digital Library</span>
          </button>
          {currentFolder && (
            <>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800 dark:text-slate-100 font-bold">
                {currentFolder.name}
              </span>
            </>
          )}
        </div>

        <div className="text-[11px] font-mono text-slate-400 shrink-0">
          {currentSubfolders.length} folders · {files.length} documents
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search documents by name, description..."
            className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-royal-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Academic Materials">Academic Materials</option>
            <option value="Research Papers">Research Papers</option>
            <option value="Question Papers">Question Papers</option>
            <option value="Assignments">Assignments</option>
            <option value="E-Books">E-Books</option>
            <option value="Notes">Notes</option>
            <option value="Administrative Documents">Administrative Documents</option>
          </select>

          <select
            value={selectedFileType}
            onChange={(e) => setSelectedFileType(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-royal-500"
          >
            <option value="ALL">All File Types</option>
            <option value="pdf">PDF Documents</option>
            <option value="docx">Word (DOCX)</option>
            <option value="xlsx">Excel (XLSX)</option>
            <option value="pptx">PowerPoint (PPTX)</option>
            <option value="txt">Text Files</option>
            <option value="zip">ZIP Archives</option>
          </select>
        </div>
      </div>

      {/* Folders Section (if any subfolders exist in current view) */}
      {currentSubfolders.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Folders ({currentSubfolders.length})
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {currentSubfolders.map((f) => (
              <div
                key={f.id}
                className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-royal-400 dark:hover:border-royal-600 transition shadow-sm flex items-center justify-between group"
              >
                <div
                  onClick={() => setCurrentFolder(f)}
                  className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                >
                  <div className="w-10 h-10 rounded-xl bg-royal-50 dark:bg-royal-950/60 text-royal-600 flex items-center justify-center shrink-0">
                    <Folder className="w-5 h-5 fill-current" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {f.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {f._count?.files || 0} files · {f.category}
                    </div>
                  </div>
                </div>

                {isStaff && (
                  <button
                    onClick={() => {
                      setFolderToDelete(f);
                      setDeleteFolderDialogOpen(true);
                    }}
                    className="p-1 rounded-lg text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                    title="Delete folder"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Files Section */}
      <div className="space-y-3">
        <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Documents ({files.length})
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading digital documents...</div>
        ) : files.length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No digital files in this folder"
            description="Upload educational course materials, research summaries, or question papers."
            actionLabel={isStaff ? 'Upload Document' : undefined}
            onAction={isStaff ? () => setUploadModalOpen(true) : undefined}
          />
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {files.map((file) => (
              <div
                key={file.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 shrink-0">
                      {getFileIcon(file.fileType)}
                    </div>
                    <div className="flex items-center gap-1">
                      {file.allowedRoles !== 'ALL' && (
                        <span title="Restricted to staff" className="p-1 text-amber-500">
                          <Lock className="w-3.5 h-3.5" />
                        </span>
                      )}
                      <Badge variant="primary">.{file.fileType.toUpperCase()}</Badge>
                    </div>
                  </div>

                  <h3
                    onClick={() => {
                      setFileToPreview(file);
                      setPreviewModalOpen(true);
                    }}
                    className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white line-clamp-2 hover:text-royal-600 dark:hover:text-royal-400 cursor-pointer transition mb-1"
                  >
                    {file.name}
                  </h3>
                  <p className="text-[11px] text-slate-400 line-clamp-2 mb-2">
                    {file.description || 'No description added'}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-3 font-mono">
                    <span>{(file.fileSize / 1024).toFixed(1)} KB</span>
                    <span>{file.downloadCount} DLs</span>
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <button
                      onClick={() => {
                        setFileToPreview(file);
                        setPreviewModalOpen(true);
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-royal-600 dark:text-royal-400 hover:underline"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>

                    <div className="flex items-center gap-1">
                      <a
                        href={`/api/files/${file.id}/download`}
                        download
                        className="p-1.5 rounded-lg text-slate-500 hover:text-royal-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>

                      {isStaff && (
                        <>
                          <button
                            onClick={() => {
                              setFileToRename(file);
                              setRenamedName(file.name);
                              setRenamedDesc(file.description || '');
                              setRenameModalOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Edit details"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setFileToDelete(file);
                              setDeleteFileDialogOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Delete file"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LIST VIEW */
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">Document Name</th>
                    <th className="px-5 py-3.5">Category</th>
                    <th className="px-5 py-3.5">Size</th>
                    <th className="px-5 py-3.5">Downloads</th>
                    <th className="px-5 py-3.5">Upload Date</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {files.map((file) => (
                    <tr key={file.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                      <td className="px-5 py-4">
                        <div
                          onClick={() => {
                            setFileToPreview(file);
                            setPreviewModalOpen(true);
                          }}
                          className="font-bold text-slate-900 dark:text-white hover:text-royal-600 cursor-pointer truncate max-w-sm"
                        >
                          {file.name}
                        </div>
                        <div className="text-xs text-slate-400 truncate">
                          {file.originalName}
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="teal">{file.category}</Badge>
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {(file.fileSize / 1024).toFixed(1)} KB
                      </td>
                      <td className="px-5 py-4 font-mono text-xs text-slate-600 dark:text-slate-300">
                        {file.downloadCount}
                      </td>
                      <td className="px-5 py-4 text-xs text-slate-500 dark:text-slate-400">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setFileToPreview(file);
                              setPreviewModalOpen(true);
                            }}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
                          >
                            Preview
                          </button>
                          <a
                            href={`/api/files/${file.id}/download`}
                            download
                            className="p-1 rounded-lg text-slate-500 hover:text-royal-600"
                            title="Download"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                          {isStaff && (
                            <button
                              onClick={() => {
                                setFileToDelete(file);
                                setDeleteFileDialogOpen(true);
                              }}
                              className="p-1 rounded-lg text-slate-500 hover:text-rose-600"
                              title="Delete"
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
          </div>
        )}
      </div>

      {/* Upload File Modal */}
      <UploadModal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        folders={folders}
        currentFolderId={currentFolder?.id}
        onUploaded={() => {
          loadFiles();
          loadFolders();
        }}
      />

      {/* File Preview Modal */}
      <FilePreviewModal
        isOpen={previewModalOpen}
        onClose={() => setPreviewModalOpen(false)}
        file={fileToPreview}
      />

      {/* New Folder Modal */}
      <Modal
        isOpen={newFolderModalOpen}
        onClose={() => setNewFolderModalOpen(false)}
        title="Create New Folder"
      >
        <form onSubmit={handleCreateFolder} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Folder Name *
            </label>
            <input
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              required
              placeholder="e.g. Midterm Question Papers 2026"
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Category
            </label>
            <select
              value={newFolderCategory}
              onChange={(e) => setNewFolderCategory(e.target.value)}
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
              Access Restriction
            </label>
            <select
              value={newFolderRole}
              onChange={(e) => setNewFolderRole(e.target.value)}
              className="w-full px-3 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            >
              <option value="ALL">Public to All Students & Staff</option>
              <option value="ADMIN_LIBRARIAN">Restricted to Library Staff</option>
            </select>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setNewFolderModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingFolder}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white disabled:opacity-50 shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              {creatingFolder ? 'Creating...' : 'Create Folder'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Rename File Modal */}
      <Modal
        isOpen={renameModalOpen}
        onClose={() => setRenameModalOpen(false)}
        title="Edit Document Details"
      >
        <form onSubmit={handleRenameSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              File Display Name
            </label>
            <input
              type="text"
              value={renamedName}
              onChange={(e) => setRenamedName(e.target.value)}
              required
              className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              value={renamedDesc}
              onChange={(e) => setRenamedDesc(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 text-xs sm:text-sm rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-royal-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setRenameModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={renaming}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-gradient-to-r from-royal-600 to-royal-700 hover:from-royal-500 hover:to-royal-600 text-white disabled:opacity-50 shadow-sm hover:shadow-md transition active:scale-[0.98]"
            >
              {renaming ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete File Dialog */}
      <ConfirmDialog
        isOpen={deleteFileDialogOpen}
        onClose={() => setDeleteFileDialogOpen(false)}
        onConfirm={handleDeleteFile}
        title="Delete Document"
        message={`Are you sure you want to delete "${fileToDelete?.name}"? Physical disk storage and all downloads will be removed.`}
        confirmText="Confirm Delete"
      />

      {/* Delete Folder Dialog */}
      <ConfirmDialog
        isOpen={deleteFolderDialogOpen}
        onClose={() => setDeleteFolderDialogOpen(false)}
        onConfirm={handleDeleteFolder}
        title="Delete Folder"
        message={`Are you sure you want to delete folder "${folderToDelete?.name}" and all its subfolders?`}
        confirmText="Delete Folder"
      />
    </div>
  );
}
