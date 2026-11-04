# CLAUDE.md - PeerApply Nexus Instructions

Refer to [AGENTS.md](./AGENTS.md) and [DESIGN.md](./DESIGN.md).

## Commands
- `npm run dev`: Start Next.js local server (port 3000)
- `npm run build`: Production build
- `npm start`: Start production server
- `npx @google/design.md lint DESIGN.md`: Verify design tokens
- `node _sources/vibebreaker/bin/vibebreaker.js doctor`: Check audit workspace

## Architecture
- Dual-tier database in `src/lib/db.ts` (MongoDB with automatic fallback to `data/db.json`).
- Multimodal AI job extractor in `src/lib/ai.ts`.
- RFC 7807 problem details error responses.
