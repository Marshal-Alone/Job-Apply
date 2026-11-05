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
  Sparkles,
  Send,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
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
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  if (!job) return null;

  const activeApp = activeStudent ? job.applications?.[activeStudent.id] : undefined;
  const currentStatus: ApplicationStatus = activeApp?.status || 'NOT_APPLIED';
  const [personalNotes, setPersonalNotes] = useState(activeApp?.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Normalize all attached guide images
  const images: string[] =
    job.imageUrls && job.imageUrls.length > 0
      ? job.imageUrls
      : job.imageUrl
      ? [job.imageUrl]
      : [];

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

  const handlePrevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const handleNextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  return (
    <>
      {/* Fullscreen Lightbox Overlay */}
      {isLightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Top Bar */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>
                Screenshot {activeImageIndex + 1} of {images.length}
              </span>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Encircled Image */}
          <div
            className="relative max-w-5xl max-h-[85vh] w-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={images[activeImageIndex]}
              alt={`Screenshot ${activeImageIndex + 1}`}
              className="max-h-[80vh] max-w-full object-contain rounded-xl shadow-2xl"
            />

            {images.length > 1 && (
              <>
                <button
                  onClick={handlePrevImage}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition border border-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition border border-white/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail Bar in Lightbox */}
          {images.length > 1 && (
            <div
              className="absolute bottom-4 flex items-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-sm max-w-md overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition shrink-0 ${
                    activeImageIndex === idx
                      ? 'border-blue-500 scale-105'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Main Job Modal */}
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-3xl my-8 p-6 md:p-8 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
          {/* Top Header */}
          <div className="flex items-start justify-between pb-4 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {job.company}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {job.jobType}
                </span>
                <span className="text-xs text-slate-400">
                  Posted {formatTimeAgo(job.createdAt)} by {job.postedBy?.studentName || 'Friend'}
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

            {/* Guide Screenshots Gallery (Shows all attached images) */}
            {images.length > 0 && (
              <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/70 dark:bg-slate-950/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-indigo-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                      Guide Screenshots &amp; Instructions ({images.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      Image {activeImageIndex + 1} of {images.length}
                    </span>
                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="p-1 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition flex items-center gap-1 text-xs"
                      title="Enlarge image"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline text-[11px]">Enlarge</span>
                    </button>
                  </div>
                </div>

                {/* Main Image Viewer */}
                <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/10 dark:bg-black/40 flex items-center justify-center min-h-[220px] max-h-[420px]">
                  <img
                    src={images[activeImageIndex]}
                    alt={`Screenshot ${activeImageIndex + 1}`}
                    className="w-full max-h-[420px] object-contain cursor-pointer transition hover:opacity-95"
                    onClick={() => setIsLightboxOpen(true)}
                  />

                  {/* Navigation Arrows (if multiple images) */}
                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition shadow-md"
                        title="Previous screenshot"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white transition shadow-md"
                        title="Next screenshot"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnail Strip */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 pt-3 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative rounded-xl overflow-hidden border-2 transition shrink-0 w-16 h-16 bg-black/10 ${
                          activeImageIndex === idx
                            ? 'border-blue-600 ring-2 ring-blue-500/20 scale-105'
                            : 'border-slate-200 dark:border-slate-800 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">
                          #{idx + 1}
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Job Description &amp; Details
              </h4>
              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                {job.description}
              </div>
            </div>

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Required Skills &amp; Tags
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
                  {(['NOT_APPLIED', 'APPLIED'] as ApplicationStatus[]).map((status) => (
                    <button
                      key={status}
                      onClick={() => onUpdateStatus(job.id, status, personalNotes)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                        currentStatus === status
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                      }`}
                    >
                      {status === 'NOT_APPLIED' ? 'Not Applied' : '✓ Applied'}
                    </button>
                  ))}
                </div>

                {/* Personal Notes */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">
                    Add Private Application / Referral Notes (e.g. referral ID, instructions)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={personalNotes}
                      onChange={(e) => setPersonalNotes(e.target.value)}
                      placeholder="e.g. Sent referral to recruiter..."
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
              <span>AI Match &amp; Cold Email</span>
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
                <span>{currentStatus === 'APPLIED' ? 'Re-open Portal' : 'Apply & Track'}</span>
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
