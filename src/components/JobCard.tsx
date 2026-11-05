'use client';

import React, { useState } from 'react';
import { Job, Student, ApplicationStatus } from '@/lib/types';
import {
  ExternalLink,
  CheckCircle2,
  MapPin,
  Clock,
  Trash2,
  Check,
  Image as ImageIcon,
  Mail,
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

  // Other peer (e.g., Vaishnavi if Marshal is active, or vice versa)
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

  // Clean description to remove any raw URLs or URL fragments
  const cleanDescription = (job.description || '')
    .replace(/https?:\/\/[^\s]+/gi, '')
    .trim();

  return (
    <div
      onClick={handleCardClick}
      className={`rounded-2xl border p-5 transition-all duration-200 flex flex-col justify-between cursor-pointer group ${
        isApplied
          ? 'bg-slate-100/90 dark:bg-slate-900/60 border-slate-300 dark:border-slate-800 text-slate-500 shadow-none opacity-80 hover:opacity-100'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-400 dark:hover:border-blue-500 hover:shadow-md'
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

            {/* HR Email Badge */}
            {isEmailApply && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                <Mail className="w-3 h-3" />
                <span>HR Email</span>
              </span>
            )}

            {/* Gray Applied Badge */}
            {isApplied && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                <span>Applied</span>
              </span>
            )}

            {/* Guide Images Count Badge */}
            {images.length > 0 && (
              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/60">
                <ImageIcon className="w-3 h-3" />
                <span>{images.length} {images.length === 1 ? 'Guide Screenshot' : 'Guide Screenshots'}</span>
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
          className={`font-bold text-base md:text-lg leading-snug mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors ${
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

        {/* Friend Note Preview (if provided) */}
        {job.friendNote && (
          <div className="mb-3 px-3 py-2 rounded-xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/70 dark:border-amber-500/30 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2">
            <span className="font-bold text-amber-700 dark:text-amber-400 shrink-0">
              💬 {job.postedBy?.studentName?.split(' ')[0] || 'Friend'}:
            </span>
            <span className="italic line-clamp-2 leading-relaxed">
              &ldquo;{job.friendNote}&rdquo;
            </span>
          </div>
        )}

        {/* Clean Description / Extracted Info */}
        {cleanDescription && (
          <p
            className={`text-xs line-clamp-2 leading-relaxed mb-3 ${
              isApplied ? 'text-slate-500 dark:text-slate-500' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            {cleanDescription}
          </p>
        )}

        {/* Mini Guide Screenshots Preview Strip (if available) */}
        {images.length > 0 && (
          <div className="mb-3 flex items-center gap-2 overflow-x-auto pb-1">
            {images.slice(0, 4).map((img, idx) => (
              <div
                key={idx}
                className="relative w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/10 shrink-0"
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
              Click to view all {images.length} guide screenshots &rarr;
            </span>
          </div>
        )}
      </div>

      {/* Footer: Peer status + Action Buttons */}
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

        {/* Action Buttons: Details + Apply */}
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onSelectJob) onSelectJob(job);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
          >
            {images.length > 0 ? `Screenshots (${images.length})` : 'Details'}
          </button>

          {isApplied ? (
            <div className="flex items-center gap-1.5">
              <button
                onClick={handleApplyClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shadow-none"
                title={isEmailApply ? 'View HR email popup' : 'Open link again'}
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
                title="Reset status"
              >
                Reset
              </button>
            </div>
          ) : isEmailApply ? (
            <button
              onClick={handleApplyClick}
              title={`Popup: ${job.applyInstructions || 'Send resume on HR email'}`}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm active:scale-[0.98]"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Apply (HR Email)</span>
            </button>
          ) : (
            <button
              onClick={handleApplyClick}
              title={`Opens ${job.applyUrl}`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-sm active:scale-[0.98]"
            >
              <span>Apply</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Apply Instructions Popup Modal */}
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
