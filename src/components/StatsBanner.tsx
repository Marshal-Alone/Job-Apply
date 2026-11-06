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
  const percentApplied = totalJobs > 0 ? Math.round((appliedCount / totalJobs) * 100) : 0;

  if (totalJobs === 0) return null;

  return (
    <div className="flex items-center gap-3 bg-white dark:bg-[#181818] px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#272727]">
      {/* Progress Bar HUD */}
      <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-[#272727]">
        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-[#272727] overflow-hidden">
          <div
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${percentApplied}%` }}
          />
        </div>
        <span className="text-[11px] font-semibold text-slate-700 dark:text-[#9b9b9b] font-mono">
          {percentApplied}%
        </span>
      </div>

      {/* Pill Counters */}
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#1f1f1f] text-slate-700 dark:text-[#d1d5db]">
          {totalJobs} <span className="font-normal text-slate-500 dark:text-[#9b9b9b]">total</span>
        </span>
        <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
          {appliedCount} <span className="font-normal opacity-80">applied</span>
        </span>
        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-[#1f1f1f] text-slate-600 dark:text-[#9b9b9b]">
          {remainingCount} <span className="font-normal opacity-80">pending</span>
        </span>
      </div>
    </div>
  );
};
