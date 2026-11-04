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

---

## Code Review Round 3 — 2026-11-04

**Scope**: Task 3 — `src/domain/settings.ts`, `src/services/{kvStore,settingsRepo,holidayLoader}.ts`, `src/test/fakes.ts`, Rust store-plugin registration
**Build Status**: PASS (`pnpm test` 48/48, `pnpm build` clean, coverage 95.5% lines overall, `cargo check` clean)

Note: Codex was cut off by the relay ("Selected model is at capacity") after finishing the code but before its final report; results verified independently here.

All planned interfaces present; every rejection case from the plan is covered with its Chinese message; `loadCalendar` handles bundled / cached / fetched / failed years as specified (Review Focus #2 covered).

### Issues

#### Issue 1 (Medium): very long single-line declarations hurt readability
**File**: src/domain/settings.ts:17-24
Several schema lines exceed 150 characters (wishSchema, restPolicySchema).
**Fix**: Break into multi-line object literals; consider reusing `parseHHMM` from `dates.ts` in `superRefine` instead of the local `minutes` helper.

#### Issue 2 (Low): a cache write failure discards freshly fetched holiday data
**File**: src/services/holidayLoader.ts:18
If `kv.set` throws after a successful fetch, the outer catch returns `[]`.
**Fix**: Wrap only the `kv.set` in its own try/catch and still return `days`.

#### Issue 3 (Low): plan checkboxes for Task 3 not marked
**Fix**: Mark Task 3 steps 1–4 `[x]`.

### Verdict: APPROVED (Medium/Low items folded into the next Codex batch)

---

## Code Review Round 4 — 2026-11-04

**Scope**: Task 4 — `src/domain/market.ts`, `src/services/{eastmoney,http}.ts`, http plugin registration; Round 3 fixes in `settings.ts`, `holidayLoader.ts`
**Build Status**: PASS (`pnpm test` 55/55, `pnpm build` clean, `cargo check` clean with store + http plugins)

Round 3 items fixed (schema reformatted, cache-write failure no longer drops fetched data, plan marked). Task 4 matches the plan's interfaces; parsers zod-validate and throw on malformed payloads (Review Focus #3, parser half); search keeps only market 0/1; http capability scoped to the two allowed hosts.

### Issues

#### Issue 1 (Medium): `httpFetchJson` has no timeout
**File**: src/services/http.ts:4
On a flaky or captive network the request can hang indefinitely, so chips would never be marked `未更新`.
**Fix**: Pass a timeout (plugin-http `connectTimeout`, plus an `AbortSignal.timeout(10_000)`), so failures surface as rejections within ~10 s.

#### Issue 2 (Low): `market.test.ts` bundles several plan cases into one `it`
**File**: src/domain/market.test.ts:18
`isTradingTime` cases (10:00 / 12:00 / 15:01 / Saturday) are asserted in a single test; failures will be less precise. Acceptable.

### Verdict: APPROVED (Issue 1 folded into the next Codex batch)

---

## Code Review Round 5 — 2026-11-04

**Scope**: Task 5 — `src/domain/copywriter.ts`, `src/data/items.ts`, tests; Round 4 fix in `src/services/http.ts`
**Build Status**: PASS (`pnpm test` 63/63, `pnpm build` clean)

Round 4 timeout fixed (`connectTimeout` + `AbortSignal.timeout(10_000)`). Copy templates match Global Constraints exactly; rotation is deterministic.

### Issues

#### Issue 1 (High): lunch start is hard-coded to 12:00
**File**: src/domain/copywriter.ts:62 (`lunchStartCountdown`)
Users set their own lunch time (or none). With lunch 11:30–12:30 the `开饭` line shows at the wrong time; with `lunch: null` it still appears. `Snapshot` carries no lunch info, so `CopyContext` cannot know it — this is a gap in the plan's interface.
**Fix**: Add `readonly lunchStart: string | null` ('HH:MM', from `Settings.lunch?.start`) to `CopyContext`; compute the countdown with `parseHHMM` / `secondsSinceMidnight` from `dates.ts`; return null when `lunchStart` is null. Add tests: custom lunch 11:30 shows the line at 11:10 and not at 11:45; `lunchStart: null` never shows it.

#### Issue 2 (Medium): `ITEMS` is not in ascending price order
**File**: src/data/items.ts:26-28
`一台相机 3999`, `一趟长途旅行 5000`, `一台游戏主机 3999`: `ITEMS.find(price > todayEarned)` depends on ascending order, as the plan requires.
**Fix**: Sort ascending (or derive with a sorted copy) and add a test asserting `ITEMS` is ascending.

#### Issue 3 (Low): mixed-language item name
**File**: src/data/items.ts:31 — `一台电动 scooter` → `一台电动滑板车`.

#### Issue 4 (Low): unnecessary type re-export
**File**: src/domain/copywriter.ts:last line — `export type { Instrument, ShopItem }` is unused; remove.

### Verdict: NEEDS_FIX

---

## Code Review Round 6 — 2026-11-04

**Scope**: fixes for Round 5 — `src/domain/copywriter.ts`, `src/data/items.ts`, tests, plan Task 5 interface
**Build Status**: PASS (`pnpm test` 64/64, `pnpm build` clean)

All four issues fixed: `CopyContext.lunchStart` added (plan updated), lunch countdown uses the user's lunch start via `parseHHMM`, null lunch suppresses the line, with tests; `ITEMS` ascending with a test; item renamed; stray re-export removed.

### Verdict: APPROVED
