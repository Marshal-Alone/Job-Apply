'use client';

import React, { useState, useRef } from 'react';
import { Student, Job } from '@/lib/types';
import {
  Sparkles,
  Upload,
  Link as LinkIcon,
  Check,
  AlertCircle,
  X,
  Loader2,
  Send,
} from 'lucide-react';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudent: Student;
  onJobAdded: (job: Job) => void;
}

export const AddJobModal: React.FC<AddJobModalProps> = ({
  isOpen,
  onClose,
  activeStudent,
  onJobAdded,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields (in case they want to adjust)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [location, setLocation] = useState('Remote');
  const [description, setDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setImageBase64(result);
      setImagePreview(result);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  // Instant Extract and Post Job
  const handleExtractAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() && !imageBase64) {
      setError('Please enter a job link or message.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 1: AI / destination link extraction
      const parseRes = await fetch('/api/ai/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: inputVal.trim() || undefined,
          imageUrl: imageBase64 || undefined,
        }),
      });

      const parseJson = await parseRes.json();
      let extracted = parseJson.data;

      if (!extracted || !extracted.applyUrl) {
        // Fallback basic extraction from input
        const urlMatch = inputVal.match(/https?:\/\/[^\s]+/i);
        extracted = {
          title: title || 'Software Developer',
          company: company || 'Company',
          applyUrl: urlMatch ? urlMatch[0] : inputVal.trim(),
          location: 'Remote',
          description: inputVal.replace(/https?:\/\/[^\s]+/gi, '').trim() || 'Job opening shared.',
        };
      }

      // Final job payload
      const jobPayload = {
        title: title.trim() || extracted.title || 'Software Developer',
        company: company.trim() || extracted.company || 'Company',
        applyUrl: applyUrl.trim() || extracted.applyUrl,
        location: location.trim() || extracted.location || 'Remote',
        jobType: 'Internship',
        salary: undefined,
        deadline: undefined,
        tags: [],
        source: imageBase64 ? 'Flyer' : 'WhatsApp',
        description:
          (description.trim() || extracted.description || 'Open link for full job details and application.')
            .replace(/https?:\/\/[^\s]+/gi, '')
            .trim(),
        imageUrl: imageBase64 || undefined,
        postedBy: {
          studentId: activeStudent.id,
          studentName: activeStudent.name,
          studentAvatar: activeStudent.avatar,
        },
      };

      // Step 2: Save to Database
      const createRes = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      });

      const createJson = await createRes.json();
      if (createJson.success && createJson.data) {
        onJobAdded(createJson.data);
        onClose();
      } else {
        setError(createJson.detail || 'Failed to save job.');
      }
    } catch (err) {
      console.error('Job submission failed:', err);
      setError('Error parsing or posting job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Share a Job with {activeStudent.id === 'marshal' ? 'Vaishnavi' : 'Marshal'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Paste the application link or WhatsApp forward
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="my-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleExtractAndSave} className="space-y-3.5 mt-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Apply Link or WhatsApp Message *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Paste the link or message here, e.g. https://careers.jio.com/..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              AI will automatically visit the destination link to extract the company, title, and role details.
            </p>
          </div>

          {/* Flyer Upload Option */}
          <div className="flex items-center justify-between text-xs pt-1">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{imagePreview ? 'Change uploaded flyer' : '+ Upload poster/flyer image'}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {showAdvanced ? 'Hide title/company fields' : 'Edit title/company manually'}
            </button>
          </div>

          {imagePreview && (
            <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border flex items-center justify-between text-xs">
              <span className="text-emerald-600 font-medium flex items-center gap-1">
                <Check className="w-3.5 h-3.5" /> Flyer image attached
              </span>
              <button
                type="button"
                onClick={() => {
                  setImageBase64(null);
                  setImagePreview(null);
                }}
                className="text-slate-400 hover:text-red-500"
              >
                Remove
              </button>
            </div>
          )}

          {/* Advanced / Optional Overrides */}
          {showAdvanced && (
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Company Name (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Jio"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-0.5">Job Title (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Software Developer"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Action Row */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!inputVal.trim() && !imageBase64)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting link info &amp; posting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Post Job</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
