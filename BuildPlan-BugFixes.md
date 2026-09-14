# Build Plan — FinalBugReport.md Remediation (P0 · P1 · P2)

**Source of truth:** [FinalBugReport.md](FinalBugReport.md) — findings FBR-01 … FBR-22
**Scope:** P0 (3) + P1 (7) + P2 (12) = **22 findings**. P3 (FBR-23…30) is explicitly out of scope.
**Author of plan:** Opus 5 · **Implementer:** Sonnet (code changes) · **Date:** 13 Sep 2026
**Deployment constraints that bound every decision:** Vercel Hobby — **12 Serverless Functions**,
**4.5 MB request cap**, **1 cron/day** · Supabase free tier — **500 MB** · **phone-first** cohort.

---

## 0. How to use this document

Work **wave by wave**. Each wave ends at a **verification gate** that must pass before the next wave
starts. Within a wave, items are independent unless a `Depends on:` line says otherwise.

Every item below gives: **Files → Change → Migration → Tests → Acceptance → Risk**. Implement only
what the item specifies. Where this plan disagrees with `FinalBugReport.md`, **this plan wins** — the
three disagreements are listed in §2 and each says why.

---

## 1. Preflight (blocking — do this first)

`node_modules` is **not installed** in this working tree. The bug report's §0 honesty statement is
still accurate: no finding has been validated by tooling, only by reading source.

```bash
npm install
npm run verify        # typecheck && check-tokens && test
```

**Record the baseline.** Paste the actual output into the PR description. Specifically:

1. Confirm `npm run test` is green **before** any change. There are 15 existing test files under
   [src/lib/](src/lib/); several will be touched by this work.
2. Run `npm run lint` and capture the warning count — this resolves **FBR-27** (currently
   "unverified") as a side effect and gives a before/after number.
3. If the baseline is **not** green, stop and report which tests fail. Do not fold pre-existing
   failures into this remediation.

**Migration conventions** (verified in [src/db/client.ts:138-170](src/db/client.ts#L138-L170)):

- Migrations live in [drizzle/](drizzle/), are discovered by `readdirSync` **sorted by filename**,
  and are tracked in `_migrations` by name. Highest existing is `0005_add_stored_files.sql`.
- **Each file is executed as a single `exec`/`query` call.** Therefore:
  **never use `CREATE INDEX CONCURRENTLY` in a `drizzle/*.sql` file** — it cannot run inside an
  implicit transaction block and will fail on PGlite. Use the plain form in the migration and put
  the `CONCURRENTLY` variant in [drizzle/production-only/](drizzle/production-only/) as a documented
  manual step (that subdirectory is skipped by the loader's `isFile()` filter).
- Every schema change needs **both** the SQL file **and** the matching column in
  [src/db/schema.ts](src/db/schema.ts). A migration without the Drizzle column is invisible to the
  ORM; a column without the migration breaks production at runtime.
- Use `IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS` throughout — migrations must be re-runnable
  against a partially-migrated environment.

**Migration ledger for this work** (allocate in this order, do not renumber later):

| File | Wave | Serves |
|---|---|---|
| `drizzle/0006_provisional_accounts.sql` | 1 | FBR-03 |
| `drizzle/0007_phone_unique.sql` | 2 | FBR-05 |
| `drizzle/0008_rate_limits.sql` | 4 | FBR-14 |
| `drizzle/0009_image_token_count.sql` | 3 | FBR-17 |
| `drizzle/0010_is_gradeable_fn.sql` | 3 | FBR-22 |
| `drizzle/production-only/9998_phone_unique_concurrent.sql` | 2 | FBR-05 (prod path) |

---

## 2. Corrections to FinalBugReport.md — read before implementing

The bug report's *diagnoses* hold up against source. Three of its *proposed fixes* do not. These are
not style preferences; following the report literally would produce a no-op or a broken build.

### 2.1 FBR-08 — the proposed bare layout file will have **no effect**

The report says:

> `src/app/student/attempts/[id]/layout.tsx` -> no AppShell; requireStudent() only

There is **no page at that segment**. All student routing goes through the single catch-all
[src/app/student/[[...slug]]/page.tsx](src/app/student/[[...slug]]/page.tsx), which dispatches
`slug = ['attempts', id]` to `StudentTestRunnerView`. Next.js applies layouts along the **matched**
route segments — `app/layout.tsx` → `app/student/layout.tsx` → `app/student/[[...slug]]/page.tsx`.
A layout under `attempts/[id]/` is never in that chain and would be dead code, exactly like the
barrier in FBR-04.

**Do this instead:** move `AppShell` **out of**
[src/app/student/layout.tsx](src/app/student/layout.tsx) and **into** the four non-runner views, so
`StudentTestRunnerView` renders bare. `student/layout.tsx` keeps only `requireStudent()` and passes
the session down. Details in the FBR-08 item. Serverless function count is unchanged either way.

### 2.2 FBR-06 — changing `sweepExpiredAttempts`'s return type is a **breaking change**

`sweepExpiredAttempts` currently returns `Promise<number>`
([src/lib/sweep.ts:30](src/lib/sweep.ts#L30)). Three live callers depend on that shape:

- [src/server/api/cron/sweep-expired.ts](src/server/api/cron/sweep-expired.ts) — `closedCount` in the JSON body
- [src/db/client.ts:76, 80, 94, 98](src/db/client.ts#L76) — the local `setInterval` sweep
- [src/lib/cron-sweep.test.ts:4-6](src/lib/cron-sweep.test.ts#L4) — `vi.fn().mockResolvedValue(0)`

The report's `{ closed, backlog }` return is the right design, but the item must **also** update the
cron route's response body, both `client.ts` call sites, and the existing test's mock. Budget for it.

### 2.3 FBR-05 — the de-dup report is a **precondition**, not a follow-up

`CREATE UNIQUE INDEX` on `profiles.phone` **will fail** if collisions already exist, and a failed
migration in this loader **aborts boot** for the whole app
([client.ts:167-169](src/db/client.ts#L167)) — turning a data-hygiene issue into a total outage.
The normalise-then-constrain sequencing in the FBR-05 item is mandatory, and the migration must be
written so it cannot brick a deploy.

---

## 3. Wave plan and sequencing rationale

Waves are ordered by **blast radius**, not by severity label. Two P1s (FBR-04, FBR-08) are pulled
forward because they share `TestRunnerClient.tsx` with FBR-07 and FBR-12, and four items touching
one 1200-line component in parallel is how merge conflicts eat a day.

| Wave | Theme | Items | Gate |
|---|---|---|---|
| **0** | Preflight | — | `npm run verify` green, baseline recorded |
| **1** | Stop the bleeding | FBR-01, FBR-02, FBR-03 | P0 regression tests pass |
| **2** | Exam runner + identity | FBR-04, FBR-08, FBR-07, FBR-12, FBR-05 | Manual phone walkthrough |
| **3** | Lifecycle + correctness | FBR-06, FBR-10, FBR-09, FBR-17, FBR-18, FBR-22 | Lifecycle + analytics tests |
| **4** | Platform hardening | FBR-13, FBR-14, FBR-21, FBR-20, FBR-19, FBR-16, FBR-15, FBR-11 | Full verify + deploy smoke |

**One PR per wave.** Waves 1 and 2 are separately deployable and separately revertable; that matters
because Wave 2 changes the layout tree and Wave 1 does not.

---

# Wave 1 — Stop the bleeding (P0)

## FBR-01 · Positional-parameter index shift → HTTP 500 on batch filter

- **Files:** [src/server/api/students/index.ts:76-122](src/server/api/students/index.ts#L76-L122)
- **Change:** Replace the hand-rolled `$n` placeholders and the nested-ternary parameter array with
  a single `params: unknown[]` + `clauses: string[]` builder, pushing each parameter and deriving
  its index from `params.length`. The report's fix block is correct — use it as written.
- **Also:** the count query above (lines 38-66) uses the Drizzle builder and is *correct*. Do **not**
  rewrite it, but confirm its filter semantics match the new clause builder exactly — the two
  diverging is how a total of 40 renders above 12 rows.
- **Migration:** none.
- **Tests:** new test file following the existing `src/lib/*.test.ts` convention. Assert, for **all
  eight** combinations of `search × batch × status`, that
  `(count of distinct $n placeholders in the SQL text) === params.length` and that the highest index
  equals `params.length`. Extract the builder into a pure exported helper so it is testable without
  a DB.
- **Acceptance:** `/teacher/students` → select any batch with an empty search box → 200 + rows.
  Then repeat with search filled, with status filters, and with `batch = 'General'`.
- **Risk:** Low. Self-contained. `'General'` is a sentinel meaning `IS NULL OR = 'General'` and must
  push **no** parameter — that asymmetry is the original bug's root cause, so test it explicitly.

## FBR-02 · Standalone solution ingest overwrites solutions across subjects

- **Files:** [src/server/api/questions/ingest.ts:50-80](src/server/api/questions/ingest.ts#L50-L80) ·
  [src/lib/zod/ingest.ts](src/lib/zod/ingest.ts)
- **Change:**
  1. Add optional `humanCode` to `IngestSolutionsPayload` in the Zod schema.
  2. In the solutions loop: if `targetPaperId` is set, keep the existing
     `(paperId, sourceQno)` condition. If not, require `sol.humanCode` and match on it
     (`humanCode` is already `.unique()`, [schema.ts:88](src/db/schema.ts#L88)). If neither is
     available, throw `HttpError(422, 'ambiguous_solution_target', …)` with the report's message —
     it names the fix for the teacher, which a bare 422 does not.
  3. Guard `existing.length > 1` → `409 ambiguous_solution_target`. Never loop-update multiple rows.
  4. Have the extraction prompt emit `humanCode`.
- **Migration:** none (no schema change — `humanCode` already exists).
- **Tests:** extend [src/lib/zod/ingest.test.ts](src/lib/zod/ingest.test.ts) for the new optional
  field. New test: seed two standalone questions with `sourceQno: 1` in different subjects, ingest a
  solution for one, assert the other row is **byte-identical** (including `sourcePage`, which the
  current loop also clobbers).
- **Acceptance:** upload standalone solutions without a `paperId` and without `humanCode` → clear
  422, no writes. With `humanCode` → exactly one row updated.
- **Risk:** **Medium — behavioural break by design.** Any existing teacher workflow that uploads
  standalone solutions keyed on question number alone will now be refused. That is the point (it was
  silently corrupting data), but it must be called out in the PR and ideally in release notes.
  Mode 1 of the same handler ([ingest.ts:87-118](src/server/api/questions/ingest.ts#L87-L118)) is the
  upstream cause and is **not** fixed here — leave it, but add a code comment pointing at FBR-02 so
  the next reader knows `(NULL, sourceQno)` collisions are known and intentional-for-now.

## FBR-03 · Unauthenticated question-bank + answer-key exfiltration

**The single most serious finding. Six sub-parts; a dashboard filter alone is not a control.**

- **Files:** [src/lib/auth.ts:105-140](src/lib/auth.ts#L105-L140) ·
  [src/lib/session.ts](src/lib/session.ts) ·
  [src/server/api/auth/login.ts:26-53](src/server/api/auth/login.ts#L26-L53) ·
  [src/app/student/views/StudentDashboardView.tsx:18-33](src/app/student/views/StudentDashboardView.tsx#L18-L33) ·
  [src/server/api/tests/attempts.ts](src/server/api/tests/attempts.ts) ·
  [src/server/api/attempts/result.ts:60-80](src/server/api/attempts/result.ts#L60-L80) ·
  [src/server/api/analytics/cohort.ts](src/server/api/analytics/cohort.ts) ·
  [src/server/api/analytics/test-by-id.ts](src/server/api/analytics/test-by-id.ts) · `drizzle/0006_*.sql`
- **Migration `drizzle/0006_provisional_accounts.sql`:**
  ```sql
  ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_provisional boolean NOT NULL DEFAULT false;
  ALTER TABLE tests    ADD COLUMN IF NOT EXISTS audience text NOT NULL DEFAULT 'enrolled';
  -- audience: 'enrolled' | 'public'
  ```
  Add both columns to [src/db/schema.ts](src/db/schema.ts). **Defaults are deliberately
  backward-safe:** every existing profile stays non-provisional and every existing test stays
  `enrolled`, so no currently-enrolled student loses access at deploy time.
- **Change, in this order:**
  1. **Provision as un-entitled.** `loginWithPhone`'s auto-provision branch sets
     `isProvisional: true`, `batch: 'Prospective'`. Keep `canLogin: true` — the frictionless funnel
     advertised on [boardChallenge/page.tsx:46](src/app/boardChallenge/page.tsx#L46) is intentional
     and must keep working.
  2. **Carry the flag in the session.** Add `isProvisional` to the `Session` type and the JWT
     payload in [src/lib/session.ts](src/lib/session.ts). Existing cookies lack the field —
     treat `undefined` as `false` so live sessions are not invalidated mid-exam.
  3. **Authorise at both layers.** `StudentDashboardView` filters to
     `audience = 'public'` when `session.isProvisional`; **and** `POST /api/tests/:id/attempts`
     enforces the same predicate server-side alongside its existing `isPublished` / `opensAt` /
     `closesAt` / `maxAttempts` gates. Both, not either.
  4. **Never disclose keys to a provisional account.** In `attempts/result.ts`, omit `answer` and
     `solution` when `session.isProvisional`. Set the Board Challenge test to
     `resultsPolicy: 'on_release'` so the diagnostic returns a strengths report.
  5. **Quarantine the statistics.** Exclude `is_provisional` rows from `v_test_ranks` and from both
     analytics endpoints. In `/teacher/students`, surface them under a **"Prospective leads"** tab
     with a *Convert to enrolled student* action that clears the flag and sets a real batch.
  6. **Rate-limit provisioning per IP** separately from per-phone login
     ([login.ts:37-38](src/server/api/auth/login.ts#L37-L38) currently permits 30 *new accounts* per
     IP per 5 min). **This cap is in-memory and therefore not enforceable across containers — it is
     a speed bump until FBR-14 lands in Wave 4.** State that honestly in the code comment; do not
     claim a control you do not have.
- **Tests:**
  - Extend [src/lib/dto.leak.test.ts](src/lib/dto.leak.test.ts): a provisional session receives a
    result payload with **no** `answer` and **no** `solution` key present (assert key absence, not
    `=== null` — a `null` still tells an attacker the field exists).
  - Extend [src/lib/phone-auth.test.ts](src/lib/phone-auth.test.ts): auto-provisioned profile has
    `isProvisional === true` and `batch === 'Prospective'`.
  - New: provisional session + `audience = 'enrolled'` test → dashboard omits it **and**
    `POST /attempts` returns 403. Assert the API independently of the UI.
  - New: analytics aggregates exclude provisional attempts.
- **Acceptance:** walk the report's exploit path verbatim
  (`login → /student → POST attempts → submit → GET result`). It must fail at step 3 with a 403 for
  `enrolled` tests, and at step 5 must return no keys for the `public` diagnostic.
- **Risk:** **High — this is the item most likely to break real students.** The `DEFAULT false` /
  `DEFAULT 'enrolled'` pair is what makes it safe. Before deploying, run
  `SELECT count(*) FROM profiles WHERE phone IS NOT NULL AND username LIKE 'student\_%';` to size how
  many *already auto-provisioned* accounts exist; those are indistinguishable from real students
  today and will remain non-provisional after this migration. Backfilling them is a **judgement call
  for the institution, not for the implementer** — surface the count and let them decide (§5, item 1).

### Gate 1
`npm run verify` green · new P0 tests pass · exploit path manually reproduced as blocked ·
batch filter exercised across all eight filter combinations in a browser.

---

# Wave 2 — Exam runner + identity (P1)

> Four of these five items touch
> [TestRunnerClient.tsx](src/app/student/attempts/[id]/TestRunnerClient.tsx). Implement them in the
> listed order **in one branch**, one commit each. Do not parallelise.

## FBR-04 · The fullscreen integrity barrier is unreachable dead code (`window.status`)

- **Files:** [TestRunnerClient.tsx:1191](src/app/student/attempts/[id]/TestRunnerClient.tsx#L1191)
  (dead block) · [:397-398](src/app/student/attempts/[id]/TestRunnerClient.tsx#L397) (no-op
  `useEffect` fullscreen call) · [eslint.config.mjs](eslint.config.mjs)
- **Change:**
  1. **Delete** the `{!isFullscreen && status === 'in_progress' && …}` block. Do **not** "fix" it by
     declaring `status` — on iOS, WebKit does not implement `requestFullscreen` on generic elements,
     so `isFullscreen` can never become `true` and the repaired barrier would be a **total lockout on
     the primary device**. The report is right about this.
  2. **Delete** the `requestFullscreen()` call inside the `useEffect`. It is rejected by every browser
     outside a user gesture and logs a console error on every exam load. The instructions page
     already does this correctly, on click
     ([TestInstructionClient.tsx:56-63](src/app/student/tests/[id]/TestInstructionClient.tsx#L56-L63)) — leave that.
  3. **Add the lint rule that makes this class of bug impossible:**
     ```js
     rules: { 'no-restricted-globals': ['error', 'status', 'name', 'length', 'event', 'closed'] }
     ```
     Run `npm run lint` immediately after adding it. **Expect other hits** — these globals are easy
     to shadow. Fix each one; if any is a genuine intentional use, disable it inline with a comment
     explaining why, never by weakening the rule.
- **Migration:** none.
- **Tests:** the lint rule *is* the regression test. Optionally assert the rule is present in
  `eslint.config.mjs` to lock it.
- **Acceptance:** `npm run lint` fails on a scratch line `if (status === 'x') {}` and passes once
  removed. No console errors on exam load.
- **Risk:** Low, and **strictly net-positive**: the deleted code has never executed for any student
  on any platform. Do **not** build the replacement integrity model here — that is
  `FinalEnhancements.md` §3, an enhancement, not a bug fix. Scope discipline matters: FBR-16 in Wave
  4 lays the telemetry groundwork it will need.
- **Communication:** the PR must state plainly that **fullscreen enforcement has never been active**.
  Any student-facing or marketing copy claiming "enforced for academic integrity" is false today and
  must be corrected or removed — flag it (§5, item 8), as copy is not the implementer's call.

## FBR-08 · Exam runner nested inside app chrome — broken layout + one-tap escape

**See §2.1 — the report's proposed fix does not work. Use this approach.**

- **Files:** [src/app/student/layout.tsx](src/app/student/layout.tsx) ·
  [src/app/student/views/](src/app/student/views/) (all five views) ·
  [src/components/AppShell.tsx](src/components/AppShell.tsx) ·
  [TestRunnerClient.tsx:707, 932](src/app/student/attempts/[id]/TestRunnerClient.tsx#L707) ·
  [src/app/globals.css:55-67](src/app/globals.css#L55-L67)
- **Change:**
  1. Reduce `student/layout.tsx` to `requireStudent()` + `{children}`; no `AppShell`.
  2. Wrap the four non-runner views (`StudentDashboardView`, `StudentAnalyticsView`,
     `StudentTestInstructionView`, `StudentAttemptResultView`) in `AppShell` individually. A small
     shared `StudentChrome` server component avoids repeating the `NAV` array four times.
  3. `StudentTestRunnerView` renders `TestRunnerClient` **bare**.
  4. The runner then owns the full viewport: `h-[100dvh]` instead of
     `h-[calc(100dvh-var(--app-header-h))]`, no outer `main` padding, no footer, and
     `overscroll-behavior: none` on the scroll container to kill scroll-chaining and mid-exam
     pull-to-refresh.
  5. **Guard in-app navigation.** With the nav links gone, the remaining exits are the back gesture
     and any in-app link. Add a confirm-on-leave that **flushes answers first** — `beforeunload` does
     not fire on a client-side Next.js route change, so the unsynced buffer is currently discarded
     silently. Coordinate with FBR-12's `flushBeacon`, landing after it in the same branch.
  6. Re-check the bottom action bar at 360 px: it currently `flex-wrap`s onto two rows
     ([:932](src/app/student/attempts/[id]/TestRunnerClient.tsx#L932)), which the height math did
     not account for.
- **Migration:** none.
- **Tests:** no meaningful unit surface — this is layout. **Manual verification is the gate:** on a
  360×640 viewport, assert `document.documentElement.scrollHeight === window.innerHeight` (no outer
  page scroll), the CBT header with the timer never scrolls out of view, and no nav/logout affordance
  is reachable from the runner.
- **Acceptance:** exam on a real phone (or 360×640 DevTools): single scroll context, timer always
  visible, no route out without a confirm.
- **Risk:** **Medium-high — the riskiest layout change in the plan.** It moves `AppShell` for
  *every* student page. Regress all four non-runner pages explicitly; a missed wrap means a page with
  no navigation at all. Verify the serverless function count is unchanged (`next build` output) —
  App Router layouts are not separate functions, but confirm rather than assume, given the 12-function
  ceiling that commit `a5addb3` was fighting.

## FBR-07 · Option selected without "Save & Next" is graded but shown *Not Answered*

- **Files:** [TestRunnerClient.tsx:454-467, 479-509](src/app/student/attempts/[id]/TestRunnerClient.tsx#L454-L467) ·
  [src/lib/attempts.ts:180-192](src/lib/attempts.ts#L180-L192) ·
  [src/lib/grading.ts:35-48](src/lib/grading.ts#L35-L48)
- **Change:** Adopt NTA semantics — **selection is the save.**
  1. `handleSelectOption` sets `state` alongside `response`, preserving flags:
     `flagged_unanswered | answered_flagged → answered_flagged`, else `answered`. Use the report's
     block as written.
  2. Apply the identical transition in `handleSetIntegerValue` once the draft parses to a finite
     number — and back to `seen_unanswered` when it does not, so a half-typed `-` never shows green.
  3. **Add a server-side repair** in `saveAttemptAnswersBatch`, because the UI is not the only
     writer. **Repair, do not reject** — a mid-exam 422 must never block a save:
     `isGradeableResponse(type, response) && state ∈ {seen_unanswered, not_seen}` → `state = 'answered'`.
- **Migration:** none. Pre-existing contradictory rows are repaired on next save; note in the PR that
  rows never saved again keep the old `state`. A one-off backfill script is **optional** and should
  be proposed, not assumed.
- **Tests:** extend [src/lib/grading.gradeable.test.ts](src/lib/grading.gradeable.test.ts) with the
  invariant: `isGradeableResponse === true` ⟹ `state ∈ {answered, answered_flagged}`. Extend
  [src/lib/attempt-lifecycle.test.ts](src/lib/attempt-lifecycle.test.ts) for the server repair.
- **Acceptance:** tap option B on Q1 → tap Q5 in the palette without Save & Next → palette cell for
  Q1 is **green**, the pre-submit summary counts it under **Answered**, and the scorecard agrees.
- **Risk:** Low-medium. Changes what students see mid-exam, in the direction that matches the grader.
  Verify flagged-state transitions carefully — silently clearing a flag is its own small betrayal of
  the student's intent.

## FBR-12 · `beforeunload` is the wrong save hook on mobile

- **Files:** [TestRunnerClient.tsx:376-388, 405, 353-365](src/app/student/attempts/[id]/TestRunnerClient.tsx#L376-L388)
- **Change:** Make `pagehide` the authoritative flush via `navigator.sendBeacon` (guaranteed to
  survive teardown; a `fetch` in `visibilitychange` may be cancelled as the page freezes). Keep
  `beforeunload` **only** for the desktop confirm dialog. Use the report's `flushBeacon` block.
  The `POST` alias for beacons already exists
  ([answers.ts:96](src/server/api/attempts/answers.ts#L96)) — **no server change needed.**
- **Migration:** none.
- **Tests:** unit-test `buildAnswersPayload()` shape if not already covered. Beacon dispatch itself
  needs manual verification.
- **Acceptance:** on Android Chrome, background the exam tab and let the OS reclaim it → reopen →
  answers present. `beforeunload` no longer registered unconditionally, so the page is eligible for
  the back/forward cache again.
- **Risk:** Low. Note `sendBeacon` gives no completion signal — do not build UI that claims a
  confirmed save on its return value.

## FBR-05 · Phone numbers are not unique — sessions can be mis-issued

- **Files:** [src/db/schema.ts:53](src/db/schema.ts#L53) ·
  [src/lib/auth.ts:51-69, 88-95](src/lib/auth.ts#L88-L95) ·
  [src/server/api/students/index.ts:157-171](src/server/api/students/index.ts#L157-L171) ·
  [src/server/api/students/by-id.ts:98](src/server/api/students/by-id.ts#L98) ·
  [src/server/api/students/bulk-import.ts:80-90](src/server/api/students/bulk-import.ts#L80-L90) ·
  [src/lib/student-csv.ts](src/lib/student-csv.ts) · `drizzle/0007_*.sql`
- **Change, strictly in this order** (see §2.3 — a failed migration aborts app boot):
  1. **Report first.** Add `npm run report:phone-dupes` (a `tsx` script beside the existing ones in
     [scripts/](scripts/)) running the report query. **Run it against production before writing the
     migration.** If it returns rows, the constraint cannot ship until the institution resolves them
     — that is a data decision, not an implementation one (§5, item 3). Surface the list and stop.
  2. **Normalise at write time.** Store **E.164 only** in all four write paths.
     `normalizePhone` ([auth.ts:51-69](src/lib/auth.ts#L51-L69)) already produces it. The three-way
     `OR` in the login lookup then collapses to a single equality.
  3. **Backfill** existing rows to E.164 in the migration, **before** the index is created —
     normalising may itself *create* collisions (`+919876543210` and `9876543210` becoming equal).
     The report from step 1 must be re-run **post-normalisation**.
  4. **Constrain.** In `drizzle/0007_phone_unique.sql` use the **plain** form:
     ```sql
     CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_unique
       ON profiles (phone) WHERE phone IS NOT NULL;
     ```
     Put the `CONCURRENTLY` variant in `drizzle/production-only/9998_phone_unique_concurrent.sql`
     for zero-downtime application against a live Supabase instance.
  5. **Validate in all four write paths** → `409 phone_taken`, including the conflicting `fullName`
     so faculty can see who holds it. Add intra-CSV phone collision detection to
     [student-csv.ts:109-166](src/lib/student-csv.ts#L109-L166), which already does this for
     username and email. Use `isUniqueViolation` from [src/lib/http.ts](src/lib/http.ts) for the
     insert race.
  6. **Never guess on a collision.** If `loginWithPhone` matches more than one row → `409
     phone_ambiguous`, ask for the username. Removing the unordered `.limit(1)` is the core of this
     fix: a wrong guess here is an **account takeover**, and with a 90-day session TTL
     ([session.ts:5](src/lib/session.ts#L5)) it persists for three months.
- **Tests:** extend [src/lib/phone-auth.test.ts](src/lib/phone-auth.test.ts) — normalisation
  idempotence, `409 phone_ambiguous` on a two-row match, no arbitrary resolution. Extend
  [src/lib/student-csv.test.ts](src/lib/student-csv.test.ts) for intra-CSV phone duplicates.
- **Acceptance:** creating a second student with an existing phone → 409 naming the holder, via POST,
  PATCH, CSV **and** auto-provision. Login with a duplicated number (pre-constraint fixture) → 409,
  never a silent guess.
- **Risk:** **High — the only item here that can prevent the app from booting.** The step order is
  the mitigation. Do not merge steps 4 and 5 ahead of steps 1-3.

### Gate 2
`npm run verify` green · **manual phone walkthrough end to end**: login → dashboard → instructions →
runner (full viewport, timer pinned, no nav escape) → select options via palette without Save & Next
→ background the tab → reopen → submit → scorecard. Answered/Not-Answered counts must agree across
palette, pre-submit summary, and scorecard. Confirm `next build` function count ≤ 12.

---

# Wave 3 — Lifecycle + correctness (P1/P2)

## FBR-06 · Abandoned attempts graded once a day; fallback sweep unreachable

**See §2.2 — the return-type change has three extra call sites.**

- **Files:** [src/lib/sweep.ts:30-56](src/lib/sweep.ts#L30-L56) ·
  [src/server/api/cron/sweep-expired.ts](src/server/api/cron/sweep-expired.ts) ·
  [src/db/client.ts:76-99](src/db/client.ts#L76) ·
  [src/server/api/attempts/result.ts](src/server/api/attempts/result.ts) ·
  [src/server/api/tests/attempts.ts:41-63](src/server/api/tests/attempts.ts#L41-L63) ·
  [src/server/api/attempts/by-id.ts:18](src/server/api/attempts/by-id.ts#L18) ·
  [vercel.json](vercel.json) · [src/lib/cron-sweep.test.ts](src/lib/cron-sweep.test.ts)
- **Change:**
  1. **Move the tick off Vercel Cron.** Hobby permits one invocation/day, so `0 0 * * *` is a
     constraint, not a typo. Configure **cron-job.org** (already the documented dependency in
     [PRODUCTION-SETUP-GUIDE.md](PRODUCTION-SETUP-GUIDE.md)) to call
     `/api/cron/sweep-expired?key=$CRON_SECRET` every 5 minutes. The route already exists inside the
     unified router ([router.ts:127-128](src/server/api/router.ts#L127)) and already accepts
     `?key=` — **zero new serverless functions, zero code change for the trigger.** Keep the daily
     `vercel.json` entry as a backstop. **Correct the now-misleading comment at
     [sweep.ts:12-14](src/lib/sweep.ts#L12) — it claims a 5-minute cron that does not exist.**
  2. **Bound each invocation.** `sweepExpiredAttempts(db?, limit = 25)` ordered by
     `asc(deadlineAt)`, selecting `limit + 1` to detect a queue, returning
     `{ closed: number; backlog: boolean }`. Update the cron route's JSON body, both `client.ts`
     call sites, and the existing test mock. Surface `backlog` in the response so a monitor can see
     a queue forming. The current unbounded serial loop will hit `FUNCTION_INVOCATION_TIMEOUT`
     part-way through a 100-candidate test inside `maxDuration = 60`
     ([route.ts:16](src/app/api/[[...slug]]/route.ts#L16)), and `.catch(() => {})` at the call site
     makes that invisible.
  3. **Self-heal on paths students actually use.** Add a **targeted single-attempt** sweep — not the
     global one — to `attempts/result.ts` and to `tests/attempts.ts` before the max-attempts check.
     The existing opportunistic sweep on `GET /api/attempts/:id`
     ([by-id.ts:18](src/server/api/attempts/by-id.ts#L18)) has **zero client callers** and never
     fires; leave it or remove it, but do not rely on it.
  4. **Fix the lockout message.** Count only `submitted`/`auto_submitted` toward `maxAttempts`,
     mirroring `StudentDashboardView.tsx:47-49`, which already computes `completedCount` correctly.
     Today the API tells a student who completed nothing that they "already completed all 1 allowed
     attempt(s)".
- **Migration:** none.
- **Tests:** extend [src/lib/cron-sweep.test.ts](src/lib/cron-sweep.test.ts) (new return shape, mock
  update) and [src/lib/attempt-lifecycle.test.ts](src/lib/attempt-lifecycle.test.ts): 30 expired
  attempts + `limit = 25` → `{ closed: 25, backlog: true }`; stale `in_progress` attempt → result
  page grades and returns a scorecard instead of `400 attempt_in_progress`; stale attempt →
  instructions page does **not** return `max_attempts_exceeded`.
- **Acceptance:** abandon an attempt past deadline → hit the result page → graded immediately. Cron
  hit manually returns `{ closed, backlog }`.
- **Risk:** Medium. The external cron is **infrastructure the implementer cannot configure** — it
  needs an account and `CRON_SECRET` (§5, item 4). Ship the code, then **hand the user explicit setup
  instructions**; until that is done, sweeps remain daily and step 3 is the only live mitigation.
  Say so in the PR rather than marking FBR-06 closed.

## FBR-10 · Attempt deadlines ignore the test's closing time

- **Files:** [src/server/api/tests/attempts.ts:100](src/server/api/tests/attempts.ts#L100) ·
  [TestInstructionClient.tsx](src/app/student/tests/[id]/TestInstructionClient.tsx)
- **Change:** `deadlineAt = new Date(Math.min(now + durationS*1000, closesAt ?? Infinity))`. Refuse a
  start leaving `< 60s` with `403 insufficient_time_remaining`. Surface the truncation on the
  instructions page **before** the student commits: *"This test closes at 6:00 PM. You have 10
  minutes remaining, not the full 180."*
- **Migration:** none.
- **Tests:** `attempt-lifecycle` — start 10 min before `closesAt` on a 180-min paper → deadline
  equals `closesAt`; `< 60s` remaining → 403; `closesAt = null` → full duration.
- **Acceptance:** as above; dashboard no longer shows "Closed" while a timer runs
  ([StudentDashboardView.tsx:51](src/app/student/views/StudentDashboardView.tsx#L51)).
- **Risk:** Low. Genuinely reduces some students' exam time — that is the correct enforcement of an
  advertised window, but the instructions-page warning is **not optional**. Do not ship the clamp
  without it.

## FBR-09 · Bulk question deletion orphans media in `stored_files`

- **Files:** [src/server/api/questions/bulk.ts:106-108](src/server/api/questions/bulk.ts#L106-L108) ·
  [src/lib/storage.ts:157-169](src/lib/storage.ts#L157-L169) · new `scripts/gc-orphans.ts`
- **Change:**
  1. After the bulk `db.delete`, add
     `await Promise.allSettled(deletable.map((id) => deleteQuestionImageDir(id)))`.
     **`allSettled`, not `all`** — one failed blob delete must not abort the rest or surface as a 500
     after the rows are already gone.
  2. **Orphans from every prior bulk delete are already in the database.** Ship the reaper
     (`npm run gc:orphans`) using the report's `DELETE … WHERE NOT EXISTS` query, plus a one-line
     orphan count on the teacher dashboard.
- **Migration:** none (the reaper is a script, not a migration — a destructive `DELETE` must be run
  deliberately, never on boot).
- **Tests:** extend [src/lib/storage.test.ts](src/lib/storage.test.ts) — bulk-delete N questions with
  images → zero `stored_files` rows keyed to them; one failing delete does not prevent the others.
- **Acceptance:** `npm run gc:orphans` reports and removes a seeded orphan; count reaches 0.
- **Risk:** Medium **for the reaper only** — it deletes binaries irrecoverably. Give it a
  `--dry-run` that prints counts and keys, and make dry-run the **default**, requiring `--force` to
  delete. Compounded by FBR-25's base64 overhead (+33%), this is the fastest route to the hard
  500 MB write failure, so the reaper matters — but not enough to risk deleting live diagrams.

## FBR-17 · `unresolvedImages` filter misses option diagrams and partial crops

- **Files:** [src/server/api/questions/index.ts:58-62](src/server/api/questions/index.ts#L58-L62) ·
  [src/db/schema.ts](src/db/schema.ts) · question write paths · `drizzle/0009_*.sql`
- **Migration `drizzle/0009_image_token_count.sql`:**
  ```sql
  ALTER TABLE questions ADD COLUMN IF NOT EXISTS image_token_count integer NOT NULL DEFAULT 0;
  ```
  Plus a **backfill** — a `DEFAULT 0` on existing rows makes the filter report "0 unresolved"
  for the entire back catalogue, which is the same wrong answer in a new place. Backfill by counting
  `[[IMG:` tokens in `body` and `options` in SQL, then let the write paths maintain it via
  `extractAllImageTokens(body, options)`.
- **Change:** replace the `NOT EXISTS` predicate with
  `image_token_count > (SELECT count(*) FROM question_images qi WHERE qi.question_id = …)`.
  This makes partially-cropped questions appear (the current all-or-nothing `NOT EXISTS` excludes
  them) and covers `options`, where JEE circuit and graph choices live.
- **Tests:** a question with 2 tokens in `options` and 1 image → appears in the filter. Assert the
  filter's set matches `extractAllImageTokens`-based verify
  ([bulk.ts:166-178](src/server/api/questions/bulk.ts#L166-L178)) for a mixed fixture — the two
  subsystems currently answer the same question differently, which is the actual defect.
- **Acceptance:** the filter and bulk-verify agree; no more "0 unresolved" followed by
  `Unresolved image figures: …` on the same rows.
- **Risk:** Low. Students are **not** exposed — the publish gate
  ([publish.ts:32-49](src/server/api/tests/publish.ts#L32-L49)) already blocks unverified questions.
  This is faculty-workflow correctness, correctly re-rated P1 → P2.

## FBR-18 · Test cloning is not transactional

- **Files:** [src/server/api/tests/clone.ts:29-58](src/server/api/tests/clone.ts#L29-L58)
- **Change:** wrap both inserts in one `db.transaction`. The pattern is already used correctly at
  [tests/attempts.ts:113](src/server/api/tests/attempts.ts#L113) and
  [lib/attempts.ts:125](src/lib/attempts.ts#L125) — follow it.
- **Migration:** none. Ghost `"<Title> (Copy)"` drafts from past failures already exist and cannot be
  published (`publish_gate_failed`) or deleted (no affordance). **Add a delete affordance for
  zero-question draft clones, or at minimum report the count** — otherwise the fix stops new ghosts
  while leaving the existing ones stuck forever.
- **Tests:** force the `testQuestions` insert to fail → assert **no** `tests` row remains.
- **Acceptance:** a failed clone leaves nothing behind.
- **Risk:** Low.

## FBR-22 · Analytics count `response IS NOT NULL` as attempted; the grader does not

- **Files:** [analytics/cohort.ts:39, 43](src/server/api/analytics/cohort.ts#L39) ·
  [analytics/test-by-id.ts:162, 238-239](src/server/api/analytics/test-by-id.ts#L162) ·
  [analytics/test-export-questions.ts:92-93](src/server/api/analytics/test-export-questions.ts#L92-L93) ·
  [src/lib/grading.ts:35-48](src/lib/grading.ts#L35-L48) · `drizzle/0010_*.sql`
- **Migration `drizzle/0010_is_gradeable_fn.sql`:** the report's `is_gradeable(qtype, jsonb)`
  `IMMUTABLE` SQL function. **Verify PGlite supports it** — local dev runs the same migrations, and a
  function the WASM build rejects will abort boot for every developer. If unsupported, fall back to a
  single shared SQL fragment in TypeScript, imported by all five sites. One definition is the goal;
  a DB function is just the cleanest way to get it.
- **Change:** replace all **five** `aa.response IS NOT NULL` sites with `is_gradeable(q.type, aa.response)`.
  `isGradeableResponse`'s own doc comment records that these two notions diverged once before — the
  client paths were fixed, the analytics SQL was not.
- **Tests:** grade a fixture attempt containing a non-null-but-ungradeable response
  (`{value: "abc"}`, which `normalizeResponse` preserves) and assert analytics `times_attempted`
  equals the grader's `isAttempted` count. Extend
  [src/lib/analytics-metrics.test.ts](src/lib/analytics-metrics.test.ts).
- **Acceptance:** scorecard and teacher CSV export report identical attempt counts.
- **Risk:** Low-medium. **Historical analytics numbers will shift** — difficulty indices currently
  understate. That is a correction, not a regression, but it will be noticed: say so in the PR.

### Gate 3
`npm run verify` green · lifecycle and analytics tests pass · stale-attempt recovery verified by hand
· `gc:orphans --dry-run` output reviewed before any `--force` run.

---

# Wave 4 — Platform hardening (P2)

## FBR-13 · Ephemeral `SESSION_SECRET` logs students out mid-exam

- **Files:** [src/lib/session.ts:31-48](src/lib/session.ts#L31-L48) ·
  [scripts/check-tokens.mjs](scripts/check-tokens.mjs) · `.env.production.example`
- **Change:** in `getKey()`, throw at module load when
  `NODE_ENV === 'production' && (!fromEnv || fromEnv.length < 32)`. A misconfigured deploy must break
  at **boot**, not mid-exam. Keep the zero-config random fallback for local dev — it is right there
  and harmful only in production. Add the same check to `check-tokens.mjs` (already wired into
  `prebuild`, so CI catches it) and mark the var **required** in `.env.production.example`.
- **Tests:** unit-test the guard with `NODE_ENV=production` and a short/absent secret.
- **Acceptance:** `SESSION_SECRET` unset + production build → immediate, explicit boot failure.
- **Risk:** **Medium — can break a currently-"working" deploy at boot.** That is the intent, but
  **confirm `SESSION_SECRET` is set in Vercel before merging.** Today's symptom is students seeing
  *"Signed out — your answers are saved on this device"* mid-exam without having signed out.

## FBR-14 · In-memory mutex and rate limiter give no cross-container guarantee

- **Files:** [src/lib/rate-limit.ts:17](src/lib/rate-limit.ts#L17) ·
  [src/server/api/auth/login.ts:36-38](src/server/api/auth/login.ts#L36) · `drizzle/0008_*.sql`
- **Migration `drizzle/0008_rate_limits.sql`:** the report's `rate_limits` table.
- **Change:** Postgres-backed limiter via the single atomic `INSERT … ON CONFLICT DO UPDATE`
  round-trip. **Keep the in-memory limiter as a free first-tier filter** and consult Postgres only on
  the auth path. **Do not add Upstash** — the report is right that it means a new vendor, two more
  secrets and a network hop on login to replace something Supabase already does.
- **Scope note:** fix **only** the rate-limit half. The report's correction to BUG-09 is sound —
  `withDbLock` guards a single in-process PGlite instance, and the critical sections are already
  idempotent (`gradeAndCloseAttempt` short-circuits on `totalMarks !== null`; counters use
  `greatest()`; attempt-number allocation re-reads `max(attempt_no)` inside a transaction backstopped
  by `UNIQUE (test_id, student_id, attempt_no)`). Worst case is duplicated work, not corrupted marks.
  Where genuine cross-container serialisation is ever needed, use `pg_advisory_xact_lock(hashtext($1))`.
- **Tests:** window expiry, count increment, and the FBR-03 per-IP provisioning cap now holding
  across simulated containers (two limiter instances, one table).
- **Acceptance:** the login cap holds when the in-memory map is cleared between calls.
- **Risk:** Low-medium — adds a DB round-trip to login. Acceptable: it **completes FBR-03**, whose
  per-IP provisioning cap is unenforceable until this lands.
- **Depends on:** FBR-03 (Wave 1).

## FBR-21 · Every API call costs a DB round-trip for authentication

- **Files:** [src/lib/auth.ts:246-272](src/lib/auth.ts#L246-L272) ·
  [src/server/api/attempts/answers.ts](src/server/api/attempts/answers.ts) ·
  [src/server/api/attempts/events.ts](src/server/api/attempts/events.ts) ·
  [src/lib/session.ts:5](src/lib/session.ts#L5)
- **Change:** tier the guard by what the endpoint risks.
  1. Add `apiSessionFast()` — JWT verify only, **zero DB** — for high-frequency, low-risk,
     self-scoped writes: `/answers` and `/events`. Both already re-verify ownership against
     `attempt.studentId !== session.userId`
     ([answers.ts:38](src/server/api/attempts/answers.ts#L38),
     [events.ts:38](src/server/api/attempts/events.ts#L38)), so a JWT suffices — a deactivated
     student can at worst keep writing to their own in-progress attempt for the remaining token life.
  2. **Keep full DB-backed `apiSession()`** on login, teacher mutations, result disclosure, and
     anything cross-user. The revocation check is correct and deliberate; only its ubiquity is the
     problem.
  3. Shorten the 90-day TTL with refresh-on-use, bounding the JWT-only revocation window.
- **Migration:** none.
- **Tests:** `apiSessionFast` issues no queries (spy the db handle); `/answers` and `/events` still
  reject cross-student attempt IDs.
- **Acceptance:** query count during a simulated 15 s heartbeat cycle drops by one per request. At
  720 heartbeats × 100 candidates, this is the difference between ~4,800 auth queries/minute and
  near-zero against a free-tier pooler.
- **Risk:** **Medium — it is a deliberate, bounded weakening of revocation** on two endpoints. Both
  mitigations (ownership re-check, shorter TTL) must land **in the same commit**. If the TTL
  reduction is deferred (§5, item 7), defer this item too — do not ship half of it.
- **Depends on:** FBR-03 (session shape gains `isProvisional`).

## FBR-20 · Question diagrams served `no-cache`, revalidating on every view

- **Files:** [src/server/api/files/image.ts:43, 53](src/server/api/files/image.ts#L43)
- **Change:** `'Cache-Control': 'private, max-age=31536000, immutable'`. The bytes are immutable for
  the life of a `(questionId, placeholderId)` pair — the key derives from both
  ([paths.ts:52-54](src/lib/paths.ts#L52)) and a re-crop writes a new `storagePath`. The ETag
  machinery already exists (lines 39-49); `private` keeps it out of shared caches so the entitlement
  check still gates first access.
- **If instant re-crop invalidation is required,** put the content hash in the URL
  (`?v=<sha256>`) and keep `immutable`. **Decide this before implementing** (§5, item 6) — teachers
  re-cropping a diagram and seeing the old one for a year is a worse bug than the one being fixed.
  Default to the hashed URL if unsure.
- **Migration:** none.
- **Tests:** assert the header value; assert the URL carries `v=` if the hashed-URL path is chosen.
- **Acceptance:** second view of a diagram issues **no** network request. Re-crop shows new bytes
  immediately.
- **Risk:** Medium **only** through the invalidation question above; otherwise low. Each current
  revalidation costs four queries to answer *"still 304?"*, and on patchy 4G a stalled one is a blank
  box where a circuit diagram should be, mid-exam.

## FBR-19 · Login page fires a full analytics aggregation to ask "am I signed in?"

- **Files:** [src/app/login/LoginForm.tsx:47-53](src/app/login/LoginForm.tsx#L47) ·
  [src/server/api/router.ts](src/server/api/router.ts) · new `src/server/api/auth/me.ts`
- **Change:** add `GET /api/auth/me` using `getSession()` **only** — JWT verify, zero DB queries
  (deliberately not `apiSession()`, per FBR-21). Wire it with one `if` in the `len === 2` block of
  `router.ts` and add it to the route table at [router.ts:261](src/server/api/router.ts#L261).
  **No new serverless function** — the unified router already handles dispatch, which matters under
  the 12-function cap. Point `LoginForm` at it.
- **Tests:** extend [src/lib/api-routes.test.ts](src/lib/api-routes.test.ts) — the route resolves,
  `GET` only, and returns `{authenticated:false}` without a cookie.
- **Acceptance:** `/login` no longer triggers the 160-line aggregation in
  [analytics/student-me.ts](src/server/api/analytics/student-me.ts). This is on the Board Readiness
  Challenge funnel's critical path from a phone on 4G.
- **Risk:** Low.

## FBR-16 · `attempt_events` is write-only, undisclosed, and half-unused

- **Files:** [src/server/api/attempts/events.ts:16-24, 67-71](src/server/api/attempts/events.ts#L16-L24) ·
  [src/server/api/router.ts:186](src/server/api/router.ts#L186) ·
  [TestRunnerClient.tsx:344-372](src/app/student/attempts/[id]/TestRunnerClient.tsx#L344-L372) ·
  [TestInstructionClient.tsx:130-280](src/app/student/tests/[id]/TestInstructionClient.tsx#L130-L280)
- **Change — bug-fix scope only:**
  1. Add a **teacher-only `GET`** to `events.ts`. The module exports `POST` only, so
     `router.ts:186` can never serve a `GET` and `dispatchApiRequest` answers `405` — every
     `tab_hidden` row ever written is unreadable through the product. **Zero new serverless
     functions**; the router already dispatches the path.
  2. Emit the five declared-but-unemitted types: `fullscreen_enter`/`fullscreen_exit` (only where a
     real user-gesture fullscreen change occurs — **do not** reintroduce FBR-04's barrier),
     `offline`/`online` (handlers already exist at lines 344-351 and log nothing), and
     `paste_blocked` (needs a paste handler).
  3. **Add the disclosure section to the instructions page.** Its five sections — Timer, Palette,
     Marking Scheme, Navigating, Connection — do not mention that focus changes are recorded.
     Collecting behavioural telemetry from **minors** without disclosure is the wrong default on
     consent grounds, and telemetry nobody was warned about cannot fairly be acted on.
  4. When surfacing counts to teachers, **classify by duration, not raw count.** On a phone,
     `visibilitychange → hidden` fires for an incoming call, a notification pull-down, a screen lock
     or any app switch — raw counts will flag honest students.
- **Out of scope:** the proctoring UI and scoring model (`FinalEnhancements.md` §3).
- **Tests:** `GET` requires a teacher session; a student session gets 403. Extend
  [src/lib/api-routes.test.ts](src/lib/api-routes.test.ts) for the new verb.
- **Acceptance:** a teacher can read events for an attempt; a student cannot; the instructions page
  discloses the collection.
- **Risk:** Low technically. **The disclosure is the non-negotiable part** — if item 3 is cut, cut
  item 2 with it. Do not expand collection without disclosing it.

## FBR-15 · Vercel's 4.5 MB request cap silently drops large PDF uploads

- **Files:** [src/server/api/papers/index.ts:18](src/server/api/papers/index.ts#L18) ·
  `PapersView.tsx`
- **Change:** make the limit honest — `MAX_UPLOAD_BYTES = Number(process.env.MAX_UPLOAD_BYTES ?? 4 * 1024 * 1024)`
  (down from a fictional 60 MB) — and check **client-side before the fetch**, with the actual file
  size in the message. The gateway rejects at 4.5 MB before Next.js is reached, so the server guard,
  the `application/pdf` sniff and the SHA-256 de-dup never run, and a gateway 413 carries no JSON
  body for `PapersView` to read.
- **Out of scope:** pre-signed direct-to-Supabase-Storage upload (`FinalEnhancements.md` §6.1) is the
  proper fix. **Ship the honest limit now regardless** — the current state makes a hard platform
  limit look like an intermittent network fault.
- **Tests:** the server constant reads from env with the 4 MB default.
- **Acceptance:** a 10 MB PDF → immediate, specific client-side message naming the size and the
  limit; no dead request.
- **Risk:** Low. It **reduces** advertised capability to match reality. Teachers who were uploading
  large PDFs were already failing — now they will be told why.

## FBR-11 · Option shuffling reorders options but keeps original letters

- **Files:** [src/lib/dto.ts:36-49](src/lib/dto.ts#L36-L49) ·
  [src/server/api/tests/attempts.ts:86-94](src/server/api/tests/attempts.ts#L86-L94) ·
  [TestRunnerClient.tsx:884](src/app/student/attempts/[id]/TestRunnerClient.tsx#L884)
- **Change — pick one, and prefer the second** (§5, item 5):
  - **(a)** Relabel in `toStudentQuestion`: displayed `key = A..D` in sequence, original preserved as
    `originalKey`, which the client submits. Grading already compares original keys
    ([grading.ts:96-104](src/lib/grading.ts#L96-L104)), so this must thread `originalKey` through
    the runner and the answers payload.
  - **(b) Recommended: shuffle question order only; leave `shuffleOptions` off.** Question shuffling
    already defeats answer-sharing, and (b) is a config change rather than a change to the response
    contract mid-remediation. Option (a) touches the submit payload — the one path where a mistake
    silently costs marks.
- **Migration:** none.
- **Tests:** if (a): a `dto` test asserting displayed keys are always `A..D` in sequence **and** a
  grading test proving `originalKey` round-trips correctly. If (b): assert `shuffleOptions` is off by
  default.
- **Acceptance:** no student ever sees `(C) (A) (D) (B)`.
- **Risk:** (a) **medium** — it changes the answer submission contract. (b) low.
  **Costs no marks today** — `optionOrders` is presentation-only and the grader is correct. It is
  ranked last in this wave for that reason. If the wave runs long, **this is the item to defer.**

### Gate 4
Full `npm run verify` · `npm run lint` at or below the Wave 0 baseline · `next build` function count
**≤ 12** · deploy to a preview and smoke-test: login → dashboard → exam → submit → scorecard, on a
real phone.

---

## 4. Cross-cutting requirements

1. **Function count.** Run `next build` at every gate and check the function count. Commit `a5addb3`
   consolidated routes specifically to fit under 12. Nothing in this plan should add one — every new
   endpoint (`/api/auth/me`, `GET /api/attempts/:id/events`) goes through the existing unified
   router. **Verify, do not assume.**
2. **Migrations are re-runnable and boot-critical.** A failing migration aborts app boot
   ([client.ts:167](src/db/client.ts#L167)). `IF NOT EXISTS` everywhere; no `CONCURRENTLY` in
   `drizzle/`; test each migration against a fresh PGlite **and** a migrated copy.
3. **Every schema change is two edits** — the SQL file **and** [src/db/schema.ts](src/db/schema.ts).
4. **Session shape changes are backward-compatible.** Live cookies predate `isProvisional`; treat
   missing fields as safe defaults so no student is signed out mid-exam.
5. **Test conventions.** Tests live in `src/**/*.test.ts` and run under `vitest`. Follow the existing
   file naming. Prefer extending the 15 existing files over adding near-duplicates.
6. **Report honestly.** If an item is blocked on infrastructure (FBR-06's external cron) or on a data
   decision (FBR-05's duplicate phones, FBR-03's existing auto-provisioned accounts), say so in the
   PR and **leave the finding open**. Do not mark a finding closed because the code landed.

---

## 5. Items that need a decision from the user before implementation

These are not implementation details; each changes what students or faculty experience. Raise them
**before** starting the relevant wave, not after.

| # | Item | Decision needed |
|---|---|---|
| 1 | **FBR-03** | Existing auto-provisioned accounts (`username LIKE 'student_%'`) stay non-provisional after migration. Backfill them to provisional, or grandfather them in? Backfilling may cut off real students who entered through the funnel. |
| 2 | **FBR-03** | Which tests become `audience = 'public'`? The plan assumes the Board Challenge diagnostic only. |
| 3 | **FBR-05** | If the duplicate-phone report returns rows, who resolves them, and how? The unique index cannot ship until they are resolved. |
| 4 | **FBR-06** | External cron (cron-job.org) needs an account and `CRON_SECRET`. Who sets it up? Until then, sweeps stay daily. |
| 5 | **FBR-11** | Option (a) relabel, or option (b) disable `shuffleOptions`? Plan recommends (b). |
| 6 | **FBR-20** | Must a re-cropped diagram invalidate instantly? If yes, hashed URLs; if no, plain `immutable`. |
| 7 | **FBR-21** | Acceptable session TTL after shortening from 90 days? This bounds the JWT-only revocation window. |
| 8 | **FBR-04** | Student-facing copy claiming fullscreen is "enforced for academic integrity" is false. Who rewrites it? |

---

## 6. Explicitly out of scope

- **P3 findings FBR-23 … FBR-30.** Separate plan. FBR-27 (lint warnings) is incidentally resolved by
  the Wave 0 baseline and the FBR-04 lint rule.
- **Everything in [FinalEnhancements.md](FinalEnhancements.md)** — notably §3 (the replacement
  integrity/proctoring model), §4 (full mobile-first exam layout) and §6.1 (pre-signed uploads).
  FBR-04, FBR-08, FBR-15 and FBR-16 deliberately stop at the bug-fix boundary and leave hooks for
  that work.
- **`withDbLock` / distributed locking.** Per FBR-14's own correction, the realistic worst case is
  duplicated work, not corrupted marks.
- **Mode 1 of the standalone ingest path** ([ingest.ts:87-118](src/server/api/questions/ingest.ts#L87-L118)),
  the upstream cause of FBR-02. FBR-02 makes the *symptom* impossible by refusing ambiguous writes;
  redesigning standalone-question identity is a larger change.
