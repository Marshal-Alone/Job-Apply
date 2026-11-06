'use client';

import React from 'react';
import { Upload, Sliders, CheckCircle } from 'lucide-react';

export const HowItWorksSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      icon: Upload,
      title: 'Share opening in seconds',
      description:
        'Found a role on LinkedIn or WhatsApp? Paste the career link, or press Ctrl+V to attach hiring posters and guide screenshots directly.',
    },
    {
      step: '02',
      icon: Sliders,
      title: 'Choose the application method',
      description:
        'Verify whether clicking Apply opens a direct career webpage or brings up an HR email popup with pre-filled application notes.',
    },
    {
      step: '03',
      icon: CheckCircle,
      title: 'Apply and track together',
      description:
        'Click Apply to open the listing and mark your progress. Your applied card smoothly shrinks to 96% scale and syncs with your peer.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 border-b border-slate-200 dark:border-[#272727] bg-slate-50 dark:bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[680px] mb-12">
          <span className="text-xs uppercase font-semibold tracking-wider text-blue-600 dark:text-blue-400 mb-2 block">
            How it works
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Three simple steps to coordinate your hunt
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#9b9b9b] leading-relaxed font-normal">
            No complex signups or messy spreadsheets. StudyBuddy is built for rapid, daily peer execution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                className="relative rounded-2xl border border-slate-200 dark:border-[#272727] bg-white dark:bg-[#181818] p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#1f1f1f] text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-200/60 dark:border-[#272727]">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="font-mono text-xs font-bold text-slate-400 dark:text-[#9b9b9b]">
                      STEP {s.step}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                    {s.title}
                  </h3>
                  <p className="text-xs text-slate-600 dark:text-[#9b9b9b] leading-relaxed font-normal">
                    {s.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
