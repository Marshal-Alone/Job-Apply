'use client';

import React, { useState, useEffect } from 'react';
import { Job, Student } from '@/lib/types';
import {
  X,
  ExternalLink,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Mail,
  Globe,
  Edit3,
  Check,
} from 'lucide-react';
import { formatTimeAgo } from '@/lib/utils';
import { ApplyActionModal } from './ApplyActionModal';

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
  activeStudent: Student | null;
  onApply: (jobId: string) => void;
  onJobUpdated?: (updatedJob: Job) => void;
}

export const JobModal: React.FC<JobModalProps> = ({
  job,
  onClose,
  activeStudent,
  onApply,
  onJobUpdated,
}) => {
  const [currentJob, setCurrentJob] = useState<Job | null>(job);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isApplyPopupOpen, setIsApplyPopupOpen] = useState(false);

  // Apply action edit state
  const [isEditingAction, setIsEditingAction] = useState(false);
  const [editActionType, setEditActionType] = useState<'LINK' | 'EMAIL'>('LINK');
  const [editUrl, setEditUrl] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editInstructions, setEditInstructions] = useState('');
  const [isSavingAction, setIsSavingAction] = useState(false);

  useEffect(() => {
    if (job) {
      setCurrentJob(job);
      const isEmail =
        job.applyType === 'EMAIL' ||
        Boolean(job.applyInstructions) ||
        job.applyUrl.startsWith('mailto:') ||
        (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(job.applyUrl) && !job.applyUrl.startsWith('http'));

      const initialEmail =
        job.applyEmail ||
        (job.applyUrl.startsWith('mailto:')
          ? job.applyUrl.replace('mailto:', '').split('?')[0]
          : job.applyUrl.includes('@') && !job.applyUrl.startsWith('http')
          ? job.applyUrl.trim()
          : (job.description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || ''));

      setEditActionType(isEmail ? 'EMAIL' : 'LINK');
      setEditUrl(job.applyUrl.startsWith('mailto:') ? '' : job.applyUrl);
      setEditEmail(initialEmail);
      setEditInstructions(job.applyInstructions || (initialEmail ? `Send resume on HR email: ${initialEmail}` : ''));
    }
  }, [job]);

  if (!currentJob) return null;

  const activeApp = activeStudent ? currentJob.applications?.[activeStudent.id] : undefined;
  const isApplied = activeApp?.status === 'APPLIED';

  const images: string[] =
    currentJob.imageUrls && currentJob.imageUrls.length > 0
      ? currentJob.imageUrls
      : currentJob.imageUrl
      ? [currentJob.imageUrl]
      : [];

  const isEmailApply =
    currentJob.applyType === 'EMAIL' ||
    Boolean(currentJob.applyInstructions) ||
    currentJob.applyUrl.startsWith('mailto:') ||
    (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(currentJob.applyUrl) && !currentJob.applyUrl.startsWith('http'));

  const detectedEmail =
    currentJob.applyEmail ||
    (currentJob.applyUrl.startsWith('mailto:')
      ? currentJob.applyUrl.replace('mailto:', '').split('?')[0]
      : currentJob.applyUrl.includes('@') && !currentJob.applyUrl.startsWith('http')
      ? currentJob.applyUrl.trim()
      : (currentJob.description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || 'hr@company.com'));

  const applyInstructions =
    currentJob.applyInstructions || `Send resume on HR email: ${detectedEmail}`;

  const handleApplyClick = () => {
    if (isEmailApply) {
      setIsApplyPopupOpen(true);
    } else {
      if (currentJob.applyUrl && currentJob.applyUrl !== '#') {
        window.open(currentJob.applyUrl, '_blank', 'noopener,noreferrer');
      }
      onApply(currentJob.id);
    }
  };

  const handleSaveActionEdit = async () => {
    setIsSavingAction(true);
    try {
      const finalUrl =
        editActionType === 'EMAIL'
          ? (editEmail.trim() ? `mailto:${editEmail.trim()}` : '#')
          : (editUrl.trim() || '#');

      const finalInstructions =
        editActionType === 'EMAIL'
          ? (editInstructions.trim() || (editEmail ? `Send resume on HR email: ${editEmail}` : undefined))
          : undefined;

      const res = await fetch(`/api/jobs/${currentJob.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applyType: editActionType,
          applyUrl: finalUrl,
          applyEmail: editActionType === 'EMAIL' ? editEmail.trim() : undefined,
          applyInstructions: finalInstructions,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setCurrentJob(json.data);
        if (onJobUpdated) onJobUpdated(json.data);
        setIsEditingAction(false);
      }
    } catch (err) {
      console.error('Failed to update job apply action:', err);
    } finally {
      setIsSavingAction(false);
    }
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
      {/* Lightbox Overlay */}
      {isLightboxOpen && images.length > 0 && (
        <div
          className="fixed inset-0 bg-black/95 z-[60] flex flex-col items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsLightboxOpen(false)}
        >
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between text-white z-10">
            <div className="flex items-center gap-2 text-xs font-semibold">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>
                Screenshot {activeImageIndex + 1} of {images.length}
              </span>
            </div>
            <button
              onClick={() => setIsLightboxOpen(false)}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

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
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors border border-white/20"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNextImage}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/70 hover:bg-black/90 text-white transition-colors border border-white/20"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {images.length > 1 && (
            <div
              className="absolute bottom-4 flex items-center gap-2 p-2 rounded-2xl bg-black/60 backdrop-blur-xs max-w-md overflow-x-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-transform ${
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

      {/* Main Job Details Modal */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
        <div className="bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] rounded-2xl w-full max-w-2xl my-8 p-6 shadow-2xl animate-in fade-in duration-150 flex flex-col max-h-[90vh]">
          {/* Header */}
          <div className="flex items-start justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-xs font-semibold uppercase tracking-wider ${
                  isApplied
                    ? 'text-slate-400 dark:text-slate-500'
                    : 'text-blue-600 dark:text-blue-400'
                }`}>
                  {currentJob.company}
                </span>
                {isApplied && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span>Applied</span>
                  </span>
                )}
                <span className="text-xs text-slate-400">
                  Posted {formatTimeAgo(currentJob.createdAt)} by {currentJob.postedBy?.studentName || 'Friend'}
                </span>
              </div>
              <h2 className={`text-lg font-bold leading-snug ${
                isApplied
                  ? 'text-slate-500 dark:text-slate-400'
                  : 'text-slate-900 dark:text-slate-100'
              }`}>
                {currentJob.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Scrollable Content */}
          <div className="overflow-y-auto py-4 space-y-4 flex-1 pr-1">
            {/* Description / Instructions */}
            {currentJob.description && (
              <div className="p-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-[#141b2e]">
                <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500 shadow-xs" />
                  <span>Job Details &amp; Friend Notes</span>
                </h4>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-line font-normal">
                  {currentJob.description}
                </p>
              </div>
            )}

            {/* Screenshots & Flyers Gallery */}
            {images.length > 0 && (
              <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-[#141b2e]">
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      Screenshots &amp; Instructions ({images.length})
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-slate-400">
                      {activeImageIndex + 1} of {images.length}
                    </span>
                    <button
                      onClick={() => setIsLightboxOpen(true)}
                      className="p-1 rounded-lg text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors flex items-center gap-1 text-xs"
                      title="Enlarge image"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                      <span className="text-[11px]">Enlarge</span>
                    </button>
                  </div>
                </div>

                {/* Main Image Viewer */}
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 flex items-center justify-center min-h-[200px] max-h-[380px]">
                  <img
                    src={images[activeImageIndex]}
                    alt={`Screenshot ${activeImageIndex + 1}`}
                    className="w-full max-h-[380px] object-contain cursor-pointer"
                    onClick={() => setIsLightboxOpen(true)}
                  />

                  {images.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                        title="Previous screenshot"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/60 hover:bg-black/80 text-white transition-colors"
                        title="Next screenshot"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex items-center gap-2 pt-2.5 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        className={`relative rounded-lg overflow-hidden border-2 transition-colors shrink-0 w-14 h-14 bg-black/10 ${
                          activeImageIndex === idx
                            ? 'border-blue-600 ring-2 ring-blue-500/20'
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

            {/* What clicking "Apply" does: Verification & Edit */}
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-2.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {isEmailApply ? (
                    <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                  ) : (
                    <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    What clicking &quot;Apply&quot; does:
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-md font-medium bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {isEmailApply ? 'HR Email Popup' : 'Web Link'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingAction(!isEditingAction)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingAction ? 'Cancel' : 'Change'}</span>
                </button>
              </div>

              {!isEditingAction ? (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200/80 dark:border-slate-800">
                  {isEmailApply ? (
                    <div className="space-y-1">
                      <p className="font-medium text-slate-800 dark:text-slate-100">
                        {applyInstructions}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Email: <code className="font-mono text-indigo-500">{detectedEmail}</code> (popup shows Copy &amp; Open Mail App buttons)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <span className="text-slate-500 block text-[11px]">Opens destination URL:</span>
                      <a
                        href={currentJob.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-blue-600 dark:text-blue-400 hover:underline block truncate"
                      >
                        {currentJob.applyUrl}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5 pt-1 border-t border-slate-200 dark:border-slate-800">
                  <div className="flex rounded-lg bg-slate-200/80 dark:bg-slate-800/80 p-0.5 text-xs font-medium max-w-fit">
                    <button
                      type="button"
                      onClick={() => setEditActionType('LINK')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                        editActionType === 'LINK'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Globe className="w-3.5 h-3.5" />
                      <span>Web Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditActionType('EMAIL');
                        if (!editInstructions && editEmail) {
                          setEditInstructions(`Send resume on HR email: ${editEmail}`);
                        }
                      }}
                      className={`flex items-center gap-1 px-3 py-1 rounded-md transition-colors ${
                        editActionType === 'EMAIL'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>HR Email Popup</span>
                    </button>
                  </div>

                  {editActionType === 'EMAIL' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                          HR Email
                        </label>
                        <input
                          type="email"
                          value={editEmail}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditEmail(val);
                            if (!editInstructions || editInstructions.startsWith('Send resume on HR email:')) {
                              setEditInstructions(`Send resume on HR email: ${val}`);
                            }
                          }}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                          Popup Instruction
                        </label>
                        <input
                          type="text"
                          value={editInstructions}
                          onChange={(e) => setEditInstructions(e.target.value)}
                          className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-0.5">
                        Job URL
                      </label>
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsEditingAction(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSavingAction}
                      onClick={handleSaveActionEdit}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingAction ? 'Saving...' : 'Save'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Action */}
          <div className="pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2.5 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Close
            </button>

            <button
              onClick={handleApplyClick}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs active:scale-[0.99]"
            >
              {isEmailApply ? (
                <>
                  <Mail className="w-4 h-4" />
                  <span>{isApplied ? 'View HR Email Popup' : 'Apply via HR Email'}</span>
                </>
              ) : (
                <>
                  <span>{isApplied ? 'Re-open Application' : 'Apply Now'}</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Apply Action Popup */}
      {isApplyPopupOpen && (
        <ApplyActionModal
          job={currentJob}
          student={activeStudent}
          isOpen={isApplyPopupOpen}
          onClose={() => setIsApplyPopupOpen(false)}
          onApply={onApply}
        />
      )}
    </>
  );
};
