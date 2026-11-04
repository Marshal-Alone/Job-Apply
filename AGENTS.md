# PeerApply Nexus — AI Agent & Developer Guidelines

> Built using the standards from `vibe-coding-ai-rules`, `design.md`, `vibebreaker`, and `ai-agent-skills`.

## Project Overview

PeerApply Nexus is a high-tempo collaborative job hunting and application tracking platform designed for student groups.
It replaces chaotic WhatsApp chats with a real-time, shared board where:
- Any student can post job listings (links, text descriptions, or WhatsApp flyer/screenshot images).
- AI in the loop (Gemini multimodal & structured extraction) automatically extracts job title, company, requirements, deadline, tags, and apply URL.
- Every student can track their personal status (`Not Applied`, `Applied`, `Interviewing`, `Offer`, `Rejected`).
- Clicking "Apply" opens the target job page AND updates the student's status with immediate visual feedback (`#10B981` Emerald state).
- Group peer visibility shows which classmates applied to what, encouraging collaboration and interview prep.

## Architecture & Conventions

### Directory Layout
- `src/app/`: Next.js App Router (pages and API routes).
- `src/components/`: Modular React components (cyclomatic complexity <= 8 per function).
- `src/lib/`:
  - `db.ts`: Dual-tier database layer. Connects to MongoDB when `MONGODB_URI` is provided; automatically falls back to persistent local JSON store (`data/jobs.json`) so the app is 100% operational out-of-the-box.
  - `ai.ts`: Multimodal AI job extractor using Gemini (`@google/genai` or heuristic fallback).
  - `types.ts`: TypeScript contracts for Student, Job, Application, and API responses.
  - `validation.ts`: Zod schemas for input validation (VibeBreaker Pass 01/Pass 17 compliance).
  - `utils.ts`: Helper utilities.

### Design Standards (`DESIGN.md` integration)
- Never use arbitrary CSS colors. Always use design tokens: `accent`, `applied`, `surface`, `primary`.
- High contrast compliant with WCAG AA.
- Responsive mobile & desktop layout.

### Security & Reliability Standards (`VibeBreaker` 20-Pass Compliance)
- **Pass 01 Untrusted Input**: All API inputs validated via Zod schemas. URLs sanitized against `javascript:` protocols.
- **Pass 03 IDOR Protection**: Student application mutations are scoped strictly to the requesting student ID.
- **Pass 05 Error Handling**: Never expose internal stack traces in production. Return RFC 7807 structured errors (`{ type, title, status, detail }`).
- **Pass 07 Resource Lifecycle**: Safe file uploads with size caps (5MB max) and MIME type checks (JPEG, PNG, WebP).
- **Pass 11 Resilience**: Graceful degradation when Gemini or MongoDB are unreachable.

### NPM Scripts
- `npm run dev`: Run development server at `http://localhost:3000`
- `npm run build`: Production build
- `npm start`: Start production server
