'use client';

import React from 'react';
import { Student } from '@/lib/types';
import { StudentSwitcher } from './StudentSwitcher';
import { Briefcase, RefreshCw, Sun, Moon, Plus } from 'lucide-react';

interface NavbarProps {
  students: Student[];
  activeStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  onOpenAddJob: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  students,
  activeStudent,
  onSelectStudent,
  onOpenAddJob,
  onRefresh,
  isRefreshing = false,
  darkMode,
  onToggleDarkMode,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-[#0e1422]/95 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Briefcase className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-slate-100">
            PeerApply <span className="text-blue-600 dark:text-blue-400">Nexus</span>
          </span>
        </div>

        {/* Right Section: Student Switcher + Sync + Share Job Button + Dark Mode */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Toggle color theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Student Switcher */}
          <StudentSwitcher
            students={students}
            activeStudent={activeStudent}
            onSelectStudent={onSelectStudent}
          />

          {/* Sync Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors border border-slate-200 dark:border-slate-800"
              title="Sync latest updates"
              aria-label="Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          )}

          {/* Share Job CTA Button */}
          <button
            onClick={onOpenAddJob}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.99] transition-transform transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Share Job</span>
          </button>
        </div>
      </div>
    </header>
  );
};
