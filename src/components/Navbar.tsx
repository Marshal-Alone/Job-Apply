'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Student } from '@/lib/types';
import { StudentSwitcher } from './StudentSwitcher';
import { Briefcase, RefreshCw, Sun, Moon, Plus, Bell, BellOff, CheckCircle2, AlertCircle, Clock, Send } from 'lucide-react';

interface NavbarProps {
  students: Student[];
  activeStudent: Student | null;
  onSelectStudent: (student: Student) => void;
  onOpenAddJob: () => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  notificationPermission?: NotificationPermission;
  onRequestNotificationPermission?: () => void;
  onTestNotification?: (delaySeconds?: number) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  students,
  activeStudent,
  onSelectStudent,
  onOpenAddJob,
  onRefresh,
  isRefreshing = false,
  darkMode,
  onToggleDarkMode,
  notificationPermission = 'default',
  onRequestNotificationPermission,
  onTestNotification,
}) => {
  const [isNotifMenuOpen, setIsNotifMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsNotifMenuOpen(false);
      }
    };
    if (isNotifMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifMenuOpen]);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-subtle)] bg-white/80 dark:bg-black/85 backdrop-blur-md transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-15 flex items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z" />
              <path d="M6 6h10" />
              <path d="M6 10h7" />
              <circle cx="17.5" cy="15.5" r="2.5" className="fill-emerald-400 stroke-none" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm sm:text-base tracking-tight text-slate-900 dark:text-white">
                Study<span className="text-blue-600 dark:text-blue-400">Buddy</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] uppercase font-bold tracking-widest px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                Peer Hub
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Student Switcher + Sync + Share Job Button + Dark Mode */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Theme Toggle */}
          <button
            onClick={onToggleDarkMode}
            className="p-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-[#181818] transition-colors cursor-pointer active:scale-[0.98]"
            title="Toggle theme"
            aria-label="Toggle theme"
          >
            {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Notification Bell & Dropdown */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setIsNotifMenuOpen(!isNotifMenuOpen)}
              className="relative p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181818] transition-colors border border-slate-200 dark:border-[#272727] cursor-pointer active:scale-[0.98]"
              title={
                notificationPermission === 'granted'
                  ? 'Desktop notifications active (Click to manage)'
                  : notificationPermission === 'denied'
                  ? 'Notifications blocked in browser settings'
                  : 'Enable desktop notifications'
              }
              aria-label="Notifications settings"
            >
              {notificationPermission === 'denied' ? (
                <BellOff className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              ) : (
                <Bell
                  className={`w-3.5 h-3.5 ${
                    notificationPermission === 'granted'
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                />
              )}

              {notificationPermission === 'granted' && (
                <span
                  className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-[#181818]"
                  aria-hidden="true"
                />
              )}

              {notificationPermission === 'default' && (
                <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2" aria-hidden="true">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                </span>
              )}
            </button>

            {/* Notification Management Popover */}
            {isNotifMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#181818] border border-slate-200 dark:border-[#272727] shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100 dark:border-[#272727]">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      Notification Bar Alerts
                    </span>
                  </div>
                  {notificationPermission === 'granted' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" />
                      Active
                    </span>
                  ) : notificationPermission === 'denied' ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md border border-red-500/20">
                      <AlertCircle className="w-3 h-3" />
                      Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                      Setup Needed
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 mb-3.5 leading-relaxed">
                  Sends native desktop alerts to your Windows notification bar when your peer shares a new job, even if you are in another app.
                </p>

                {notificationPermission !== 'granted' ? (
                  <button
                    onClick={() => {
                      onRequestNotificationPermission?.();
                      setIsNotifMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>Enable Notification Bar Alerts</span>
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        onTestNotification?.(0);
                        setIsNotifMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-slate-700 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-[#272727] dark:hover:bg-[#313131] transition-colors cursor-pointer active:scale-[0.98]"
                    >
                      <Send className="w-3.5 h-3.5 text-blue-500" />
                      <span>Send Instant Test Notification</span>
                    </button>

                    <button
                      onClick={() => {
                        onTestNotification?.(5);
                        setIsNotifMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Test in 5s (Switch to another app)</span>
                    </button>
                    <p className="text-[10px] text-slate-400 text-center mt-1">
                      Click the 5s button, then switch to any other app or desktop to watch it pop up!
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Student Switcher */}
          <StudentSwitcher
            students={students}
            activeStudent={activeStudent}
            onSelectStudent={onSelectStudent}
          />

          {/* Sync Button */}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#181818] transition-colors border border-slate-200 dark:border-[#272727] cursor-pointer active:scale-[0.98]"
              title="Sync latest updates"
              aria-label="Sync"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            </button>
          )}

          {/* Share Job CTA Button */}
          <button
            onClick={onOpenAddJob}
            className="flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-xs cursor-pointer active:scale-[0.98]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Share job</span>
          </button>
        </div>
      </div>
    </header>
  );
};
