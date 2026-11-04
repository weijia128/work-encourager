# 2026-11-04-work-encourager Review Log

---

## Code Review Round 1 — 2026-11-04

**Scope**: Task 0 (steps 3, 4), Task 1, Task 2 — `vitest.config.ts`, `package.json`, `tsconfig.node.json`, `src/domain/{dates,holidays,workdays,earnings}.ts` + tests
**Build Status**: PASS (`pnpm test` 31/31, `pnpm build` clean, coverage 99.1% lines / 98.5% branches)

Overall: matches the plan's interfaces and values exactly; all planned test cases present plus a zero-workday guard. Good catch on the plan's bigSmall example (10-31 is one week before 11-07, so it rests).

### Issues

#### Issue 1 (High): `computeSnapshot` exceeds the 50-line function limit
**File**: src/domain/earnings.ts:116
The function is ~65 lines, violating the user's hard limit (functions < 50 lines).
**Fix**: Extract helpers, e.g. `parseDayShape(schedule) -> { start, end, lunchSecs, dailySeconds }` and `monthTotals(beforeCount, workedSeconds, todayProgress, total, dailyWage, perSecond, salary) -> { monthEarned, monthProgress }`. Keep the public signature and behaviour unchanged; all existing tests must still pass.

#### Issue 2 (Medium): reassigned `let` bindings conflict with the immutability rule
**File**: src/domain/earnings.ts:87 (`let worked … worked -= overlap`), src/domain/earnings.ts:152 (`let monthEarned / monthProgress`)
**Fix**: Express both as `const` expressions (e.g. `const overlap = lunchSecs ? Math.max(0, …) : 0; return clamped - start - overlap;` and have the extracted `monthTotals` return an object from a ternary). Local `Map`/`Date` building in `buildCalendar`, `mondayOf`, `workdaysInMonth` is fine — they never escape mutated.

#### Issue 3 (Low): `coverage/` output is not git-ignored
**File**: .gitignore
**Fix**: Add `coverage/`.

#### Issue 4 (Low): plan text still contains the wrong bigSmall example
**File**: docs/superpowers/plans/2026-11-04-work-encourager.md (Task 1 Step 2)
**Fix**: Change "10-31 true (two weeks before)" to "10-31 false (one week before), 10-24 true (two weeks before)" so the plan matches the tests.

### Verdict: NEEDS_FIX

Note: commits could not be made inside the Codex sandbox (`.git` read-only). The orchestrator will commit after approval.

---

## Code Review Round 2 — 2026-11-04

**Scope**: fixes for Round 1 — `src/domain/earnings.ts`, `.gitignore`, plan Task 1 Step 2
**Build Status**: PASS (`pnpm test` 31/31, `pnpm build` clean)

All four issues fixed as recommended: `computeSnapshot` split into `parseDayShape` / `todaySlice` / `monthTotals` (now ≤50 lines, behaviour unchanged), no reassigned `let` left in `src/domain/`, `coverage/` ignored, plan example corrected.

### Verdict: APPROVED
