'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/providers/AuthProvider';
import {
  LayoutDashboard,
  BookOpen,
  PlusCircle,
  Tags,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  AlertTriangle,
  History,
  FolderLock,
  Users,
  BookmarkCheck,
  BarChart3,
  Bell,
  Sliders,
  FileText,
  User,
  LogOut,
  ChevronDown,
  ChevronRight,
  X,
  Library,
} from 'lucide-react';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [collapsedSections, setCollapsedSections] = useState({});

  const toggleSection = (name) => {
    setCollapsedSections((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const isStaff = user?.role === 'ADMIN' || user?.role === 'LIBRARIAN';
  const isAdmin = user?.role === 'ADMIN';

  const isActive = (path) => pathname === path;
  const isSectionActive = (paths) => paths.some((p) => pathname.startsWith(p));

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden"
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-navy-dark text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-royal-600 to-tealAccent-500 flex items-center justify-center text-white shadow-md shadow-royal-900/40">
              <Library className="w-5 h-5" />
            </div>
            <div>
              <div className="font-black text-lg text-white tracking-tight flex items-center gap-1.5">
                AuraLib <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-royal-500/20 text-royal-400 border border-royal-500/30">PRO</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Digital Library System</div>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Main */}
          <div>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Main
            </div>
            <Link
              href="/dashboard"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                isActive('/dashboard')
                  ? 'bg-royal-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Staff Books Management */}
          {isStaff ? (
            <div>
              <button
                onClick={() => toggleSection('books')}
                className="w-full flex items-center justify-between px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 hover:text-slate-300"
              >
                <span>Book Management</span>
                {collapsedSections.books ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {!collapsedSections.books && (
                <div className="space-y-1">
                  <Link
                    href="/dashboard/books"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/books')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>All Books</span>
                  </Link>
                  <Link
                    href="/dashboard/books/new"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/books/new')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 shrink-0" />
                    <span>Add New Book</span>
                  </Link>
                  <Link
                    href="/dashboard/books/categories"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/books/categories')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Tags className="w-4 h-4 shrink-0" />
                    <span>Categories</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Catalog
              </div>
              <Link
                href="/dashboard/books"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition ${
                  isActive('/dashboard/books')
                    ? 'bg-royal-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <BookOpen className="w-4 h-4 shrink-0" />
                <span>Browse Catalog</span>
              </Link>
            </div>
          )}

          {/* Circulation Module */}
          {isStaff ? (
            <div>
              <button
                onClick={() => toggleSection('circulation')}
                className="w-full flex items-center justify-between px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2 hover:text-slate-300"
              >
                <span>Circulation</span>
                {collapsedSections.circulation ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
              {!collapsedSections.circulation && (
                <div className="space-y-1">
                  <Link
                    href="/dashboard/circulation/issue"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/circulation/issue')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <ArrowUpRight className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Issue Book</span>
                  </Link>
                  <Link
                    href="/dashboard/circulation/return"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/circulation/return')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <ArrowDownLeft className="w-4 h-4 shrink-0 text-royal-400" />
                    <span>Return Book</span>
                  </Link>
                  <Link
                    href="/dashboard/circulation/issued"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/circulation/issued')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Clock className="w-4 h-4 shrink-0" />
                    <span>Issued Books</span>
                  </Link>
                  <Link
                    href="/dashboard/circulation/overdue"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/circulation/overdue')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>Overdue Books</span>
                  </Link>
                  <Link
                    href="/dashboard/circulation/history"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/circulation/history')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <History className="w-4 h-4 shrink-0" />
                    <span>Borrowing History</span>
                  </Link>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                My Circulation
              </div>
              <div className="space-y-1">
                <Link
                  href="/dashboard/circulation/issued"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive('/dashboard/circulation/issued')
                      ? 'bg-royal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Clock className="w-4 h-4 shrink-0" />
                  <span>My Borrowed Books</span>
                </Link>
                <Link
                  href="/dashboard/reservations"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive('/dashboard/reservations')
                      ? 'bg-royal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4 shrink-0" />
                  <span>My Reservations</span>
                </Link>
                <Link
                  href="/dashboard/circulation/history"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive('/dashboard/circulation/history')
                      ? 'bg-royal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span>Borrowing History</span>
                </Link>
              </div>
            </div>
          )}

          {/* Digital File Management */}
          <div>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              Digital Assets
            </div>
            <div className="space-y-1">
              <Link
                href="/dashboard/digital-files"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  isActive('/dashboard/digital-files')
                    ? 'bg-royal-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FolderLock className="w-4 h-4 shrink-0 text-teal-400" />
                <span>{isStaff ? 'File Manager' : 'Digital Library'}</span>
              </Link>
              {isStaff && (
                <Link
                  href="/dashboard/digital-files/categories"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive('/dashboard/digital-files/categories')
                      ? 'bg-royal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Tags className="w-4 h-4 shrink-0" />
                  <span>File Categories</span>
                </Link>
              )}
            </div>
          </div>

          {/* Community & Members (Staff) */}
          {isStaff && (
            <div>
              <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                Members & Requests
              </div>
              <div className="space-y-1">
                <Link
                  href="/dashboard/members"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive('/dashboard/members')
                      ? 'bg-royal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Users className="w-4 h-4 shrink-0" />
                  <span>Library Members</span>
                </Link>
                <Link
                  href="/dashboard/reservations"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive('/dashboard/reservations')
                      ? 'bg-royal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BookmarkCheck className="w-4 h-4 shrink-0" />
                  <span>Book Reservations</span>
                </Link>
              </div>
            </div>
          )}

          {/* Analytics & System */}
          <div>
            <div className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
              System & Reports
            </div>
            <div className="space-y-1">
              {isStaff && (
                <Link
                  href="/dashboard/reports"
                  onClick={onClose}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                    isActive('/dashboard/reports')
                      ? 'bg-royal-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  <span>Reports & Analytics</span>
                </Link>
              )}
              <Link
                href="/dashboard/notifications"
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  isActive('/dashboard/notifications')
                    ? 'bg-royal-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <Bell className="w-4 h-4 shrink-0" />
                <span>Notifications</span>
              </Link>
              {isAdmin && (
                <>
                  <Link
                    href="/dashboard/activity-logs"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/activity-logs')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <FileText className="w-4 h-4 shrink-0" />
                    <span>Activity Logs</span>
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    onClick={onClose}
                    className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition ${
                      isActive('/dashboard/settings')
                        ? 'bg-royal-600 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                    }`}
                  >
                    <Sliders className="w-4 h-4 shrink-0" />
                    <span>System Settings</span>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* User Footer Card */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/profile"
              onClick={onClose}
              className="flex items-center gap-3 min-w-0 flex-1 hover:opacity-80 transition"
            >
              <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-royal-400 text-sm overflow-hidden shrink-0">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name?.charAt(0) || 'U'
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-white truncate">{user?.name || 'Loading...'}</div>
                <div className="text-[11px] text-slate-400 truncate capitalize">{user?.role?.toLowerCase() || 'Member'}</div>
              </div>
            </Link>
            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
