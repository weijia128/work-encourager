# 上班鼓励器 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A Tauri 2 desktop app for macOS and Windows. It shows today's earnings live in the menu bar or tray and in a floating panel. It compares "本月上班进度" with the month-to-date change of A-share instruments, and includes rotating fun copy plus a 功德木鱼 button.

**Architecture:** All business rules are pure TypeScript functions in `src/domain/`: workdays, earnings snapshot, market math and copy. They take `now: Date` explicitly and are unit-tested to ≥80%. Side effects sit behind small interfaces in `src/services/` (key-value store, market provider, platform/tray) and are injected through React context, so components test with fakes. The Rust side is a thin shell. It handles the tray/menu-bar, hide-on-close, single instance and plugins, and exposes one command (`set_tray_status`) that the frontend calls once per second.

**Tech Stack:** Tauri 2, Rust (stable via rustup), React + TypeScript (strict) + Vite, pnpm, Vitest + @testing-library/react, zod. Tauri plugins: store, http, autostart, single-instance.

**Spec:** `docs/superpowers/specs/2026-11-04-work-encourager-design.md`. The approved panel mockup is `.superpowers/brainstorm/8351-1793757523/content/panel-v2.html`.

## Global Constraints

- One codebase builds for macOS and Windows. v1 has no code signing, notarization or auto-update.
- All earnings math uses the machine's local wall clock and is recomputed from `now` every tick, never accumulated. That way sleep or lid-close cannot drift the numbers.
- Daily wage = 月薪 ÷ 当月实际工作日数. Per-second = daily wage ÷ effective work seconds (work span minus lunch). 本月进度 = 本月已赚 ÷ 月薪, and it equals exactly 1 after the last workday ends.
- The calendar beats the rest policy. Statutory off-days are always rest, and 调休补班 days are always work. 单休 rests on Sunday. 大小周: the small week works Saturday, and weeks alternate continuously by calendar week with no reset at holidays.
- There is no start/stop/"关闭计时器" button. Leave, overtime and other special schedules are not modelled. Settings reject overnight shifts.
- No OS dialogs or notifications. The only prompt is the in-panel "本月设置有变化吗？", signalled by a tray-icon red dot.
- Display: panel today-earned has 4 decimals (`¥79.2008`), menu bar/tray has 2 decimals (`💰 ¥79.20`). Up is red `#d63031`, down is green `#2e8b57`.
- Status labels, exact: `还没上班`, `上班中`, `午休中`, `已下班`, `今天休息`. They are shown as `{称呼}，{label}`.
- Copy templates, exact: `再过 {剩余时间}，{物品} 就赚回来了`, `本月已经赚出 {N} 个 {心愿}`, `坚持住，还有 {m} 分钟开饭`, `最后 {m} 分钟，每一秒都是纯赚`, `本月上班又跑赢了{品种名} ✌️`. Every copy line is prefixed `{称呼}，`.
- Default watchlist: 沪深300 `1.000300`, 科创50 `1.000688`, 黄金ETF `1.518880`. Search may add A-share indices, ETFs and stocks (market 0 or 1). No futures.
- Defaults: autostart off, panel always-on-top on, 木鱼 sound off.
- Only two network hosts: `*.eastmoney.com` (quotes and search) and `cdn.jsdelivr.net` (holiday data). Everything else stays local.
- User coding rules: immutable updates only, files ≤400 lines, functions <50 lines, no `console.log`, validate input with zod, ≥80% coverage on `src/domain/**` and `src/services/**`.
- Commit format `<type>: <description>`, ending with `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.

## Review Focus

1. **Panel hidden for a long time.** The menu-bar number must keep ticking every second while the panel window is hidden or minimised, because WKWebView timer throttling could freeze it. Owned by Task 6, with `backgroundThrottling: "disabled"` and a manual check.
2. **No holiday data for the current year.** For example, it is January 2027 and the 2027 file is neither bundled nor reachable. The app must fall back to the rest policy alone and must not crash or show NaN. Owned by Task 3, test `loadCalendar falls back to empty calendar when fetch fails`.
3. **Offline or a changed quote API.** Chips must keep the last cached value with a `未更新` mark, with no popup and no crash. A malformed response counts as a failure. Owned by Task 4 (parser rejects bad shapes) and Task 9 (cached plus stale display).
4. **App running across midnight and across a month boundary.** Today-earned resets to 0. 今日功德 resets. The red dot appears on the new month's first workday after work starts. Owned by Task 2 (rollover snapshot tests), Task 8 (`needsMonthPrompt`) and Task 10 (merit rollover).
5. **调休补班 Saturday.** It is a workday, so earnings tick, but the exchange is closed. The market must not be treated as trading, and polling must not run. Owned by Task 1 test `isTradingDay is false on a 补班 Saturday`.

---

## File Map

```
src-tauri/
  tauri.conf.json            window config, plugins, bundle
  capabilities/default.json  plugin permissions + http URL scope
  icons/tray.png, tray-badge.png
  src/lib.rs                 builder: plugins, setup, close→hide
  src/tray.rs                tray build, click handling, set_tray_status
src/
  domain/dates.ts            date-key + clock helpers
  domain/holidays.ts         holiday-cn parsing, HolidayCalendar
  domain/workdays.ts         RestPolicy, isWorkday, workdaysInMonth, isTradingDay
  domain/earnings.ts         computeSnapshot
  domain/settings.ts         zod schema, Settings type, defaults
  domain/market.ts           monthToDateChange, isTradingTime, types
  domain/copywriter.ts       buildCopyCandidates, pickCopy, formatDuration
  domain/monthPrompt.ts      needsMonthPrompt
  domain/merit.ts            Merit type, tapMerit, rolloverMerit
  data/holidays/2026.json    bundled holiday-cn data
  data/items.ts              物品库
  services/kvStore.ts        KeyValueStore interface + tauri + memory impls
  services/settingsRepo.ts   load/save settings, merit, quotes cache
  services/holidayLoader.ts  loadCalendar
  services/eastmoney.ts      MarketProvider impl + response parsers
  services/http.ts           httpFetchJson via tauri-plugin-http
  services/platform.ts       Platform interface + tauri impl (tray, top, autostart)
  services/ServicesContext.tsx
  hooks/useNow.ts, useMarket.ts, useTraySync.ts
  components/SetupWizard.tsx, SettingsView.tsx, Panel.tsx,
             StatusBlock.tsx, EarnedBlock.tsx, ProgressBars.tsx,
             CopyLine.tsx, TickerChips.tsx, AddInstrumentDialog.tsx,
             MuyuButton.tsx, MonthPrompt.tsx
  App.tsx, main.tsx, styles.css
.github/workflows/build.yml
```

Tests sit next to their source as `*.test.ts(x)`. `src/test/fakes.ts` holds the in-memory `KeyValueStore`, a fake `MarketProvider` and a fake `Platform`.

---

### Task 0: Toolchain, scaffold, test harness

**Files:**
- Create: the project via the Tauri scaffolder at `/Users/weijia/Projects/work-encourager` (keep the existing `docs/` and `.superpowers/`)
- Create: `vitest.config.ts`, `.gitignore` (must include `.superpowers/`, `node_modules/`, `src-tauri/target/`, `dist/`)

- [ ] **Step 1:** Install Rust with `curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y`, then `source ~/.cargo/env`. Verify with `rustc --version`, which should print `rustc 1.x`. Xcode Command Line Tools must exist; check with `xcode-select -p`.
- [ ] **Step 2:** Scaffold with `pnpm create tauri-app` (React, TypeScript, pnpm) into a temp dir, then move its contents into the project root. Set the product name `上班鼓励器` and the identifier `com.weijia.workencourager`.
- [x] **Step 3:** Add dev deps `vitest @vitest/coverage-v8 @testing-library/react @testing-library/user-event jsdom` and dep `zod`. In `vitest.config.ts`, set the jsdom environment and coverage thresholds of 80 (lines, functions, branches, statements) for `src/domain/**` and `src/services/**`, excluding the Tauri adapters `src/services/http.ts`, `src/services/platform.ts` and `createTauriStore`. Add `"test": "vitest run"` and `"coverage": "vitest run --coverage"`.
- [x] **Step 4:** Write `src/domain/sanity.test.ts` asserting `1 + 1 === 2`. Run `pnpm test`. Expected: 1 passed. Delete the file afterwards.
- [ ] **Step 5:** Run `pnpm tauri dev`. Expected: the template window opens. Close it.
- [ ] **Step 6:** Run `git init`, then commit `chore: scaffold tauri 2 react app with vitest`.

### Task 1: Dates, holiday calendar, workdays

**Files:**
- Create: `src/domain/dates.ts`, `src/domain/holidays.ts`, `src/domain/workdays.ts`, `src/data/holidays/2026.json`
- Test: `src/domain/workdays.test.ts`, `src/domain/holidays.test.ts`

**Interfaces — Produces:**
```ts
// dates.ts
toDateKey(d: Date): string                    // local 'YYYY-MM-DD'
parseDateKey(key: string): Date               // local midnight
parseHHMM(s: string): number                  // minutes since midnight; throws on bad format
secondsSinceMidnight(d: Date): number
mondayOf(key: string): string                 // date key of that week's Monday
// holidays.ts
interface HolidayDay { date: string; name: string; isOffDay: boolean }
type HolidayCalendar = ReadonlyMap<string, HolidayDay>
parseHolidayCn(json: unknown): HolidayDay[]   // zod; throws on bad shape
buildCalendar(days: readonly HolidayDay[]): HolidayCalendar
EMPTY_CALENDAR: HolidayCalendar
// workdays.ts
type RestPolicy = { kind: 'double' } | { kind: 'single' } | { kind: 'bigSmall'; smallWeekMonday: string }
isWorkday(date: string, policy: RestPolicy, cal: HolidayCalendar): boolean
workdaysInMonth(year: number, month: number /*1-12*/, policy: RestPolicy, cal: HolidayCalendar): string[]
isTradingDay(date: string, cal: HolidayCalendar): boolean   // Mon–Fri and not a calendar off-day
```

- [x] **Step 1:** Download `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/2026.json` to `src/data/holidays/2026.json`. Its shape is `{ year, days: [{ name, date, isOffDay }] }`.
- [x] **Step 2:** Write the failing tests. Use synthetic calendars unless the test names the bundled file:
  - `double: Mon–Fri work, Sat/Sun rest` (2026-11-06 is Fri, so true; 2026-11-07 is Sat, so false)
  - `single: Saturday works, Sunday rests`
  - `bigSmall: Saturday works only in small weeks, alternating` (smallWeekMonday `2026-11-02` gives 11-07 true, 11-14 false, 11-21 true, 10-31 false (one week before), and 10-24 true (two weeks before))
  - `calendar off-day overrides policy` and `calendar 补班 day overrides policy` (a synthetic Sunday with `isOffDay:false` counts as work under `single`)
  - `workdaysInMonth(2026, 11, double, EMPTY) has 21 days, first 2026-11-02, last 2026-11-30`
  - `bundled 2026.json parses and 2026-10-01 is an off-day`
  - `parseHolidayCn throws on missing days array`
  - `isTradingDay is false on a 补班 Saturday` (synthetic calendar marking a Saturday `isOffDay:false`) and `false on a statutory off-day weekday`
- [x] **Step 3:** Run `pnpm test src/domain`. Expected: FAIL (modules missing).
- [x] **Step 4:** Implement the interfaces above. For `bigSmall`, a Saturday works when the whole number of weeks between `mondayOf(date)` and `smallWeekMonday` is even, in either direction. Compute this with date keys, not `Date` arithmetic across DST.
- [x] **Step 5:** Run `pnpm test src/domain`. Expected: all PASS.
- [ ] **Step 6:** Commit `feat: add workday and holiday calendar rules`.

### Task 2: Earnings snapshot

**Files:**
- Create: `src/domain/earnings.ts`
- Test: `src/domain/earnings.test.ts`

**Interfaces:**
- Consumes: Task 1 (all)
- Produces:
```ts
interface WorkSchedule {
  monthlySalary: number; workStart: string; workEnd: string   // 'HH:MM'
  lunch: { start: string; end: string } | null
  restPolicy: RestPolicy
}
type WorkStatus = 'beforeWork' | 'working' | 'lunch' | 'afterWork' | 'restDay'
interface Snapshot {
  status: WorkStatus
  dailyWage: number; perSecond: number; hourlyWage: number
  todayEarned: number; todayProgress: number          // 0..1
  workedSeconds: number; dailySeconds: number
  monthEarned: number; monthProgress: number          // 0..1
  workdayIndex: number; workdaysTotal: number          // "第 N/M 天"
  countdown: { kind: 'toWork' | 'toLunchEnd' | 'toOffWork'; seconds: number } | null
}
computeSnapshot(now: Date, schedule: WorkSchedule, cal: HolidayCalendar): Snapshot
STATUS_LABEL: Record<WorkStatus, string>   // exact labels from Global Constraints
```

The shared fixture is salary 21000, 09:00–18:00, lunch 12:00–13:30, `double`, `EMPTY_CALENDAR`. November 2026 has 21 workdays, so the daily wage is 1000, there are 27000 effective seconds, and the hourly wage is 133.33.

- [x] **Step 1:** Write the failing tests:
  - `working at 2026-11-04 15:00`: status `working`, todayEarned 600, workedSeconds 16200, monthEarned 2600, monthProgress ≈ 0.12381, workdayIndex 3, workdaysTotal 21, countdown `toOffWork` 10800
  - `lunch at 12:30`: status `lunch`, todayEarned 400, countdown `toLunchEnd` 3600
  - `beforeWork at 08:00`: todayEarned 0, countdown `toWork` 3600, monthEarned 2000
  - `afterWork at 19:00`: todayEarned 1000, todayProgress 1, countdown null
  - `restDay on Saturday 2026-11-07 10:00`: todayEarned 0, monthEarned 5000, workdayIndex 5
  - `last workday end gives monthProgress exactly 1` (2026-11-30 18:00:01)
  - `month rollover: 2026-12-01 08:59 has monthEarned 0 and December's total`
  - `no lunch: lunch null gives 32400 effective seconds`
  - `todayEarned grows by perSecond per second` (compare snapshots one second apart while working)
- [x] **Step 2:** Run `pnpm test src/domain/earnings`. Expected: FAIL.
- [x] **Step 3:** Implement `computeSnapshot` as a pure function of its inputs. When a month has 0 workdays, return a zero-wage snapshot with status `restDay`, not NaN.
- [x] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit `feat: compute earnings snapshot from wall clock`.

### Task 3: Settings schema, storage, holiday loader

**Files:**
- Create: `src/domain/settings.ts`, `src/services/kvStore.ts`, `src/services/settingsRepo.ts`, `src/services/holidayLoader.ts`, `src/test/fakes.ts`
- Test: `src/domain/settings.test.ts`, `src/services/settingsRepo.test.ts`, `src/services/holidayLoader.test.ts`

**Interfaces:**
- Consumes: `WorkSchedule`, `RestPolicy`, `HolidayCalendar`, `parseHolidayCn`, `buildCalendar`
- Produces:
```ts
interface Instrument { secid: string; name: string }
interface WishItem { name: string; price: number }
interface Settings extends WorkSchedule {
  nickname: string; watchlist: Instrument[]; wishlist: WishItem[]
  autostart: boolean; alwaysOnTop: boolean; muyuSound: boolean
  lastConfirmedMonth: string | null    // 'YYYY-MM'
}
settingsSchema: z.ZodType<Settings>
DEFAULT_WATCHLIST: Instrument[]
defaultSettingsDraft(): Omit<Settings, 'nickname' | 'monthlySalary'>   // 09:00–18:00, lunch 12:00–13:00, double
interface KeyValueStore { get<T>(key: string): Promise<T | undefined>; set<T>(key: string, value: T): Promise<void> }
createTauriStore(): Promise<KeyValueStore>        // @tauri-apps/plugin-store, file 'settings.json'
createMemoryStore(): KeyValueStore
loadSettings(kv): Promise<Settings | null>        // null if absent or fails validation
saveSettings(kv, s: Settings): Promise<void>      // validates first, throws Error with Chinese message
loadCalendar(years: number[], kv, fetchJson: (url: string) => Promise<unknown>): Promise<HolidayCalendar>
```

- [x] **Step 1:** Write the failing tests:
  - Schema accepts a valid settings object.
  - Schema rejects each of these with a Chinese message: empty nickname, nickname over 12 chars, salary ≤ 0 or non-finite, `workEnd <= workStart` (overnight is not supported), lunch outside work hours, lunch end ≤ start, duplicate watchlist secid, wish price ≤ 0.
  - `loadSettings returns null for corrupted stored data`.
  - `saveSettings then loadSettings round-trips`.
  - `loadCalendar uses bundled 2026 without fetching`.
  - `loadCalendar fetches 2027 from jsdelivr and caches it under 'holidays:2027'`.
  - `loadCalendar uses cached year on second call without fetching`.
  - `loadCalendar falls back to empty calendar when fetch fails`. Assert no throw, and that `isWorkday` for a 2027 weekday is true.
- [x] **Step 2:** Run `pnpm test src/domain/settings src/services`. Expected: FAIL.
- [x] **Step 3:** Implement. `loadCalendar` uses the URL `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/{year}.json`. Treat a 404 or parse error as "no data", and do not cache failures. Register `tauri-plugin-store` in Cargo and `lib.rs`, and add `store:default` to the capabilities.
- [x] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit `feat: settings schema, local storage and holiday loader`.

### Task 4: Market math and Eastmoney provider

**Files:**
- Create: `src/domain/market.ts`, `src/services/eastmoney.ts`, `src/services/http.ts`, `src/services/__fixtures__/kline-000300.json`, `src/services/__fixtures__/search-hs300.json`
- Test: `src/domain/market.test.ts`, `src/services/eastmoney.test.ts`

**Interfaces:**
- Consumes: `isTradingDay`, `Instrument`
- Produces:
```ts
interface DailyClose { date: string; close: number }
interface Quote { secid: string; change: number; asOf: string; stale: boolean }
monthToDateChange(closes: readonly DailyClose[], now: Date): number | null
  // latest close ÷ last close dated before the 1st of now's month − 1; null if no base
isTradingTime(now: Date, cal: HolidayCalendar): boolean   // trading day and 09:30–11:30 or 13:00–15:00
interface MarketProvider {
  fetchDailyCloses(secid: string): Promise<DailyClose[]>
  search(query: string): Promise<Instrument[]>
}
parseKline(json: unknown): DailyClose[]       // zod; throws on bad shape
parseSearch(json: unknown): Instrument[]      // keeps only market 0 or 1
createEastmoneyProvider(fetchJson: (url: string) => Promise<unknown>): MarketProvider
// http.ts — runtime adapter, excluded from coverage like other Tauri adapters
httpFetchJson(url: string): Promise<unknown>   // plugin-http fetch; throws on non-2xx or invalid JSON
```

Endpoints:
- Daily closes: `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid={secid}&fields1=f1,f2,f3&fields2=f51,f53&klt=101&fqt=1&lmt=45&end=20500101`. The response is `data.klines: ["YYYY-MM-DD,close", …]`.
- Search: `https://searchapi.eastmoney.com/api/suggest/get?input={q}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&count=10`. The response is `QuotationCodeTable.Data[]`, with `QuoteID` (the secid, e.g. `1.000300`), `Name` and `MktNum`.

- [x] **Step 1:** Use the provided endpoint fixtures for `1.000300` and `沪深300`; their real response shapes are captured in `src/services/__fixtures__/`.
- [x] **Step 2:** Write the failing tests:
  - `monthToDateChange`: base on Oct 30, latest on Nov 4 (1000 to 1018 gives 0.018); no bar yet this month gives 0; no bar before the month gives null.
  - `isTradingTime`: Wed 10:00 true, 12:00 false, 15:01 false, Saturday false.
  - `parseKline` on the fixture gives non-empty, ascending dates and finite numbers.
  - `parseKline throws on {data:null}`.
  - `parseSearch` on the fixture includes `1.000300` and drops non-0/1 markets.
  - The provider builds the correct URL (checked through a fake `fetchJson`).
- [x] **Step 3:** Run `pnpm test src/domain/market src/services/eastmoney`. Expected: FAIL.
- [x] **Step 4:** Implement. Register `tauri-plugin-http`, and in the capabilities add an http scope allowing `https://*.eastmoney.com/*` and `https://cdn.jsdelivr.net/*`. `httpFetchJson` uses the plugin's `fetch`, which avoids webview CORS. It is also what `loadCalendar` receives at runtime.
- [x] **Step 5:** Run it. Expected: PASS.
- [x] **Step 6:** Commit `feat: month-to-date market change via eastmoney`.

### Task 5: Copywriter and item library

**Files:**
- Create: `src/domain/copywriter.ts`, `src/data/items.ts`
- Test: `src/domain/copywriter.test.ts`

**Interfaces:**
- Consumes: `Snapshot`, `WishItem`, `Quote`, `Instrument`
- Produces:
```ts
interface ShopItem { name: string; price: number; emoji: string }
ITEMS: readonly ShopItem[]   // ≥25 items, ascending price, e.g. 一杯瑞幸 15, 一份外卖 30, 一张电影票 45, 一件 T 恤 99, 一副羽毛球拍 399
interface CopyContext {
  snapshot: Snapshot; nickname: string; wishlist: readonly WishItem[]
  quotes: readonly (Quote & { name: string })[]; lunchStart: string | null; now: Date
}
formatDuration(seconds: number): string   // '不到 1 分钟' | '23 分钟' | '2 小时 5 分钟'
buildCopyCandidates(ctx: CopyContext): string[]   // each already prefixed '{称呼}，'
pickCopy(ctx: CopyContext, rotateSeconds?: number /*default 30*/): string
  // candidates[floor(epochSeconds / rotateSeconds) % length]
```

Rules. The templates are exact, as in Global Constraints.
- **Working:** add the item countdown for the cheapest item with price > todayEarned, but only if it is reachable before off-work today. If lunch starts within 30 min, add `坚持住…开饭`. If off-work is within 30 min, add `最后…纯赚`.
- **Any status:** add one `本月已经赚出 {N} 个 {心愿}` per wish (N to 1 decimal, skipped if N < 0.1). Add one `本月上班又跑赢了{name} ✌️` per non-stale quote where monthProgress > change.
- **afterWork:** add `今天的 ¥{dailyWage 2dp} 已到账，下班快乐`.
- **restDay:** add `今天休息，本月已赚 ¥{monthEarned 2dp}`.
- **beforeWork:** add `还有 {formatDuration} 上班，今天又是纯赚的一天`.
- The candidate list is never empty.

- [x] **Step 1:** Write the failing tests, using the Task 2 fixture snapshot at 15:00 with todayEarned 600 and nickname `小叶`:
  - The item countdown string equals `小叶，再过 {d}，{item} 就赚回来了` for the right item and duration.
  - The countdown is skipped when the item is unreachable before off-work.
  - Lunch-soon and last-30-min lines appear at 11:45 and 17:40.
  - The wish line uses 1 decimal.
  - The beat-quote line appears only when monthProgress > change, and never for stale quotes.
  - `formatDuration` boundaries: 59 s, 60 s, 3660 s.
  - `pickCopy` rotates every 30 s and is deterministic.
  - Candidates are non-empty for every status.
- [x] **Step 2:** Run it. Expected: FAIL.
- [x] **Step 3:** Implement.
- [x] **Step 4:** Run it. Expected: PASS.
- [x] **Step 5:** Commit `feat: rule-based encouragement copy`.

### Task 6: Rust shell — tray/menu bar, window behaviour

**Files:**
- Create: `src-tauri/src/tray.rs`, `src-tauri/icons/tray.png`, `src-tauri/icons/tray-badge.png`. Both are 32×32 template-friendly PNGs, and the badge variant has a red dot at the top right.
- Modify: `src-tauri/src/lib.rs`, `src-tauri/tauri.conf.json`, `src-tauri/capabilities/default.json`, `src-tauri/Cargo.toml`
- Create: `src/services/platform.ts`

**Interfaces — Produces:**
```rust
#[tauri::command]
fn set_tray_status(app: tauri::AppHandle, title: String, tooltip: String, badge: bool) -> Result<(), String>
// macOS: tray.set_title(Some(title)); all: set_tooltip(tooltip); set_icon(badge ? tray-badge : tray)
```
```ts
interface Platform {
  setTrayStatus(title: string, tooltip: string, badge: boolean): Promise<void>
  setAlwaysOnTop(on: boolean): Promise<void>
  setAutostart(on: boolean): Promise<void>
}
createTauriPlatform(): Platform
```

- [x] **Step 1:** Configure the window in `tauri.conf.json`:
  - label `main`, 380×680, not resizable, `alwaysOnTop: true`, `backgroundThrottling: "disabled"`, title `上班鼓励器`.
- [x] **Step 2:** Configure the tray in `tray.rs`:
  - Tray id `main` with the menu `显示面板` / `退出`, and `show_menu_on_left_click(false)`.
  - A left click toggles the `main` window: if hidden, show and focus it; otherwise hide it.
  - `退出` calls `app.exit(0)`.
- [x] **Step 3:** Configure app behaviour in `lib.rs`:
  - On `WindowEvent::CloseRequested` for `main`, call `api.prevent_close()` and hide the window.
  - On macOS, set `ActivationPolicy::Accessory` so the app is menu-bar only with no Dock icon.
  - Register `tauri-plugin-single-instance`. A second launch shows the existing panel.
  - Register `tauri-plugin-autostart`.
  - Register `set_tray_status`.
- [x] **Step 4:** Implement `createTauriPlatform` using `invoke`, `getCurrentWindow().setAlwaysOnTop` and the autostart plugin's `enable` / `disable`.
- [ ] **Step 5:** Temporary check. Call `setTrayStatus('💰 ¥0.00', '上班鼓励器', false)` in `main.tsx` on a 1 s interval with an incrementing number. Run `pnpm tauri dev`, then verify:
  - (a) The menu bar shows the text, and it ticks.
  - (b) Closing the panel keeps the app and the menu bar running.
  - (c) A left click toggles the panel.
  - (d) After 5 minutes with the panel hidden, the number is still ticking each second.
  - (e) `退出` quits.
  Remove the temporary code afterwards.
- [x] **Step 6:** Run `cargo clippy --manifest-path src-tauri/Cargo.toml -- -D warnings`. Expected: no warnings.
- [ ] **Step 7:** Commit `feat: menu bar tray shell with hide-on-close`.

### Task 7: Services context and setup wizard

**Files:**
- Create: `src/services/ServicesContext.tsx`, `src/components/SetupWizard.tsx`, `src/App.tsx` (replacing the template)
- Test: `src/components/SetupWizard.test.tsx`

**Interfaces:**
- Consumes: `KeyValueStore`, `MarketProvider`, `Platform`, `settingsSchema`, `defaultSettingsDraft`, `saveSettings`, `mondayOf`, `toDateKey`
- Produces:
```ts
interface Services { kv: KeyValueStore; market: MarketProvider; platform: Platform; now: () => Date }
ServicesProvider({ services, children }); useServices(): Services
SetupWizard({ initial?: Settings; onDone: (s: Settings) => void })
```

The wizard is a single scrolling form, not multi-step. Its fields, in order:
1. 称呼
2. 月薪
3. 上班 / 下班
4. 午休 start/end, with a `没有午休` checkbox
5. 休息制度 radio `双休 / 单休 / 大小周`. If `大小周` is chosen, a second radio appears, `本周是 大周（周六休） / 小周（周六上班）`, which maps to `smallWeekMonday` = this week's Monday, or the previous week's Monday if this is a 大周.
6. 关注品种: default chips, removable
7. 心愿单: name + price rows, add/remove
8. Toggles: `开机自启`, `面板置顶`, `木鱼声音`

Submit is labelled `开始上班`. It validates with `settingsSchema`, shows the Chinese errors inline under each field, then calls `onDone` with `lastConfirmedMonth` set to the current month.

`App.tsx`:
- It loads settings. `null` renders `SetupWizard`; otherwise it renders `Panel` (stub until Task 8).
- It applies `alwaysOnTop` and `autostart` through `Platform` after every save.

- [ ] **Step 1:** Write the failing tests, using fake services and a fixed `now` of 2026-11-04:
  - `fills valid form and calls onDone with parsed settings`
  - `shows 下班时间必须晚于上班时间 when end ≤ start`
  - `大小周 + 大周 sets smallWeekMonday to 2026-10-26`
  - `没有午休 sets lunch null`
  - `submit stamps lastConfirmedMonth 2026-11`
- [ ] **Step 2:** Run `pnpm test src/components/SetupWizard`. Expected: FAIL.
- [ ] **Step 3:** Implement. `main.tsx` builds the real services (`createTauriStore`, `createEastmoneyProvider(httpFetchJson)`, `createTauriPlatform`, `() => new Date()`).
- [ ] **Step 4:** Run it. Expected: PASS. Then run `pnpm tauri dev`, fill in the form, restart the app, and check that the wizard is skipped.
- [ ] **Step 5:** Commit `feat: first-run setup wizard`.

### Task 8: Main panel, tray sync, month prompt

**Files:**
- Create: `src/hooks/useNow.ts`, `src/hooks/useTraySync.ts`, `src/domain/monthPrompt.ts`, `src/components/Panel.tsx`, `StatusBlock.tsx`, `EarnedBlock.tsx`, `CopyLine.tsx`, `ProgressBars.tsx`, `MonthPrompt.tsx`, `src/styles.css`
- Test: `src/domain/monthPrompt.test.ts`, `src/components/Panel.test.tsx`

**Interfaces:**
- Consumes: `computeSnapshot`, `STATUS_LABEL`, `pickCopy`, `loadCalendar`, `Settings`, `Platform`
- Produces:
```ts
useNow(intervalMs: number): Date
needsMonthPrompt(now: Date, s: Settings, cal: HolidayCalendar): boolean
  // lastConfirmedMonth !== now's month AND this month's first workday at workStart <= now
useTraySync(snapshot: Snapshot, badge: boolean): void   // calls platform.setTrayStatus once per tick
Panel({ settings, calendar, onOpenSettings, onSettingsChange })
```

The layout follows `panel-v2.html` top to bottom:
1. Header `💰 上班鼓励器` + `⚙ 设置`
2. Date, weekday and time to the second
3. `{称呼}，{status label}` with the countdown text: `距离下班` for toOffWork, `距离午休结束` for toLunchEnd, `距离上班` for toWork
4. `今日已赚` big at 4 decimals
5. `速度 ¥x / 秒 · 时薪 ¥x`
6. The copy line
7. `今日进度 xx.x%` with `已工作 h / h`
8. `本月进度 xx.x%` with `¥已赚 / ¥月薪 · 第 N/M 天`
9. TickerChips slot (Task 9)
10. Muyu slot (Task 10)

`MonthPrompt` is shown above the copy line when `needsMonthPrompt` is true. It has two buttons, `没变化` and `去修改`. Either one sets `lastConfirmedMonth`; `去修改` also opens settings. The tray tooltip is `{称呼}，{label} · 今日 ¥x.xx`.

- [ ] **Step 1:** Write the failing tests:
  - `needsMonthPrompt`:
    - false when `lastConfirmedMonth` = current month
    - true at 2026-12-01 09:00 with `lastConfirmedMonth` `2026-11`
    - false at 2026-12-01 08:59
    - true on 12-15 when the user missed the 1st
  - Panel, with fixed `now` 2026-11-04 15:00 and the Task 2 fixture:
    - it renders `小叶，上班中`, `¥600.0000`, `第 3/21 天`
    - fake platform `setTrayStatus` is called with the title `💰 ¥600.00`
    - the `没变化` click persists `lastConfirmedMonth` and clears the badge
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement. `useNow(1000)` drives everything, and the calendar loads once for the current and next year.
- [ ] **Step 4:** Run it. Expected: PASS. Then run `pnpm tauri dev` and compare visually with `panel-v2.html`.
- [ ] **Step 5:** Commit `feat: main panel with progress bars and menu bar sync`.

### Task 9: Ticker chips, add/remove, market polling

**Files:**
- Create: `src/hooks/useMarket.ts`, `src/components/TickerChips.tsx`, `src/components/AddInstrumentDialog.tsx`
- Modify: `src/components/Panel.tsx` (fill the slot), `src/services/settingsRepo.ts` (add `loadQuotes` / `saveQuotes`, key `quotes`)
- Test: `src/hooks/useMarket.test.ts`, `src/components/TickerChips.test.tsx`

**Interfaces:**
- Consumes: `MarketProvider`, `monthToDateChange`, `isTradingTime`, `Quote`, `Instrument`
- Produces:
```ts
useMarket(watchlist: Instrument[], cal: HolidayCalendar): Record<string, Quote>   // keyed by secid
TickerChips({ watchlist, quotes, onChange: (next: Instrument[]) => void })
```

Polling:
- Load cached quotes immediately, then fetch all on mount.
- Afterwards, re-fetch every 3 min while `isTradingTime` is true. Also fetch once in the first tick after 15:00 on a trading day, to capture the close.
- On failure, keep the cached quote with `stale: true`. The chip then shows a gray `未更新` suffix, and there is no dialog.
- A newly added instrument fetches immediately.

Chips:
- Each chip shows `{name} {+x.x%}`, colored per Global Constraints.
- A hover `×` removes the chip, and a trailing `＋` opens the dialog.
- The dialog has a search box (debounce 300 ms → `market.search`), a result list, and a click to add (deduped).

- [ ] **Step 1:** Write the failing tests, using fake timers and a fake provider:
  - `fetches on mount and caches`
  - `marks stale and keeps cached value on fetch error`
  - `does not poll on Saturday or on a 补班 Saturday`
  - `polls every 3 min during trading time`
  - `chip shows red for +1.8% and green for -2.1%`
  - `adding a duplicate secid is ignored`
  - `remove calls onChange without that secid`
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run it. Expected: PASS. Run `pnpm tauri dev` and check that the real quotes appear. Turn off Wi-Fi, restart, and check that cached values show with `未更新`.
- [ ] **Step 5:** Commit `feat: watchlist chips with month-to-date change`.

### Task 10: 功德木鱼

**Files:**
- Create: `src/domain/merit.ts`, `src/components/MuyuButton.tsx`
- Modify: `src/services/settingsRepo.ts` (`loadMerit` / `saveMerit`, key `merit`), `Panel.tsx`
- Test: `src/domain/merit.test.ts`, `src/components/MuyuButton.test.tsx`

**Interfaces — Produces:**
```ts
interface Merit { date: string; today: number; total: number }
rolloverMerit(m: Merit, now: Date): Merit       // new date → today 0, total kept
tapMerit(m: Merit, now: Date): Merit            // rollover then today+1, total+1
MuyuButton({ merit, sound: boolean, onTap: () => void })
```

The button is 🪵. Each tap shows a floating `功德 +1` for 800 ms. It shows `今日功德 {today}` and `累计 {total}` with the subtitle `点一下，班味 -1`. When `sound` is true, play a short synthesized wood-knock with WebAudio (an oscillator plus an envelope, no asset file). Persist after each tap.

- [ ] **Step 1:** Write the failing tests:
  - `tapMerit increments both`
  - `tap on a new day resets today to 1 and keeps total`
  - `rolloverMerit is a no-op on the same day`
  - `tapMerit does not mutate input`
  - `clicking button calls onTap and shows 功德 +1`
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit `feat: merit muyu button`.

### Task 11: Settings view

**Files:**
- Create: `src/components/SettingsView.tsx`
- Modify: `src/App.tsx` (toggle between Panel and SettingsView)
- Test: `src/components/SettingsView.test.tsx`

**Interfaces:**
- Consumes: `SetupWizard` (reused with `initial`), `saveSettings`, `Platform`
- Produces: `SettingsView({ settings, onSave: (s: Settings) => void, onCancel: () => void })`

`SettingsView` wraps `SetupWizard` with `initial={settings}`. The submit label is `保存`, and a `取消` link returns to the panel. When saving, preserve `lastConfirmedMonth`; only the first-run setup stamps it. After saving, App re-applies `alwaysOnTop` and `autostart`, and the panel recomputes immediately.

- [ ] **Step 1:** Write the failing tests:
  - `prefills current values`
  - `saving new salary calls onSave with updated salary and same lastConfirmedMonth`
  - `toggling 面板置顶 off calls platform.setAlwaysOnTop(false) after save` (App-level test)
- [ ] **Step 2:** Run it. Expected: FAIL.
- [ ] **Step 3:** Implement. This needs a `submitLabel` prop on `SetupWizard` and a `stampMonth` flag.
- [ ] **Step 4:** Run it. Expected: PASS.
- [ ] **Step 5:** Commit `feat: editable settings view`.

### Task 12: Cross-platform build and acceptance

**Files:**
- Create: `.github/workflows/build.yml`

- [ ] **Step 1:** Run `pnpm coverage`. Expected: thresholds met (≥80%) for `src/domain/**` and `src/services/**`. Run `cargo clippy` clean and `pnpm tsc --noEmit` clean.
- [ ] **Step 2:** Run `pnpm tauri build` on the Mac. Expected: a `.dmg` under `src-tauri/target/release/bundle/dmg/`. Install it and run the acceptance checklist below.
- [ ] **Step 3:** Write `build.yml`: on `workflow_dispatch`, use a matrix of `macos-latest` and `windows-latest` with `tauri-apps/tauri-action@v0` and no signing secrets, and upload the bundles as artifacts.
- [ ] **Step 4:** **Ask the user before** creating a GitHub repo or pushing, because that is outward-facing. Once they approve, push and trigger the workflow. Expected: both jobs green, plus a Windows `.msi`/`.exe` artifact.
- [ ] **Step 5:** Hand the Windows installer to the user to verify on their home PC with the same checklist (tray tooltip instead of menu-bar text).
- [ ] **Step 6:** Commit `ci: cross-platform unsigned build workflow`.

**Acceptance checklist (manual):**
- [ ] The first launch shows the wizard. After `开始上班`, the panel shows `{称呼}，上班中` during work hours.
- [ ] The menu bar shows `💰 ¥x.xx` ticking each second, including after the panel has been hidden for 10 minutes.
- [ ] Closing the panel hides it. A click on the menu bar brings it back. `退出` quits, and a relaunch skips the wizard.
- [ ] Lunch pauses the number. After off-work, it shows the full daily wage.
- [ ] The chips show real month-to-date changes in A-share colors. Add, search and remove all work.
- [ ] Offline, the chips show `未更新`, with no popup.
- [ ] 木鱼 taps persist across a restart.
- [ ] Changing the salary in settings updates the numbers immediately.
- [ ] After sleep or lid-close, the numbers match the wall clock on wake.
