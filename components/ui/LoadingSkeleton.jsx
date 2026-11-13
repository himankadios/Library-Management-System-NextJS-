'use client';

import React from 'react';

export function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 animate-pulse">
      <div className="flex justify-between items-center mb-4">
        <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-24"></div>
        <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
      <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded w-16 mb-2"></div>
      <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded w-32"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="w-full bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="h-4 bg-slate-200 dark:bg-slate-800 rounded flex-1"></div>
        ))}
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="p-4 flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <div key={c} className="h-4 bg-slate-100 dark:bg-slate-800/60 rounded flex-1"></div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function LoadingSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <SkeletonTable rows={4} cols={5} />
    </div>
  );
}
