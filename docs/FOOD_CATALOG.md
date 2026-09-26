# Food lookup and nutrition provenance

FitSnap searches Open Food Facts for packaged foods and, with USDA_API_KEY configured, USDA FoodData Central for general foods. These are live external catalogs; this change does not import millions of records locally or train an image recognition model.

A photo is sent to Gemini only to suggest food names. It cannot populate nutrition automatically. Users select a catalog record, enter a measured portion, check preparation and units, and confirm it before adding it. Manual package-label entry is available and remains labeled as user-entered.

On save, the server resolves the food reference again (using a bounded source cache), scales the source values, and ignores client-supplied catalog macros. The saved item records provider, source ID, source URL, portion amount, and unit. Core calories, protein, carbohydrates, and fat must be present; missing optional fiber, sugar, and sodium remain unknown rather than becoming zero. Open Food Facts records with reported quality errors or only estimated nutrients are excluded. USDA mass values cannot be converted to volume without density. Open Food Facts uses normalized 100 g/100 mL keys, so users must confirm the source label's unit.

No photo model or public food catalog can guarantee exact nutrition. Recipes, preparation, label rounding, catalog errors, and measured portions affect results. Historical entries remain unchanged; this migration cannot validate past nutrition.

## Setup and rollout

1. Configure DATABASE_URL and JWT_SECRET, plus the application's existing mail/storage settings.
2. Set GEMINI_API_KEY to enable photo suggestions. GEMINI_FOOD_MODEL defaults to gemini-2.5-flash.
3. Set USDA_API_KEY to enable general-food lookup. Missing keys produce an actionable error, never fabricated results.
4. Back up the existing database and apply `npx prisma migrate deploy` before releasing this code. Migration `20260926000100_food_provenance` makes fiber nullable and adds source/portion columns. Generate the client with `npx prisma generate`.
5. This repository's historical migrations do not create the complete schema on an empty database. For a disposable development database use `npx prisma db push`; production databases need a reviewed migration baseline before adopting migration deployment.

Search runs only on explicit submission. Requests have a 10-second timeout, bounded cache (300 entries; search 15 minutes, records 24 hours), request deduplication, and conservative per-process provider limits. The rate limiter and cache are not distributed: use a shared limiter/cache for multiple replicas, or a properly licensed hosted catalog/index for large traffic. Public search quotas cannot support unlimited concurrent image recognition users. Failed requests do not create nutrition records.

Food photos are processed by Gemini when recognition is requested. They are not submitted to the public food catalogs. MOCK_AI is development-only and does not run in production.

## Providers and licensing

- [Open Food Facts API documentation](https://openfoodfacts.github.io/openfoodfacts-server/api/): product lookup uses v3; full-text lookup uses its legacy search endpoint. Respect current quotas and the Open Database License/Database Contents License before redistributing a combined database. Source attribution is visible in the food journal.
- [USDA FoodData Central API guide](https://fdc.nal.usda.gov/api-guide/): requires an API key; data is public domain. Source links identify the original food record.
