import { ITEMS } from "../data/items";
import type { Snapshot } from "./earnings";
import type { WishItem } from "./settings";
import type { Quote } from "./market";
import { parseHHMM, secondsSinceMidnight } from "./dates";

export interface CopyContext {
  readonly snapshot: Snapshot;
  readonly nickname: string;
  readonly wishlist: readonly WishItem[];
  readonly quotes: readonly (Quote & { name: string })[];
  readonly lunchStart: string | null;
  readonly now: Date;
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
  return ctx.wishlist
    .map((wish) => ctx.snapshot.monthEarned / wish.price)
    .map((count, index) =>
      count >= 0.1
        ? prefix(ctx.nickname, `本月已经赚出 ${count.toFixed(1)} 个 ${ctx.wishlist[index].name}`)
        : null,
    )
    .filter((line): line is string => line !== null);
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
    ...nearbyLines(ctx),
    ...wishLines(ctx),
    ...quoteLines(ctx),
    statusLine(ctx),
  ].filter((line): line is string => line !== null);
  return candidates.length > 0 ? candidates : [prefix(ctx.nickname, "继续加油，今天也会有收获")];
}

export function pickCopy(ctx: CopyContext, rotateSeconds = 30): string {
  const candidates = buildCopyCandidates(ctx);
  const interval = rotateSeconds > 0 ? rotateSeconds : 30;
  const epochSeconds = Math.floor(ctx.now.getTime() / 1000);
  return candidates[Math.floor(epochSeconds / interval) % candidates.length];
}
