import { z } from 'zod';
import { NextResponse } from 'next/server';
import { ProblemDetails } from './types';

// RFC 7807 problem details response helper
export function createProblemResponse(
  status: number,
  title: string,
  detail: string,
  type = 'about:blank'
): NextResponse<ProblemDetails> {
  return NextResponse.json(
    {
      type,
      title,
      status,
      detail,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } }
  );
}

// URL sanitization to prevent javascript: or malformed URI attacks (VibeBreaker Pass 01)
export function sanitizeUrl(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return '#';
  if (/^javascript:/i.test(trimmed) || /^data:text\/html/i.test(trimmed)) {
    return '#';
  }
  if (/^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    return `mailto:${trimmed}`;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return trimmed;
}

export const createJobSchema = z.object({
  title: z.string().min(2, 'Job title must be at least 2 characters').max(120),
  company: z.string().min(2, 'Company name is required').max(100),
  applyUrl: z.string().min(1, 'Application link or HR email is required'),
  applyType: z.enum(['LINK', 'EMAIL', 'INSTRUCTION']).default('LINK').optional(),
  applyEmail: z.string().max(120).optional(),
  applyInstructions: z.string().max(500).optional(),
  description: z.string().min(10, 'Job description must be at least 10 characters'),
  friendNote: z.string().max(1000).optional(),
  location: z.string().default('Remote / Hybrid'),
  jobType: z.enum(['Internship', 'Full-time', 'Co-op', 'Contract', 'Part-time']).default('Internship'),
  salary: z.string().max(80).optional(),
  deadline: z.string().optional(),
  tags: z.array(z.string().max(30)).default([]),
  source: z.enum(['WhatsApp', 'LinkedIn', 'Campus Drive', 'Career Portal', 'Flyer', 'Other']).default('WhatsApp'),
  imageUrl: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
  postedBy: z.object({
    studentId: z.string().min(1),
    studentName: z.string().min(1),
    studentAvatar: z.string().optional(),
  }),
});

export const updateJobSchema = z.object({
  title: z.string().min(2).max(120).optional(),
  company: z.string().min(2).max(100).optional(),
  applyUrl: z.string().min(1).optional(),
  applyType: z.enum(['LINK', 'EMAIL', 'INSTRUCTION']).optional(),
  applyEmail: z.string().max(120).optional(),
  applyInstructions: z.string().max(500).optional(),
  description: z.string().optional(),
  friendNote: z.string().max(1000).optional(),
  location: z.string().optional(),
  jobType: z.enum(['Internship', 'Full-time', 'Co-op', 'Contract', 'Part-time']).optional(),
  salary: z.string().max(80).optional(),
  deadline: z.string().optional(),
  tags: z.array(z.string().max(30)).optional(),
});

export const updateApplicationStatusSchema = z.object({
  studentId: z.string().min(1, 'Student ID is required'),
  studentName: z.string().min(1, 'Student Name is required'),
  studentAvatar: z.string().optional(),
  status: z.enum(['NOT_APPLIED', 'APPLIED', 'INTERVIEWING', 'OFFER', 'REJECTED']),
  notes: z.string().max(500).optional(),
  interviewDate: z.string().optional(),
});

export const parseJobWithAISchema = z.object({
  rawText: z.string().optional(),
  imageUrl: z.string().optional(), // base64 or URL
  imageUrls: z.array(z.string()).optional(),
});
