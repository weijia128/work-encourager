import { ITEMS } from "../data/items";
import bundledCopyLibrary from "../data/copyLibrary.json";
import type { Snapshot } from "./earnings";
import type { WishItem } from "./settings";
import type { Quote } from "./market";
import { parseHHMM, secondsSinceMidnight } from "./dates";

export interface CopyLibrary {
  readonly version: number;
  readonly humor: readonly string[];
  readonly dao: readonly string[];
}

export const BUNDLED_COPY_LIBRARY: CopyLibrary = bundledCopyLibrary;

export interface CopyContext {
  readonly snapshot: Snapshot;
  readonly nickname: string;
  readonly wishlist: readonly WishItem[];
  readonly quotes: readonly (Quote & { name: string })[];
  readonly lunchStart: string | null;
  readonly now: Date;
  readonly copyLibrary?: CopyLibrary;
}

export function formatDuration(seconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  if (safeSeconds < 60) return "不到 1 分钟";
  const minutes = Math.floor(safeSeconds / 60);
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  if (hours === 0) return `${minutes} 分钟`;
  return remaining === 0 ? `${hours} 小时` : `${hours} 小时 ${remaining} 分钟`;
}

function prefix(nickname: string, text: string): string {
  return `${nickname}，${text}`;
}

function itemLine(ctx: CopyContext): string | null {
  const { snapshot } = ctx;
  if (snapshot.status !== "working") return null;
  const item = ITEMS.find((candidate) => candidate.price > snapshot.todayEarned);
  if (!item || snapshot.perSecond <= 0) return null;
  const remainingSeconds = reachableSeconds(snapshot);
  const needed = (item.price - snapshot.todayEarned) / snapshot.perSecond;
  if (needed > remainingSeconds) return null;
  return prefix(ctx.nickname, `再过 ${formatDuration(needed)}，${item.name} 就赚回来了`);
}

function reachableSeconds(snapshot: Snapshot): number {
  return snapshot.countdown?.kind === "toOffWork"
    ? Math.max(0, snapshot.dailySeconds - snapshot.workedSeconds)
    : 0;
}

function dailyItemLines(ctx: CopyContext): string[] {
  const { snapshot } = ctx;
  if (snapshot.status !== "working" || snapshot.todayEarned <= 0) return [];
  return ITEMS.filter((item) => item.price <= 100 && snapshot.todayEarned >= item.price).map(
    (item) => {
      const count = snapshot.todayEarned / item.price;
      const formatted = count >= 10 ? count.toFixed(0) : count.toFixed(1);
      return prefix(ctx.nickname, `今天已赚的钱 ≈ ${formatted} × ${item.name}`);
    },
  );
}

function encouragementLines(ctx: CopyContext): string[] {
  const library = ctx.copyLibrary ?? BUNDLED_COPY_LIBRARY;
  return ctx.snapshot.status === "working"
    ? library.humor.map((line) => prefix(ctx.nickname, line))
    : [];
}

function daoLines(ctx: CopyContext): string[] {
  const library = ctx.copyLibrary ?? BUNDLED_COPY_LIBRARY;
  return library.dao.map((line) => prefix(ctx.nickname, line));
}

function nearbyLines(ctx: CopyContext): string[] {
  const { snapshot } = ctx;
  if (snapshot.status !== "working" || !snapshot.countdown) return [];
  const lines: string[] = [];
  const seconds = snapshot.countdown.seconds;
  if (seconds <= 30 * 60 && seconds > 0) {
    lines.push(prefix(ctx.nickname, `最后 ${Math.ceil(seconds / 60)} 分钟，每一秒都是纯赚`));
  }
  const lunchSeconds = lunchStartCountdown(ctx);
  if (lunchSeconds !== null && lunchSeconds <= 30 * 60 && lunchSeconds > 0) {
    lines.push(prefix(ctx.nickname, `坚持住，还有 ${Math.ceil(lunchSeconds / 60)} 分钟开饭`));
  }
  return lines;
}

function lunchStartCountdown(ctx: CopyContext): number | null {
  if (ctx.snapshot.status !== "working" || ctx.lunchStart === null) return null;
  const lunchStart = parseHHMM(ctx.lunchStart) * 60;
  return lunchStart - secondsSinceMidnight(ctx.now);
}

function wishLines(ctx: CopyContext): string[] {
  return ctx.wishlist.map((wish) => {
    const count = ctx.snapshot.monthEarned / wish.price;
    return count >= 0.1
      ? prefix(ctx.nickname, `本月已经赚出 ${count.toFixed(1)} 个 ${wish.name}`)
      : prefix(ctx.nickname, `${wish.name}心愿进度 ${(count * 100).toFixed(1)}%`);
  });
}

function quoteLines(ctx: CopyContext): string[] {
  return ctx.quotes
    .filter((quote) => !quote.stale && ctx.snapshot.monthProgress > quote.change)
    .map((quote) => prefix(ctx.nickname, `本月上班又跑赢了${quote.name} ✌️`));
}

function statusLine(ctx: CopyContext): string | null {
  const { snapshot } = ctx;
  if (snapshot.status === "afterWork") {
    return prefix(ctx.nickname, `今天的 ¥${snapshot.dailyWage.toFixed(2)} 已到账，下班快乐`);
  }
  if (snapshot.status === "restDay") {
    return prefix(ctx.nickname, `今天休息，本月已赚 ¥${snapshot.monthEarned.toFixed(2)}`);
  }
  if (snapshot.status === "beforeWork" && snapshot.countdown) {
    return prefix(
      ctx.nickname,
      `还有 ${formatDuration(snapshot.countdown.seconds)} 上班，今天又是纯赚的一天`,
    );
  }
  return null;
}

export function buildCopyCandidates(ctx: CopyContext): string[] {
  const candidates = [
    itemLine(ctx),
    ...dailyItemLines(ctx),
    ...nearbyLines(ctx),
    ...wishLines(ctx),
    ...encouragementLines(ctx),
    ...daoLines(ctx),
    ...quoteLines(ctx),
    statusLine(ctx),
  ].filter((line): line is string => line !== null);
  return candidates.length > 0 ? candidates : [prefix(ctx.nickname, "继续加油，今天也会有收获")];
}

function rotate<T>(lines: readonly T[], now: Date, rotateSeconds: number): T {
  const interval = rotateSeconds > 0 ? rotateSeconds : 3600;
  const index = Math.floor(now.getTime() / 1000 / interval) % lines.length;
  return lines[index];
}

export function pickCopy(ctx: CopyContext, rotateSeconds = 3600): string {
  return rotate(buildCopyCandidates(ctx), ctx.now, rotateSeconds);
}

export function isDaoCopyTime(now: Date): boolean {
  return Math.floor(now.getTime() / 1000 / 1800) % 2 === 1;
}

export function pickCopyLines(ctx: CopyContext, rotateSeconds = 3600): [string, string, string] {
  const wishes = wishLines(ctx);
  const priceLines = [itemLine(ctx), ...dailyItemLines(ctx)].filter(
    (line): line is string => line !== null,
  );
  const humor = encouragementLines(ctx);
  const dao = daoLines(ctx);
  const thirdLines = isDaoCopyTime(ctx.now)
    ? dao
    : humor.length > 0
      ? humor
      : [prefix(ctx.nickname, "下班不是生活的暂停键")];
  return [
    rotate(
      wishes.length > 0
        ? wishes
        : [prefix(ctx.nickname, "给心愿清单添个小目标，让工资有个开心的去处")],
      ctx.now,
      rotateSeconds,
    ),
    rotate(
      priceLines.length > 0 ? priceLines : [prefix(ctx.nickname, "好好上班，也记得好好吃饭")],
      ctx.now,
      rotateSeconds,
    ),
    rotate(thirdLines, ctx.now, 1800),
  ];
}
