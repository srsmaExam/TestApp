# Bug Fix Release Summary

## Wave 1 (P0) — commit `f766bdb`

- **FBR-01**: Fixed the batch-filter positional-parameter crash on `/teacher/students`; added a 25-test regression suite.
- **FBR-02**: Standalone solution ingest no longer overwrites cross-subject questions sharing a `sourceQno` — now requires `humanCode` or refuses with 422/409.
- **FBR-03**: Closed the phone-login exfiltration hole — auto-provisioned accounts are now `isProvisional`, gated to `audience: 'public'` tests only, excluded from all cohort analytics, and never receive answer keys/solutions. Added a "Prospective Leads" teacher tab with a convert-to-enrolled action.

## Wave 2 (P1 exam runner + identity) — commit `92a2d51`

- **FBR-04**: Removed the dead fullscreen barrier (`window.status` bug) and the no-op auto-fullscreen call; added an ESLint `no-restricted-globals` rule so this can't recur.
- **FBR-08**: Moved `AppShell` out of the runner (report's proposed fix was structurally impossible — documented why); runner now owns the full viewport with no nav/logout escape hatch.
- **FBR-07**: Selecting an option or typing a value now saves immediately (NTA semantics) instead of requiring "Save & Next"; added a server-side repair in `saveAttemptAnswersBatch`.
- **FBR-12**: `pagehide` + `sendBeacon` is now the authoritative flush; `beforeunload` kept only for the desktop confirm dialog.
- **FBR-05**: Discovered the bug report was imprecise here — a unique index already existed from migration 0004, but on an *unnormalized* column, so different string formats of the same number could coexist. Fixed via normalization at all 4 write paths, ambiguous-match refusal in login, and new report/backfill scripts (`report:phone-dupes`, `backfill:phone-e164`).

## Verification

**Verified:** 149/149 tests pass, clean typecheck, 0 lint errors, production build succeeds with only 3 dynamic routes (well under the 12-function cap).

## Remaining Work

**Not started:** Wave 3 (FBR-06, 09, 10, 17, 18, 22) and Wave 4 (FBR-11, 13–16, 19–21) per `BuildPlan-BugFixes.md`. Resume there when ready.
