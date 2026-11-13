import Link from 'next/link';
import { BookOpen, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-navy-dark p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto rounded-3xl bg-royal-100 dark:bg-royal-950/60 flex items-center justify-center text-royal-600 mb-6 shadow-sm">
          <BookOpen className="w-10 h-10" />
        </div>
        <h1 className="text-6xl font-black text-slate-900 dark:text-white tracking-tight mb-3">404</h1>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Page Not Found</h2>
        <p className="text-slate-500 dark:text-slate-400 mb-8 text-sm">
          The catalog page, digital document, or resource you are looking for does not exist or may have been relocated.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-royal-600 hover:bg-royal-700 text-white font-medium text-sm transition shadow-sm"
          >
            <Home className="w-4 h-4" /> Go to Dashboard
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-sm transition"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
