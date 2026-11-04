'use client';

import React from 'react';
import { Search, Filter, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

interface FilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  sortBy: string;
  onSortByChange: (value: string) => void;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  sourceFilter,
  onSourceFilterChange,
  typeFilter,
  onTypeFilterChange,
  sortBy,
  onSortByChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm mb-6 space-y-3">
      {/* Search Bar + Quick Status Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by company (Google, Stripe), role, skill (React, Python), or tags..."
            className="w-full text-xs pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/60 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Quick Applied Status Filter Pills */}
        <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800/60 p-1 shrink-0 overflow-x-auto">
          {[
            { id: 'ALL', label: 'All Jobs' },
            { id: 'UNAPPLIED', label: 'Not Applied Yet' },
            { id: 'APPLIED', label: '✓ Applied by Me' },
            { id: 'INTERVIEWING', label: '🎯 Interviewing' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Dropdown Filter Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
        <div className="flex items-center gap-1.5 mr-1 text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[11px] font-medium">Refine:</span>
        </div>

        {/* Source Dropdown */}
        <select
          value={sourceFilter}
          onChange={(e) => onSourceFilterChange(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Sources</option>
          <option value="WhatsApp">💬 WhatsApp Group Finds</option>
          <option value="Flyer">🖼️ Flyers & Posters</option>
          <option value="Campus Drive">🎓 Campus Drives</option>
          <option value="LinkedIn">🌐 LinkedIn</option>
        </select>

        {/* Job Type Dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="ALL">All Types</option>
          <option value="Internship">Internship</option>
          <option value="Full-time">Full-time</option>
          <option value="Co-op">Co-op</option>
          <option value="Contract">Contract</option>
        </select>

        {/* Sort Dropdown */}
        <select
          value={sortBy}
          onChange={(e) => onSortByChange(e.target.value)}
          className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 focus:outline-none ml-auto"
        >
          <option value="NEWEST">Newest First</option>
          <option value="DEADLINE">Deadline Soonest</option>
          <option value="COMPANY">Company (A-Z)</option>
        </select>
      </div>
    </div>
  );
};
