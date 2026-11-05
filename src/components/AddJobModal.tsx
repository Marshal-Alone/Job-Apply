'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Student, Job } from '@/lib/types';
import {
  Sparkles,
  Upload,
  Link as LinkIcon,
  Check,
  AlertCircle,
  X,
  Loader2,
  Image as ImageIcon,
  Plus,
  Clipboard,
} from 'lucide-react';

interface AddJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeStudent: Student;
  onJobAdded: (job: Job) => void;
}

// Client-side image resize helper to keep database payloads lightweight
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

export const AddJobModal: React.FC<AddJobModalProps> = ({
  isOpen,
  onClose,
  activeStudent,
  onJobAdded,
}) => {
  const [inputVal, setInputVal] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pasteSuccess, setPasteSuccess] = useState<string | null>(null);

  // Form Fields for manual adjustment
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [applyUrl, setApplyUrl] = useState('');
  const [location, setLocation] = useState('Remote');
  const [description, setDescription] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Global paste handler when modal is active
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
      // Reset input value so same files can be chosen again if needed
      e.target.value = '';
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Instant Extract and Post Job
  const handleExtractAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() && images.length === 0) {
      setError('Please enter a job link, message, or attach a screenshot/flyer.');
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
          imageUrl: images[0] || undefined,
          imageUrls: images,
        }),
      });

      const parseJson = await parseRes.json();
      let extracted = parseJson.data;

      if (!extracted || !extracted.applyUrl) {
        const urlMatch = inputVal.match(/https?:\/\/[^\s]+/i);
        extracted = {
          title: title || 'Software Developer',
          company: company || 'Company',
          applyUrl: urlMatch ? urlMatch[0] : inputVal.trim(),
          location: 'Remote',
          description: inputVal.replace(/https?:\/\/[^\s]+/gi, '').trim() || 'Job opening shared.',
        };
      }

      // Final job payload with multiple images
      const jobPayload = {
        title: title.trim() || extracted.title || 'Software Developer',
        company: company.trim() || extracted.company || 'Company',
        applyUrl: applyUrl.trim() || extracted.applyUrl,
        location: location.trim() || extracted.location || 'Remote',
        jobType: 'Internship',
        salary: undefined,
        deadline: undefined,
        tags: [],
        source: images.length > 0 ? 'Flyer' : 'WhatsApp',
        description:
          (description.trim() || extracted.description || 'Open link for full job details and application.')
            .replace(/https?:\/\/[^\s]+/gi, '')
            .trim(),
        imageUrl: images[0] || undefined,
        imageUrls: images,
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

  const peerName = activeStudent.id === 'marshal' ? 'Vaishnavi' : 'Marshal';

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Share a Job with {peerName}
              </h2>
              <p className="text-[11px] text-slate-500">
                Paste the apply link, flyer, or screenshots to guide them
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
          <div className="my-2.5 flex items-center gap-2 p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900 text-xs shrink-0">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {pasteSuccess && (
          <div className="my-2 flex items-center gap-2 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 text-xs animate-in fade-in duration-150 shrink-0">
            <Check className="w-4 h-4 shrink-0" />
            <span>{pasteSuccess} from clipboard!</span>
          </div>
        )}

        <form onSubmit={handleExtractAndSave} className="space-y-3.5 mt-3 overflow-y-auto pr-1 flex-1">
          {/* Main Link or Message Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Job Apply Link or WhatsApp Forward
            </label>
            <textarea
              rows={3}
              placeholder="Paste link or text here, e.g. https://careers.jio.com/... (You can also press Ctrl+V anytime to paste screenshots!)"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              AI automatically extracts the company, title, and destination link details.
            </p>
          </div>

          {/* Guide Screenshots / Images Gallery Section */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50/60 dark:bg-slate-950/40 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Guide Screenshots / Flyers</span>
                {images.length > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                    {images.length}
                  </span>
                )}
              </span>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>+ Upload Files</span>
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

            {/* Paste Hint Strip */}
            <div className="flex items-center justify-between px-2.5 py-1.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 text-[11px] text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60">
              <div className="flex items-center gap-1.5">
                <Clipboard className="w-3.5 h-3.5" />
                <span>Tip: Copy any screenshot &amp; press <strong>Ctrl+V</strong> to paste directly!</span>
              </div>
            </div>

            {/* Thumbnail Preview Grid */}
            {images.length > 0 ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 pt-1 max-h-48 overflow-y-auto">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-black/10 aspect-video flex items-center justify-center shadow-xs"
                  >
                    <img
                      src={img}
                      alt={`Guide screenshot ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {/* Index badge */}
                    <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.2 rounded">
                      #{idx + 1}
                    </span>
                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 p-1 rounded-full bg-red-600 text-white opacity-80 hover:opacity-100 transition shadow-sm"
                      title="Remove image"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer border border-dashed border-slate-200 dark:border-slate-800 rounded-xl py-3 text-center hover:bg-slate-100/50 dark:hover:bg-slate-800/40 transition"
              >
                <p className="text-[11px] text-slate-400">
                  No images added yet. Click to browse or <strong>Ctrl+V</strong> to paste portal screenshots.
                </p>
              </div>
            )}
          </div>

          {/* Toggle Manual Overrides */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            >
              {showAdvanced ? 'Hide manual fields' : 'Edit title / company manually'}
            </button>
          </div>

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
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || (!inputVal.trim() && images.length === 0)}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting &amp; posting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                  <span>Post Job {images.length > 0 ? `(${images.length} images)` : ''}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
