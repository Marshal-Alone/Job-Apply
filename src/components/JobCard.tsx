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
  Globe,
  RotateCcw,
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

  // Peer status (Marshal / Vaishnavi)
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
      className={`relative rounded-2xl border p-5 cursor-pointer group flex flex-col justify-between origin-center transition-[transform,opacity,background-color,border-color,box-shadow] duration-200 ${
        isApplied
          ? 'bg-slate-100/70 dark:bg-[#090d18]/80 border-slate-200/60 dark:border-slate-800/60 opacity-70 scale-[0.96] hover:scale-[0.98] hover:opacity-95'
          : 'bg-white dark:bg-[#0e1322] border-slate-200/90 dark:border-slate-800/80 card-highlight hover:border-blue-500/40 dark:hover:border-blue-500/30 scale-100 hover:-translate-y-0.5'
      }`}
    >
      <div>
        {/* Top Meta Header: Company, Action Type, Time & Delete */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Company Name */}
            <span
              className={`font-bold text-xs tracking-wider uppercase ${
                isApplied
                  ? 'text-slate-400 dark:text-slate-500'
                  : 'text-blue-600 dark:text-blue-400'
              }`}
            >
              {job.company}
            </span>

            {/* Application Mode Badge */}
            {isEmailApply ? (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                isApplied
                  ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                  : 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-900/60'
              }`}>
                <Mail className="w-3 h-3 text-indigo-500" />
                <span>HR Email</span>
              </span>
            ) : (
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-md border ${
                isApplied
                  ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800'
                  : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700/60'
              }`}>
                <Globe className="w-3 h-3 text-blue-500" />
                <span>Career Link</span>
              </span>
            )}

            {/* Screenshots count badge */}
            {images.length > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
                <ImageIcon className="w-3 h-3 text-slate-500" />
                <span>{images.length} {images.length === 1 ? 'Screenshot' : 'Screenshots'}</span>
              </span>
            )}

            {/* Applied Indicator Badge */}
            {isApplied && (
              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Check className="w-3 h-3" />
                <span>Applied</span>
              </span>
            )}

            <span className="text-[11px] text-slate-400 flex items-center gap-1 ml-auto sm:ml-0 font-medium">
              <Clock className="w-3 h-3" />
              <span>{formatTimeAgo(job.createdAt)}</span>
            </span>
          </div>

          {onDeleteJob && (
            <button
              onClick={handleDelete}
              className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer"
              title="Delete job"
              aria-label="Delete job"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Job Title: Gray when applied, card is shrunk */}
        <h3
          className={`font-bold text-base sm:text-lg leading-snug mb-2.5 transition-colors ${
            isApplied
              ? 'text-slate-500 dark:text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-300'
              : 'text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400'
          }`}
        >
          {job.title}
        </h3>

        {/* Description / Instructions */}
        {cleanDescription && (
          <p
            className={`text-xs line-clamp-2 leading-relaxed mb-4 ${
              isApplied
                ? 'text-slate-400 dark:text-slate-600'
                : 'text-slate-600 dark:text-slate-300'
            }`}
          >
            {cleanDescription}
          </p>
        )}

        {/* Screenshots Preview Strip */}
        {images.length > 0 && (
          <div className={`mb-4 flex items-center gap-2 overflow-x-auto pb-1 ${isApplied ? 'opacity-50 group-hover:opacity-100' : ''}`}>
            {images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="relative w-12 h-12 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 shrink-0 group/img"
              >
                <img
                  src={img}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-200 group-hover/img:scale-108"
                />
                {idx === 3 && images.length > 4 && (
                  <div className="absolute inset-0 bg-black/70 text-white font-bold text-[10px] flex items-center justify-center">
                    +{images.length - 3}
                  </div>
                )}
              </div>
            ))}
            <span className="text-[11px] text-blue-600 dark:text-blue-400 font-semibold whitespace-nowrap pl-1">
              View {images.length} {images.length === 1 ? 'screenshot' : 'screenshots'} &rarr;
            </span>
          </div>
        )}
      </div>

      {/* Card Footer: Peer status + Action Buttons */}
      <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
        {/* Peer application state */}
        <div className="text-xs">
          {peerHasApplied ? (
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>{peerName} applied</span>
            </span>
          ) : (
            <span className="text-slate-400 font-medium">
              {peerName} hasn&apos;t applied
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
            className="px-3.5 py-1.5 rounded-xl text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 transition-colors cursor-pointer"
          >
            {images.length > 0 ? `Screenshots (${images.length})` : 'Details'}
          </button>

          {isApplied ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleApplyClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200/90 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
                title={isEmailApply ? 'View HR email popup' : 'Re-open link'}
              >
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Applied</span>
                {isEmailApply ? <Mail className="w-3 h-3 opacity-60" /> : <ExternalLink className="w-3 h-3 opacity-60" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateStatus(job.id, 'NOT_APPLIED');
                }}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Reset status"
                aria-label="Reset status"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : isEmailApply ? (
            <button
              onClick={handleApplyClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Apply (HR Email)</span>
            </button>
          ) : (
            <button
              onClick={handleApplyClick}
              className="flex items-center gap-2 px-4.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs active:scale-[0.98] cursor-pointer"
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
