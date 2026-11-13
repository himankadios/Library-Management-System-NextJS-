'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from 'lucide-react';

export default function Breadcrumb() {
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);

  const formatSegment = (str) => {
    return str
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  return (
    <nav className="flex items-center text-xs font-medium text-slate-500 dark:text-slate-400 space-x-1.5 overflow-x-auto py-1">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-royal-600 dark:hover:text-royal-400 transition"
      >
        <Home className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Home</span>
      </Link>
      {segments.map((segment, index) => {
        const href = `/${segments.slice(0, index + 1).join('/')}`;
        const isLast = index === segments.length - 1;
        // Don't duplicate dashboard if it's the first segment
        if (segment === 'dashboard' && index === 0) return null;

        return (
          <React.Fragment key={href}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            {isLast ? (
              <span className="text-slate-900 dark:text-slate-200 font-semibold truncate">
                {formatSegment(segment)}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-royal-600 dark:hover:text-royal-400 transition truncate"
              >
                {formatSegment(segment)}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
