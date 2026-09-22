# AI nutrition and wellness: requirements and implementation plan

Status: original requirements, September 22, 2026. Core implementation is now available; see [setup and implementation status](ai-health-setup.md) for delivered behavior, deployment prerequisites and deferred extensions.

## 1. Product scope

Help members understand estimated energy needs, log meals easily, build suitable diet plans, and review progress. Use deterministic calculations for numbers and AI for interpreting meal descriptions, suggesting meals, and explaining trends.

BMI alone must not determine diet or overall health. CDC describes BMI as a screening measure, not a direct measurement of body fat. Its adult interpretation applies to ages 20 and older: https://www.cdc.gov/bmi/faq/.

Proposed first-release scope: general wellness for adults aged 20+, with manual tracking available independently of AI. Automated diet targets are withheld for pregnancy/breastfeeding, eating-disorder concerns, or conditions requiring therapeutic nutrition until an appropriate professional provides a plan. This is a product boundary, not a diagnosis. NIDDK similarly excludes pregnancy, breastfeeding, and children from its general Body Weight Planner: https://www.niddk.nih.gov/health-information/weight-management/body-weight-planner.

Assumptions: “reports” initially means generated daily/weekly progress summaries. Uploaded laboratory or medical reports are a separate later phase. Provider, budget, launch region, and clinical reviewer are not yet selected.

## 2. Existing project and gaps

| Area | Current implementation | Required change |
| --- | --- | --- |
| UI | React, TypeScript, Vite; profile, nutrition, progress and trainer pages | Extend existing screens with onboarding, estimates, meal assistance and reports |
| API | Express, JWT authentication, user/trainer/admin roles | Add authenticated calculation and AI services with resource ownership checks |
| Profile | Height, current/target weight; user DOB, gender, fitness goal | Add activity, dietary preferences, allergies, timezone, consent and eligibility inputs |
| Nutrition | Manual meal entry, daily calorie/macronutrient totals | Add portion-aware estimation, corrections, history and personalized target versions |
| Targets | Fixed 2,200 kcal, 175 g protein, 220 g carbohydrate, 65 g fat in `server/api.ts` | Replace defaults with computed targets or an explicit “setup required” state |
| Persistence | Active `server/db.ts` uses PostgreSQL through `server/postgres.ts` | Add migrations and transactional repositories; README's JSON architecture is outdated |
| Dates | Nutrition routes derive today from UTC | Use member timezone for day boundaries and retain UTC event timestamps |
| AI | No AI provider SDK in package dependencies | Add a server-side provider adapter and validated output contracts |

Persistence is a prerequisite: current reads use a process-local cached database and saves rewrite all tables; save errors are caught without propagating failure. Concurrent requests/serverless instances can overwrite changes. Move profile, progress and nutrition writes to scoped transactional operations and coordinate remaining legacy writers so they cannot overwrite these records. Do this before adding background jobs. API success must mean persistence succeeded.

## 3. User inputs

Required for personalized estimates:

- Date of birth, height and latest dated weight, with explicit units and unit conversion.
- Goal: maintenance, fat loss, or muscle gain; target weight optional for maintenance.
- Activity category with understandable examples; occupation and exercise frequency can refine it.
- Formula-specific physiological input only when the selected energy equation requires it. Explain its purpose, keep it separate from gender identity, and offer a manual professional-set target if omitted.
- Timezone, allergies, dietary restrictions, and eligibility screening. Distinguish “none” from “not answered.”

Required for meal suggestions: cuisine preferences, vegetarian/vegan or other dietary pattern, disliked foods, meals per day, cooking time and budget preference. Optional inputs include sleep, water intake and waist measurements. Never infer body fat, medical conditions, or missing measurements from BMI.

Collect explicit consent before sending member data to an AI provider. Collect condition details only when necessary and voluntarily supplied; a simple eligibility flag is sufficient for the initial calculation gate.

## 4. Functional requirements

### A. Calculation and target engine

- Compute BMI as weight in kg divided by squared height in meters. Validate finite positive values and plausible ranges; show the measurement date and interpretation limitations.
- Select and document a professionally reviewed resting-energy equation, activity factors, goal adjustments, calorie bounds and macro rules before release. Store a policy version and formula version. Do not allow the language model to choose these rules dynamically.
- Estimate maintenance energy from resting energy and activity; display rounded estimates and assumptions rather than implying laboratory accuracy.
- Avoid double counting exercise when the activity factor already includes it.
- Calculate calories and macros in code, checking consistency while allowing food-label rounding. Missing values stay unknown rather than silently becoming zero.
- Recalculate a proposal when relevant profile inputs change. Require member acceptance before changing active diet targets; keep old daily target snapshots for historical comparisons.
- Review sustained weight trends and logging coverage before proposing later adjustments. Do not react to one day's weight or compensate for overeating with severe restriction.
- If required inputs or eligibility are missing, return `needs_input` or `review_required` and preserve manual tracking.

### B. Daily meal updates

1. Member types a meal, for example “2 rotis, dal and curd,” or selects a saved food/recipe.
2. AI extracts candidate foods and quantities. Ask for portion size, preparation or oil when these materially change the estimate.
3. Match items to a food database or verified recipe, then calculate nutrition from quantities in code.
4. Show editable portions, source, assumptions and an uncertainty label; member confirms before saving.
5. Recompute daily totals and remaining targets after add, edit or delete. Mark totals as incomplete when nutrients are unknown.

Support grams/ml and household measures with explicit conversion data, raw versus cooked weights, recipe yields, backdated entries and duplicates/retries. Persist `logged`, `estimated`, or `label_verified` provenance. A missing meal log does not mean the member ate nothing.

Use USDA FoodData Central as a candidate baseline source; it provides food search and nutrient APIs: https://fdc.nal.usda.gov/api-guide/. Validate regional coverage and licensing separately; Indian mixed dishes need curated ingredient recipes and realistic serving sizes. AI memory is not a nutrition database.

### C. Diet suggestions

- Start with a daily plan and ingredient-backed substitutions. Add seven-day plans and grocery lists later.
- Respect allergies as hard constraints; use curated ingredient/allergen metadata and reject unknown-risk suggestions where safety cannot be established.
- Match preference, budget and preparation constraints while aiming for the active targets.
- Recalculate all proposed meal totals from food records. Validate generated output against a schema and policy before displaying it.
- Label the plan as a proposal; applying it never logs meals as eaten.
- Give brief explanations tied to actual member inputs. Do not diagnose nutrient deficiencies, prescribe medication or supplements, or guarantee weight-loss timelines.

### D. Progress reports

- Daily: logged intake, target comparison, meal completeness and practical next-meal suggestions.
- Weekly: weight trend, logged-day averages, target adherence on sufficiently complete days, activity summary and a few actionable observations.
- Show reporting dates, timezone, data coverage and missing days. Separate logged facts, computed estimates and AI commentary.
- Require adequate measurements before describing a trend; otherwise say there is insufficient data. Do not claim diet caused a medical improvement.
- Compute report metrics in code; let AI explain the resulting structured summary. Store an input snapshot so a report can be reproduced.
- Offer an in-app report first; add printable/downloadable versions and scheduled reports later. Trainer access requires assignment and member sharing permission.

### E. Optional medical-report uploads (later)

Private PDF/image upload, malware/type/size checks, OCR extraction and user confirmation of test names, values, units, dates and lab reference ranges. Attach source-page references and highlight uncertain extraction. Initially provide a plain-language summary and questions for a clinician, without changing diet targets or diagnosing disease. Medical interpretation requires a separate clinical and jurisdictional review before release. Do not use the existing public avatar bucket for these files.

## 5. Architecture and data

```text
Profile / meals / progress screens
             |
Authenticated Express endpoints
             |
Input validation + ownership + consent + eligibility
             |
Calculation engine ---- food database / curated recipes
             |
AI adapter (minimal structured context)
             |
Output schema + nutrient/allergen/policy validation
             |
Member preview and acceptance -> transactional PostgreSQL writes
```

Proposed modules: `server/health/calculations.ts`, `server/health/policy.ts`, `server/nutrition/foods.ts`, `server/ai/provider.ts`, `server/ai/validation.ts`, and `server/reports/service.ts`. Keep calculation functions independent of AI availability.

Proposed storage additions:

| Entity | Main fields |
| --- | --- |
| Health preferences | user ID, activity, restrictions/allergies, cuisine, timezone, eligibility, consent version/time |
| Measurements | user ID, measured timestamp, value, unit, source; reuse/migrate existing weight history |
| Target versions | user ID, input snapshot, formula/policy versions, calorie/macros, status, effective date, accepted by |
| Meal items | user ID, meal/log ID, food ID, quantity/unit, nutrition snapshot, source, uncertainty, eaten timestamp |
| Food/recipe cache | source ID/version, serving conversions, ingredients, nutrient values, fetched timestamp |
| Recommendations/reports | owner, date range, input version/hash, structured result, model/prompt version, status |
| AI jobs/usage | owner, idempotency key, status, attempt count, token/cost metadata, sanitized error |

Enforce foreign keys, unique user/local-date daily logs, idempotency and ownership in database queries. Keep model outputs separate from authoritative member records. Unknown historical macros currently saved as zero cannot reliably be recovered; mark legacy provenance instead of claiming accuracy.

Proposed routes, relative to the existing `/api` prefix:

- `PUT /user/health/preferences` and `POST /user/health/estimate`.
- `POST /user/health/targets/:id/accept` with expected input version.
- `POST /user/nutrition/estimate-meal` returns a draft; existing meal POST saves confirmed entries.
- `PATCH` and `DELETE /user/nutrition/meals/:id`; extend nutrition GET with a validated local date.
- `POST /user/nutrition/plan` and `GET /user/nutrition/plans/:id`.
- `POST /user/reports` and `GET /user/reports/:id`.

Reject stale results when their profile/input version changed. Longer report/plan generation should use durable jobs and polling; do not rely on a process-local timer or an unawaited task surviving a serverless response.

## 6. Services, security and operations needed

- AI provider account and server-only credentials, structured-output support, usage limits and documented data handling. Select a model using an evaluation set of local meals, missing inputs and unsafe requests; no model fine-tuning is needed initially.
- Food data credentials, curated regional recipes, serving conversion rules and a dietitian-reviewed calculation policy.
- Proposed server settings: `AI_ENABLED`, `AI_PROVIDER`, `AI_MODEL`, `AI_API_KEY`, `FOOD_DATA_API_KEY`, `AI_TIMEOUT_MS`, and `AI_MONTHLY_BUDGET`. Names are placeholders until a provider is selected. Never expose secrets through `VITE_*` variables.
- Per-user rate limits, bounded output/retries, caching by input version, daily quotas, usage monitoring and a global feature switch. Estimate monthly spend from active users × calls per feature × measured token cost, plus food data/storage/jobs; do not assume a free service tier.
- Send only necessary inputs; exclude names, email, authentication data and unrelated records. Treat meal text and uploaded documents as untrusted content, never instructions for tools or database writes.
- Encrypt transport and storage, redact health content from operational logs, and define retention/deletion/export. Ensure deletion reaches AI artifacts, uploads and backups according to documented retention policy.
- Restrict trainer access to assigned, consenting members; admin role alone should not grant access to sensitive reports. Verify provider retention and applicable launch-region obligations before using real health data.
- On timeout or provider failure, retain manual logging and deterministic estimates; show unavailable/pending states. Never substitute fabricated AI output.

## 7. Delivery phases and acceptance criteria

| Phase | Deliverable | Completion gate |
| --- | --- | --- |
| 0: foundation | Transactional persistence, timezone model, data migrations, reviewed policy and contracts | Concurrent writes survive; save failures are reported; migration preserves existing data |
| 1: estimates | Onboarding, eligibility, BMI/energy estimates and versioned targets | Unit conversions and reference fixtures pass; missing inputs and excluded groups receive appropriate states |
| 2: AI meals | Text extraction, food matching, confirmation, edit/delete and source labels | Ambiguous portions request clarification; totals reconcile; duplicate submissions do not double count |
| 3: guidance | Daily suggestions and weekly reports | Allergy constraints pass evaluation; reported metrics match stored facts; missing days remain visible |
| 4: extensions | Photos, seven-day plans, grocery lists, scheduled reports, optional medical-document summaries | Separate accuracy, privacy, runtime and clinical gates completed for each feature |

Launch tests must cover authorization and cross-user access, unit conversion, zero/invalid values, timezone midnight boundaries, changed inputs, retries, concurrent writes, allergy conflicts, prompt injection, malformed AI JSON, incomplete logs, budget exhaustion and provider outages. Run existing `npm run lint` and `npm run build` during implementation and add focused service/API tests for the new logic. Validate AI behavior with reviewed examples rather than asserting exact generated prose.

Proposed rollout: internal fixtures, opt-in member pilot, then gradual enablement after reviewing correction rates, failed estimates, report accuracy, latency and cost per active user. Final numeric quality and budget thresholds must be set from pilot evidence before general release.

## 8. Decisions to resolve before implementation

1. Launch population and region; retain the proposed 20+ general-wellness boundary unless an appropriate age-specific flow is designed.
2. Whether reports mean progress summaries only or also uploaded medical reports; plan assumes the former for MVP.
3. AI provider, monthly spend limit and approved provider data-retention terms.
4. Food coverage priorities, especially regional/home-cooked dishes, and who maintains curated recipes.
5. Qualified reviewer for calorie/macro policies and whether professional review is available inside or outside the app. Trainer status alone is not a clinical qualification.

Recommended first implementation slice: persistence fixes, health onboarding, deterministic estimates and versioned targets, followed by text meal estimation. These establish trustworthy inputs before diet plans and longitudinal reports.
