# GEMINI.md - PeerApply Nexus Instructions

Refer to [AGENTS.md](./AGENTS.md) for complete architecture, conventions, and VibeBreaker standards.

## Key Rules
1. **Design System**: Strictly use tokens defined in [DESIGN.md](./DESIGN.md) (primary, accent, applied, surface).
2. **Security & Input**: All mutations must validate with Zod schemas in `src/lib/validation.ts`. Sanitize URLs.
3. **Database Layer**: Respect dual-tier `db.ts` (MongoDB + resilient persistent JSON fallback).
4. **Error Handling**: RFC 7807 problem details format (`{ type, title, status, detail }`).
5. **Cyclomatic Complexity**: Keep component functions <= 8 cyclomatic complexity.
