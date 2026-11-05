'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Job, Student, ApplicationStatus } from '@/lib/types';
import { Navbar } from '@/components/Navbar';
import { StatsBanner } from '@/components/StatsBanner';
import { FilterBar } from '@/components/FilterBar';
import { JobCard } from '@/components/JobCard';
import { JobModal } from '@/components/JobModal';
import { AddJobModal } from '@/components/AddJobModal';
import { AICoachDrawer } from '@/components/AICoachDrawer';
import {
  Sparkles,
  RefreshCw,
  Plus,
  CheckCircle2,
  Briefcase,
  Upload,
} from 'lucide-react';

export default function Home() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [activeStudent, setActiveStudent] = useState<Student | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  // Modals
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [aiFitJob, setAiFitJob] = useState<Job | null>(null);
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

  // Fetch Jobs
  const fetchJobs = useCallback(async (quiet = false) => {
    if (!quiet) setIsRefreshing(true);
    try {
      const res = await fetch('/api/jobs');
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setJobs(json.data);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch Students & restore saved selection
  const fetchStudents = useCallback(async () => {
    try {
      const res = await fetch('/api/students');
      const json = await res.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        setStudents(json.data);

        // Saved selection in localStorage
        const savedId = typeof window !== 'undefined'
          ? localStorage.getItem('peerapply_active_student_id')
          : null;

        const matched = json.data.find((s: Student) => s.id === savedId);
        // Default to Marshal if not set or found
        const chosen = matched || json.data.find((s: Student) => s.id === 'marshal') || json.data[0];
        setActiveStudent(chosen);
        if (typeof window !== 'undefined') {
          localStorage.setItem('peerapply_active_student_id', chosen.id);
        }
      }
    } catch (err) {
      console.error('Error fetching students:', err);
    }
  }, []);

  useEffect(() => {
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

    // Auto-refresh interval (polling for peer updates every 15s)
    const interval = setInterval(() => {
      fetchJobs(true);
    }, 15000);

    return () => clearInterval(interval);
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

    showToast(`🎉 Applied to ${company}! Status saved for ${activeStudent.name}.`, 'success');

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
    setJobs((prev) => [newJob, ...prev]);
    showToast(`🚀 "${newJob.title}" posted to shared board!`, 'success');
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
          if (statusFilter === 'INTERVIEWING' && app?.status !== 'INTERVIEWING') return false;
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
    <div className={`min-h-screen flex flex-col ${darkMode ? 'dark' : ''}`}>
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
      />

      {/* Main Container - Focused Directly on Job List */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
        {/* Compact Stats Strip */}
        <StatsBanner jobs={jobs} activeStudent={activeStudent} />

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

        {/* Job Listings Grid (2 wide cards side by side) */}
        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-56 rounded-2xl bg-slate-200/60 dark:bg-slate-800/60 animate-pulse border border-slate-200 dark:border-slate-800"
              />
            ))}
          </div>
        ) : filteredJobs.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                activeStudent={activeStudent}
                onApply={handleApply}
                onUpdateStatus={handleUpdateStatus}
                onDeleteJob={handleDeleteJob}
                onSelectJob={(job) => setSelectedJob(job)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center mb-2.5">
              <Briefcase className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              No jobs posted yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-3.5">
              Found an opening on WhatsApp or LinkedIn? Share the link or flyer below so both of you can apply and track!
            </p>
            <button
              onClick={() => setIsAddJobOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition shadow-sm"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Share First Job or Flyer</span>
            </button>
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
          onUpdateStatus={handleUpdateStatus}
          onOpenAiFit={(job) => {
            setSelectedJob(null);
            setAiFitJob(job);
          }}
        />
      )}

      {aiFitJob && (
        <AICoachDrawer
          job={aiFitJob}
          student={activeStudent}
          onClose={() => setAiFitJob(null)}
        />
      )}
    </div>
  );
}
