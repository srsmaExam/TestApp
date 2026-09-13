# Final Enhancements & Roadmap — SRSMA JEE CBT Platform

**Date:** 13 September 2026
**Supersedes:** [`ProposedEnhancements.md`](ProposedEnhancements.md)
**Companion:** [`FinalBugReport.md`](FinalBugReport.md) — fix the P0/P1 findings there first; several enhancements below depend on them.
**References:** [LLD](JEE-Test-Platform-LLD.md) · [Production Setup](PRODUCTION-SETUP-GUIDE.md) · [Production Ops](README.production.md) · [Local Build](README.local.md)

---

## 1. The Three Constraints That Decide Everything

`ProposedEnhancements.md` was written as an aspirational roadmap. This revision re-scores every item
against three hard facts about *this* deployment. Where a proposal fails one of them it is dropped
or redesigned, with the reason stated — a roadmap that ignores its own platform is a wish list.

### Constraint A — Most students take these exams on a **phone**

This is the single most consequential fact, and `ProposedEnhancements.md` did not account for it.
It inverts several of its recommendations:

| Proposed | Reality on a mid-range Android phone |
|---|---|
| Glassmorphism, `backdrop-blur-md` on headers | `backdrop-blur` forces off-main-thread compositing on a live-repainting surface. On a phone it drops the 1 Hz timer repaint into visible jank. **Dropped.** |
| Second display font (Outfit / Plus Jakarta) | ~35-45 KB extra webfont on 4G, for headings. The `tnum` utility already exists ([globals.css](src/app/globals.css)) and solves the actual problem (timer jitter). **Dropped.** |
| "Suggest landscape mode for an optimal CBT layout" | Backwards. Students hold phones in portrait; a prompt to rotate is friction before a 3-hour exam. **Replaced** with a portrait-first layout (§4). |
| Multi-layer shadows, `ring-1 ring-white/10` depth | Fine, cheap. **Kept.** |

### Constraint B — Vercel **Hobby**: 12 Serverless Functions, 4.5 MB requests, 1 cron/day

The unified router ([src/server/api/router.ts](src/server/api/router.ts)) buys real headroom, and
this document spends none of it. **Every item below adds zero serverless functions.** New API
endpoints are module exports dispatched by the existing router; new screens are App Router pages
inside the existing `[[...slug]]` dispatchers.

| # | Function | Source |
|:---:|---|---|
| 1 | `/api/[[...slug]]` — all API routes | [router.ts](src/server/api/router.ts) |
| 2 | `middleware` | [middleware.ts](src/middleware.ts) |
| 3-7 | `/`, `/login`, `/SRSMA`, `/student/[[...slug]]`, `/teacher/[[...slug]]` | [src/app/](src/app/) |
| — | `/boardChallenge` — `force-static`, no function | |
| | **7 of 12 used · 5 spare** | |

Two further consequences the previous roadmap missed:

- **No WebSockets.** Vercel Hobby serverless functions cannot hold them. Anything "live" must be
  short-interval polling — which is why §6.3 rescopes the Live Proctoring Cockpit rather than
  promising real-time.
- **1 cron/day.** The 5-minute sweep the LLD specifies is impossible on Vercel Cron. It moves to an
  external pinger — see [`FinalBugReport.md` FBR-06](FinalBugReport.md).

### Constraint C — $0.00/month, and no new vendors without a reason

Kept from the original. But "free tier" is not the same as "free": every new service is another
secret to rotate, another status page to watch, and another way for an exam to fail at 9 a.m. on a
Sunday. So this revision **drops Upstash Redis** — Postgres already does distributed counters, and
Supabase is already a dependency ([`FinalBugReport.md` FBR-14](FinalBugReport.md)).

---

## 2. What Changed From `ProposedEnhancements.md`

### Added (11)

| # | Enhancement | Why it is here |
|---|---|---|
| **A1** | **Basic proctoring: tab-switch detection, disclosed in the Instructions** | **Explicitly requested.** Full design in §3. The telemetry already reaches the database and nothing can read it ([FBR-16](FinalBugReport.md)). |
| A2 | Exam-mode chrome removal (runner outside `AppShell`) | Prerequisite for proctoring to mean anything: today a Logout button sits above the exam ([FBR-08](FinalBugReport.md)). |
| A3 | Portrait-first mobile exam layout | §4. Replaces the landscape suggestion. |
| A4 | Reliable mobile save (`pagehide` + beacon) | `beforeunload` never fires on iOS ([FBR-12](FinalBugReport.md)). Answers are lost on the primary device. |
| A5 | Resume-after-crash flow | A killed phone tab currently means a 24-hour lockout ([FBR-06](FinalBugReport.md)). |
| A6 | Option relabelling on shuffle | Shuffled papers show `C, A, D, B` ([FBR-11](FinalBugReport.md)). |
| A7 | Immutable image caching | Diagrams re-fetch on every revisit; a stalled 4G revalidation is a blank diagram mid-exam ([FBR-20](FinalBugReport.md)). |
| A8 | Tiered auth (`apiSessionFast`) | ~4,800 auth queries/min at 100 candidates ([FBR-21](FinalBugReport.md)). This is the scaling ceiling. |
| A9 | Prospective-vs-enrolled student separation | Required to keep the Board Challenge funnel without exposing the question bank ([FBR-03](FinalBugReport.md)). |
| A10 | Low-bandwidth mode (deferred diagram loading) | 75 WebP diagrams on a metered 4G connection. |
| A11 | Dismissible overlays + single shared palette component | ([FBR-24](FinalBugReport.md), [FBR-30](FinalBugReport.md)) |

### Dropped (5)

| Proposed | Reason |
|---|---|
| Glassmorphism / `backdrop-blur` headers | Compositing cost on the target device (Constraint A). |
| Second display font (Outfit / Plus Jakarta Sans) | Payload cost for no functional gain; `tnum` already fixes timer jitter. |
| Screen-orientation landscape suggestion | Wrong for a portrait phone cohort. |
| Upstash Redis for distributed rate limiting | Postgres does this with no new vendor (Constraint C). |
| Network-latency ping on the pre-exam screen | A ping to a serverless function measures cold-start, not the student's connection. Misleading. The KaTeX check is kept. |

### Rescoped (4)

| Proposed | Rescoped to |
|---|---|
| Real-Time Live Proctoring Cockpit | 20 s polling on one existing endpoint. No WebSockets on Hobby (§6.3). |
| Pre-Signed Supabase Storage upload | Kept and promoted, but paired with an **honest client-side 4 MB guard shipped first** — today a hard platform limit looks like a flaky network ([FBR-15](FinalBugReport.md)). |
| Interactive Pre-Exam Diagnostic | Reduced to what a phone student actually needs: KaTeX render check, diagram load check, storage-permission check. |
| Section Review Modal | Mostly **already built** ([TestRunnerClient.tsx:1108-1160](src/app/student/attempts/[id]/TestRunnerClient.tsx#L1108-L1160)). Remaining gap is only "Jump to unanswered" + the Answered & Marked note (§5.2). |

### Kept as proposed (6)

`GET /api/auth/me` · Solution Explorer & bookmarking · PDF Crop Studio v2 · Faculty Test Simulator ·
Roster CSV export & bulk batch move · `bytea` storage migration.

---

## 3. ⭐ Basic Proctoring — Tab-Switch Detection

> **This is the requested feature.** It is specified in full: data model, client, API, teacher
> surface, and the exact Instructions copy.

### 3.1 What already exists, and what is missing

The plumbing is **half-built**. Recognising that changes this from a feature build into a
completion job.

| Piece | Status |
|---|---|
| `attempt_events` table | ✅ [schema.ts:246-253](src/db/schema.ts#L246-L253) |
| `POST /api/attempts/:id/events` with ownership + rate limit | ✅ [events.ts](src/server/api/attempts/events.ts) |
| Router path registered | ✅ [router.ts:186](src/server/api/router.ts#L186) |
| Client emits `tab_hidden` / `tab_visible` | ✅ [TestRunnerClient.tsx:353-372](src/app/student/attempts/[id]/TestRunnerClient.tsx#L353-L372) |
| **Any way to read the data back** | ❌ `events.ts` exports `POST` only → `405` |
| **Duration of each absence** | ❌ two unlinked rows; no `durationMs` |
| **Student-facing warning** | ❌ nothing |
| **Teacher-facing report** | ❌ nothing |
| **Disclosure in the Instructions** | ❌ **nothing — and this is the blocking issue** |
| `fullscreen_*`, `offline`, `online`, `paste_blocked` | ❌ declared in the enum, never emitted |

So the platform **already records student focus changes and tells no one.** Completing the read path
without also adding the disclosure would be the wrong order of work.

### 3.2 Design principles — because the primary device is a phone

This is where naive tab-switch proctoring goes wrong. On a phone,
`visibilitychange → hidden` fires for all of:

- an incoming call or WhatsApp notification
- the notification shade being pulled down
- the screen auto-locking during a long read
- the student switching to the calculator (often legitimately)
- Android reclaiming memory
- rotating the device, on some browsers

A raw counter will flag honest students. So:

| Principle | Implementation |
|---|---|
| **1. Measure duration, not count** | A 1.5 s notification glance and a 4-minute absence are different events. Store `durationMs`. |
| **2. Ignore transients** | Absences under **2 s** are discarded client-side. |
| **3. Classify, don't accuse** | `brief` (2-15 s) · `extended` (15 s-2 min) · `prolonged` (>2 min). The teacher sees a distribution, not a verdict. |
| **4. Never auto-submit or lock** | On a phone, a false positive ending a 3-hour exam is far worse than an unflagged absence. Telemetry informs a human; it never acts. |
| **5. Tell the student, in the moment** | A quiet, non-blocking banner. A student who knows it is recorded is deterred; one who finds out afterwards is ambushed. |
| **6. Disclose up front** | §3.6. Non-negotiable: these are minors. |
| **7. Never block the exam on telemetry** | Every event POST is fire-and-forget. `events.ts` already returns `200 {ignored: 'rate_limited'}` rather than erroring — keep that. |
| **8. Degrade honestly** | The Page Visibility API cannot see a second device, a person in the room, or a paper cheat sheet. Call the feature *focus monitoring*, never *proctoring-proof*. |

### 3.3 Data model — one migration

`attempt_events` already fits. Add a duration column so an absence is one row, not two:

```sql
-- drizzle/0003_proctoring.sql
ALTER TABLE attempt_events ADD COLUMN IF NOT EXISTS duration_ms integer;

CREATE INDEX IF NOT EXISTS attempt_events_attempt_type_idx
  ON attempt_events (attempt_id, event_type);

COMMENT ON COLUMN attempt_events.duration_ms IS
  'For tab_visible: ms the exam was backgrounded. NULL for instantaneous events.';
```

```ts
// src/db/schema.ts — attemptEvents
durationMs: integer('duration_ms'),
```

No new table, no new index on a hot write path, no change to the exam's own tables.

### 3.4 Client — `TestRunnerClient.tsx`

Replace the existing `handleVisibilityChange`
([lines 353-372](src/app/student/attempts/[id]/TestRunnerClient.tsx#L353-L372)):

```ts
// --- Focus monitoring (disclosed in the pre-exam Instructions, §5) -----------
const MIN_ABSENCE_MS = 2_000;      // ignore notification glances and rotations
const hiddenAtRef = useRef<number | null>(null);
const [focusLossCount, setFocusLossCount] = useState(0);
const [focusWarning, setFocusWarning] = useState<string | null>(null);

const logEvent = useCallback(
  (eventType: string, meta?: Record<string, unknown>, durationMs?: number) => {
    // Fire-and-forget: telemetry must never interrupt or slow an exam.
    fetch(`/api/attempts/${attemptId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ eventType, meta, durationMs }),
      keepalive: true,             // survives the page being frozen
    }).catch(() => {});
  },
  [attemptId],
);

const handleVisibilityChange = useCallback(() => {
  if (document.visibilityState === 'hidden') {
    hiddenAtRef.current = Date.now();
    flushTimeSpent();
    flushBeacon();                 // see FBR-12 — beacon, not fetch, on the way out
    logEvent('tab_hidden');
    return;
  }

  // Returning to the exam.
  activeSinceRef.current = performance.now();
  const away = hiddenAtRef.current ? Date.now() - hiddenAtRef.current : 0;
  hiddenAtRef.current = null;

  if (away < MIN_ABSENCE_MS) return;   // transient — not recorded, not counted

  const next = focusLossCount + 1;
  setFocusLossCount(next);
  logEvent('tab_visible', { awayClass: classifyAbsence(away) }, away);

  setFocusWarning(
    next === 1
      ? 'You left the exam screen. Your answers were saved. Screen changes are recorded for this test.'
      : `You have left the exam screen ${next} times (last: ${formatAway(away)}). This is recorded and shared with your teacher.`,
  );
  syncWithServer();                // re-sync in case the beacon was dropped
}, [attemptId, focusLossCount, flushTimeSpent, logEvent, syncWithServer]);
```

```ts
// src/lib/proctoring.ts — shared by client and teacher view, so the thresholds
// have exactly one definition (see FinalBugReport.md §4 on drift).
export type AbsenceClass = 'brief' | 'extended' | 'prolonged';

export function classifyAbsence(ms: number): AbsenceClass {
  if (ms < 15_000) return 'brief';
  if (ms < 120_000) return 'extended';
  return 'prolonged';
}

export function formatAway(ms: number): string {
  const s = Math.round(ms / 1000);
  return s < 60 ? `${s}s` : `${Math.floor(s / 60)}m ${s % 60}s`;
}
```

Also emit the four event types that exist in the enum and are never sent:

```ts
// fullscreen — pairs with deleting the dead barrier (FBR-04)
const handleFullscreenChange = () => {
  const fs = Boolean(document.fullscreenElement);
  setIsFullscreen(fs);
  logEvent(fs ? 'fullscreen_enter' : 'fullscreen_exit');
};

// connectivity — handlers already exist and log nothing today
const handleOffline = () => { setIsOnline(false); logEvent('offline'); };
const handleOnline  = () => { setIsOnline(true);  logEvent('online'); syncWithServer(); };

// paste into the numerical box — a pasted answer is worth knowing about
const handlePaste = (e: React.ClipboardEvent) => {
  e.preventDefault();
  logEvent('paste_blocked');
};
```

**Student-facing banner** — non-blocking, dismissible, below the timer, never over the question:

```tsx
{focusWarning && (
  <div
    role="status"
    className="flex shrink-0 items-start gap-2 border-b border-amber-300 bg-amber-50 px-4 py-2
               text-xs text-amber-900 dark:border-amber-800 dark:bg-amber-950/70 dark:text-amber-200"
  >
    <AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-600" aria-hidden />
    <p className="flex-1">{focusWarning}</p>
    <button
      type="button"
      onClick={() => setFocusWarning(null)}
      aria-label="Dismiss"
      className="shrink-0 rounded p-1 hover:bg-amber-100 dark:hover:bg-amber-900"
    >
      <X className="size-3.5" />
    </button>
  </div>
)}
```

`role="status"` (not `alert`) so a screen reader announces it without interrupting; a 44×44 px tap
target for the dismiss button, per §4.

### 3.5 API — extend `events.ts`, add **zero** functions

`router.ts:186` already routes `/api/attempts/[id]/events` to this module for every verb. Adding a
`GET` export makes it live immediately.

```ts
// src/server/api/attempts/events.ts

// 1. Accept durationMs on the existing POST
const eventSchema = z.object({
  eventType: z.enum(KNOWN_EVENT_TYPES),
  meta: z.record(z.any()).optional().nullable(),
  durationMs: z.number().int().min(0).max(24 * 60 * 60_000).optional(),
});

// 2. NEW: teacher-only read path. Students must not see their own flag count
//    beyond the in-exam banner — it would turn proctoring into a scoreboard.
export const GET = withApi<Ctx>(async (_req, { params }) => {
  await apiTeacher();
  const { id: attemptId } = await params;
  const db = await getDb();

  const rows = await db
    .select()
    .from(attemptEvents)
    .where(eq(attemptEvents.attemptId, attemptId))
    .orderBy(asc(attemptEvents.at));

  const absences = rows.filter((r) => r.eventType === 'tab_visible' && r.durationMs != null);

  return json({
    timeline: rows,
    summary: {
      focusLossCount: absences.length,
      totalAwayMs: absences.reduce((t, r) => t + (r.durationMs ?? 0), 0),
      longestAwayMs: Math.max(0, ...absences.map((r) => r.durationMs ?? 0)),
      byClass: {
        brief:     absences.filter((r) => classifyAbsence(r.durationMs!) === 'brief').length,
        extended:  absences.filter((r) => classifyAbsence(r.durationMs!) === 'extended').length,
        prolonged: absences.filter((r) => classifyAbsence(r.durationMs!) === 'prolonged').length,
      },
      fullscreenExits: rows.filter((r) => r.eventType === 'fullscreen_exit').length,
      offlineEvents:   rows.filter((r) => r.eventType === 'offline').length,
      pasteBlocked:    rows.filter((r) => r.eventType === 'paste_blocked').length,
    },
  });
});
```

For the roster view, one aggregate added to the existing
[`analytics/test-by-id.ts`](src/server/api/analytics/test-by-id.ts) avoids N requests for N students:

```sql
SELECT a.id AS attempt_id,
       count(*) FILTER (WHERE e.event_type = 'tab_visible' AND e.duration_ms >= 2000)  AS focus_losses,
       coalesce(sum(e.duration_ms) FILTER (WHERE e.event_type = 'tab_visible'), 0)     AS total_away_ms,
       coalesce(max(e.duration_ms) FILTER (WHERE e.event_type = 'tab_visible'), 0)     AS longest_away_ms
FROM attempts a
LEFT JOIN attempt_events e ON e.attempt_id = a.id
WHERE a.test_id = $1
GROUP BY a.id;
```

### 3.6 ⭐ Instructions disclosure — required, and the exact copy

The instructions page
([TestInstructionClient.tsx](src/app/student/tests/[id]/TestInstructionClient.tsx)) currently has
five sections: **1.** Timer · **2.** Palette & Colour Codes · **3.** Marking Scheme ·
**4.** Navigating and Answering · plus the connection-drop callout. Insert a new
**section 5** after "Navigating and Answering", before the connection callout and the declaration.

```tsx
{/* 5. Exam Integrity & Screen Monitoring — disclosure for the focus telemetry
      recorded by TestRunnerClient. Must stay in sync with src/lib/proctoring.ts. */}
<div>
  <h3 className="font-semibold text-slate-900 dark:text-slate-100">
    5. Exam Integrity & Screen Monitoring
  </h3>

  <div className="mt-2 rounded-md border border-amber-200 bg-amber-50/70 p-3.5 text-xs
                  text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/50 dark:text-amber-200">
    <p className="font-semibold">
      <ShieldCheck className="mr-1 inline size-3.5" aria-hidden />
      Please read this before you begin.
    </p>
    <p className="mt-1.5 leading-relaxed">
      This is a monitored examination. While the test is running, the app records
      <strong> when you leave the exam screen and for how long</strong> — for example if you switch
      to another app or browser tab, or if your phone screen locks. Your teacher can see this
      summary alongside your answers.
    </p>
  </div>

  <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs text-slate-600 dark:text-slate-400">
    <li>
      <strong>What is recorded:</strong> the time you left the exam screen, the time you came back,
      and how long you were away. Also recorded: leaving full screen, losing your internet
      connection, and pasting into an answer box.
    </li>
    <li>
      <strong>What is not recorded:</strong> nothing outside this exam page. The app cannot see your
      other apps, tabs, messages, camera, microphone, files or location.
    </li>
    <li>
      <strong>You will be told at the time.</strong> A yellow notice appears at the top of the exam
      each time you return, showing how many times this has happened. Nothing is hidden from you.
    </li>
    <li>
      <strong>Your exam is never stopped by this.</strong> You will not be locked out, and the test
      will not be submitted early. Your answers keep saving normally.
    </li>
    <li>
      <strong>Short interruptions are expected and ignored.</strong> Absences under 2 seconds are not
      recorded at all. A notification or a quick call is normal and is not treated as misconduct.
    </li>
    <li>
      <strong>To get a clean record:</strong> silence notifications, keep this the only open tab, and
      stay on the exam screen until you submit. Use the on-screen answer box rather than another app.
    </li>
  </ul>

  <p className="mt-2.5 text-xs italic text-slate-500 dark:text-slate-400">
    Repeated or long absences are reviewed by your teacher together with your answers and timing —
    they are never treated as proof of cheating on their own.
  </p>
</div>
```

Then extend the declaration checkbox
([TestInstructionClient.tsx:256-266](src/app/student/tests/[id]/TestInstructionClient.tsx#L256-L266))
so consent is explicit rather than implied:

```tsx
<span className="text-xs text-slate-800 dark:text-slate-200">
  I have read and understood all the instructions above, <strong>including the screen-monitoring
  notice in section 5</strong>. I agree that I will not use any unfair means during the examination.
</span>
```

**Why the copy is written this way**

- It states **what is not collected** as prominently as what is. A student who fears the app is
  reading their messages will disable notifications or abandon the exam.
- It sets expectations for phones explicitly ("if your phone screen locks"), because on the primary
  device this *will* happen to honest students.
- It promises **no lockout and no early submission**, which removes the incentive to panic on
  returning — the behaviour that actually loses marks.
- It says short absences are ignored, with the real threshold, so the rule is falsifiable rather
  than a vague warning.
- It ends by saying a human reviews it in context. That is both true of the design and what makes
  the deterrent fair.

Mirror this in the teacher-facing copy on the test-builder screen, so faculty know what the number
they are looking at does and does not mean.

### 3.7 Teacher surface

**(a) Roster column** in the per-student table at
[TestAnalyticsClient.tsx:396-410](src/app/teacher/tests/[id]/analytics/TestAnalyticsClient.tsx#L396-L410):

```
Student Name      Score   Rank   Time     Screen focus
Aarav Sharma      248     3      2h 47m   ✅ No interruptions
Diya Reddy        196     18     2h 51m   ⚠️ 4 times · longest 3m 12s
Kabir Nair        231     7      2h 12m   ⚠️ 11 times · longest 14m 06s
Ishaan Gupta      252     1      2h 58m   ○ 2 times · longest 6s
```

Sortable, with a deliberately calm visual language: `○` for brief-only, `⚠️` once there is any
`extended`/`prolonged` absence. No red, no "CHEATING DETECTED" badge — the column reports a fact.

**(b) Expandable timeline** per attempt, from `GET /api/attempts/:id/events`:

```
09:14:02  Exam started
09:41:18  Left exam screen
09:41:24  Returned              (away 6s · brief)
10:02:55  Left exam screen
10:06:07  Returned              (away 3m 12s · prolonged)   ⚠️
10:31:40  Lost internet connection
10:31:52  Reconnected
11:58:31  Submitted
```

**(c) The honest caveat**, rendered in the panel itself, not just in docs:

> Focus monitoring detects when this exam page loses focus. It cannot detect a second device, another
> person in the room, or printed material. On phones, screen locks and incoming calls produce
> unavoidable entries. Review this together with per-question timing before drawing any conclusion.

### 3.8 What this deliberately does **not** do

Stated so scope does not creep into things that are hostile, ineffective, or both on a phone:

| Not doing | Why |
|---|---|
| Webcam / microphone proctoring | Requires permissions most phones will refuse, is heavy on 4G, and is disproportionate for a coaching mock test. |
| Forced fullscreen lockdown | Unimplementable on iOS ([FBR-04](FinalBugReport.md)); on Android it locks students out of a timed exam. |
| Auto-submit on N tab switches | Guaranteed false positives on phones. An incoming call would end a 3-hour exam. |
| Blocking copy across the whole page | Breaks pinch-zoom and text selection on a phone, which students need to read dense questions. Paste into the answer box is logged instead. |
| DevTools / right-click detection | Trivially bypassed, and a phone has neither. Pure theatre. |
| Keystroke or mouse-movement biometrics | No meaningful signal on touch input. |

---

## 4. Mobile-First Exam Experience

The exam runner is the one screen where phone quality is not a nicety. Depends on
[FBR-08](FinalBugReport.md) (chrome removal) landing first.

### 4.1 Exam-mode chrome removal

```
src/app/student/attempts/[id]/layout.tsx     <- new: requireStudent() only, no AppShell
```

Removes the nav links, Logout button and footer from above a live exam, reclaims ~180 px of vertical
space on a phone, and eliminates the nested-scroll trap. **Zero new serverless functions** — App
Router layouts are not functions.

### 4.2 Portrait layout budget (360 × 640 CSS px, the realistic floor)

```
┌──────────────────────────────────────┐
│ ⏱ 02:47:31      Q12/75      [☰]     │  44px  exam bar: timer, position, palette
├──────────────────────────────────────┤
│ ⚠ You left the exam screen (2nd)  ✕ │  (only when §3 fires)
├──────────────────────────────────────┤
│ PHY · MCQ            +4.00 / −1.00  │  24px
│                                      │
│  A block of mass m rests on an       │
│  inclined plane at angle θ...        │
│                                      │
│        [ diagram ]                   │  ~420px  question + options
│                                      │
│  (A) mg sin θ                        │
│  (B) mg cos θ                        │
│  (C) μmg cos θ                       │
│  (D) Zero                            │
├──────────────────────────────────────┤
│ [Clear] [⚑ Review]    [◀]  [Save ▶] │  56px  one row, 44px targets
└──────────────────────────────────────┘
```

Changes from today:

1. **One action row, not two.** The current bar `flex-wrap`s onto two rows at 360 px
   ([TestRunnerClient.tsx:932](src/app/student/attempts/[id]/TestRunnerClient.tsx#L932)). Icon-only
   Previous/Next and a shortened "⚑ Review" fit one row.
2. **Palette moves into the exam bar** as `☰` — reachable with a thumb at the top, not buried in the
   bottom row.
3. **Subject tabs collapse into the header chip** (`PHY · MCQ`), with subject switching inside the
   palette sheet. Three tabs at 360 px are unreadable anyway.
4. **44 × 44 px minimum tap targets** throughout. Today `size-9` (36 px) palette cells
   ([line 82](src/app/student/attempts/[id]/TestRunnerClient.tsx#L82)) are below the WCAG 2.5.5
   floor — a real mis-tap risk when the mis-tap navigates away from a half-answered question.
5. **`h-[100dvh]`, `overscroll-behavior: none`** — no page scroll, no pull-to-refresh mid-exam.
6. **Sticky timer.** It must never scroll out of view; it is the single most-checked element.

### 4.3 Mobile reliability

| Item | Change |
|---|---|
| `pagehide` beacon | `beforeunload` does not fire on iOS ([FBR-12](FinalBugReport.md)). |
| `keepalive: true` on event POSTs | Survives page freeze. |
| Immutable image caching | ([FBR-20](FinalBugReport.md)) Removes the re-fetch on every revisit. |
| **Low-bandwidth mode** | Load the current question's diagram plus the next one; show a tap-to-load placeholder with a size hint (`Diagram · 34 KB`) for the rest. Saves ~2.5 MB on a 75-question paper. |
| Resume-after-crash | ([FBR-06](FinalBugReport.md)) Reopening restores from IndexedDB and shows *"Welcome back — 2h 14m remaining. All 43 answers restored."* The IndexedDB mirror already works ([TestRunnerClient.tsx:257-270](src/app/student/attempts/[id]/TestRunnerClient.tsx#L257-L270)); only the reassurance is missing. |
| Storage-permission check | IndexedDB throws in iOS Private Browsing. Detect on the instructions page and warn *before* a 3-hour exam, not during. |

### 4.4 Visual polish that survives Constraint A

Kept from `ProposedEnhancements.md`, minus the expensive parts:

- ✅ Deep navy `#070d18` surfaces (already `dark:bg-[#090d16]`) — cheap, correct.
- ✅ Timer escalation: amber under 15 min, crimson under 5. Already partly present
  ([line 733](src/app/student/attempts/[id]/TestRunnerClient.tsx#L733)) — extend to the amber tier.
- ✅ `tnum` tabular numerals on the timer. **Already implemented.**
- ✅ Non-colour state cues on palette cells (✓ / ⚑ / dot). **Already implemented** and genuinely good
  — the doc comment at [line 43-50](src/app/student/attempts/[id]/TestRunnerClient.tsx#L43-L50)
  explains why. `ProposedEnhancements.md` §3.3 proposed this as new work; it is done.
- ✅ Option-select feedback: 150 ms border/background transition. **Drop the `scale-[1.01]`** — a
  transform on a tapped element on Android reads as a rendering wobble, not a confirmation.
- ❌ Glassmorphic headers — dropped (Constraint A).
- ❌ Second display font — dropped (Constraint A).

---

## 5. Student Flow

### 5.1 `GET /api/auth/me` — kept as proposed

Highest value-per-line item in the original document. Fixes
[FBR-19](FinalBugReport.md); costs zero functions (one `if` in `router.ts`). Full code in the bug
report.

### 5.2 Section review before submit — mostly already built

`ProposedEnhancements.md` §4.3 describes this as missing. It is **not**: the submit modal already
renders a per-subject table of Answered / Not Answered / Marked / Not Visited with a totals row
([TestRunnerClient.tsx:1108-1160](src/app/student/attempts/[id]/TestRunnerClient.tsx#L1108-L1160)).

Three real gaps remain:

1. **"Jump to first unanswered"** button — closes the modal and calls `goToQuestion` on the first
   `seen_unanswered` or `not_seen` index. ~10 lines.
2. **The Answered & Marked note.** The table splits "Marked" from "Answered" but never states that
   *Answered & Marked for Review is still evaluated*. Students routinely believe marking withdraws
   an answer. Add the footnote from `ProposedEnhancements.md`:
   *"Questions Answered & Marked for Review **will** be evaluated for marks."*
3. **Fix the counts first.** Today the table is *wrong* whenever a student selected an option without
   pressing Save & Next ([FBR-07](FinalBugReport.md)) — it reports those under "Not Ans" while the
   grader scores them. A more prominent summary built on incorrect numbers is worse than no summary.
   **FBR-07 is a hard prerequisite.**

### 5.3 Pre-exam readiness check — rescoped

Drop the latency ping (it measures serverless cold-start, not the student's connection). Keep what a
phone student actually needs, all client-side, no API calls:

```
Before you begin — quick device check

✅ Maths renders correctly       ∫₀¹ x² dx = ⅓      ← tap if this looks wrong
✅ Diagrams load                 [ sample image ]
✅ Answers can be saved offline  IndexedDB available
⚠️ Notifications are on          Silence them — see section 5
```

The KaTeX check is worth keeping on its own: a student who sees raw `\int_0^1` should find out now,
not 40 minutes into a Maths section.

### 5.4 Solution Explorer & Revision Notebook — kept

`ProposedEnhancements.md` §4.4, unchanged in substance. Two notes:

- The data is already there — `timeSpentMs` and `expectedTimeS` are both persisted, so
  `Overtime (⏱ > 1.5× expected)` and `Unforced errors (< 45s, incorrect)` are pure client-side
  filters over the existing result payload. **No API change, no new function.**
- Bookmarks need one table. Keep it minimal and scoped to the student:

```sql
CREATE TABLE IF NOT EXISTS question_bookmarks (
  student_id  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  note        text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (student_id, question_id)
);
```

`/student/bookmarks` becomes a new branch in the existing
[`/student/[[...slug]]`](src/app/student/[[...slug]]/page.tsx) dispatcher — zero functions. Gate it
behind `!is_provisional` ([FBR-03](FinalBugReport.md)), or it becomes a question-bank export tool.

---

## 6. Faculty Cockpit

### 6.1 Direct Supabase Storage upload — kept and promoted, but ship the guard first

`ProposedEnhancements.md` ranks this #1. Agreed on substance. One sequencing correction: today a
teacher uploading a 9 MB paper sees *"Network error: Could not connect to server"*
([FBR-15](FinalBugReport.md)) — a hard platform limit disguised as a flaky network.

**Step 1 (hours, not days):** honest client-side guard + honest server constant. Do this before any
storage work.

**Step 2:** the pre-signed flow as proposed —

```
POST /api/papers/upload-url   -> signed Supabase Storage PUT URL
browser  --PUT-->  Supabase Storage  (progress bar, up to 50 MB)
POST /api/papers              -> register { fileKey, sha256, pageCount }
```

Both new endpoints are module exports on the existing router. Notes not in the original: the SHA-256
de-dup check ([papers/index.ts:58-65](src/server/api/papers/index.ts#L58-L65)) must move to
*before* the signed URL is issued, or duplicate blobs accumulate in the bucket; and `pdf-lib` page
counting must move client-side, since the server never sees the bytes.

### 6.2 PDF Crop Studio v2 — kept

`ProposedEnhancements.md` §5.2, unchanged. Teacher-only, desktop-only, so Constraint A does not
apply. Zoom/pan is the high-value half; treat auto-detect as speculative.

### 6.3 Live monitor — rescoped from "real-time" to "recent"

Vercel Hobby serverless functions cannot hold WebSockets, so "Real-Time Live Proctoring Cockpit" is
not deliverable as written. Rescoped:

- `/teacher/tests/[id]/live` — a branch in the existing teacher dispatcher, **zero functions**.
- **20-second polling** of one endpoint returning a compact snapshot: candidates in progress,
  answers-per-minute, per-student last-heartbeat age, and the §3 focus counters.
- **"Last seen"** derived from `attempt_answers.updated_at` — the 15 s autosave heartbeat
  ([TestRunnerClient.tsx:331-336](src/app/student/attempts/[id]/TestRunnerClient.tsx#L331-L336))
  already provides this signal at no extra cost. No new heartbeat endpoint needed.
- Flag `> 90 s` since last heartbeat as "connection lost" — 6× the heartbeat interval, so a single
  dropped sync on 4G does not trigger it.
- **Interaction with [FBR-21](FinalBugReport.md):** a teacher polling every 20 s during a
  100-candidate exam adds load exactly when the platform is most loaded. Ship `apiSessionFast`
  first, keep the snapshot to a single aggregate query, and cap the view to one polling teacher.

### 6.4 Test Simulator — kept, with the ranking caveat made explicit

`ProposedEnhancements.md` §5.3, kept. The `is_simulation: true` flag is necessary but not sufficient:
`v_test_ranks`, [analytics/cohort.ts](src/server/api/analytics/cohort.ts),
[analytics/test-by-id.ts](src/server/api/analytics/test-by-id.ts), both CSV exports, and
`StudentDashboardView`'s `completedCount` must all exclude it. That is six call sites — the same
filter obligation as `is_provisional` ([FBR-03](FinalBugReport.md)), so **build one shared
`realAttempts()` predicate and use it everywhere**, rather than adding two independent flags that
each get forgotten in a different query.

### 6.5 Roster CSV export & bulk batch move — kept

`ProposedEnhancements.md` §5.4, unchanged. `POST /api/students/bulk-batch`
([bulk-batch.ts](src/server/api/students/bulk-batch.ts)) already exists, so the bulk move is mostly
a UI task. The export must be gated to exclude `is_provisional` rows by default — a CSV of every
phone number that ever touched the landing page is a data-protection liability, not a roster.

---

## 7. Architecture

### 7.1 Rate limiting — Postgres, not Upstash

`ProposedEnhancements.md` §6.1 recommends Upstash Redis. **Changed.** Rationale and full SQL in
[FBR-14](FinalBugReport.md): Postgres gives an atomic distributed counter with no new vendor, no new
secrets, and no extra network hop on the login path. Keep the in-memory limiter as a free
first-tier filter. Use `pg_advisory_xact_lock` for the rare case that needs true serialisation.

### 7.2 Tiered authentication

**New**, and the highest-leverage scalability item in this document —
see [FBR-21](FinalBugReport.md). Today every heartbeat, every event POST and every diagram fetch
costs a `profiles` round-trip. At 100 candidates that is ~4,800 auth queries per minute on a
free-tier pooler, and it will present as random 500s rather than a clean capacity error.
`apiSessionFast()` (JWT-only) on self-scoped high-frequency writes removes ~95% of that load.

### 7.3 Typed API client — kept

`ProposedEnhancements.md` §6.4, unchanged. There is a natural home for it:
[src/lib/api-routes.test.ts](src/lib/api-routes.test.ts) and `ALL_REGISTERED_ROUTES`
([router.ts:255+](src/server/api/router.ts#L255)) already enumerate every route, so the client can be
type-checked **against the router's own registry** — making client/server URL drift a compile error
rather than a runtime 404. That is a stronger guarantee than the original proposal described.

### 7.4 `bytea` migration — kept

`ProposedEnhancements.md` §6.2, unchanged. Migration SQL and the PGlite caveat in
[FBR-25](FinalBugReport.md). Sequence it **after** [FBR-09](FinalBugReport.md)'s orphan reaper —
migrating orphaned blobs wastes the effort and doubles peak storage during the copy.

### 7.5 Anti-cheating telemetry

`ProposedEnhancements.md` §6.3 proposed this as new work. It is **half-built and undisclosed** —
see §3 and [FBR-16](FinalBugReport.md). The original's teacher-facing string was
*"⚠️ Candidate switched browser tabs 4 times during the examination."* That framing is what §3.2
principle 3 rejects: on a phone, "switched tabs 4 times" is as likely to mean four notifications as
four lookups. Report duration and let a human judge.

---

## 8. Roadmap

Ordered so each phase unblocks the next. Bug fixes are interleaved where an enhancement depends on
one — building on a broken foundation is the failure mode this ordering exists to prevent.

```
PHASE 0 — Security & correctness gate  (1-2 days)   ⛔ BLOCKS PUBLISHING NEW TESTS
├── FBR-03  close open provisioning + answer-key exposure   [A9]
├── FBR-01  student batch filter SQL
├── FBR-13  require SESSION_SECRET in production
├── FBR-07  option selection sets `answered`  (prerequisite for §5.2)
└── FBR-15  honest 4 MB upload guard  (hours; §6.1 step 1)

PHASE 1 — Make the exam reliable on a phone  (4-5 days)
├── FBR-08  runner out of AppShell; own layout            [A2]
├── §4.2    portrait layout, one action row, 44px targets [A3]
├── FBR-12  pagehide + keepalive beacon                   [A4]
├── FBR-04  delete dead fullscreen barrier + ESLint rule
├── FBR-06  5-min external cron, bounded sweep, self-heal [A5]
├── FBR-10  clamp attempt deadline to closesAt
└── FBR-20  immutable image caching                       [A7]

PHASE 2 — ⭐ Basic proctoring  (3-4 days)   ← the requested feature
├── §3.3    duration_ms migration + index
├── §3.4    client: duration tracking, 2s floor, banner, 4 unused event types
├── §3.5    GET /api/attempts/:id/events + roster aggregate   (0 new functions)
├── §3.6    ⭐ Instructions section 5 + declaration copy      (ship WITH §3.4, never after)
└── §3.7    teacher roster column, timeline, honest caveat

PHASE 3 — Data integrity & scale  (3-4 days)
├── FBR-02  scope solution ingest to humanCode
├── FBR-05  normalise + unique phone across all 4 write paths
├── FBR-09  purge media on bulk delete + orphan reaper
├── FBR-18  clone in one transaction
├── FBR-21  apiSessionFast on hot paths                   [A8]
├── FBR-14  Postgres rate limiting  (§7.1)
└── FBR-22  is_gradeable() in SQL

PHASE 4 — Student experience  (4-5 days)
├── §5.1    GET /api/auth/me
├── §5.2    jump-to-unanswered + Answered & Marked note
├── §5.3    pre-exam device check
├── §4.3    low-bandwidth mode + resume-after-crash       [A10]
├── FBR-11  relabel shuffled options                      [A6]
└── FBR-24  FBR-30  dismissible overlays, shared palette  [A11]

PHASE 5 — Faculty cockpit  (5-7 days)
├── §6.1    pre-signed Supabase Storage upload (step 2)
├── §6.2    PDF Crop Studio v2 zoom & pan
├── §6.5    roster CSV export + bulk batch move
├── §6.3    /teacher/tests/[id]/live  (20s polling)
└── §6.4    Test Simulator + shared realAttempts() predicate

PHASE 6 — Debt & polish  (2-3 days)
├── §5.4    Solution Explorer + Revision Notebook
├── FBR-25  bytea migration  (after FBR-09's reaper)
├── §7.3    typed API client against ALL_REGISTERED_ROUTES
├── §4.4    timer escalation tier, option-select transition
└── FBR-23  FBR-28  FBR-29  copy, landing toggle, middleware matcher
```

### Why Phase 2 sits where it does

Proctoring is the requested feature, but it is third, not first, and the ordering is deliberate:

- **Phase 0 is a security gate.** While [FBR-03](FinalBugReport.md) is open, anyone can obtain a
  session and read every answer key. Monitoring tab switches inside an exam whose answer key is
  already public is not proctoring.
- **Phase 1 makes the signal trustworthy.** Today the runner sits under a Logout button
  ([FBR-08](FinalBugReport.md)) and loses answers on the primary device
  ([FBR-12](FinalBugReport.md)). If a phone student's tab is killed and answers vanish, the focus
  telemetry records a "prolonged absence" for a platform bug — flagging honest students for the
  platform's own defect. Fix the exam, then measure it.
- **§3.6 ships with §3.4, never after.** The disclosure and the collection are one change. The
  system is already collecting focus data with no disclosure, which is the wrong default; shipping
  the read path first would deepen that, not fix it.

### Constraint ledger

| Constraint | Status after all six phases |
|---|---|
| Serverless functions | **7 / 12** — unchanged. Every new endpoint is a router module export; every new screen is a dispatcher branch or an App Router layout. |
| Request payload | Respected — 4 MB client guard now, direct-to-storage later. Nothing else exceeds it. |
| Vercel cron (1/day) | Kept as a backstop; the 5-minute tick moves to cron-job.org (already a documented dependency). |
| New paid services | **None.** Upstash dropped in favour of Postgres. |
| New free-tier vendors | **None** beyond Supabase Storage, which is the same project's existing bucket. |
| Monthly cost | **$0.00** |
| Phone-first | Now an explicit design constraint rather than an afterthought: it drove the drop of glassmorphism, the second font and landscape mode, and it drove the addition of §3.2, §4.2 and §4.3. |
| Local dev (PGlite) | Preserved. Only the `bytea` migration touches the shared storage path — exercise both drivers ([README.local.md](README.local.md)). |
| NTA compliance | Strengthened, not weakened: [FBR-07](FinalBugReport.md) restores the marking contract the instructions already promise, and [FBR-11](FinalBugReport.md) restores conventional option lettering. |
