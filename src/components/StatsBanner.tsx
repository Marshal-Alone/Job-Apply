'use client';

import React from 'react';
import { Job, Student } from '@/lib/types';
import { CheckCircle2, Clock, Briefcase } from 'lucide-react';

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
    <div className="flex items-center gap-2 mb-4 text-xs">
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-800">
        <Briefcase className="w-3.5 h-3.5 text-slate-500" />
        <span>Total: {totalJobs}</span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-900/60">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Applied: {appliedCount}</span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-800">
        <Clock className="w-3.5 h-3.5 text-slate-500" />
        <span>Remaining: {remainingCount}</span>
      </div>
    </div>
  );
};
