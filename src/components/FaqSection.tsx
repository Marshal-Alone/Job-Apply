'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does peer syncing work between applicants?',
      a: 'Each student selects their active profile (Marshal or Vaishnavi) in the header. Applications, new job posts, and notes automatically sync to the shared database so both students see live status updates.',
    },
    {
      q: 'What if a job requires emailing HR instead of an online portal?',
      a: 'Select "HR Email" when sharing the role. When clicking Apply, a popup opens displaying the HR email address, a 1-click copy button, and an action to launch your email client with a pre-filled application template.',
    },
    {
      q: 'Can I paste screenshots directly from WhatsApp or LinkedIn?',
      a: 'Yes. Simply copy any hiring flyer or screenshot to your clipboard and press Ctrl+V anywhere in the Share Job modal to attach it immediately without saving files locally.',
    },
    {
      q: 'Why do applied jobs shrink instead of disappearing?',
      a: 'Shrinking applied cards to 96% scale and graying them out preserves your full application history for interview preparation while keeping pending opportunities visually dominant.',
    },
    {
      q: 'Does StudyBuddy require personal accounts or subscriptions?',
      a: 'No. StudyBuddy is completely free, runs locally with resilient persistent JSON and MongoDB storage, and remembers your active student selection in your browser.',
    },
    {
      q: 'Can we filter by job type, source, or application status?',
      a: 'Yes. You can instantly filter by All Jobs, Not Applied, and Applied, or drill down by source (WhatsApp, Flyers, LinkedIn, Campus Drive) and role type (Internship, Full-time, Co-op).',
    },
  ];

  const toggleIndex = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-16 sm:py-20 border-b border-slate-200 dark:border-[#272727] bg-white dark:bg-[#000000]">
      <div className="max-w-[680px] mx-auto px-4">
        <div className="mb-10 text-center">
          <span className="text-xs uppercase font-semibold tracking-wider text-blue-600 dark:text-blue-400 mb-2 block">
            Common questions
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-3">
            Frequently asked questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-[#9b9b9b] font-normal">
            Everything you need to know about peer tracking, clipboard paste, and applying.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 dark:border-[#272727] bg-slate-50 dark:bg-[#181818] overflow-hidden transition-colors"
              >
                <button
                  type="button"
                  onClick={() => toggleIndex(idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs sm:text-sm text-slate-900 dark:text-white cursor-pointer select-none"
                  aria-expanded={isOpen}
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`w-4 h-4 text-slate-400 dark:text-[#9b9b9b] transition-transform duration-200 shrink-0 ml-3 ${
                      isOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 text-xs text-slate-600 dark:text-[#9b9b9b] leading-relaxed border-t border-slate-200/60 dark:border-[#272727] font-normal">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
