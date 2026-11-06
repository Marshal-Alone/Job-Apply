'use client';

import React from 'react';
import { Student } from '@/lib/types';
import { Check } from 'lucide-react';

interface StudentSwitcherProps {
  students: Student[];
  activeStudent: Student | null;
  onSelectStudent: (student: Student) => void;
}

export const StudentSwitcher: React.FC<StudentSwitcherProps> = ({
  students,
  activeStudent,
  onSelectStudent,
}) => {
  return (
    <div className="flex items-center p-1 rounded-xl bg-slate-100/90 dark:bg-[#141b2e] border border-slate-200/80 dark:border-slate-800 shadow-2xs">
      {students.map((student) => {
        const isSelected = activeStudent?.id === student.id;
        return (
          <button
            key={student.id}
            onClick={() => onSelectStudent(student)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-[background-color,color,box-shadow] duration-150 cursor-pointer ${
              isSelected
                ? 'bg-white dark:bg-[#0e1322] text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/90 dark:border-slate-700/80'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/40'
            }`}
            title={`Active applicant: ${student.name}`}
          >
            <div className="relative">
              <img
                src={student.avatar}
                alt=""
                className={`w-4.5 h-4.5 rounded-full p-0.5 border ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                    : 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 ring-1 ring-white dark:ring-slate-900" />
            </div>
            <span>{student.name}</span>
            {isSelected && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
          </button>
        );
      })}
    </div>
  );
};
