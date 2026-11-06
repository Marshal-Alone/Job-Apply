'use client';

import React, { useEffect, useRef, useState } from 'react';

export const TaglineReveal: React.FC = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const sentenceOne = ['Applying', 'alone', 'is', 'exhausting.'];
  const sentenceTwo = ['Hunting', 'together', 'gets', 'you', 'hired.'];

  return (
    <section
      ref={sectionRef}
      className="py-16 sm:py-24 border-b border-slate-200 dark:border-[#272727] bg-white dark:bg-[#000000]"
    >
      <div className="max-w-[680px] mx-auto text-center px-4">
        <span className="text-xs uppercase font-semibold tracking-wider text-blue-600 dark:text-blue-400 mb-3 block">
          The study buddy advantage
        </span>

        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight leading-snug">
          <span className="block mb-1.5">
            {sentenceOne.map((word, i) => (
              <span
                key={i}
                className="inline-block mr-2 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  color: isVisible ? 'inherit' : 'rgba(155, 155, 155, 0.3)',
                  transitionDelay: `${i * 90}ms`,
                }}
              >
                {word}
              </span>
            ))}
          </span>

          <span className="block">
            {sentenceTwo.map((word, i) => (
              <span
                key={i}
                className="inline-block mr-2 transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
                style={{
                  color: isVisible ? 'inherit' : 'rgba(155, 155, 155, 0.3)',
                  transitionDelay: `${(sentenceOne.length + i) * 90}ms`,
                }}
              >
                {word}
              </span>
            ))}
          </span>
        </h2>

        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#9b9b9b] mt-5 max-w-md mx-auto leading-relaxed">
          Job hunts fail when momentum dies in fragmented chats. StudyBuddy keeps applications synchronized so both of you stay accountable.
        </p>
      </div>
    </section>
  );
};
