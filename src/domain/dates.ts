export function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseDateKey(key: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) throw new Error(`无效的日期：${key}`);
  const [, y, m, d] = match;
  return new Date(Number(y), Number(m) - 1, Number(d));
}

export function parseHHMM(s: string): number {
  const match = /^(\d{2}):(\d{2})$/.exec(s);
  if (!match) throw new Error(`无效的时间格式：${s}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) throw new Error(`无效的时间格式：${s}`);
  return hours * 60 + minutes;
}

export function secondsSinceMidnight(d: Date): number {
  return d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds();
}

export function mondayOf(key: string): string {
  const d = parseDateKey(key);
  const dow = d.getDay();
  const offset = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + offset);
  return toDateKey(d);
}

export function formatClock(d: Date): string {
  const time = [d.getHours(), d.getMinutes(), d.getSeconds()]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
  return `${toDateKey(d)} ${"日一二三四五六"[d.getDay()]} ${time}`;
}
