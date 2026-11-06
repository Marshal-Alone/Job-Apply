'use client';

import React, { useState } from 'react';
import { Job, Student, ApplicationStatus } from '@/lib/types';
import {
  ExternalLink,
  CheckCircle2,
  Clock,
  Trash2,
  Check,
  Image as ImageIcon,
  Mail,
  Building2,
  Globe,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { ApplyActionModal } from './ApplyActionModal';

interface JobCardProps {
  job: Job;
  activeStudent: Student | null;
  onApply: (jobId: string) => void;
  onUpdateStatus: (jobId: string, status: ApplicationStatus) => void;
  onDeleteJob?: (jobId: string) => void;
  onSelectJob?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  activeStudent,
  onApply,
  onUpdateStatus,
  onDeleteJob,
  onSelectJob,
}) => {
  const [isApplyPopupOpen, setIsApplyPopupOpen] = useState(false);

  const activeApp = activeStudent ? job.applications?.[activeStudent.id] : undefined;
  const isApplied = activeApp?.status === 'APPLIED';

  // Normalize all attached guide images
  const images: string[] =
    job.imageUrls && job.imageUrls.length > 0
      ? job.imageUrls
      : job.imageUrl
      ? [job.imageUrl]
      : [];

  const isEmailApply =
    job.applyType === 'EMAIL' ||
    Boolean(job.applyInstructions) ||
    job.applyUrl.startsWith('mailto:') ||
    (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.applyUrl) && !job.applyUrl.startsWith('http'));

  // Peer status
  const peerStudentId = activeStudent?.id === 'marshal' ? 'vaishnavi' : 'marshal';
  const peerName = activeStudent?.id === 'marshal' ? 'Vaishnavi' : 'Marshal';
  const peerApp = job.applications?.[peerStudentId];
  const peerHasApplied = peerApp?.status === 'APPLIED';

  const handleApplyClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEmailApply) {
      setIsApplyPopupOpen(true);
    } else {
      if (job.applyUrl && job.applyUrl !== '#') {
        window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
      }
      onApply(job.id);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteJob && confirm(`Delete "${job.title}" at ${job.company}?`)) {
      onDeleteJob(job.id);
    }
  };

  const handleCardClick = () => {
    if (onSelectJob) {
      onSelectJob(job);
    }
  };

  const cleanDescription = (job.description || '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .trim();

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-2xl border p-5 transition-colors cursor-pointer group flex flex-col justify-between ${
        isApplied
          ? 'bg-slate-50/80 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500/70 dark:hover:border-blue-500/60 shadow-xs'
      }`}
    >
      <div>
        {/* Top Meta Header */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`font-semibold text-xs tracking-wide uppercase ${
                isApplied
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {job.company}
            </span>

            {/* Application Mode Badge */}
            {isEmailApply ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                <Mail className="w-3 h-3" />
                <span>HR Email</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                <Globe className="w-3 h-3" />
                <span>Career Link</span>
              </span>
            )}

            {/* Screenshots Badge */}
            {images.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700/60">
                <ImageIcon className="w-3 h-3" />
                <span>{images.length} {images.length === 1 ? 'Screenshot' : 'Screenshots'}</span>
              </span>
            )}

            {/* Applied Indicator Badge */}
            {isApplied && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Applied</span>
              </span>
            )}

            <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(job.createdAt)}</span>
            </span>
          </div>

          {onDeleteJob && (
            <button
              onClick={handleDelete}
              className="p-1 rounded-md text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              title="Delete job"
              aria-label="Delete job"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3
          className={`font-semibold text-base leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
            isApplied ? 'text-slate-600 dark:text-slate-300' : 'text-slate-900 dark:text-slate-100'
          }`}
        >
          {job.title}
        </h3>

        {/* Description / Instructions */}
        {cleanDescription && (
          <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
            {cleanDescription}
          </p>
        )}

        {/* Screenshots Preview Strip */}
        {images.length > 0 && (
          <div className="mb-3.5 flex items-center gap-2 overflow-x-auto pb-1">
            {images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0"
              >
                <img src={img} alt="" className="w-full h-full object-cover" />
                {idx === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/70 text-white font-bold text-[10px] flex items-center justify-center">
                    +{images.length - 3}
                  </div>
                )}
              </div>
            ))}
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap pl-1">
              View {images.length} {images.length === 1 ? 'screenshot' : 'screenshots'} &rarr;
            </span>
          </div>
        )}
      </div>

      {/* Card Footer */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        {/* Peer application state */}
        <div className="text-xs text-slate-500">
          {peerHasApplied ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{peerName} applied</span>
            </span>
          ) : (
            <span className="text-slate-400">
              {peerName} hasn&apos;t applied yet
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectJob) onSelectJob(job);
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors"
          >
            {images.length > 0 ? `Screenshots (${images.length})` : 'Details'}
          </button>

          {isApplied ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleApplyClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
                title={isEmailApply ? 'View HR email popup' : 'Re-open application link'}
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Applied</span>
                {isEmailApply ? <Mail className="w-3 h-3 opacity-60" /> : <ExternalLink className="w-3 h-3 opacity-60" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(job.id, 'NOT_APPLIED');
                }}
                className="px-2 py-1 text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Reset application status"
              >
                Reset
              </button>
            </div>
          ) : isEmailApply ? (
            <button
              onClick={handleApplyClick}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs active:scale-[0.99]"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Apply (HR Email)</span>
            </button>
          ) : (
            <button
              onClick={handleApplyClick}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs active:scale-[0.99]"
            >
              <span>Apply</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Apply Action Instructions Popup Modal */}
      {isApplyPopupOpen && (
        <ApplyActionModal
          job={job}
          student={activeStudent}
          isOpen={isApplyPopupOpen}
          onClose={() => setIsApplyPopupOpen(false)}
          onApply={onApply}
        />
      )}
    </div>
  );
};
