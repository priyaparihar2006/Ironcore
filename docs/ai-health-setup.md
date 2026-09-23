# AI wellness setup and implementation status

The application now has a **Health & AI** dashboard at `/dashboard/health` and an updated nutrition page. Runtime changes are implemented; external credentials, professional policy review and a pilot remain deployment prerequisites. No live provider call or migration against the configured database was performed during implementation.

## Configure and run

For the configured OpenRouter free model, see [the exact environment settings](ai-providers.md#requested-openrouter-model). `AI_OUTPUT_MODE=prompt_json` supports compatible chat models without strict structured-output support, with local schema validation before accepting results.

1. Install dependencies with `npm install`.
2. Keep the existing PostgreSQL `DATABASE_URL` and authentication settings. Back up the database before deployment. Run `npm run migrate:health` to apply the additive health schema and the unique member/day nutrition index. Application initialization also ensures this schema. The migration preserves existing rows and fails with a reconciliation message if legacy duplicate day logs exist; it does not silently delete or merge them.
3. For AI features, copy the AI settings from `.env.example` into the server environment. Set `AI_ENABLED=true`, `AI_MODEL`, the provider's `AI_API_KEY`, and `FOOD_DATA_API_KEY` for food lookup. Choose `AI_API_FORMAT=responses` or `chat_completions` and the provider's `AI_BASE_URL`. The default remains OpenAI Responses. Models must support strict JSON Schema output. Keys must never use a `VITE_` prefix. See [provider examples](ai-providers.md) for OpenRouter, Gemini compatibility and local models.
4. Choose `AI_PRICING_MODE=paid` with explicit non-negative token rates (at least one positive) and a positive monthly budget, or `free` with both rates explicitly zero and a non-negative budget. Use the selected model's actual account pricing. Blank/invalid values disable AI. Free mode does not alter provider billing and still enforces daily quotas. Default timeout is 25 seconds and default member quota is 20 AI requests per rolling 24 hours.
5. Have a qualified nutrition professional review the `wellness-v1` policy in `server/health/calculations.ts`. Set `HEALTH_POLICY_REVIEWED=true` only after that review. Until then, members can preview estimates, track meals and generate calculated reports; activating diet targets and generating diet plans is disabled. This flag does not certify the application or replace a clinical review.
6. Run `npm run dev`, complete the existing fitness profile, then open **Health & AI**. Save preferences and consent, calculate estimates and accept targets when enabled. Use **Nutrition** to log or estimate meals.

Your `.env` was not modified. AI and food lookup degrade to explicit unavailable messages if configuration is missing; there are no fabricated responses. Manual tracking, estimates and calculated reports do not require an AI account.

## Implemented behavior

- Profile-derived BMI and Mifflin–St Jeor resting-energy estimates; explicit activity factors, goal adjustment and calorie/macronutrient policy. The first release uses the existing profile's kg/cm units. It supports ages 20–100 within the configured measurement/BMI/energy bounds. Missing physiological input or eligibility returns a setup/review state.
- Preferences for timezone, diet, allergies, dislikes, cuisine, budget and cooking time. Sensitive conditions use an eligibility flag rather than storing a medical history. AI consent is separate and revocable.
- Versioned estimate proposals, input snapshots/hashes, explicit acceptance and stale-input checks. A birthday changing the energy calculation also invalidates the previous proposal. Existing daily logs retain historical target snapshots; accepted targets apply to new daily logs. A profile change requires reviewing a new proposal.
- Meal description extraction followed by USDA FoodData Central lookup and deterministic portion scaling. Unclear portions ask a question. Food matches and grams can be corrected before confirmation. The first USDA match is a **candidate**, not a verified identification; the member must check it. Mixed regional dishes should be entered ingredient by ingredient. Cached food records expire after 30 days.
- Date-specific meal history, manual entries, edits/deletes, unknown-macro labels, server-derived totals and idempotent meal creation. New days without accepted targets show “target not set”; old fixed targets remain historical records. Daily grouping uses saved timezone. Entry timestamps record when an entry was logged; a backdated record is associated with the selected day, not an inferred historical eating time.
- One-day AI meal proposals restricted to at least three previously logged USDA foods the member explicitly marked suitable for the saved diet. The server rejects unknown food IDs, unsupported portions and totals outside 20% of each target. It blocks automatic plans when allergies are reported because the food source does not verify allergen safety. Preferences such as budget/cuisine are guidance, not guarantees; all suggestions require member review. Plans do not log food as eaten.
- Daily/seven-day reports with logged-day calorie averages, coverage, weight change only after three distinct measurement days, input snapshots and optional AI observations. A missing entry is never treated as zero actual intake. Reports do not infer causal health improvements or claim complete-day adherence from partial logs. In-browser printing and JSON export are available.
- Saved plans/reports are owner-scoped. Health-artifact deletion removes preferences, targets, drafts, plans and reports while retaining meal/progress records. Account deletion cascades health artifacts and usage records. Admin/trainer roles do not bypass owner checks for these endpoints.

## Persistence and operational details

The old shared in-memory cache and full-database rewrites have been replaced for runtime writes with fresh repeatable-read snapshots, transactional changed-row updates, cross-process advisory locking and optimistic conflict checks. Unrelated changes can merge; conflicting changes return HTTP 409 and require refreshing/retrying. Failures propagate to clients instead of reporting a successful save. All existing routes now forward rejected promises through Express's error handler.

New tables: `wellness_states`, `health_ai_usage`, and `health_food_cache`. The health state is a bounded JSON document per member (100 target versions, 100 meal drafts, 20 plans, 52 reports). Existing nutrition/progress tables and their historical data are retained. The compatibility data-access layer still reads all legacy tables for each request; splitting those reads into dedicated repositories is a future scalability improvement.

AI usage reservations are persisted before a request. They conservatively reserve input bytes plus schema/system overhead and the maximum 1,800 output tokens, using configured prices. Reservations are intentionally retained for failed requests, so the cap may stop usage early. They are an application guard, not a replacement for provider-side billing limits; keep model prices current. Token counts, status and timestamps are stored without prompts. Health-artifact deletion retains usage metadata to prevent quota bypass. Set a documented deployment-specific retention policy for usage metadata and database backups before launch.

AI work is bounded and awaited in the HTTP request; there are no unawaited tasks or process-local scheduled jobs. Configure hosting timeouts for the AI call plus a batch of up to eight concurrent food lookups (or lower the timeout/portion limit to fit the host). A disconnected request may finish server-side; refresh before retrying. For larger plans and scheduling, add a durable queue before enabling those features.

The provider receives meal descriptions, selected preferences or aggregate report metrics, not member names, emails, credentials or full medical records. Responses requests include `store:false`; compatible Chat Completions requests do not assume support for that field. Neither guarantees zero provider retention. Review provider terms and applicable regional privacy obligations before processing real health data.

## Verification

```sh
npm run lint
npm test
npm run test:ui
npm run build
```

Backend tests use PGlite (embedded PostgreSQL) and mocked provider/food responses; they never connect to `DATABASE_URL` or use real API keys. They cover migrations, stale writes, conflicts, rollback, ownership, consent, formula fixtures, date boundaries, meal mutations, target acceptance, provider failures and quota handling. PGlite serializes test connections, so these tests validate optimistic stale-snapshot semantics, not production load or multi-process throughput.

Browser smoke tests build the app and use Playwright with installed Chrome, mocked application endpoints and desktop/mobile viewports against Vite preview. Install Chrome, or change `channel` in `playwright.config.ts` to an available browser. The tests exercise preference saving, estimate preview, reporting and manual/AI meal confirmation.

## Deferred extensions and launch gates

The original plan designated meal photos, seven-day meal plans, grocery lists, scheduled reports, and uploaded medical-report summaries as later extensions. They are not enabled in this release. Medical-report uploads need private storage, extraction validation, source-page attribution and a separate clinical review. Also pending: curated regional recipe coverage, a professional-set target workflow, optional sleep/water tracking, trainer report sharing, imperial-unit entry, and formal pilot accuracy/latency/cost thresholds.

Before public rollout, review the nutrition policy, validate provider output against a representative regional meal evaluation set, verify production database concurrency and hosting timeouts, select retention terms, and run an opt-in pilot. Existing legacy zero-valued macros cannot be reconstructed into known values; the UI labels legacy provenance.

## References

- [OpenAI structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [USDA FoodData Central API guide](https://fdc.nal.usda.gov/api-guide/)
- [Mifflin–St Jeor equation publication](https://pubmed.ncbi.nlm.nih.gov/2305711/)
- [CDC BMI limitations and adult interpretation](https://www.cdc.gov/bmi/faq/)
- [NIDDK Body Weight Planner scope](https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner)
