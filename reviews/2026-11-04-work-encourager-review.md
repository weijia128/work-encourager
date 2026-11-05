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

---

## Code Review Round 7 — 2026-11-04

**Scope**: Task 6 — `src-tauri/src/{lib,tray}.rs`, `tauri.conf.json`, capabilities, tray icons, `src/services/platform.ts`, `src/App.tsx`
**Build Status**: PASS (`cargo clippy --offline -D warnings` clean, `pnpm test` 64/64, `pnpm build` clean); `cargo fmt --check` FAILS

Window config matches the plan (380×680, fixed, always-on-top, `backgroundThrottling: "disabled"`), close→hide, Accessory policy, single-instance shows the panel, badge switches template off so the red dot keeps its colour. Good.

### Issues

#### Issue 1 (Medium): tray icon is decoded and re-set on every tick
**File**: src-tauri/src/tray.rs:55 (`set_tray_status`)
The frontend calls this once per second. Re-decoding the PNG and calling `set_icon_with_as_template` every second wastes CPU and can make the menu-bar icon flicker on macOS.
**Fix**: Keep the last badge state in managed state (e.g. `struct TrayBadge(Mutex<Option<bool>>)` registered with `.manage(...)`), and only swap the icon when the badge value changes. Title/tooltip may still update every tick.

#### Issue 2 (Medium): menu item `显示面板` toggles instead of showing
**File**: src-tauri/src/tray.rs:43
If the panel is already visible, choosing `显示面板` hides it — contrary to its label.
**Fix**: Add `show_window` (show + unminimize + set_focus) for the menu item and the single-instance callback; keep `toggle_window` for left-click only.

#### Issue 3 (Low): Rust code not rustfmt-formatted
**Fix**: Run `cargo fmt --manifest-path src-tauri/Cargo.toml`.

#### Issue 4 (Low): window errors silently discarded in `toggle_window`
**File**: src-tauri/src/tray.rs:33 — `let _ = result;` hides failures. Acceptable for a UI click handler; consider `eprintln!` in debug builds only. Optional.

### Verdict: NEEDS_FIX (Medium items fixed now because Issue 1 affects the every-second hot path)

---

## Code Review Round 8 — 2026-11-05

**Scope**: fixes for Round 7 + Task 6 Step 5 manual check
**Build Status**: PASS (`cargo fmt --check`, `cargo clippy --offline -D warnings`, `pnpm test` 64/64, `pnpm build`)

Issues 1–3 fixed: badge icon swapped only on change via managed `TrayBadge` state; `显示面板` and single-instance now call `show_window`; rustfmt applied. Issue 4 left as-is (optional, accepted).

Manual check (temporary harness in `main.tsx`, reverted): user confirmed the macOS menu bar shows `💰 ¥N.00` ticking every second; it kept ticking for ~3.3 h unattended. `set_tray_status` returned no errors in the dev log. Hide/toggle/quit behaviours still to be confirmed in the final acceptance checklist (Task 12).

### Verdict: APPROVED

---

## Code Review Round 9 — 2026-11-05

**Scope**: Task 7 — `src/services/ServicesContext.tsx`, `src/components/SetupWizard.tsx` + test, `src/App.tsx`, `src/main.tsx`, `src/test/fakes.ts`; plus a Task 6 defect found during manual testing
**Build Status**: PASS (`pnpm test` 68/68, `pnpm build` clean). `pnpm format:check` FAILS (Prettier now installed, printWidth 100).

Behaviour is right: field order and labels match the plan, 大小周 mapping correct, lunch null, month stamped, store-load failure shows a Chinese message, platform failures don't block saving.

### Issues

#### Issue 1 (High): the line limit is met by cramming, not by decomposition
**File**: src/components/SetupWizard.tsx (whole file), src/App.tsx:14-16, src/main.tsx:12
JSX lines run to 300–400 characters; the form is one component. This defeats the "functions < 50 lines / small focused files" rule and is unreadable.
**Fix**: Split the wizard into section components (e.g. `BasicsSection`, `ScheduleSection`, `RestPolicySection`, `WatchlistSection`, `WishlistSection`, `OptionsSection`) under `src/components/setup/`, plus a pure `formToSettings(form, now)` / `settingsToForm(initial, now)` module with its own unit tests. Then run `pnpm format` (Prettier, already installed) over `src/` and make `pnpm format:check` pass. Keep every function < 50 formatted lines.

#### Issue 2 (High): some validation errors are invisible
**File**: src/components/SetupWizard.tsx:44-47
Errors for paths that have no `fieldError` slot (e.g. `wishlist.0.name` empty wish name, `wishlist.0.price`, `lunch.start` bad format, `workStart`) are collected but never rendered, so pressing `开始上班` appears to do nothing.
**Fix**: Render an error under each wish row and under 上班时间; and show a summary line above the submit button listing any error whose path has no dedicated slot. Add a test: an empty wish name shows `心愿名称不能为空`.

#### Issue 3 (Medium): the wizard has no styling
**File**: src/App.css
It renders as raw browser form controls inside a 380 px window. 
**Fix**: Add `src/styles.css` (imported in `main.tsx`) with the panel-v2 look — system font stack, white card, 12 px radius, 8–12 px spacing, labelled rows, primary button `#1f4e9c`; field errors in `#d63031` 12 px. Remove the scaffold's unused CSS rules.

#### Issue 4 (High, from Task 6 manual test): `tray-badge.png` is a corrupt PNG
**File**: src-tauri/icons/tray-badge.png
Decoding fails (`Unknown filter method 214`): its decompressed IDAT is 4324 bytes instead of 32×(32×4+1)=4128 — badge rows were written with extra bytes. Every badge switch errors, so the red dot never shows.
**Fix**: Regenerate it with a correct writer (each row = 1 filter byte 0 + 128 bytes RGBA). Add a Rust unit test in `tray.rs` (`#[cfg(test)]`) asserting both `icon(TRAY_ICON)` and `icon(TRAY_BADGE_ICON)` decode to 32×32. Run `cargo test --offline --manifest-path src-tauri/Cargo.toml`.

### Verdict: NEEDS_FIX

---

## Code Review Round 10 — 2026-11-05

**Scope**: fixes for Round 9
**Build Status**: PASS (`pnpm format:check`, `pnpm test` 71/71, `pnpm coverage` 97.2% lines, `pnpm build`, `cargo test --offline` 1/1, `cargo clippy --offline -D warnings`)

All four fixed: wizard split into six section components + pure `form.ts` (with unit tests), every file ≤ 100 lines and Prettier-clean; inline errors for every field plus a fallback summary (empty-wish test added); `src/styles.css` added; `tray-badge.png` regenerated (IDAT now exactly 4128 bytes) with a Rust decode test.

### Notes (Low, carry into Task 8)
- `SetupWizard` renders a debug footer `本月：… · 本周一：…` that is not in the spec. Remove it.
- `useMemo(..., [reference])` never memoizes because `reference` is a new `Date` on every render. Drop the memo.

### Verdict: APPROVED

### Addendum — user feedback from the manual wizard run (2026-11-05)
- **Watchlist chips are delete-buttons.** Clicking a chip (which users read as "select") removes it, and the user ended up with an empty 关注品种 box with no way to add back. Fix: make only a small `×` inside the chip remove it; add a `恢复默认` link when the list is empty. The `＋ 添加` search dialog (Task 9) must also be usable from the wizard.
- **No way to reopen settings after setup.** Pull Task 11 (SettingsView) forward to right after Task 8, so the `⚙ 设置` button works.

### Task 8 follow-up — 2026-11-05

The Round 10 notes and manual-run addendum are resolved: the wizard debug footer and ineffective `useMemo` were removed; watchlist text is inert, removal is available through the small `×`, and an empty list offers `恢复默认`. Settings can now be reopened from the panel through the temporary prefilled wizard flow.

---

## Code Review Round 11 — 2026-11-05

**Scope**: Task 8 — `Panel` + sub-components, `useNow`, `useTraySync`, `monthPrompt`, `App.tsx`, styles; Round 10 notes + user-feedback fixes
**Build Status**: PASS (`pnpm format:check`, `pnpm test` 75/75, `pnpm coverage` 96.9% lines, `pnpm build`)

Round 10 notes fixed (debug footer and memo removed; chip × only; `恢复默认`). Per-minute integer tray sync is implemented exactly as the 2026-11-05 decision says. The layout follows panel-v2.

### Issues

#### Issue 1 (High): copy never rotates
**File**: src/components/Panel.tsx:30 — `buildCopyCandidates(...)[0]` always shows the first candidate.
**Fix**: Use `pickCopy(ctx)`, which rotates every 30 s, and add a Panel test showing that the copy changes when `now` advances 30 s and there are two or more candidates.

#### Issue 2 (Medium): menu bar freezes while the settings screen is open
**File**: src/App.tsx — `useTraySync` lives inside `Panel`, so while `editing` is true (or before setup is finished) the tray is never updated.
**Fix**: Lift the `now`/snapshot/tray sync into an App-level component that is mounted whenever settings exist, and render Panel or the settings screen beneath it.

#### Issue 3 (Medium): `去修改` does not clear the month prompt
**File**: src/App.tsx:38 — editing preserves the old `lastConfirmedMonth`, so after `去修改 → 保存` the red dot and prompt remain. The plan says either button sets it.
**Fix**: When the edit was opened from the month prompt, stamp the current month on save (for example, `onOpenSettings({ fromMonthPrompt: true })`).

#### Issue 4 (Low): the tray tooltip format differs from the plan
**File**: src/hooks/useTraySync.ts:14 — should be `{称呼}，{label} · 今日 ¥x.xx`.

#### Issue 5 (Low): minor cleanups
`monthPrompt.ts` reimplements the month string twice (reuse `monthKey`); the calendar effect in `App.tsx` depends on `services.market` for no reason; the `dateText` builder in `Panel.tsx` should be a small `formatClock(now)` helper in `dates.ts` with a test.

### Verdict: NEEDS_FIX — committed as-is because it is functional, with the fixes going into the next Codex run together with Task 11

### Round 11 follow-up — 2026-11-05

All five Round 11 issues were fixed: copy rotation now uses `pickCopy`; live snapshot and tray synchronization remain mounted while SettingsView is open; month-prompt edits confirm the current month after saving; tray tooltips include nickname and exact status; and date/month helper duplication was removed with `formatClock` coverage. Task 11 is implemented with a formal SettingsView, cancel flow, preserved month confirmation, and platform-setting reapplication.
