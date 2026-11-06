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
    <div className="flex items-center p-0.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800">
      {students.map((student) => {
        const isSelected = activeStudent?.id === student.id;
        return (
          <button
            key={student.id}
            onClick={() => onSelectStudent(student)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors ${
              isSelected
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs border border-slate-200/80 dark:border-slate-700/60'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
            title={`Active applicant: ${student.name}`}
          >
            <img
              src={student.avatar}
              alt=""
              className={`w-4 h-4 rounded-full p-0.5 border ${
                isSelected
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-slate-300 dark:border-slate-700 bg-slate-200 dark:bg-slate-800'
              }`}
            />
            <span>{student.name}</span>
            {isSelected && <Check className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
          </button>
        );
      })}
    </div>
  );
};
