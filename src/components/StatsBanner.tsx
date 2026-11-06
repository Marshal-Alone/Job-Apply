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
    <div className="flex items-center gap-3 bg-white dark:bg-[#0e1322] px-3.5 py-1.5 rounded-xl border border-slate-200/90 dark:border-slate-800 shadow-2xs">
      {/* Progress Bar HUD */}
      <div className="hidden md:flex items-center gap-2 pr-2 border-r border-slate-200 dark:border-slate-800">
        <div className="w-16 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${percentApplied}%` }}
          />
        </div>
        <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 font-mono">
          {percentApplied}%
        </span>
      </div>

      {/* Pill Counters */}
      <div className="flex items-center gap-1.5 text-xs font-semibold">
        <span className="px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800/60 text-slate-700 dark:text-slate-300">
          {totalJobs} <span className="font-normal text-slate-500">total</span>
        </span>
        <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
          {appliedCount} <span className="font-normal opacity-80">applied</span>
        </span>
        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          {remainingCount} <span className="font-normal opacity-80">pending</span>
        </span>
      </div>
    </div>
  );
};
