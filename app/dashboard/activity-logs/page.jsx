'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/AuthProvider';
import Badge from '@/components/ui/Badge';
import Pagination from '@/components/ui/Pagination';
import EmptyState from '@/components/ui/EmptyState';
import { SkeletonTable } from '@/components/ui/LoadingSkeleton';
import { FileText, Search, ShieldCheck } from 'lucide-react';

export default function ActivityLogsPage() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionFilter, setActionFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        page: String(page),
        limit: '20',
        action: actionFilter,
      });
      const res = await fetch(`/api/activity-logs?${q}`);
      const data = await res.json();
      setLogs(data.logs || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.total || 0);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, actionFilter]);

  const getActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <Badge variant="success">CREATE</Badge>;
      case 'UPDATE':
        return <Badge variant="primary">UPDATE</Badge>;
      case 'DELETE':
        return <Badge variant="danger">DELETE</Badge>;
      case 'ISSUE':
        return <Badge variant="teal">ISSUE</Badge>;
      case 'RETURN':
        return <Badge variant="success">RETURN</Badge>;
      case 'UPLOAD':
        return <Badge variant="primary">UPLOAD</Badge>;
      case 'LOGIN':
        return <Badge variant="default">LOGIN</Badge>;
      default:
        return <Badge variant="default">{action}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <ShieldCheck className="w-6 h-6 text-royal-600" />
            <span>Security & Activity Audit Trail</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Immutable log of all administrative operations, book circulations, and system events
          </p>
        </div>

        <select
          value={actionFilter}
          onChange={(e) => {
            setActionFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs sm:text-sm rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 focus:outline-none focus:border-royal-500 shadow-sm"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">Creation</option>
          <option value="UPDATE">Updates</option>
          <option value="DELETE">Deletions</option>
          <option value="ISSUE">Book Issue</option>
          <option value="RETURN">Book Return</option>
          <option value="UPLOAD">File Upload</option>
          <option value="LOGIN">User Logins</option>
        </select>
      </div>

      {loading ? (
        <SkeletonTable rows={10} cols={5} />
      ) : logs.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No activity logs found"
          description="There are no audit events matching your filter criteria."
        />
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase text-[11px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Action</th>
                  <th className="px-5 py-3.5">Entity</th>
                  <th className="px-5 py-3.5">Details</th>
                  <th className="px-5 py-3.5">Performed By</th>
                  <th className="px-5 py-3.5 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                    <td className="px-5 py-4">{getActionBadge(log.action)}</td>
                    <td className="px-5 py-4 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                      {log.entity}
                    </td>
                    <td className="px-5 py-4 text-xs text-slate-600 dark:text-slate-300 max-w-md">
                      {log.details || '-'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="font-semibold text-slate-800 dark:text-slate-200">
                        {log.user?.name || 'System / Guest'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {log.user?.email || 'automated'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-right font-mono text-xs text-slate-400">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}
    </div>
  );
}
