import React from 'react';
import Link from 'next/link';
import { Briefcase, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-slate-50 dark:bg-[#090d16] text-slate-900 dark:text-slate-100">
      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-200/60 dark:border-blue-900/40 shadow-xs">
        <Briefcase className="w-6 h-6" />
      </div>
      <span className="text-xs font-semibold tracking-wider uppercase text-blue-600 dark:text-blue-400 mb-1">
        404 Error
      </span>
      <h1 className="text-2xl font-bold tracking-tight mb-2">
        Job Posting Not Found
      </h1>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
        The page or job listing you are looking for may have been removed, archived, or the link might be broken.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Return to Shared Job Board</span>
      </Link>
    </div>
  );
}
