'use client';

import React from 'react';
import { Plus, ArrowDown, Users } from 'lucide-react';

interface LandingHeroProps {
  onOpenAddJob: () => void;
  onScrollToBoard: () => void;
  totalJobs: number;
}

export const LandingHero: React.FC<LandingHeroProps> = ({
  onOpenAddJob,
  onScrollToBoard,
  totalJobs,
}) => {
  return (
    <section className="pt-8 pb-10 sm:pt-12 sm:pb-14 border-b border-slate-200 dark:border-[#272727]">
      <div className="max-w-[680px] mx-auto text-center px-4">
        {/* Eyebrow Pill */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#1f1f1f] border border-slate-200 dark:border-[#272727] text-xs font-semibold text-slate-700 dark:text-[#d1d5db] mb-5">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span>Peer career hub for students</span>
        </div>

        {/* Hero Heading with B5 Signature Left-to-Right Text Gradient */}
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight hero-gradient-text mb-4 leading-tight">
          Land your next role with your study buddy
        </h1>

        {/* Subheadline with B5 max-w and pretty wrapping */}
        <p className="text-sm sm:text-base text-slate-600 dark:text-[#9b9b9b] leading-relaxed mb-7 font-normal">
          Replace lost chat links with a shared board. Drop job links or paste flyer screenshots, verify whether to apply online or email HR, and keep each other accountable in real time.
        </p>

        {/* CTA Button Row per B2 padding */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
          <button
            onClick={onOpenAddJob}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Share a job opening</span>
          </button>
          <button
            onClick={onScrollToBoard}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#d1d5db] bg-slate-100 dark:bg-[#181818] hover:bg-slate-200 dark:hover:bg-[#272727] border border-slate-200 dark:border-[#272727] active:scale-[0.98] transition-all duration-200 cursor-pointer"
          >
            <span>View shared board</span>
            <ArrowDown className="w-3.5 h-3.5 opacity-60" />
          </button>
        </div>

        {/* Honest Proof Signal */}
        <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-[#9b9b9b] font-medium">
          <Users className="w-3.5 h-3.5 text-blue-500 shrink-0" />
          <span>100% free for student peer groups • {totalJobs} active {totalJobs === 1 ? 'opening' : 'openings'} shared</span>
        </div>
      </div>
    </section>
  );
};
