'use client';

import React from 'react';
import { Job, Student } from '@/lib/types';
import { CheckCircle2, Clock } from 'lucide-react';

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
    <div className="flex items-center gap-2.5 mb-3 text-xs">
      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800 shadow-xs">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        <span>Applied: {appliedCount}</span>
      </div>

      <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-800 shadow-xs">
        <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
        <span>Remaining: {remainingCount}</span>
      </div>
    </div>
  );
};
