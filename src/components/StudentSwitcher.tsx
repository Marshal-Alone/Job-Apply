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
    <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/60 shadow-inner">
      {students.map((student) => {
        const isSelected = activeStudent?.id === student.id;
        return (
          <button
            key={student.id}
            onClick={() => onSelectStudent(student)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150 ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-700'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={`Active applicant: ${student.name}`}
          >
            <img
              src={student.avatar}
              alt={student.name}
              className={`w-5 h-5 rounded-full p-0.5 border ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800'
              }`}
            />
            <span>{student.name}</span>
            {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>
        );
      })}
    </div>
  );
};
