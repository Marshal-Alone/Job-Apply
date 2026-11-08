'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Job, Student, ApplicationStatus } from '@/lib/types';
import {
  registerServiceWorker,
  sendDesktopNotification,
  playNotificationSound,
  getNotificationPermission,
  requestNotificationPermission,
} from '@/lib/notifications';
import { Navbar } from '@/components/Navbar';
import { StatsBanner } from '@/components/StatsBanner';
import { FilterBar } from '@/components/FilterBar';
import { JobCard } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';
import { AddJobModal } from '@/components/AddJobModal';
import { ApplyActionModal } from '@/components/ApplyActionModal';
import {
  RefreshCw,
  CheckCircle2,
  Briefcase,
  Upload,
  AlertTriangle,
} from 'lucide-react';

function getOrCreateDeviceId(): string {
  if (typeof window === 'undefined') return '';
  try {
    let id = localStorage.getItem('peerapply_device_id');
    if (!id || id.trim().length === 0) {
      const match = document.cookie.match(/(?:^|;\s*)peerapply_device_id=([^;]*)/);
      if (match && match[1]) {
        id = decodeURIComponent(match[1]);
      }
    }

    if (!id || id.trim().length === 0) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        id = crypto.randomUUID();
      } else {
        id = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
      }
    }

    localStorage.setItem('peerapply_device_id', id);
    document.cookie = `peerapply_device_id=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
    return id;
  } catch {
    return 'dev-fallback-' + Date.now();
  }
}

export default function Home() {

  const [jobs, setJobs] = useState<Job[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Background Notification Diffing & Peer Filtering Refs
  const knownJobIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef<boolean>(true);
  const activeStudentRef = useRef<Student | null>(activeStudent);

  useEffect(() => {
    activeStudentRef.current = activeStudent;
  }, [activeStudent]);

  // Modals
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [applyModalJob, setApplyModalJob] = useState<Job | null>(null);
  const [isAddJobOpen, setIsAddJobOpen] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' } | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST');

  const showToast = (message: string, type: 'success' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Fetch Jobs with peer diffing & desktop alerts
  const fetchJobs = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const res = await fetch('/api/jobs');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        const incomingJobs: Job[] = json.data;

        if (isInitialLoadRef.current) {
          // On initial load: populate knownJobIdsRef with all existing job IDs
          incomingJobs.forEach((job) => knownJobIdsRef.current.add(job.id));
          isInitialLoadRef.current = false;
        } else {
          // In polling updates: diff incoming jobs against knownJobIdsRef
          const currentStudent = activeStudentRef.current;
          for (const job of incomingJobs) {
            if (!knownJobIdsRef.current.has(job.id)) {
              knownJobIdsRef.current.add(job.id);

              // Notify if posted by peer (not the active student)
              if (job.postedBy?.studentId && job.postedBy.studentId !== currentStudent?.id) {
                const posterName = job.postedBy.studentName || 'Peer';
                sendDesktopNotification(`New Job: ${job.title}`, {
                  body: `${job.company} • Shared by ${posterName}`,
                  tag: `job-${job.id}`,
                  data: { url: '/' },
                });
                playNotificationSound();
                showToast(`New job: "${job.title}" at ${job.company} (shared by ${posterName})`, 'info');
              }
            }
          }
        }

        setJobs(incomingJobs);
        setFetchError(null);
      } else {
        if (!quiet) setFetchError(json.detail || 'Unable to load jobs board right now.');
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
      if (!quiet) setFetchError('Failed to connect to server. Please check your network connection.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch Students & restore saved selection with device-aware default
  const fetchStudents = useCallback(async () => {
    try {
      const deviceId = getOrCreateDeviceId();
      const endpoint = deviceId
        ? `/api/students?deviceId=${encodeURIComponent(deviceId)}`
        : '/api/students';

      const res = await fetch(endpoint);
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setStudents(json.data);

        // Saved selection in localStorage (preserves manual switch!)
        const savedId = typeof window !== 'undefined'
          ? localStorage.getItem('peerapply_active_student_id')
          : null;

        const manualMatch = json.data.find((s: Student) => s.id === savedId);
        if (manualMatch) {
          setActiveStudent(manualMatch);
        } else {
          // First time on this device: default based on device assignment (Device 1 -> marshal, Device 2+ -> vaishnavi)
          const targetDefaultId = json.defaultStudentId || 'marshal';
          const chosen =
            json.data.find((s: Student) => s.id === targetDefaultId) ||
            json.data.find((s: Student) => s.id === 'marshal') ||
            json.data[0];

          setActiveStudent(chosen);
          if (typeof window !== 'undefined') {
            localStorage.setItem('peerapply_active_student_id', chosen.id);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, []);

  useEffect(() => {
    // Register background service worker & read initial notification permission
    registerServiceWorker();
    setNotificationPermission(getNotificationPermission());

    // Restore theme preference (default to dark)
    const savedTheme = typeof window !== 'undefined' ? localStorage.getItem('peerapply_theme') : null;
    if (savedTheme === 'light') {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }

    fetchStudents();
    fetchJobs();

    // Auto-refresh interval (polling for peer updates every 5s)
    const interval = setInterval(() => {
      fetchJobs(true);
    }, 5000);

    // Immediate check when window/tab is focused
    const handleFocus = () => {
      fetchJobs(true);
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [fetchJobs, fetchStudents]);

  // Handle Student Selection & save to localStorage permanently
  const handleSelectStudent = (student: Student) => {
    setActiveStudent(student);
    if (typeof window !== 'undefined') {
      localStorage.setItem('peerapply_active_student_id', student.id);
    }
    showToast(`Active applicant set to ${student.name}`, 'info');
  };

  // Handle Apply Action
  const handleApply = async (jobId: string) => {
    if (!activeStudent) return;

    const targetJob = jobs.find((j) => j.id === jobId);
    const company = targetJob ? targetJob.company : 'Company';

    // Optimistic UI update
    setJobs((prev) =>
      prev.map((j) => {
        if (j.id !== jobId) return j;
        const now = new Date().toISOString();
        return {
          ...j,
          applications: {
            ...j.applications,
            [activeStudent.id]: {
              studentId: activeStudent.id,
              studentName: activeStudent.name,
              studentAvatar: activeStudent.avatar,
              status: 'APPLIED',
              appliedAt: now,
              updatedAt: now,
            },
          },
        };
      })
    );

    showToast(`Applied to ${company}! Status saved for ${activeStudent.name}.`, 'success');

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeStudent.id,
          studentName: activeStudent.name,
          studentAvatar: activeStudent.avatar,
          status: 'APPLIED',
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? json.data : j)));
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob(json.data);
        }
      }
    } catch (err) {
      console.error('Failed to record application:', err);
    }
  };

  // Handle Stage Update (Interviewing, Offer, etc.)
  const handleUpdateStatus = async (
    jobId: string,
    status: ApplicationStatus,
    notes?: string
  ) => {
    if (!activeStudent) return;

    try {
      const res = await fetch(`/api/jobs/${jobId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: activeStudent.id,
          studentName: activeStudent.name,
          studentAvatar: activeStudent.avatar,
          status,
          notes,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setJobs((prev) => prev.map((j) => (j.id === jobId ? json.data : j)));
        if (selectedJob && selectedJob.id === jobId) {
          setSelectedJob(json.data);
        }
        showToast(`Status updated to ${status}`, 'info');
      }
    } catch (err) {
      console.error('Failed to update stage:', err);
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    try {
      const res = await fetch(`/api/jobs/${jobId}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setJobs((prev) => prev.filter((j) => j.id !== jobId));
        showToast('Job removed from board', 'info');
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const handleJobAdded = (newJob: Job) => {
    knownJobIdsRef.current.add(newJob.id);
    setJobs((prev) => [newJob, ...prev]);
    const posterName = activeStudent?.name || 'you';
    showToast(`"${newJob.title}" posted & marked as applied for ${posterName}!`, 'success');
  };

  // Notification Permission Request Handler
  const handleRequestNotificationPermission = async () => {
    const perm = await requestNotificationPermission();
    setNotificationPermission(perm);
    if (perm === 'granted') {
      playNotificationSound();
      showToast('Desktop notifications enabled! You will be alerted when new jobs are shared.', 'success');
    } else if (perm === 'denied') {
      showToast('Notifications blocked in browser. Please allow them in your site settings.', 'info');
    }
  };

  // Toggle Dark Mode with persistence
  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      if (typeof window !== 'undefined') localStorage.setItem('peerapply_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      if (typeof window !== 'undefined') localStorage.setItem('peerapply_theme', 'light');
    }
  };

  // Filtered & Sorted Jobs
  const filteredJobs = useMemo(() => {
    return jobs
      .filter((job) => {
        // Search
        if (search.trim()) {
          const q = search.toLowerCase();
          const matchTitle = job.title.toLowerCase().includes(q);
          const matchCompany = job.company.toLowerCase().includes(q);
          const matchDesc = job.description.toLowerCase().includes(q);
          const matchTags = (job.tags || []).some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchCompany && !matchDesc && !matchTags) return false;
        }

        // Status Filter
        if (activeStudent) {
          const app = job.applications?.[activeStudent.id];
          const hasApplied = app && app.status !== 'NOT_APPLIED';
          if (statusFilter === 'APPLIED' && !hasApplied) return false;
          if (statusFilter === 'UNAPPLIED' && hasApplied) return false;
        }

        // Source Filter
        if (sourceFilter !== 'ALL' && job.source !== sourceFilter) return false;

        // Type Filter
        if (typeFilter !== 'ALL' && job.jobType !== typeFilter) return false;

        return true;
      })
      .sort((a, b) => {
        // Prioritize unapplied jobs on top
        if (activeStudent) {
          const aApplied =
            a.applications?.[activeStudent.id]?.status &&
            a.applications[activeStudent.id].status !== 'NOT_APPLIED';
          const bApplied =
            b.applications?.[activeStudent.id]?.status &&
            b.applications[activeStudent.id].status !== 'NOT_APPLIED';

          if (!aApplied && bApplied) return -1;
          if (aApplied && !bApplied) return 1;
        }

        if (sortBy === 'DEADLINE') {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === 'COMPANY') {
          return a.company.localeCompare(b.company);
        }
        // Default: Newest first
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [jobs, search, statusFilter, sourceFilter, typeFilter, sortBy, activeStudent]);

  return (
    <div className={`min-h-screen flex flex-col bg-slate-50 dark:bg-black text-slate-900 dark:text-slate-100 ${darkMode ? 'dark' : ''}`}>
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-3 duration-150">
          <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xl border border-slate-700 dark:border-slate-200 text-xs font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <Navbar
        students={students}
        activeStudent={activeStudent}
        onSelectStudent={handleSelectStudent}
        onOpenAddJob={() => setIsAddJobOpen(true)}
        onRefresh={() => fetchJobs()}
        isRefreshing={isRefreshing}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
        notificationPermission={notificationPermission}
        onRequestNotificationPermission={handleRequestNotificationPermission}
      />

      {/* Main Board Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="max-w-[680px]">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                Active job board
              </h1>
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-[#9b9b9b] mt-1 font-normal">
              Active applicant: <span className="font-semibold text-slate-800 dark:text-white">{activeStudent?.name}</span> • Synchronized with your study buddy
            </p>
          </div>

          <StatsBanner jobs={jobs} activeStudent={activeStudent} />
        </div>

        {/* Filter & Search Bar */}
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sortBy={sortBy}
          onSortByChange={setSortBy}
        />

        {/* Job Listings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-[#272727] bg-white dark:bg-[#181818] p-5 animate-pulse flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-20 bg-slate-200 dark:bg-[#272727] rounded-md" />
                      <div className="h-4 w-16 bg-slate-200 dark:bg-[#272727] rounded-md" />
                    </div>
                    <div className="h-3 w-12 bg-slate-200 dark:bg-[#272727] rounded-md" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-200 dark:bg-[#272727] rounded-lg mb-2.5" />
                  <div className="space-y-1.5 mb-4">
                    <div className="h-3.5 w-full bg-slate-200/70 dark:bg-[#272727]/60 rounded" />
                    <div className="h-3.5 w-4/5 bg-slate-200/70 dark:bg-[#272727]/60 rounded" />
                  </div>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-[#272727] flex items-center justify-between gap-3">
                  <div className="h-3.5 w-24 bg-slate-200 dark:bg-[#272727] rounded" />
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-16 bg-slate-200 dark:bg-[#272727] rounded-lg" />
                    <div className="h-7 w-20 bg-slate-200 dark:bg-[#272727] rounded-lg" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : fetchError && jobs.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-2xl border border-red-200 dark:border-red-900/40 bg-red-50/40 dark:bg-red-950/20">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 mx-auto flex items-center justify-center mb-2.5 border border-red-200 dark:border-red-800">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Unable to load job board
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4 font-normal">
              {fetchError}
            </p>
            <button
              onClick={() => {
                setIsLoading(true);
                fetchJobs();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Retry connection</span>
            </button>
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                activeStudent={activeStudent}
                onApply={handleApply}
                onOpenApplyModal={(targetJob) => setApplyModalJob(targetJob)}
                onUpdateStatus={handleUpdateStatus}
                onDeleteJob={handleDeleteJob}
                onSelectJob={(job) => setSelectedJob(job)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-[#272727] bg-white dark:bg-[#181818]">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#1f1f1f] text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2.5">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-white">
              {search.trim() || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'No matching jobs found'
                : 'No jobs posted yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-[#9b9b9b] max-w-sm mx-auto mt-1 mb-3.5 font-normal">
              {search.trim() || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || typeFilter !== 'ALL'
                ? 'Try adjusting your search query or filters to find what you are looking for.'
                : 'Found an opening on WhatsApp or LinkedIn? Share the link or flyer below so both of you can apply and track!'}
            </p>
            {search.trim() || statusFilter !== 'ALL' || sourceFilter !== 'ALL' || typeFilter !== 'ALL' ? (
              <button
                onClick={() => {
                  setSearch('');
                  setStatusFilter('ALL');
                  setSourceFilter('ALL');
                  setTypeFilter('ALL');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-[#d1d5db] bg-slate-100 hover:bg-slate-200 dark:bg-[#272727] dark:hover:bg-[#313131] transition-colors cursor-pointer active:scale-[0.98]"
              >
                <span>Reset all filters</span>
              </button>
            ) : (
              <button
                onClick={() => setIsAddJobOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Share first job or flyer</span>
              </button>
            )}
          </div>
        )}
      </main>

      {/* Modals & Drawers */}
      {isAddJobOpen && activeStudent && (
        <AddJobModal
          isOpen={isAddJobOpen}
          onClose={() => setIsAddJobOpen(false)}
          activeStudent={activeStudent}
          onJobAdded={handleJobAdded}
        />
      )}

      {selectedJob && (
        <JobModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          activeStudent={activeStudent}
          onApply={handleApply}
          onJobUpdated={(updated) => {
            setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
            setSelectedJob(updated);
            showToast('Apply action updated successfully!', 'info');
          }}
        />
      )}

      {applyModalJob && (
        <ApplyActionModal
          job={applyModalJob}
          student={activeStudent}
          isOpen={Boolean(applyModalJob)}
          onClose={() => setApplyModalJob(null)}
          onApply={handleApply}
        />
      )}
    </div>
  );
}
