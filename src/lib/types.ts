export type ApplicationStatus =
  | 'NOT_APPLIED'
  | 'APPLIED'
  | 'INTERVIEWING'
  | 'OFFER'
  | 'REJECTED';

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  college?: string;
  branch?: string;
  batch?: string;
  skills: string[];
}

export interface StudentApplication {
  studentId: string;
  studentName: string;
  studentAvatar?: string;
  status: ApplicationStatus;
  appliedAt?: string;
  updatedAt: string;
  notes?: string;
  interviewDate?: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  applyUrl: string;
  description: string;
  location: string;
  jobType: 'Internship' | 'Full-time' | 'Co-op' | 'Contract' | 'Part-time';
  salary?: string;
  deadline?: string;
  tags: string[];
  source: 'WhatsApp' | 'LinkedIn' | 'Campus Drive' | 'Career Portal' | 'Flyer' | 'Other';
  imageUrl?: string;
  imageUrls?: string[];
  postedBy: {
    studentId: string;
    studentName: string;
    studentAvatar?: string;
  };
  createdAt: string;
  updatedAt: string;
  applications: Record<string, StudentApplication>;
}

export interface ProblemDetails {
  type: string;
  title: string;
  status: number;
  detail: string;
  instance?: string;
}
