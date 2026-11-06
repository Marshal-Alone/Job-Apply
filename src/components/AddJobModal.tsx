'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Student, Job } from '@/lib/types';
import {
  Upload,
  Link as LinkIcon,
  Check,
  AlertCircle,
  X,
  Loader2,
  Image as ImageIcon,
  Clipboard,
  Mail,
  Globe,
} from 'lucide-react';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudent: Student;
  onJobAdded: (job: Job) => void;
}

// Client-side image resize helper to keep payloads fast and lightweight
function compressImage(file: File, maxWidth = 1600, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const elem = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        elem.width = width;
        elem.height = height;
        const ctx = elem.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(elem.toDataURL('image/jpeg', quality));
      };
      img.onerror = () => reject(new Error('Failed to load image for compression'));
    };
    reader.onerror = (err) => reject(err);
  });
}

function extractDomainName(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    const host = parsed.hostname.replace(/^www\./, '');
    const parts = host.split('.');
    if (parts.length >= 2) {
      const name = parts[0];
      return name.charAt(0).toUpperCase() + name.slice(1);
    }
    return 'Company';
  } catch {
    return 'Company';
  }
}

export const AddJobModal: React.FC<AddJobModalProps> = ({
  isOpen,
  onClose,
  activeStudent,
  onJobAdded,
}) => {
  // Only the essential fields requested by user:
  // 1. Job link
  // 2. Company name (optional)
  // 3. What clicking "Apply" does
  // 4. Description (optional)
  // 5. Images
  // 6. Apply btn (Submit)
  const [jobLink, setJobLink] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [applyActionType, setApplyActionType] = useState<'LINK' | 'EMAIL'>('LINK');
  const [hrEmail, setHrEmail] = useState('');
  const [hrInstructions, setHrInstructions] = useState('');
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-detect email or URL when typing in jobLink
  const handleLinkChange = (val: string) => {
    setJobLink(val);
    const emailMatch = val.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const hasUrl = /https?:\/\//i.test(val);

    if (emailMatch && !hasUrl) {
      setApplyActionType('EMAIL');
      setHrEmail(emailMatch[0]);
      if (!hrInstructions || hrInstructions.startsWith('Send resume on HR email:')) {
        setHrInstructions(`Send resume on HR email: ${emailMatch[0]}`);
      }
    } else if (hasUrl) {
      if (!companyName) {
        const guessed = extractDomainName(val);
        if (guessed && guessed !== 'Company') {
          setCompanyName(guessed);
        }
      }
    }
  };

  // Helper to add image file(s)
  const addImageFiles = useCallback(async (files: FileList | File[]) => {
    setError(null);
    const newImages: string[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await compressImage(file);
        newImages.push(compressed);
      } catch (e) {
        console.error('Failed to compress image:', e);
      }
    }

    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
      setPasteSuccess(`Added ${newImages.length} image${newImages.length > 1 ? 's' : ''}`);
      setTimeout(() => setPasteSuccess(null), 3000);
    }
  }, []);

  // Global paste handler when modal is active (Ctrl+V anywhere in modal pastes image)
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      const imageFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) imageFiles.push(file);
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault();
        addImageFiles(imageFiles);
      }
    };

    window.addEventListener('paste', handleWindowPaste);
    return () => window.removeEventListener('paste', handleWindowPaste);
  }, [isOpen, addImageFiles]);

  if (!isOpen) return null;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addImageFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit Job
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedLink = jobLink.trim();
    if (!trimmedLink && images.length === 0) {
      setError('Please provide a job link or attach at least one screenshot.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const isEmailAction = applyActionType === 'EMAIL' || (hrEmail && !trimmedLink.startsWith('http'));
      const finalEmail = hrEmail.trim() || (isEmailAction ? trimmedLink.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)?.[0] : undefined);
      const finalApplyUrl = isEmailAction && finalEmail ? `mailto:${finalEmail}` : (trimmedLink || '#');
      const finalInstructions = isEmailAction
        ? (hrInstructions.trim() || (finalEmail ? `Send resume on HR email: ${finalEmail}` : 'Send resume to HR'))
        : undefined;

      const derivedCompany =
        companyName.trim() ||
        (trimmedLink ? extractDomainName(trimmedLink) : '') ||
        'Hiring Company';

      const derivedTitle = 'Software Developer';

      const finalDescription =
        description.trim() ||
        (isEmailAction && finalEmail
          ? `Send resume directly to ${finalEmail}. Check attached guide screenshots for details.`
          : 'Apply via direct career link. Check attached guide screenshots for step-by-step instructions.');

      const jobPayload = {
        title: derivedTitle,
        company: derivedCompany,
        applyType: isEmailAction ? 'EMAIL' : 'LINK',
        applyUrl: finalApplyUrl,
        applyEmail: finalEmail,
        applyInstructions: finalInstructions,
        location: 'Remote / Hybrid',
        jobType: 'Internship',
        salary: undefined,
        deadline: undefined,
        tags: [],
        source: images.length > 0 ? 'Flyer' : 'WhatsApp',
        description: finalDescription,
        friendNote: description.trim() || undefined,
        imageUrl: images[0] || undefined,
        imageUrls: images,
        postedBy: {
          studentId: activeStudent.id,
          studentName: activeStudent.name,
          studentAvatar: activeStudent.avatar,
        },
      };

      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(jobPayload),
      });

      const json = await res.json();
      if (json.success && json.data) {
        onJobAdded(json.data);
        onClose();
      } else {
        setError(json.detail || json.message || 'Failed to post job. Please try again.');
      }
    } catch (err) {
      console.error('Failed to post job:', err);
      setError('An error occurred while posting the job. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#0e1322] border border-slate-200/90 dark:border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Share Job Opening
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Quickly share links and guide screenshots with your peer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pasteSuccess && (
          <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-xs shrink-0">
            <Check className="w-4 h-4 shrink-0" />
            <span>{pasteSuccess} from clipboard</span>
          </div>
        )}

        {/* Clean, essential form fields only */}
        <form onSubmit={handleSubmit} className="space-y-4 mt-4 overflow-y-auto pr-1 flex-1">
          {/* 1. Job Link */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1">
              Job Link
            </label>
            <input
              type="text"
              required={images.length === 0}
              placeholder="https://careers.company.com/jobs/..."
              value={jobLink}
              onChange={(e) => handleLinkChange(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 2. Company Name (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1">
              Company Name <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Google, Jio, Stripe"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 3. What clicking "Apply" does */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                What clicking &quot;Apply&quot; does:
              </span>

              {/* Segmented control */}
              <div className="flex rounded-lg bg-slate-200/80 dark:bg-slate-800/90 p-0.5 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setApplyActionType('LINK')}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                    applyActionType === 'LINK'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Open Web Link</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApplyActionType('EMAIL');
                    if (!hrInstructions && hrEmail) {
                      setHrInstructions(`Send resume on HR email: ${hrEmail}`);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-colors ${
                    applyActionType === 'EMAIL'
                      ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>HR Email Popup</span>
                </button>
              </div>
            </div>

            {applyActionType === 'EMAIL' ? (
              <div className="space-y-2.5 pt-1">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                    HR Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. hr@company.com"
                    value={hrEmail}
                    onChange={(e) => {
                      const email = e.target.value;
                      setHrEmail(email);
                      if (!hrInstructions || hrInstructions.startsWith('Send resume on HR email:')) {
                        setHrInstructions(`Send resume on HR email: ${email}`);
                      }
                    }}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-0.5">
                    Popup Message / Instruction
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Send resume on HR email: hr@company.com"
                    value={hrInstructions}
                    onChange={(e) => setHrInstructions(e.target.value)}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Clicking &quot;Apply&quot; will directly open the Job Link in a new browser tab.
              </p>
            )}
          </div>

          {/* 4. Description (Optional) */}
          <div>
            <label className="block text-xs font-semibold text-slate-900 dark:text-slate-200 mb-1">
              Description <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Add brief details, eligibility, or note for your peer..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 5. Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <label className="font-semibold text-slate-900 dark:text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>Images / Screenshots</span>
                {images.length > 0 && (
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-semibold">
                    {images.length}
                  </span>
                )}
              </label>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Files</span>
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Quick Paste Notification Strip */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-[11px] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
              <div className="flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                <span>Tip: Copy any screenshot and press <strong>Ctrl+V</strong> to paste directly</span>
              </div>
            </div>

            {/* Thumbnail Gallery Preview */}
            {images.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 max-h-48 overflow-y-auto">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 aspect-video flex items-center justify-center shadow-xs"
                  >
                    <img
                      src={img}
                      alt={`Guide screenshot ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-90 hover:opacity-100 transition-opacity"
                      title="Remove screenshot"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border border-dashed border-slate-300 dark:border-slate-700 rounded-xl py-3.5 text-center hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  No images added yet. Click to upload or press <strong>Ctrl+V</strong> to paste.
                </p>
              </div>
            )}
          </div>

          {/* 6. Apply btn (Submit Action Row) */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!jobLink.trim() && images.length === 0)}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Sharing job...</span>
                </>
              ) : (
                <span>Share Job {images.length > 0 ? `(${images.length} images)` : ''}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
