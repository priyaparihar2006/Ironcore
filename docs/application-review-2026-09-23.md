# Application review — 2026-09-23

The application is not fully correct. Existing tests cover authentication validation, nutrition, AI failure handling, health reports, and persistence conflicts well, but several booking, billing, and administration flows have gaps. This is a source review and isolated test run, not a certification of every function or a live deployment test.

## Fixed in this review

- **Trainer authorization:** `server/api.ts`, POST `/trainer/assign-workout`, allowed any trainer to assign a workout to any known member. It now applies the same assigned-client ownership rule as client details and notes. Admin access is preserved. An API regression checks rejected requests leave assignments and notifications unchanged, and checks successful admin and assigned-trainer requests.
- **Booking cancellation:** `src/pages/dashboard/UserBookingsPage.tsx` sent POST to a PUT-only cancellation endpoint. The client now sends PUT. A browser regression exercises cancellation and the refreshed booking list on desktop and mobile.

## Remaining findings, in priority order

1. **High — password recovery cannot reach users.** `server/api.ts:448–481` generates and stores a reset token but has no email delivery implementation. The response nevertheless says a link was sent. A member cannot complete this flow through the application alone. Integrate delivery and test successful delivery, failure handling, and expiry without exposing tokens.

2. **High — paid memberships can be activated without payment.** `server/api.ts:775–835` immediately activates the requested plan and writes a PAID record. The source explicitly labels this a manual/demo flow; it cannot serve as verified online billing. The route also accepts inactive plans by ID and silently converts invalid billing cycles to monthly. Payment verification and a clear manual-activation policy are needed before real billing.

3. **High — annual totals use the monthly equivalent.** `server/api.ts:792` uses `annualPrice` directly as both `pricePaid` and the payment amount, while `src/pages/dashboard/UserMembershipPage.tsx:288` labels this value “month, billed annually.” A plan displayed as $69/month therefore records $69 for a full year rather than $828. Define and consistently apply the price units in storage, API, and UI.

4. **High — bookings lack server-side scheduling validation.** POST `/user/bookings` in `server/api.ts:845` only checks whether the trainer exists. It accepts past/arbitrary date strings, arbitrary time slots, inactive trainers, and duplicate bookings. There is no database uniqueness constraint for trainer/date/slot. Validate inputs and enforce scheduling conflicts transactionally, including simultaneous requests.

5. **High — membership editing calls an absent API.** `src/pages/admin/AdminMembershipsPage.tsx:50` sends PUT `/admin/memberships/:id`; `server/api.ts` only implements GET for membership administration. Saving an edited plan cannot work. Implement an authenticated, validated update route and persistence tests.

6. **Medium — progress entries falsely count as workouts.** POST `/user/progress` sets `workoutCompleted: true` unconditionally (`server/api.ts:734`). Logging only weight therefore increases workout streaks. Today's summary also uses the first matching progress record (`server/api.ts:576`), so another entry that day can update profile weight while leaving displayed steps/calories on the older record. Decide whether entries represent daily replacements or separate events, and keep the summary consistent.

7. **Medium — expiry and historical dates are inconsistently applied.** Several API responses and analytics count `status === 'ACTIVE'` without checking membership expiry (`server/api.ts:245,601,1321`). The membership page independently derives expiry, so different screens disagree. Trainer and admin upcoming-session counts include old confirmed sessions (`server/api.ts:941,1328`). Apply a shared effective-status/date rule.

8. **Medium — workout creation and notes have incomplete validation.** POST `/trainer/workouts` checks only a truthy title and an array of exercises. Negative durations/calories and malformed exercise objects are not rejected properly; zero is replaced by a default. Workout assignment accepts arbitrary scheduled-date strings. Trainer notes validate truthiness rather than bounded text and a valid flag. Extend shared input validation and test malformed types, ranges, and dates.

9. **Medium — temporary API failures discard login sessions.** `src/context/AuthContext.tsx:45` removes the saved token on every session-restoration failure, including network errors and server failures. Preserve the token for retryable failures; remove it for confirmed authentication/account rejection. API errors need an accessible HTTP status to distinguish these cases.

10. **Medium — password changes do not invalidate existing sessions.** JWT authentication checks signature, expiry, account existence, and active status, but not a password/session version (`server/auth.ts`). Changing or resetting a password leaves previously issued tokens usable until expiry (7 or 30 days). A session-version or revocation design is required if password recovery must end existing sessions.

11. **Medium — clean production registration depends on a pre-created plan.** Public registration hardcodes `plan_basic`, while production seeding can initialize an empty database. The membership foreign key then prevents registration if that plan has not been provisioned. Add explicit non-demo plan provisioning or gracefully handle unavailable trial configuration.

12. **Medium — booking failures are hidden.** Booking creation/cancellation catches only log errors in `UserBookingsPage.tsx`; users get no actionable failure message. Display an error while retaining form data and allow retry.

## Validation and limits

- TypeScript checking passes; all 29 isolated API/unit tests pass after the authorization fix.
- Eight existing browser tests pass across desktop and mobile. They mock API responses and therefore do not prove browser-to-database integration.
- The new booking regression passes on both viewports, bringing the browser total to 10 passing tests across the two runs.
- The browser test command builds the frontend and server bundle successfully. Build warnings include the frontend chunk size and the guarded CommonJS `import.meta` fallback.
- No live database, email provider, payment provider, AI provider, or avatar storage was exercised. Tests use PGlite and mocked providers; real PostgreSQL concurrency and deployment configuration remain separate verification work.
- No migrations, production configuration changes, or live-data edits were performed. Remaining findings above are not fixed by this review.
