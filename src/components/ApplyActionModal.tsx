'use client';

import React, { useState } from 'react';
import { Job, Student } from '@/lib/types';
import { X, Mail, Copy, Check, ExternalLink, Sparkles, Send } from 'lucide-react';

interface ApplyActionModalProps {
  job: Job;
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onApply: (jobId: string) => void;
}

export const ApplyActionModal: React.FC<ApplyActionModalProps> = ({
  job,
  student,
  isOpen,
  onClose,
  onApply,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Extract email address
  const hrEmail =
    job.applyEmail ||
    (job.applyUrl.startsWith('mailto:')
      ? job.applyUrl.replace('mailto:', '').split('?')[0]
      : job.applyUrl.includes('@') && !job.applyUrl.startsWith('http')
      ? job.applyUrl.trim()
      : (job.description.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] || 'hr@company.com'));

  // Custom instructions or default
  const instructions =
    job.applyInstructions || `Send resume on HR email: ${hrEmail}`;

  const isApplied = student && job.applications?.[student.id]?.status === 'APPLIED';

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(hrEmail);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenMailClient = () => {
    const subject = encodeURIComponent(`Application for ${job.title} - ${student?.name || 'Applicant'}`);
    const body = encodeURIComponent(
      `Hello Hiring Team at ${job.company},\n\nI am writing to express my strong interest in the ${job.title} role.\n\nPlease find my resume attached.\n\nBest regards,\n${student?.name || ''}`
    );
    window.location.href = `mailto:${hrEmail}?subject=${subject}&body=${body}`;
    if (!isApplied) {
      onApply(job.id);
    }
  };

  const handleMarkApplied = () => {
    onApply(job.id);
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-150 flex flex-col relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950/70 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-200/60 dark:border-indigo-800 shrink-0">
            <Mail className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              How to Apply
            </h3>
            <p className="text-xs text-slate-500">
              {job.title} &bull; <span className="font-semibold text-slate-700 dark:text-slate-300">{job.company}</span>
            </p>
          </div>
        </div>

        {/* Instructions Banner */}
        <div className="p-4 rounded-2xl bg-amber-500/10 dark:bg-amber-400/10 border border-amber-300/80 dark:border-amber-500/40 mb-4">
          <div className="text-[11px] font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 mb-1 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instructions</span>
          </div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 leading-snug">
            {instructions}
          </p>
        </div>

        {/* HR Email Box with 1-click Copy */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-950/60 mb-5">
          <span className="text-[11px] font-medium text-slate-400 block mb-1">
            HR Contact Email:
          </span>
          <div className="flex items-center justify-between gap-2">
            <code className="text-xs sm:text-sm font-mono font-bold text-indigo-600 dark:text-indigo-400 select-all truncate">
              {hrEmail}
            </code>
            <button
              onClick={handleCopyEmail}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition shrink-0 ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Actions Grid */}
        <div className="space-y-2">
          {/* Open Email Client CTA */}
          <button
            onClick={handleOpenMailClient}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm active:scale-[0.98]"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open Email App &amp; Send Resume</span>
          </button>

          {/* Mark as Applied Toggle */}
          <button
            onClick={handleMarkApplied}
            className={`w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-semibold transition border ${
              isApplied
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>{isApplied ? 'Marked as Applied ✓' : 'Mark as Applied'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
