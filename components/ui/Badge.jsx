'use client';

import React from 'react';

export default function Badge({ children, variant = 'default', size = 'sm' }) {
  const variants = {
    default: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    primary: 'bg-royal-50 text-royal-700 dark:bg-royal-950/60 dark:text-royal-300 border-royal-200 dark:border-royal-800',
    success: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    teal: 'bg-tealAccent-50 text-tealAccent-700 dark:bg-tealAccent-950/60 dark:text-tealAccent-300 border-tealAccent-200 dark:border-tealAccent-800',
  };

  const sizes = {
    xs: 'px-2 py-0.5 text-[11px]',
    sm: 'px-2.5 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${variants[variant] || variants.default} ${sizes[size] || sizes.sm}`}
    >
      {children}
    </span>
  );
}
