# Redesign validation — 26 September 2026

- Production `npm run build` passes, including TypeScript compilation. Separate `npx tsc --noEmit` passes.
- 61 unit/integration tests passed against an isolated PGlite PostgreSQL-compatible database during development. Coverage includes ownership, food save validation, spoofed catalog macros, source normalization, unknown nutrients, portion units, image-response parsing, and clearing dialog drafts.
- Migration smoke test on a minimal historical FoodItem table preserves existing fiber values and accepts new nullable nutrients/provenance. This does not replace testing a production backup before deployment.
- Browser checks completed for desktop/mobile landing, mobile login, client dashboard, and food composer/journal. A live Open Food Facts oats lookup, confirmation of 50 g, and save persisted 188 kcal with source ID and portion metadata. Not every role-specific route has been manually audited.
- Gemini and USDA live calls were not exercised because deployment API keys were unavailable. Missing configuration fails explicitly.
- Homepage initial script payload: 14 to 12 script files; raw bytes 771,233 to 589,948; individually gzip-compressed bytes 241,134 to 183,067 (24.1% reduction). Measured unique script src files in production-rendered home HTML using Node gzip. This measures bundle payload, not real-user page-load timing or a Lighthouse score.
- Shared message polling replaces duplicate timers, pauses in hidden tabs, and prevents overlapping requests. Food composer/history load on demand; daily nutrition reads run concurrently.
- Repository-wide lint remains non-passing: 65 errors and 24 warnings, versus the earlier 70 errors and 29 warnings. Existing unrelated lint debt is not represented as resolved.

See FOOD_CATALOG.md for deployment requirements, source limitations, licensing, and scaling considerations. Changes are prepared for review; production deployment and migration have not been performed.
