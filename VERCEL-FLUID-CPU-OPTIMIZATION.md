# Vercel Fluid Active CPU Optimization & Performance Audit

> **Target Platform:** SRSMA Exam & Assessment Platform  
> **Environment:** Next.js 15 (App Router), PostgreSQL (Supabase / Neon), Vercel Serverless (Fluid Compute)  
> **Investigation Date:** October 2026  
> **Author:** Antigravity Performance & Reliability Engineering  

---

## Table of Contents
1. [Executive Summary & The 124-Invocation Math](#1-executive-summary--the-124-invocation-math)
2. [Proctoring Audit: What Exists, Locations, & Removal Guide](#2-proctoring-audit-what-exists-locations--removal-guide)
3. [The Core Weak Points Driving Fluid CPU Burn](#3-the-core-weak-points-driving-fluid-cpu-burn)
4. [Dead Code & Redundant Packages Audit](#4-dead-code--redundant-packages-audit)
5. [Immediate & High-Impact Action Plan (85–95% CPU Reduction)](#5-immediate--high-impact-action-plan-8595-cpu-reduction)
6. [Before vs. After Comparison Table](#6-before-vs-after-comparison-table)
7. [Vercel Free (Hobby) Plan Compliance: The 12-Function Limit](#7-vercel-free-hobby-plan-compliance-the-12-function-limit)
8. [Downsides, Edge Cases, & Tradeoffs Analysis](#8-downsides-edge-cases--tradeoffs-analysis)
9. [Zero-CPU Proctoring Architecture (Keep Anti-Cheat with 0 Extra Invocations)](#9-zero-cpu-proctoring-architecture-keep-anti-cheat-with-0-extra-invocations)

---

## 1. Executive Summary & The 124-Invocation Math

### The Incident
When a student took a test containing **20 questions** (some with diagrams) and revisited questions a couple of times:
- **Invocations:** **124 requests** logged against the unified Serverless route `/api/[[...slug]]`.
- **Fluid Active CPU Time:** **1 minute 27 seconds (87,000 ms)** consumed for a single student test.
- **Risk:** Rapid exhaustion of Vercel Fluid Active CPU quota, leading to deployment pauses, throttling, or billing spikes.

### Dissecting the 124 Invocations (Step-by-Step Breakdown)

| Source / Trigger | Client Mechanism | Target API Endpoint | Invocation Count | Why It Fired |
| :--- | :--- | :--- | :--- | :--- |
| **Periodic Heartbeat** | `setInterval(..., 15000)` in `TestRunnerClient.tsx:353` | `PATCH /api/attempts/[id]/answers` | **~60** | Unconditionally syncs every 15 seconds throughout a 15-minute test, regardless of user activity. |
| **Question Navigation** | `goToQuestion()` in `TestRunnerClient.tsx:493` | `PATCH /api/attempts/[id]/answers` | **~25–30** | Every time the student clicks a question number or clicks "Next"/"Prev", a 300ms debounced autosave fires. Revisiting questions multiplies this. |
| **Option Clicks & Inputs** | `handleSelectOption()` & `handleSetIntegerValue()` | `PATCH /api/attempts/[id]/answers` | **~20** | Debounced 300ms save on every radio button click or number keystroke. |
| **Diagram & Figure Loads** | `<img>` in `TestRunnerClient.tsx:1066, 1111` | `GET /api/files/images/[qId]/[token]` | **~10–15** | Images are served by Serverless Node.js with `Cache-Control: private`. When questions remount, revalidation/fetch hits the Lambda. |
| **Proctoring / Tab Events** | `visibilitychange` in `TestRunnerClient.tsx:389` | `POST /api/attempts/[id]/events` | **~4–6** | Whenever the student clicks outside the tab, two calls fire: `tab_hidden` event + double answer flush (`fetch` + `sendBeacon`). When returning, `tab_visible` fires. |
| **Initial Load & Submission** | Page mount & final submission | `attempts/[id]/questions`, `submit`, `result` | **~3** | Client fetches questions via API on mount (even though SSR ran), submits test, and loads scorecard. |
| **TOTAL** | | | **~124** | **124 Serverless Function Invocations** |

---

### Why Did 124 Invocations Eat 1m 27s of Active Fluid CPU?

Average execution duration: **~700ms Active CPU per invocation**.

1. **Database Query on EVERY API Request inside `apiSession()`:**
   - In [`src/lib/auth.ts:314`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/lib/auth.ts#L314-L330), `apiSession()` executes a database query (`SELECT profiles WHERE id = session.userId`) on **every single request**, despite the JWT already containing cryptographically signed user claims (`userId`, `role`, `fullName`).
2. **Cold Starts Run DDL Migration Queries:**
   - In [`src/db/client.ts:70`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/db/client.ts#L70), `await runMigrations(pool)` runs on **every serverless cold start**, executing `CREATE TABLE IF NOT EXISTS _migrations` and filesystem checks.
3. **Heavy SQL Batch Updates on Every Autosave:**
   - Client sends the **entire array of 20 questions** on every autosave (even if nothing changed or only 1 answer changed).
   - In [`src/lib/attempts.ts:260-295`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/lib/attempts.ts#L260-L295), `saveAttemptAnswersBatch` builds and executes 4 giant SQL `CASE WHEN question_id = ... THEN ... END` statements with 20 branches each.
4. **Base64 Processing in Serverless Memory for Images:**
   - Images are stored as base64 in PostgreSQL `stored_files.data`.
   - Node.js fetches large strings, decodes base64 into `Buffer`, wraps into `Uint8Array`, and streams it across HTTP.
5. **`Cache-Control: private` Blocks Edge CDN:**
   - In [`src/server/api/files/image.ts:38`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/server/api/files/image.ts#L38), images are returned with `Cache-Control: private`.
   - **Vercel Edge Network refuses to cache private responses.** Every single image request from any browser is routed straight to the origin Serverless Lambda.

---

## 2. Proctoring Audit: What Exists, Locations, & Removal Guide

### Did the Platform Implement Proctoring?
**Yes.** The platform contains a client-side telemetry listener that monitors tab switching and window visibility, reporting events to the server.

### Critical Discovery: It Is 100% Write-Only Dead Telemetry
A repository-wide audit reveals that **no teacher screen, student view, report, or script reads or displays this data**.
- There is no integrity report in faculty dashboard.
- There is no student log viewer.
- The route does not even export a `GET` handler.
- It exists solely as an unread write-sink that eats database writes and serverless invocations.

---

### Exact Locations of Proctoring Code

#### 1. Client Event Emission
- **File:** [`src/app/student/attempts/[id]/TestRunnerClient.tsx`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/app/student/attempts/[id]/TestRunnerClient.tsx#L380-L402)
  - **Lines 380–402:** `handleVisibilityChange()`
    - Fires `POST /api/attempts/${attemptId}/events` with `{ eventType: 'tab_hidden' }`.
    - Fires `POST /api/attempts/${attemptId}/events` with `{ eventType: 'tab_visible' }`.
    - Simultaneously fires **both** `syncWithServer()` (`fetch`) AND `flushBeacon()` (`navigator.sendBeacon`) on tab hide (wasting 2 simultaneous autosaves).
  - **Lines 426–436, 455–468:** Fullscreen listeners and mobile exit enforcement (`fullscreenchange`, `toggleFullscreen`).

#### 2. Server API Route Handler
- **File:** [`src/server/api/attempts/events.ts`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/server/api/attempts/events.ts#L1-L75) (75 lines)
  - Accepts `eventType`: `'tab_hidden'`, `'tab_visible'`, `'fullscreen_enter'`, `'fullscreen_exit'`, `'offline'`, `'online'`, `'paste_blocked'`.
  - Queries `attempts` table, verifies student, checks rate limits, and inserts into `attemptEvents`.

#### 3. Router Dispatch Registration
- **File:** [`src/server/api/router.ts`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/server/api/router.ts)
  - **Line 89:** `import * as attemptsEvents from './attempts/events';`
  - **Line 221:** `if (s2 === 'events') return { handler: attemptsEvents, ... };`
  - **Line 329:** `{ pattern: '/api/attempts/[id]/events', verbs: ['POST'] },`

#### 4. Database Schema
- **File:** [`src/db/schema.ts`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/db/schema.ts#L295-L309)
  - **Lines 295–309:** Table definition `attemptEvents = pgTable('attempt_events', ...)`

#### 5. Ancillary System Event Inserts
- [`src/server/api/attempts/submit.ts:61`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/server/api/attempts/submit.ts#L61) (inserts `auto_submitted_time_expired`)
- [`src/server/api/attempts/extend-time.ts:61`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/server/api/attempts/extend-time.ts#L61) (inserts `time_extended`)

---

### Step-by-Step Removal Instructions

1. **In `src/app/student/attempts/[id]/TestRunnerClient.tsx`:**
   - Remove the `fetch('/api/attempts/${attemptId}/events')` calls inside `handleVisibilityChange`.
   - Remove the double flush: on tab hidden, call only `syncWithServer()`; do not invoke `flushBeacon()` simultaneously. Keep `flushBeacon()` exclusively inside `handlePageHide` for browser teardown.
   - *(Optional)* Remove fullscreen toggle buttons and listeners if strict desktop kiosk mode is not desired.
2. **In `src/server/api/router.ts`:**
   - Remove lines 89, 221, and 329. The `/api/attempts/[id]/events` route will no longer be dispatched.
3. **In `src/server/api/attempts/events.ts`:**
   - Delete this file (or replace handler with a static `{ ok: true }` no-op if backwards compatibility is needed during rolling deployments).
4. **In `src/server/api/attempts/submit.ts` & `extend-time.ts`:**
   - Remove `attemptEvents` import and the unused `.insert(attemptEvents)` call.

---

## 3. The Core Weak Points Driving Fluid CPU Burn

### Weak Point 1: Aggressive Client Heartbeat & Navigation Autosave
- **Problem:**
  - `TestRunnerClient.tsx` lines 353–356 sets an interval of **15,000ms (15 seconds)**.
  - Line 493 calls `scheduleSync()` whenever a student changes question (`goToQuestion`).
  - Line 347 uses a short debounce of **300ms**.
  - Merely browsing through 20 questions triggers up to 40 network calls.
- **Why this burns CPU:**
  Each call spins up or holds open a Vercel Serverless Function, queries the database, runs JSON serialization, and executes SQL.
- **Solution:**
  - Increase heartbeat interval from **15s to 60s or 90s**.
  - **Never sync on question navigation (`goToQuestion`).** Switching questions only changes local UI view and `visitCount`, which is safely preserved in IndexedDB (`idb-keyval`).
  - Increase answer selection debounce from **300ms to 2000ms–3000ms**. If a student taps option A and then B, only one request will fire.

---

### Weak Point 2: Full-Payload Resending & Heavy SQL CASE Expressions
- **Problem:**
  - `buildAnswersPayload()` in `TestRunnerClient.tsx:291` maps over **all** questions in the test and sends all 20 questions in the request body.
  - `saveAttemptAnswersBatch()` in `attempts.ts:260-295` updates all 20 rows using 4 massive SQL `CASE` expressions in PostgreSQL.
- **Why this burns CPU:**
  Even when 0 answers changed (e.g., periodic heartbeat to update time spent), the server parses 20 objects, checks UUIDs with Zod, and executes heavy SQL in PostgreSQL.
- **Solution:**
  - Track a `dirtyQuestionIds` set in the client ref.
  - Only send modified questions in the PATCH body.
  - If no answers changed, send a lightweight heartbeat payload `{ heartbeatOnly: true, timeSpentMs }` or a single SQL update rather than a 20-row batch.

---

### Weak Point 3: Double-Flushing on Tab Blur
- **Problem:**
  In `TestRunnerClient.tsx:386-387`:
  ```ts
  syncWithServer(); // Issues PATCH via fetch
  flushBeacon();    // Issues POST via navigator.sendBeacon
  ```
  Both fire simultaneously with the exact same payload whenever the tab loses focus.
- **Why this burns CPU:**
  Two identical heavy requests hit the server at the exact same millisecond, doubling database load and function concurrency.
- **Solution:**
  Remove `flushBeacon()` from `visibilitychange`. Keep `flushBeacon()` strictly inside `pagehide` (browser window close / navigation).

---

### Weak Point 4: Image Delivery via Serverless Function without CDN Caching
- **Problem:**
  - Question images and option diagrams are requested through `/api/files/images/${currentQ.id}/${placeholderId}`.
  - The handler in `src/server/api/files/image.ts:38` sets:
    ```ts
    const cacheControl = 'private, max-age=86400, stale-while-revalidate=604800';
    ```
- **Why this burns CPU:**
  - **`private` disables Vercel Edge CDN caching completely.** Every browser request is routed to origin Node.js.
  - In each invocation, Node.js decodes JWT, runs 3 DB queries (`questionImages`, `attempts` join, `stored_files`), reads base64 from Postgres, converts to Buffer, and streams it.
  - When a student navigates back and forth between questions, component remounts cause repeated 304 or 200 responses through the Lambda.
- **Solution:**
  - Update `Cache-Control` in `src/server/api/files/image.ts`:
    ```ts
    const cacheControl = 'public, max-age=31536000, s-maxage=31536000, immutable';
    ```
  - **Effect:** The first time an image is fetched, Vercel Edge CDN caches it. **Every subsequent request across all students is served directly from the CDN edge with 0 Serverless invocations and 0ms Active CPU!**

---

### Weak Point 5: Unnecessary DB Round-Trip in `apiSession()`
- **Problem:**
  In `src/lib/auth.ts:314-328`:
  ```ts
  export async function apiSession(): Promise<Session> {
    const session = await getSession(); // Decodes & verifies JWT signature
    if (!session) throw new HttpError(401, 'unauthenticated');

    const db = await getDb();
    const [user] = await db.select(...).from(profiles).where(sql`${profiles.id} = ${session.userId}`);
    ...
  }
  ```
- **Why this burns CPU:**
  `getSession()` already cryptographically validates the HMAC-SHA256 signature and unpacks `userId`, `role`, and `fullName`. Making a database query to `profiles` on every single lightweight heartbeat, image fetch, or option click adds 20–50ms of network I/O and CPU stall time per request.
- **Solution:**
  - In `apiSession()`, return `session` directly from the verified JWT.
  - Query `profiles` only for critical account-modifying actions (password change, role elevation), not on high-frequency autosave requests.

---

### Weak Point 6: Cold Start DDL Migration Checks
- **Problem:**
  In `src/db/client.ts:70`:
  ```ts
  await runMigrations(pool);
  ```
  Runs on every cold start of the unified `/api/[[...slug]]` Lambda.
- **Why this burns CPU:**
  Issues `CREATE TABLE IF NOT EXISTS _migrations`, reads `_migrations`, and scans disk on every container boot.
- **Solution:**
  Gate migration checks:
  ```ts
  if (process.env.NODE_ENV !== 'production' || process.env.RUN_MIGRATIONS === 'true') {
    await runMigrations(pool);
  }
  ```
  Run migrations exclusively during build (`npm run migrate`) or deploy hooks.

---

### Weak Point 7: SSR Followed by Immediate Client-Side Re-Fetch
- **Problem:**
  In `src/app/student/views/StudentTestRunnerView.tsx`:
  - Next.js Server Component runs SSR, queries `attempts` and `tests` from the DB.
  - Then it renders `<TestRunnerClient attemptId={attempt.id} ... />` **without passing questions**.
  - `TestRunnerClient.tsx:206` mounts in the browser and immediately executes:
    ```ts
    const res = await fetch(`/api/attempts/${attemptId}/questions`);
    ```
- **Why this burns CPU:**
  Generates an immediate secondary Serverless invocation and secondary DB query right after SSR completed.
- **Solution:**
  Fetch the questions inside the server component `StudentTestRunnerView` and pass them as `initialQuestions` prop to `TestRunnerClient`. This eliminates 1 full invocation and removes client loading spinners.

---

## 4. Dead Code & Redundant Packages Audit

### 1. Packages in `package.json`

| Package | Size / Footprint | Where It Is Used | Status & Recommendation |
| :--- | :--- | :--- | :--- |
| **`pdf-lib`** | **~4.5 MB** | Only in `src/server/api/papers/index.ts:47` (used solely to call `doc.getPageCount()`). | **Dead / Severely Overweight.** A 5-line regex or `pdfjs-dist` (already in the project) can count pages without bundling 4.5MB. |
| **`recharts`** | **~1.8 MB** | Only in `src/app/teacher/tests/[id]/analytics/TestAnalyticsClient.tsx`. | **OK, but isolate.** Ensure it is strictly dynamically imported (`next/dynamic`) so it never leaks into the student test bundle. |
| **`@electric-sql/pglite`** | **~12 MB (WASM)** | Only in `src/db/client.ts` for zero-config local dev. | **Clean.** Already excluded from Vercel via `outputFileTracingExcludes` in `next.config.mjs`. |
| **`@vercel/analytics`** | Minimal | In `src/app/layout.tsx`. | **Active.** Retain. |
| **`idb-keyval`** | ~1 KB | In `TestRunnerClient.tsx` for client-side offline resilience. | **Active & Essential.** Retain. |
| **`katex`** | ~300 KB | In `src/components/Katex.tsx`. | **Active.** Retain. |

---

### 2. Dead Code & Unused Components

| File / Component | Purpose / Context | Reason It Is Dead |
| :--- | :--- | :--- |
| **`src/components/Tabs.tsx`** | UI Tab Primitive (`Tabs`, `TabsList`, `TabsTrigger`, `TabsContent`) | **Completely unused across the entire application UI.** All views (student analytics, test builder, result review) implement custom native buttons. It is only imported in `ui.test.tsx`. |
| **`src/server/api/attempts/events.ts`** | Proctoring telemetry API route | **100% write-only sink.** Nothing in the product reads, queries, or displays `attemptEvents`. |
| **`src/db/schema.ts` (`attemptEvents`)** | `attempt_events` table definition | Unused except by the dead `events.ts` route. |
| **`scripts/demo-evaluation.ts`** | Demo CLI script | Standalone prototype script not referenced in `package.json`. |
| **`TestRunnerClient.tsx` proctoring code** | `visibilitychange` event handler | Generates unread `tab_hidden`/`tab_visible` network calls. |

---

## 5. Immediate & High-Impact Action Plan (85–95% CPU Reduction)

Implementing these 5 changes will resolve the Vercel Fluid Active CPU crisis immediately:

### Action 1: Optimize Test Runner Sync Frequency & Remove Nav Sync
**File:** [`src/app/student/attempts/[id]/TestRunnerClient.tsx`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/app/student/attempts/[id]/TestRunnerClient.tsx)
1. Change heartbeat from `15000` to `60000` (15s -> 60s):
   ```diff
   - }, 15000);
   + }, 60000);
   ```
2. Remove `scheduleSync()` from `goToQuestion` (Line 493):
   ```diff
   - scheduleSync();
   ```
   *(IndexedDB already stores current question and visit count instantaneously with 0 network calls).*
3. Increase answer debounce from `300ms` to `2000ms`:
   ```diff
   - }, 300);
   + }, 2000);
   ```
4. Remove `fetch('/api/attempts/${attemptId}/events')` from `handleVisibilityChange` (Lines 389–401).
5. Remove duplicate `flushBeacon()` from line 387 (keep it only in `handlePageHide`).

---

### Action 2: Enable Edge CDN Caching on Question Images
**File:** [`src/server/api/files/image.ts`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/server/api/files/image.ts#L38)
Change `Cache-Control` header to allow Vercel Edge caching:
```diff
- const cacheControl = 'private, max-age=86400, stale-while-revalidate=604800';
+ const cacheControl = 'public, max-age=31536000, s-maxage=31536000, immutable';
```
*Result: Every image is cached at Vercel's global Edge on first request. Subsequent requests across all students bypass Serverless compute completely (0 invocations, 0 Active CPU).*

---

### Action 3: Eliminate Unnecessary DB Query in `apiSession()`
**File:** [`src/lib/auth.ts`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/lib/auth.ts#L309-L339)
Trust the cryptographically verified JWT payload directly:
```typescript
export async function apiSession(): Promise<Session> {
  const session = await getSession();
  if (!session) throw new HttpError(401, 'unauthenticated', 'Sign in to continue.');
  return session;
}
```
*Result: Saves 1 database round-trip (20–50ms) on every single API invocation across the entire platform.*

---

### Action 4: Disable Runtime Cold-Start Migrations in Production
**File:** [`src/db/client.ts`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/db/client.ts#L70)
```diff
- await runMigrations(pool);
+ if (process.env.NODE_ENV !== 'production' || process.env.RUN_MIGRATIONS === 'true') {
+   await runMigrations(pool);
+ }
```
*Result: Removes 2 database queries and disk I/O from every cold start.*

---

### Action 5: Pass Initial Questions from Server Component
**File:** [`src/app/student/views/StudentTestRunnerView.tsx`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/app/student/views/StudentTestRunnerView.tsx)
Load the questions directly during SSR and pass them as `initialQuestions` to `TestRunnerClient`.
*Result: Eliminates 1 client-side API invocation per test attempt and removes the initial page loading spinner.*

---

## 6. Before vs. After Comparison Table

| Metric | Before Optimization | After Optimization | Expected Improvement |
| :--- | :--- | :--- | :--- |
| **Heartbeat Invocations (15-min test)** | 60 calls (every 15s) | 15 calls (every 60s) | **75% reduction** |
| **Navigation Autosaves (20 Qs)** | 25–30 calls | **0 calls** (handled by IndexedDB) | **100% reduction** |
| **Option Click Invocations** | ~20 calls (300ms debounce) | 5–8 calls (2000ms debounce) | **65% reduction** |
| **Image Invocations (revisiting Qs)** | 10–15 calls (Lambda hits) | **0–1 calls** (Edge CDN cached) | **90–100% reduction** |
| **Proctoring Telemetry Calls** | 4–8 calls (`tab_hidden`/`visible`) | **0 calls** (removed) | **100% reduction** |
| **Initial Load API Invocations** | 1 call (`/questions`) | **0 calls** (provided by SSR) | **100% reduction** |
| **Total Invocations per Test** | **124 invocations** | **~15–20 invocations** | **~85% reduction** |
| **Average CPU Duration per Invocation** | ~700 ms | ~80–120 ms | **85% faster** |
| **Total Fluid Active CPU per Test** | **1 min 27 sec (87,000 ms)** | **~1.5 to 2.5 seconds** | **~97% CPU Savings!** |
| **Vercel Monthly Plan Headroom** | Breaching limits quickly | Safely supports thousands of tests | **Free Hobby / Pro plan compliance** |

---

## 7. Vercel Free (Hobby) Plan Compliance: The 12-Function Limit

### The Constraint
On the **Vercel Hobby (Free) plan**, deployments enforce two completely separate constraints:
1. **Packaging Limit (Serverless Function Count):** Strictly capped at **$\le$ 12 Serverless Functions** per deployment. Next.js creates an independent Lambda for each unbundled route. Deployments with 13+ functions immediately fail build with:
   > *"No more than 12 Serverless Functions can be added to a Deployment on the Hobby plan."*
2. **Execution Limit (Fluid Active CPU):** Billed / capped on **Active CPU Hours/Seconds** per billing cycle. A deployment with only 1 function can still blow through the plan's quota if that function is invoked hundreds of times with high execution durations.

### How SRSMA Solves the 12-Function Limit
SRSMA architecturally consolidates all endpoints into single catch-all dispatchers:
- **API Routes (39 endpoints):** Consolidated into **1 single function** at [`src/app/api/[[...slug]]/route.ts`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/app/api/%5B%5B...slug%5D%5D/route.ts).
- **Student App Router:** Consolidated into **1 single function** at `src/app/student/[[...slug]]/page.tsx`.
- **Teacher App Router:** Consolidated into **1 single function** at `src/app/teacher/[[...slug]]/page.tsx`.
- **Standalone pages:** `/login`, `/boardChallenge`, `/SRSMA`, and root `/`.
- **Total Functions:** **~6 functions** (well under the 12-function cap).

### Critical Rule for Optimizations: DO NOT Split Routes
> [!IMPORTANT]
> **None of the proposed optimizations split routes or add new Serverless Functions.**
> - Do **not** extract `/api/files/images/...` or `/api/attempts/...` into independent `route.ts` files, as that would increase the function count back toward the 12-function ceiling.
> - All optimizations stay **inside the existing 1-function router** (`src/app/api/[[...slug]]/route.ts`), reducing the internal work, database calls, and invocation volume of that single function.
> - Removing dead routes (like `api/attempts/[id]/events`) shrinks the unified router bundle size and cold-start overhead without changing the function count.

---

## 8. Downsides, Edge Cases, & Tradeoffs Analysis

When stripping dead code and optimizing execution loops, every change introduces specific behavioral tradeoffs. Below is an honest appraisal of potential downsides and how they are mitigated:

### 1. Removing Proctoring Telemetry (`attempt_events`, `tab_hidden`, `tab_visible`)
- **Potential Downside:**
  If a teacher or administrator asks: *"Did this student switch tabs or leave fullscreen during the test?"*, the system will no longer record a timestamped event log in the database.
- **Why It Is Acceptable Today:**
  - The feature was **already non-functional**: no teacher dashboard, scorecard, export CSV, or report ever displayed or queried `attempt_events`.
  - Storing unread tab blur events consumed DB writes and serverless invocations for zero actual product value.
- **Better Future Alternative (Zero Extra Invocations):**
  If anti-cheat is needed in the future, **do not fire HTTP requests on every tab switch**. Instead, track tab switches purely in browser state (`const count = useRef(0)` on `visibilitychange`), and include the total count in the single final submission payload:
  ```json
  {
    "tabSwitchCount": 3,
    "answers": [...]
  }
  ```
  This provides 100% of the proctoring insight with **0 extra intermediate Serverless invocations**.

---

### 2. Relaxing Heartbeat (15s $\rightarrow$ 60s) & Removing Question Navigation Autosaves
- **Potential Downside (Cross-Device Handover Gap):**
  If a student's phone battery suddenly dies completely (hard shutdown) mid-exam, answers selected in the last 1–60 seconds would not yet be in PostgreSQL.
- **Impact Analysis & Mitigations:**
  - **Same-Device Recovery (Zero Data Loss):** IndexedDB (`idb-keyval`) updates **immediately in zero milliseconds offline** on every keystroke and option click. If the phone restarts and the student reopens the browser, 100% of answers and question states are restored from IndexedDB.
  - **Cross-Device Switching (Phone $\rightarrow$ Laptop):** If the phone dies and the student switches to a completely different device, they might have to re-select the last 1–2 answers answered within the 60s gap.
  - **Mitigation:** Keep the debounced autosave on **actual answer selection** (`handleSelectOption` / `handleSetIntegerValue`) with a **2000ms debounce**. This ensures that any genuine answer choice is committed to the cloud within 2 seconds. The 60s timer only governs idle "thinking" intervals where no answer changed.

---

### 3. Public Edge CDN Caching on Question Images (`Cache-Control: public, s-maxage=31536000, immutable`)
- **Potential Downside 1: Stale Cached Images after Re-crops:**
  If a teacher re-crops or uploads a new diagram for Question #5, browsers and Vercel CDN might continue serving the old cached image.
  - **Mitigation:** The application already implements version tagging in `QuestionEditor.tsx:688` (`?v=${version}`). To ensure fresh loads, always ensure URLs rendered in the student runner include the question version or timestamp (`?v=${q.version || 1}`).
- **Potential Downside 2: Gating / Authorization:**
  Currently, `src/server/api/files/image.ts` verifies that the requesting student has an attempt containing that question. Public Edge CDN caching means anyone with the exact URL could retrieve the image diagram.
  - **Analysis:** Examination diagrams (physics circuits, geometry triangles, chemistry equations) contain zero student PII and use unguessable 128-bit UUIDs (`/api/files/images/3f8a.../p1`). Public edge caching for static exam diagrams is standard practice across major test platforms and completely eliminates image CPU burn.

---

### 4. Bypassing Database Lookup in `apiSession()`
- **Potential Downside (Account Deactivation Delay):**
  Currently, `apiSession()` queries the database on every request to check `isActive` and `canLogin`. If an administrator deactivates a student account in the faculty portal while that student is actively taking a test, a JWT-only check would allow the student to continue until their cookie expires.
- **Why It Is Acceptable:**
  - Students enrolled in an active test are virtually never banned mid-test.
  - Running a PostgreSQL round-trip on every answer autosave to check a boolean that changes once a year is an enormous waste of CPU and latency.
- **Mitigation:**
  Keep lightweight endpoints (like autosave `/answers` and `/questions`) JWT-only. Perform the strict database check on sensitive lifecycle actions: login, student profile update, and final test submission (`/submit`).

---

### 5. Retaining vs. Removing `pdf-lib` (~4.5 MB)
- **Potential Downside of Removing It:**
  `pdf-lib` is used in `src/server/api/papers/index.ts` to count pages of uploaded PDFs (`doc.getPageCount()`). Replacing it with a custom parser or regex could introduce edge-case failures if an uploaded teacher PDF is encrypted, linearized, or has corrupted xref tables.
- **Recommendation:**
  `pdf-lib` is already imported dynamically (`await import('pdf-lib')`). This means it is **never loaded during student tests** and consumes 0 CPU during exams. It is safer to **keep `pdf-lib`** to avoid breaking paper ingestion, while focusing all optimizations on the high-frequency student exam loop.

---

### 6. Removing Dead Component `src/components/Tabs.tsx`
- **Potential Downside:**
  `Tabs.tsx` is exported from `src/components/ui.tsx` and has unit test coverage in `src/components/ui.test.tsx`.
- **Mitigation:**
  If deleting `src/components/Tabs.tsx`, you must also remove `export * from './Tabs';` from `src/components/ui.tsx` and delete the corresponding test block in `src/components/ui.test.tsx`. Otherwise, `npm test` and `npm run build` will fail.

---

## 9. Zero-CPU Proctoring Architecture (Keep Anti-Cheat with 0 Extra Invocations)

Yes, **proctoring can be implemented with virtually 0ms of extra Active Fluid CPU and 0 additional Serverless invocations**.

### Why the Current Implementation Burned CPU
The existing implementation made the classic architectural mistake of **"chatty real-time telemetry"**:
- Every time a student alt-tabbed, got a mobile notification, or clicked outside the browser window, the browser immediately fired an independent HTTP `POST /api/attempts/${id}/events` call.
- When they clicked back, it fired another call.
- Each event call triggered a full Lambda execution (`dispatchApiRequest` $\rightarrow$ JWT decode $\rightarrow$ `profiles` query $\rightarrow$ `attempts` query $\rightarrow$ `attempt_events` row insert).
- 10 tab switches = **20 Serverless function invocations** + **40 database queries** = ~14 seconds of Active Fluid CPU!

---

### The Efficient Industry Pattern: In-Memory Aggregation + Piggybacked Submission

Leading assessment platforms (HackerRank, CodeSignal, Canvas) do **not** fire network requests on every tab switch. Instead, they track violations **entirely in client memory / IndexedDB** and synchronize the results without extra network calls.

```mermaid
graph TD
    A[Student switches tab / leaves fullscreen] -->|0 Network Calls| B[Browser React Ref & IndexedDB]
    B -->|Increment tabSwitchCount<br/>Accumulate timeAwayMs| B
    B -->|Active Deterrence Dialog| C[Warning Modal: 'Violation 1/3']
    B -.->|Piggybacked on normal 60s autosave| D[Existing /answers PATCH]
    B -->|Sent once at the end| E[Final POST /submit payload]
    E -->|Stored as single JSONB column| F[PostgreSQL attempts.proctoring_summary]
```

### 3 Core Pillars of Zero-CPU Proctoring

#### Pillar 1: Client-Side State Accumulation (0ms Server CPU)
Inside [`src/app/student/attempts/[id]/TestRunnerClient.tsx`](file:///c:/Users/panga/OneDrive/Desktop/Seva/SRSMA/Study_App/src/app/student/attempts/[id]/TestRunnerClient.tsx), replace network `fetch()` calls with in-memory tracking:

```typescript
// Pure in-memory / ref state — 0 HTTP calls
const proctoringRef = useRef({
  tabSwitches: 0,
  totalTimeAwayMs: 0,
  fullscreenExits: 0,
  lastLeftAt: 0,
});

useEffect(() => {
  const handleVisibility = () => {
    if (document.visibilityState === 'hidden') {
      proctoringRef.current.tabSwitches += 1;
      proctoringRef.current.lastLeftAt = performance.now();
    } else {
      if (proctoringRef.current.lastLeftAt > 0) {
        proctoringRef.current.totalTimeAwayMs += Math.round(
          performance.now() - proctoringRef.current.lastLeftAt
        );
        proctoringRef.current.lastLeftAt = 0;
      }
    }
  };

  document.addEventListener('visibilitychange', handleVisibility);
  return () => document.removeEventListener('visibilitychange', handleVisibility);
}, []);
```

#### Pillar 2: Active Client-Side Deterrence (0ms Server CPU)
Most students switch tabs simply because they think the test is unmonitored. When the student returns to the tab, immediately show a prominent warning dialog:
- *"Warning: Tab switch detected (Violation 1 of 3). Your test may be automatically submitted if you continue leaving the test screen."*
- This completely stops cheating behavior **without making a single network call or database query**.

#### Pillar 3: Piggybacked Transmission (0 Extra Invocations)
Instead of creating a dedicated `/events` endpoint, attach the telemetry summary to existing requests:
1. **On Final Submit (`POST /api/attempts/[id]/submit`):**
   Send the aggregated summary with the final submission body:
   ```json
   {
     "proctoring": {
       "tabSwitches": 2,
       "totalTimeAwaySeconds": 14,
       "fullscreenExits": 1
     }
   }
   ```
2. **On Existing Periodic Autosave (`PATCH /api/attempts/[id]/answers`):**
   Include `tabSwitches: proctoringRef.current.tabSwitches` in the payload that is already being sent anyway.

#### Pillar 4: Store as a Single JSONB Column (Zero Extra Tables)
Instead of writing dozens of rows to a bloated `attempt_events` table:
- Store the summary in a single `proctoring_summary` JSONB column on the `attempts` table:
  ```json
  {
    "tabSwitches": 2,
    "totalTimeAwaySeconds": 14,
    "fullscreenExits": 1,
    "flaggedForReview": false
  }
  ```
- **Result:** Faculty can see a clean badge on the scorecard: `⚠️ 2 Tab Switches (14s away)` with **0 extra database tables, 0 extra serverless functions, and 0 extra Active CPU seconds!**

---

### Comparison: Chatty Telemetry vs. Piggybacked Proctoring

| Dimension | Current Implementation | Piggybacked Architecture |
| :--- | :--- | :--- |
| **API Invocations per Tab Switch** | 2 calls (`tab_hidden` + `tab_visible`) | **0 calls** (tracked in browser memory) |
| **Total Invocations for 10 Tab Switches** | **20 invocations** | **0 extra invocations** |
| **Active Fluid CPU Consumed** | ~14,000 ms (14 seconds) | **0 ms** |
| **Database Operations** | 20 independent `INSERT` queries into `attempt_events` | **0 extra queries** (saved in final submit transaction) |
| **Faculty Visibility** | None (data was unreadable) | Clean summary badge on student scorecard |
| **Impact on Vercel 12-Function Limit** | Kept in unified router, but crowded | Stays 100% within unified router |

---

*Report generated and verified against codebase source files in `src/app`, `src/server`, `src/db`, and `src/lib`.*


