'use client';

import React from 'react';
import { Plus, ArrowUp } from 'lucide-react';

interface FooterSectionProps {
  onOpenAddJob: () => void;
}

export const FooterSection: React.FC<FooterSectionProps> = ({ onOpenAddJob }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="py-12 bg-slate-50 dark:bg-[#181818] border-t border-slate-200 dark:border-[#272727] text-slate-600 dark:text-[#9b9b9b]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Closing Action Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#272727] bg-white dark:bg-[#000000] p-6 sm:p-8 text-center max-w-[680px] mx-auto mb-10 shadow-xs">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-2">
            Start tracking with your study buddy
          </h3>
          <p className="text-xs text-slate-500 dark:text-[#9b9b9b] mb-5 max-w-sm mx-auto font-normal">
            Every shared opening increases both of your odds. Paste your first job link or flyer today.
          </p>
          <button
            onClick={onOpenAddJob}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Share a job opening</span>
          </button>
        </div>

        {/* Footer Meta Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-200 dark:border-[#272727] text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-900 dark:text-white">
              Study<span className="text-blue-600 dark:text-blue-400">Buddy</span>
            </span>
            <span>•</span>
            <span>Marshal &amp; Vaishnavi Job Tracking Hub</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-[11px] text-slate-400 dark:text-[#9b9b9b]">
              Free and open for student peer groups
            </span>
            <button
              onClick={scrollToTop}
              className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              <span>Back to top</span>
              <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
