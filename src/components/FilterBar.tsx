'use client';

import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';

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
    <div className="bg-white dark:bg-[#0e1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 card-highlight mb-6 space-y-3.5 transition-colors duration-200">
      {/* Search Bar + Quick Status Tabs */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search company, title, or keywords..."
            className="w-full text-xs pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#141b2e] text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors"
          />
          {search ? (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200/60 dark:bg-slate-800 text-slate-400">
              /
            </span>
          )}
        </div>

        {/* Quick Applied Status Filter Pills */}
        <div className="flex rounded-xl bg-slate-100/90 dark:bg-[#141b2e] p-1 shrink-0 overflow-x-auto border border-slate-200/80 dark:border-slate-800/80">
          {[
            { id: 'ALL', label: 'All Jobs' },
            { id: 'UNAPPLIED', label: 'Not Applied' },
            { id: 'APPLIED', label: 'Applied' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onStatusFilterChange(tab.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-[background-color,color,box-shadow] duration-150 cursor-pointer ${
                statusFilter === tab.id
                  ? 'bg-white dark:bg-[#0e1322] text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700/80'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Secondary Filter Dropdowns */}
      <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-1.5 text-slate-500 font-semibold">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="text-[11px] uppercase tracking-wider">Filters:</span>
        </div>

        {/* Source Dropdown */}
        <select
          value={sourceFilter}
          onChange={(e) => onSourceFilterChange(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141b2e] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="ALL">All Sources</option>
          <option value="WhatsApp">WhatsApp</option>
          <option value="Flyer">Flyers &amp; Screenshots</option>
          <option value="Campus Drive">Campus Drives</option>
          <option value="LinkedIn">LinkedIn</option>
        </select>

        {/* Job Type Dropdown */}
        <select
          value={typeFilter}
          onChange={(e) => onTypeFilterChange(e.target.value)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141b2e] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
        >
          <option value="ALL">All Types</option>
          <option value="Internship">Internship</option>
          <option value="Full-time">Full-time</option>
          <option value="Co-op">Co-op</option>
          <option value="Contract">Contract</option>
        </select>

        {/* Sort Dropdown */}
        <div className="ml-auto flex items-center gap-1.5">
          <span className="text-[11px] text-slate-400 hidden sm:inline">Sort:</span>
          <select
            value={sortBy}
            onChange={(e) => onSortByChange(e.target.value)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#141b2e] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
          >
            <option value="NEWEST">Newest First</option>
            <option value="DEADLINE">Deadline Soonest</option>
            <option value="COMPANY">Company (A-Z)</option>
          </select>
        </div>
      </div>
    </div>
  );
};
