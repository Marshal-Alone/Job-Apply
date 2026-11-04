'use client';

import React, { useState } from 'react';
import { Job, Student, ApplicationStatus } from '@/lib/types';
import {
  X,
  ExternalLink,
  CheckCircle2,
  Calendar,
  MapPin,
  DollarSign,
  Clock,
  Users,
  Image as ImageIcon,
  MessageSquare,
  Sparkles,
  Send,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
  activeStudent: Student | null;
  onApply: (jobId: string) => void;
  onUpdateStatus: (jobId: string, status: ApplicationStatus, notes?: string) => void;
  onOpenAiFit: (job: Job) => void;
}

export const JobModal: React.FC<JobModalProps> = ({
  job,
  onClose,
  activeStudent,
  onApply,
  onUpdateStatus,
  onOpenAiFit,
}) => {
  if (!job) return null;

  const activeApp = activeStudent ? job.applications?.[activeStudent.id] : undefined;
  const currentStatus: ApplicationStatus = activeApp?.status || 'NOT_APPLIED';
  const [personalNotes, setPersonalNotes] = useState(activeApp?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showFullImage, setShowFullImage] = useState(false);

  const allApplicants = Object.values(job.applications || {}).filter(
    (app) => app.status !== 'NOT_APPLIED'
  );

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    await onUpdateStatus(job.id, currentStatus, personalNotes);
    setIsSavingNotes(false);
  };

  const handleApplyClick = () => {
    if (job.applyUrl && job.applyUrl !== '#') {
      window.open(job.applyUrl, '_blank', 'noopener,noreferrer');
    }
    onApply(job.id);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl my-8 p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        {/* Top Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {job.company}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {job.jobType}
              </span>
              <span className="text-xs text-slate-400">
                Posted {formatTimeAgo(job.createdAt)} by {job.postedBy.studentName}
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {job.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto py-4 space-y-6 flex-1 pr-1">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Location</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                <MapPin className="w-3.5 h-3.5 text-blue-500" />
                <span>{job.location}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Stipend / Salary</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <DollarSign className="w-3.5 h-3.5" />
                <span>{job.salary || 'Not specified'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Deadline</span>
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                <Calendar className="w-3.5 h-3.5" />
                <span>{job.deadline || 'Rolling basis'}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-400 block mb-1">Shared Via</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                {job.source}
              </span>
            </div>
          </div>

          {/* Attached Flyer Image (if available) */}
          {job.imageUrl && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/50 dark:bg-slate-950/40">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-indigo-500" />
                  Uploaded WhatsApp Flyer / Screenshot
                </span>
                <button
                  onClick={() => setShowFullImage(!showFullImage)}
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showFullImage ? 'Collapse' : 'Expand Image'}
                </button>
              </div>
              <div
                className={`overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-black/5 flex items-center justify-center transition-all ${
                  showFullImage ? 'max-h-none' : 'max-h-60'
                }`}
              >
                <img
                  src={job.imageUrl}
                  alt="Job Flyer"
                  className="w-full object-contain cursor-pointer"
                  onClick={() => setShowFullImage(!showFullImage)}
                />
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Job Description & Details
            </h4>
            <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              {job.description}
            </div>
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Required Skills & Tags
              </h4>
              <div className="flex flex-wrap gap-2">
                {job.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="text-xs font-medium px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Classmates Applications Status Breakdown */}
          <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                  Classmates in Your Group Who Applied ({allApplicants.length})
                </h4>
              </div>
              <span className="text-[11px] text-slate-500">Live Peer Sync</span>
            </div>

            {allApplicants.length > 0 ? (
              <div className="space-y-2">
                {allApplicants.map((app) => (
                  <div
                    key={app.studentId}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={
                          app.studentAvatar ||
                          `https://api.dicebear.com/7.x/bottts/svg?seed=${app.studentName}`
                        }
                        alt={app.studentName}
                        className="w-7 h-7 rounded-full border bg-slate-100"
                      />
                      <div>
                        <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                          {app.studentName}
                        </span>
                        {app.notes && (
                          <span className="text-[11px] text-slate-500 block italic">
                            &quot;{app.notes}&quot;
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                          app.status === 'APPLIED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : app.status === 'INTERVIEWING'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : app.status === 'OFFER'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {app.status}
                      </span>
                      {app.appliedAt && (
                        <span className="block text-[10px] text-slate-400 mt-0.5">
                          {formatTimeAgo(app.appliedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic py-2">
                None of your classmates have tracked this application yet.
              </p>
            )}
          </div>

          {/* Active Student Application Tracker & Notes */}
          {activeStudent && (
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Your Personal Application Tracker ({activeStudent.name})
              </h4>

              <div className="flex flex-wrap items-center gap-2 mb-3">
                {(['NOT_APPLIED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED'] as ApplicationStatus[]).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => onUpdateStatus(job.id, status, personalNotes)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        currentStatus === status
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {status === 'NOT_APPLIED'
                        ? 'Not Applied'
                        : status === 'APPLIED'
                        ? '✓ Applied'
                        : status === 'INTERVIEWING'
                        ? '🎯 Interviewing'
                        : status === 'OFFER'
                        ? '🎉 Offer'
                        : 'Rejected'}
                    </button>
                  )
                )}
              </div>

              {/* Personal Notes */}
              <div>
                <label className="block text-[11px] font-medium text-slate-500 mb-1">
                  Add Private Application / Referral Notes (e.g. referral ID, OA deadline)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={personalNotes}
                    onChange={(e) => setPersonalNotes(e.target.value)}
                    placeholder="e.g. Sent referral to alumni John on LinkedIn..."
                    className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center gap-1.5 transition"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Save</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Footer */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={() => onOpenAiFit(job)}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-purple-600 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition"
          >
            <Sparkles className="w-4 h-4 text-purple-500" />
            <span>AI Match & Cold Email</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>

            <button
              onClick={handleApplyClick}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md"
            >
              <span>{currentStatus === 'APPLIED' ? 'Re-open Portal' : 'Apply & Mark Applied'}</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
