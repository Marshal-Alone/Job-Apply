'use client';

import React, { useState } from 'react';
import { Job, Student } from '@/lib/types';
import { analyzeStudentJobFit } from '@/lib/ai';
import { Sparkles, Copy, Check, X, ThumbsUp, BookOpen } from 'lucide-react';

interface AICoachDrawerProps {
  job: Job | null;
  student: Student | null;
  onClose: () => void;
}

export const AICoachDrawer: React.FC<AICoachDrawerProps> = ({ job, student, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!job || !student) return null;

  const analysis = analyzeStudentJobFit(
    student.skills || [],
    job.title,
    job.description,
    job.tags || []
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(analysis.coverNote);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-end p-0">
      <div className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 w-full max-w-md h-full p-6 shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                  AI Fit & Referral Assistant
                </h3>
                <p className="text-xs text-slate-500">
                  Tailored specifically for {student.name}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Job Target */}
          <div className="my-4 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold uppercase text-purple-600 dark:text-purple-400 tracking-wider">
              {job.company}
            </span>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mt-0.5">
              {job.title}
            </h4>
          </div>

          {/* Score Gauge */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-50/40 dark:from-purple-950/30 dark:to-indigo-950/20 border border-purple-100 dark:border-purple-900/40 mb-4 text-center">
            <div className="text-3xl font-extrabold text-purple-600 dark:text-purple-400">
              {analysis.matchScore}%
            </div>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 block mt-1">
              Estimated Resume & Skill Fit
            </span>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Based on your skills profile vs. job requirements
            </p>
          </div>

          {/* Skill Breakdown */}
          <div className="space-y-3 mb-5">
            <div>
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mb-1.5">
                <ThumbsUp className="w-3.5 h-3.5" />
                Matching Skills (Highlight on Resume)
              </span>
              <div className="flex flex-wrap gap-1.5">
                {analysis.matchingSkills.map((s, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 font-medium"
                  >
                    ✓ {s}
                  </span>
                ))}
              </div>
            </div>

            {analysis.missingSkills.length > 0 && (
              <div>
                <span className="text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mb-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Key Keywords to Review
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {analysis.missingSkills.map((s, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60 font-medium"
                    >
                      • {s}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* 1-Click Cold Email / Referral Pitch */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 bg-white dark:bg-slate-900 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                1-Click LinkedIn / Referral Note
              </span>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800 italic leading-relaxed">
              &quot;{analysis.coverNote}&quot;
            </p>
          </div>

          {/* Advice */}
          <div className="p-3.5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
            <strong>Pro Tip:</strong> {analysis.advice}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full mt-6 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition"
        >
          Done
        </button>
      </div>
    </div>
  );
};
