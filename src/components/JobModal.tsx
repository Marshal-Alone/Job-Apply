'use client';

import React, { useState, useEffect } from 'react';
import { Job, Student } from '@/lib/types';
import {
  X,
  ExternalLink,
  Calendar,
  MapPin,
  DollarSign,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
  MessageSquare,
  Mail,
  Globe,
  Edit3,
  Check,
  Send,
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

  // Normalize all attached guide images
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
                  {currentJob.company}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  {currentJob.jobType}
                </span>
                <span className="text-xs text-slate-400">
                  Posted {formatTimeAgo(currentJob.createdAt)} by {currentJob.postedBy?.studentName || 'Friend'}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
                {currentJob.title}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Scrollable Body - Ordered exactly as requested: 1. Friend Note, 2. AI Summary, 3. Images */}
          <div className="overflow-y-auto py-4 space-y-5 flex-1 pr-1">
            {/* 1. FIRST: Whatever note the friend added when adding the job */}
            {currentJob.friendNote ? (
              <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/80 dark:border-amber-500/40 shadow-xs">
                <div className="flex items-center gap-2 mb-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <MessageSquare className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>Note from {currentJob.postedBy?.studentName || 'Friend'}:</span>
                </div>
                <p className="text-xs sm:text-sm font-medium leading-relaxed text-slate-800 dark:text-slate-100 pl-6">
                  &ldquo;{currentJob.friendNote}&rdquo;
                </p>
              </div>
            ) : null}

            {/* 2. THEN: AI Summary */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50/80 dark:bg-slate-800/40">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
                  AI Summary
                </h4>
              </div>
              <div className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {currentJob.description}
              </div>
            </div>

            {/* 3. THEN: Guide Screenshots & Images Gallery */}
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

            {/* Details & Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Location</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200">
                  <MapPin className="w-3.5 h-3.5 text-blue-500" />
                  <span>{currentJob.location}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Stipend / Salary</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-3.5 h-3.5" />
                  <span>{currentJob.salary || 'Not specified'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Deadline</span>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{currentJob.deadline || 'Rolling basis'}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-[11px] text-slate-400 block mb-1">Shared Via</span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {currentJob.source}
                </span>
              </div>
            </div>

            {/* Tags */}
            {currentJob.tags && currentJob.tags.length > 0 && (
              <div>
                <div className="flex flex-wrap gap-2">
                  {currentJob.tags.map((tag, idx) => (
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

            {/* 🎯 Apply Action Verification & Quick Edit */}
            <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  {isEmailApply ? (
                    <Mail className="w-4 h-4 text-indigo-500 shrink-0" />
                  ) : (
                    <Globe className="w-4 h-4 text-blue-500 shrink-0" />
                  )}
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    Apply Action:
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    {isEmailApply ? '✉️ HR Email Popup' : '🌐 Web Portal Link'}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingAction(!isEditingAction)}
                  className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>{isEditingAction ? 'Cancel' : 'Change / Verify Action'}</span>
                </button>
              </div>

              {/* View / Verify Mode */}
              {!isEditingAction ? (
                <div className="text-xs text-slate-600 dark:text-slate-300 bg-white/70 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                  {isEmailApply ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400 font-semibold">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Clicking &quot;Apply&quot; opens popup with instruction:</span>
                      </div>
                      <p className="font-medium text-slate-800 dark:text-slate-100 pl-5 italic">
                        &ldquo;{applyInstructions}&rdquo;
                      </p>
                      <p className="text-[11px] text-slate-400 pl-5">
                        HR Email: <code className="font-mono text-indigo-500">{detectedEmail}</code> (with 1-click Copy &amp; Open Mail App buttons)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold">
                        <Globe className="w-3.5 h-3.5" />
                        <span>Clicking &quot;Apply&quot; opens web portal link:</span>
                      </div>
                      <a
                        href={currentJob.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block font-mono text-blue-600 dark:text-blue-400 hover:underline pl-5 truncate"
                      >
                        {currentJob.applyUrl}
                      </a>
                    </div>
                  )}
                </div>
              ) : (
                /* Edit Mode */
                <div className="space-y-3 pt-1 border-t border-slate-200 dark:border-slate-800 animate-in fade-in duration-150">
                  <div className="flex rounded-xl bg-slate-200/80 dark:bg-slate-800/80 p-0.5 text-xs font-semibold max-w-fit">
                    <button
                      type="button"
                      onClick={() => setEditActionType('LINK')}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                        editActionType === 'LINK'
                          ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>Open Web Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditActionType('EMAIL');
                        if (!editInstructions && editEmail) {
                          setEditInstructions(`Send resume on HR email: ${editEmail}`);
                        }
                      }}
                      className={`flex items-center gap-1 px-3 py-1 rounded-lg transition ${
                        editActionType === 'EMAIL'
                          ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                          : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
                      }`}
                    >
                      <Mail className="w-3 h-3" />
                      <span>HR Email Popup</span>
                    </button>
                  </div>

                  {editActionType === 'EMAIL' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          HR Email Address:
                        </label>
                        <input
                          type="email"
                          placeholder="e.g. hr@gmail.com"
                          value={editEmail}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditEmail(val);
                            if (!editInstructions || editInstructions.startsWith('Send resume on HR email:')) {
                              setEditInstructions(`Send resume on HR email: ${val}`);
                            }
                          }}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                          Popup Message / Instruction:
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Send resume on HR email: hr@gmail.com"
                          value={editInstructions}
                          onChange={(e) => setEditInstructions(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-0.5">
                        Application Website URL:
                      </label>
                      <input
                        type="text"
                        placeholder="https://careers.company.com/apply/..."
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
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
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isSavingAction ? 'Saving...' : 'Save Apply Action'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Modal Action Footer */}
          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Close
            </button>

            <button
              onClick={handleApplyClick}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-md active:scale-[0.98]"
            >
              {isEmailApply ? (
                <>
                  <Mail className="w-4 h-4" />
                  <span>{isApplied ? 'View HR Email & Popup' : 'Apply via HR Email'}</span>
                </>
              ) : (
                <>
                  <span>{isApplied ? 'Re-open Portal' : 'Apply Now'}</span>
                  <ExternalLink className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Apply Action Popup Modal */}
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
