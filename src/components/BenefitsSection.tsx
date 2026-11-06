'use client';

import React from 'react';
import { Clipboard, Mail, Users, CheckCircle2 } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    {
      icon: Clipboard,
      title: 'Never lose an opening in group chats',
      description:
        'Save WhatsApp forwards, LinkedIn links, and flyer screenshots directly into one shared board. Simply press Ctrl+V to paste images straight from your clipboard.',
    },
    {
      icon: Mail,
      title: 'Zero confusion on how to apply',
      description:
        'Know immediately whether to open a career portal or send your resume to an HR email. Get 1-click email copy and pre-drafted application templates.',
    },
    {
      icon: Users,
      title: 'Mutual peer accountability',
      description:
        'See which roles your study buddy has applied to in real time. Coordinate mock interview prep, split company research, and track deadlines together.',
    },
    {
      icon: CheckCircle2,
      title: 'Clutter-free visual momentum',
      description:
        'Applied jobs automatically shrink and gray out to keep pending opportunities front and center, maintaining your full application history without strikethroughs.',
    },
  ];

  return (
    <section className="py-16 sm:py-20 border-b border-slate-200 dark:border-[#272727] bg-white dark:bg-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-[680px] mb-12">
          <span className="text-xs uppercase font-semibold tracking-wider text-blue-600 dark:text-blue-400 mb-2 block">
            Built for collaborative student groups
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Why tracking job applications together wins
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#9b9b9b] leading-relaxed font-normal">
            Every feature in StudyBuddy solves the real frustrations of applying in silence or juggling chaotic messaging threads.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {benefits.map((b, i) => {
            const Icon = b.icon;
            return (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 dark:border-[#272727] bg-slate-50 dark:bg-[#181818] p-6 hover:border-slate-300 dark:hover:border-[#313131] transition-colors duration-200"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-[#1f1f1f] text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 border border-blue-200/60 dark:border-[#272727]">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
                  {b.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-[#9b9b9b] leading-relaxed font-normal">
                  {b.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
