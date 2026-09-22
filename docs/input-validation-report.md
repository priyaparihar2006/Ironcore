# Input validation implementation

## Scope and files

The implementation covers login, registration, password recovery/reset/change, member profile measurements, progress logging, administrator-created users and trainers, and the existing trial/newsletter forms. It retains the existing page layouts and AI-health functionality.

| Area | Files |
| --- | --- |
| Shared validation and accessible controls | `src/lib/validation.ts`, `src/components/ValidationInput.tsx` |
| Authentication forms | `src/pages/LoginPage.tsx`, `SignupPage.tsx`, `ForgotPasswordPage.tsx`, `ResetPasswordPage.tsx` |
| Member/admin forms | `src/pages/dashboard/UserProfilePage.tsx`, `UserProgressPage.tsx`, `src/pages/admin/AdminUsersPage.tsx` |
| Public forms | `src/components/TrialModal.tsx`, `Footer.tsx` |
| API error propagation | `src/lib/api.ts`, `src/services/api.ts` |
| Server validation and errors | `server/inputValidation.ts`, `server/httpErrors.ts`, `server/api.ts`, `server.ts`, `api/index.ts` |
| Authentication and hashing | `server/passwords.ts`, `server/auth.ts` |
| Database migration | `server/validationSchema.ts`, `server/postgres.ts`, `server/migrate-validation.ts` |
| Dependencies/scripts | `package.json`, `package-lock.json` |
| Tests | `tests/validation.test.ts`, `tests/validation-ui.spec.ts`, `tests/health.test.ts` |

## Rules

| Field | Rule |
| --- | --- |
| Weight | Required; 20–300 kg inclusive; at most one decimal; rejects nonnumeric types, NaN, Infinity, exponent notation and additional decimal digits. Applies to progress and current/target profile weight. |
| Email | Trimmed and lowercased; maximum 254 characters, local part maximum 64; practical dot-atom address with a valid dotted domain; rejects whitespace, consecutive local dots and malformed labels. |
| Phone | Optional where previously optional; required for trial enquiries. Bare Indian mobile numbers must contain 10 digits and start with 6–9. International numbers require a country code and a possible number length. Formatting spaces, parentheses and hyphens are accepted; saved numbers are normalized. |
| New password | 8–128 Unicode characters, uppercase, lowercase, digit and special character; no leading/trailing whitespace. No automatic trimming. |
| Login/current password | Required string with a defensive size cap; existing passwords retain their original complexity and whitespace behavior. |
| Confirmation | Required and exactly equal for signup/reset/change; validated if provided to administrator creation endpoints. |
| Name | 2–100 characters after trimming; Unicode letters and name punctuation supported. |
| Profile | Height 100–250 cm; optional body-fat/muscle percentages 0–100; at most one decimal; real date of birth from 1900 through today; allowed gender/fitness-goal options. |
| Progress | Calories 0–20,000, steps 0–200,000, strength 0–100, all whole numbers; notes at most 2,000 characters. Optional metrics retain their existing defaults. |
| Other submitted fields | Boolean remember-me/terms, allowed roles/statuses, trainer-reference syntax, bounded biography/specialty/experience/certifications, bounded HTTPS avatar URL and existing avatar upload checks. |

Exact weight messages are `Weight is required.`, `Please enter a valid weight.`, `Weight must be at least 20 kg.`, and `Weight must not exceed 300 kg.`

## Frontend

Shared validators run on blur and submit. Errors appear beside their fields with `aria-invalid`, descriptive error IDs and status announcements. Submission focuses the first invalid control. Loading guards and disabled submit buttons prevent repeated requests while a save is pending. API field errors propagate back to the same controls. Text inputs with decimal input modes preserve invalid numeric notation so users receive the intended error instead of browser-dependent number coercion.

## Backend

The API validates original values before normalization or persistence, independently of browser validation. Malformed JSON/body types return safe 400 responses. Validation recognizes Express's case-insensitive and trailing-slash route variants. The JSON parser inspects numeric weight tokens before parsing, because parsing otherwise erases exponent notation and trailing decimal precision. Both Express and serverless entry points use this hook.

Unexpected errors use generic messages; database constraint/format errors return 400 and uniqueness conflicts return 409. SQL details, password hashes and submitted credentials are not included in these responses. Request logging omits query strings so recovery tokens are not logged.

## Database and deployment

Run `npm run migrate:validation` against the intended PostgreSQL environment, with its existing connection variables. The normal schema initialization also installs these protections. This work did not run migrations against the configured application database.

The migration is transactional and repeatable. New `CHECK ... NOT VALID` constraints protect new and updated rows without scanning, deleting or rewriting historical data. Checks cover measurements, progress metrics, identity fields and supported password-hash formats. Existing invalid rows remain readable; correcting such a row may be necessary before an unrelated update can succeed.

A normalized email lookup index is created. A unique index is added when historical data permits it. If normalized duplicates already exist, they are preserved and reported as a count for manual review; a trigger rejects new normalized duplicates. Application writes use the existing transaction/advisory-lock mechanism. Reconcile old duplicates before relying on the unique index for arbitrary external writers.

## Authentication security

New and changed passwords use salted native scrypt (`N=32768`, `r=8`, `p=3`, 64-byte derived key); existing bcrypt hashes still verify. This avoids bcrypt's 72-byte truncation for newly accepted long passwords. Parameters follow the [OWASP password-storage guidance](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html); implementation uses [Node's scrypt API](https://nodejs.org/api/crypto.html#cryptoscryptpassword-salt-keylen-options-callback).

Unknown users, wrong passwords and inactive accounts receive the same login error. Unknown-account verification performs password hashing work. Recovery responses disclose neither account existence nor reset tokens. Reset/change endpoints are rate-limited. Production requires `JWT_SECRET`; development without one generates an ephemeral random secret. The public login page no longer displays hardcoded demo passwords, and password recovery no longer renders a demo reset-token link. Existing accounts are not deleted or rehashed automatically.

## Verification

Automated backend tests use isolated embedded PostgreSQL and exercise the requested boundary cases, direct HTTP validation, raw JSON exponent notation, malformed credentials, legacy login, registration/duplicates, administrator bypass attempts, password reset/change, direct database constraints, and idempotent migrations preserving legacy records. Browser tests use mocked API responses on desktop and mobile; backend tests separately exercise real API handlers and persistence. The existing AI-health tests remain part of regression coverage.

Final results:

- `npm run lint`: passed (TypeScript).
- `npm test`: 28 passed, 0 failed, including the existing AI-health regression suite.
- `npm run test:ui`: 8 passed, 0 failed across desktop and mobile, covering credentials, progress, profile, administrator provisioning and AI-health flows. Its production build also passed.
- `git diff --check`: passed.
- No configured/live database was used by these tests or migrated during this task.

## Limitations and recommendations

- Password-recovery email delivery is an existing unimplemented integration. Validation and token consumption are tested, but a transactional email provider is still needed for real recovery emails.
- Trial/newsletter submissions are existing local UI demonstrations without persistence or endpoints. They now validate locally; this change does not invent an external service.
- Email syntax validation does not prove mailbox ownership or support every RFC form (such as quoted local parts or Unicode local parts). Phone checks do not prove number ownership. Consider verified email/phone flows separately.
- Historical invalid measurements and duplicate addresses require deliberate review. After remediation, validate the new constraints and verify that the normalized unique index exists.
- Previously seeded demo accounts may still exist in deployed databases. Removing the public credential controls does not rotate those accounts; review their access separately.
- Long-password scrypt verification costs more CPU than simple field validation. Keep rate limiting enabled and monitor authentication capacity. Legacy bcrypt accounts retain bcrypt's historical 72-byte semantics until their passwords change.
- Existing build warnings about bundle size, Vite's `.env` NODE_ENV handling, and CommonJS `import.meta` are outside this validation scope.
