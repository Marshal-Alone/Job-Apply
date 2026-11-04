'use client';

import React from 'react';
import { Job, Student, ApplicationStatus } from '@/lib/types';
import {
  ExternalLink,
  CheckCircle2,
  MapPin,
  Clock,
  Trash2,
  Check,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface JobCardProps {
  job: Job;
  activeStudent: Student | null;
  onApply: (jobId: string) => void;
  onUpdateStatus: (jobId: string, status: ApplicationStatus) => void;
  onDeleteJob?: (jobId: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  activeStudent,
  onApply,
  onUpdateStatus,
  onDeleteJob,
}) => {
  const activeApp = activeStudent ? job.applications?.[activeStudent.id] : undefined;
  const isApplied = activeApp?.status === 'APPLIED';

  // Other peer (e.g., Vaishnavi if Marshal is active, or vice versa)
  const peerStudentId = activeStudent?.id === 'marshal' ? 'vaishnavi' : 'marshal';
  const peerName = activeStudent?.id === 'marshal' ? 'Vaishnavi' : 'Marshal';
  const peerApp = job.applications?.[peerStudentId];
  const peerHasApplied = peerApp?.status === 'APPLIED';

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (job.applyUrl && job.applyUrl !== '#') {
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    }
    onApply(job.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteJob && confirm(`Delete "${job.title}" at ${job.company}?`)) {
      onDeleteJob(job.id);
    }
  };

  // Clean description to remove any raw URLs or URL fragments
  const cleanDescription = (job.description || '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .trim();

  return (
    <div
      className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between ${
        isApplied
          ? 'bg-slate-100/90 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-500 shadow-none opacity-80 hover:opacity-100'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-slate-300 dark:hover:border-slate-700'
      }`}
    >
      <div>
        {/* Header: Company Name, Applied Badge, Time, Shared by & Delete */}
        <div className="flex items-center justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-bold text-xs uppercase tracking-wider ${
                isApplied ? 'text-slate-500 dark:text-slate-400' : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {job.company}
            </span>

            {/* Gray Applied Badge */}
            {isApplied && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Applied</span>
              </span>
            )}

            <span className="text-[11px] text-slate-400 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTimeAgo(job.createdAt)}
            </span>

            <span className="text-[11px] text-slate-400">
              • Shared by {job.postedBy?.studentName?.split(' ')[0] || 'Friend'}
            </span>
          </div>

          {onDeleteJob && (
            <button
              onClick={handleDelete}
              className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
              title="Delete job"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3
          className={`font-bold text-base md:text-lg leading-snug mb-2 ${
            isApplied ? 'text-slate-600 dark:text-slate-400' : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {job.title}
        </h3>

        {/* Location / Mode */}
        <div className="flex items-center gap-2 mb-3 text-xs text-slate-400">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span>{job.location || 'Remote'}</span>
          </div>
          <span>•</span>
          <span>{job.jobType || 'Internship'}</span>
        </div>

        {/* Clean Description / Extracted Info */}
        {cleanDescription && (
          <p
            className={`text-xs line-clamp-2 leading-relaxed mb-4 ${
              isApplied ? 'text-slate-500 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {cleanDescription}
          </p>
        )}
      </div>

      {/* Footer: Peer status + Apply Button */}
      <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-3">
        {/* Peer Status */}
        <div className="text-xs text-slate-500">
          {peerHasApplied ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {peerName} applied
            </span>
          ) : (
            <span className="text-slate-400">
              {peerName} hasn&apos;t applied yet
            </span>
          )}
        </div>

        {/* Action Button: Opens link & marks applied */}
        {isApplied ? (
          <div className="flex items-center gap-2">
            <button
              onClick={handleApplyClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shadow-none"
              title="Open link again"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Applied (Re-visit)</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </button>
            <button
              onClick={() => onUpdateStatus(job.id, 'NOT_APPLIED')}
              className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              title="Reset status"
            >
              Reset
            </button>
          </div>
        ) : (
          <button
            onClick={handleApplyClick}
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm active:scale-[0.98]"
          >
            <span>Apply Now</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  );
};
