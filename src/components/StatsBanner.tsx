'use client';

import React from 'react';
import { Job, Student } from '@/lib/types';

interface StatsBannerProps {
  jobs: Job[];
  activeStudent: Student | null;
}

export const StatsBanner: React.FC<StatsBannerProps> = ({ jobs, activeStudent }) => {
  const totalJobs = jobs.length;

  const appliedCount = activeStudent
    ? jobs.filter((j) => {
        const app = j.applications?.[activeStudent.id];
        return app && app.status !== 'NOT_APPLIED';
      }).length
    : 0;

  const remainingCount = Math.max(0, totalJobs - appliedCount);

  if (totalJobs === 0) return null;

  return (
    <div className="flex items-center gap-1.5 text-xs font-medium">
      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800">
        {totalJobs} total
      </span>
      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 font-semibold">
        {appliedCount} applied
      </span>
      <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800">
        {remainingCount} pending
      </span>
    </div>
  );
};
