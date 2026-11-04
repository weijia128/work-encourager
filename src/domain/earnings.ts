import { toDateKey, parseHHMM, secondsSinceMidnight } from "./dates";
import type { HolidayCalendar } from "./holidays";
import { isWorkday, workdaysInMonth, type RestPolicy } from "./workdays";

export interface WorkSchedule {
  monthlySalary: number;
  workStart: string;
  workEnd: string;
  lunch: { start: string; end: string } | null;
  restPolicy: RestPolicy;
}

export type WorkStatus =
  | "beforeWork"
  | "working"
  | "lunch"
  | "afterWork"
  | "restDay";

export interface Snapshot {
  status: WorkStatus;
  dailyWage: number;
  perSecond: number;
  hourlyWage: number;
  todayEarned: number;
  todayProgress: number;
  workedSeconds: number;
  dailySeconds: number;
  monthEarned: number;
  monthProgress: number;
  workdayIndex: number;
  workdaysTotal: number;
  countdown: {
    kind: "toWork" | "toLunchEnd" | "toOffWork";
    seconds: number;
  } | null;
}

export const STATUS_LABEL: Record<WorkStatus, string> = {
  beforeWork: "还没上班",
  working: "上班中",
  lunch: "午休中",
  afterWork: "已下班",
  restDay: "今天休息",
};

function zeroSnapshot(): Snapshot {
  return {
    status: "restDay",
    dailyWage: 0,
    perSecond: 0,
    hourlyWage: 0,
    todayEarned: 0,
    todayProgress: 0,
    workedSeconds: 0,
    dailySeconds: 0,
    monthEarned: 0,
    monthProgress: 0,
    workdayIndex: 0,
    workdaysTotal: 0,
    countdown: null,
  };
}

function statusAt(
  secs: number,
  start: number,
  end: number,
  lunchSecs: { start: number; end: number } | null,
): WorkStatus {
  if (secs < start) return "beforeWork";
  if (secs >= end) return "afterWork";
  if (lunchSecs && secs >= lunchSecs.start && secs < lunchSecs.end) {
    return "lunch";
  }
  return "working";
}

interface DayShape {
  start: number;
  end: number;
  lunchSecs: { start: number; end: number } | null;
  dailySeconds: number;
}

function parseDayShape(schedule: WorkSchedule): DayShape {
  const start = parseHHMM(schedule.workStart) * 60;
  const end = parseHHMM(schedule.workEnd) * 60;
  const lunchSecs = schedule.lunch
    ? {
        start: parseHHMM(schedule.lunch.start) * 60,
        end: parseHHMM(schedule.lunch.end) * 60,
      }
    : null;
  const dailySeconds =
    end - start - (lunchSecs ? lunchSecs.end - lunchSecs.start : 0);
  return { start, end, lunchSecs, dailySeconds };
}

function workedSecondsAt(
  secs: number,
  start: number,
  end: number,
  lunchSecs: { start: number; end: number } | null,
): number {
  const clamped = Math.min(Math.max(secs, start), end);
  const overlap = lunchSecs
    ? Math.max(
        0,
        Math.min(clamped, lunchSecs.end) - Math.max(start, lunchSecs.start),
      )
    : 0;
  return clamped - start - overlap;
}

function countdownAt(
  status: WorkStatus,
  secs: number,
  start: number,
  end: number,
  lunchSecs: { start: number; end: number } | null,
): Snapshot["countdown"] {
  if (status === "beforeWork") return { kind: "toWork", seconds: start - secs };
  if (status === "lunch" && lunchSecs) {
    return { kind: "toLunchEnd", seconds: lunchSecs.end - secs };
  }
  if (status === "working") return { kind: "toOffWork", seconds: end - secs };
  return null;
}

function monthTotals(
  beforeCount: number,
  workedSeconds: number,
  todayProgress: number,
  total: number,
  dailyWage: number,
  perSecond: number,
  salary: number,
): { monthEarned: number; monthProgress: number } {
  const completedDays = beforeCount + (todayProgress >= 1 ? 1 : 0);
  if (completedDays >= total) {
    return { monthEarned: salary, monthProgress: 1 };
  }
  const monthEarned = beforeCount * dailyWage + workedSeconds * perSecond;
  return { monthEarned, monthProgress: monthEarned / salary };
}

function todaySlice(
  secs: number,
  working: boolean,
  shape: DayShape,
): {
  status: WorkStatus;
  workedSeconds: number;
  countdown: Snapshot["countdown"];
} {
  const { start, end, lunchSecs } = shape;
  if (!working) {
    return { status: "restDay", workedSeconds: 0, countdown: null };
  }
  const status = statusAt(secs, start, end, lunchSecs);
  return {
    status,
    workedSeconds: workedSecondsAt(secs, start, end, lunchSecs),
    countdown: countdownAt(status, secs, start, end, lunchSecs),
  };
}

export function computeSnapshot(
  now: Date,
  schedule: WorkSchedule,
  cal: HolidayCalendar,
): Snapshot {
  const today = toDateKey(now);
  const yearMonth = [now.getFullYear(), now.getMonth() + 1] as const;
  const workdays = workdaysInMonth(...yearMonth, schedule.restPolicy, cal);
  const total = workdays.length;
  if (total === 0) return zeroSnapshot();
  const shape = parseDayShape(schedule);
  const dailyWage = schedule.monthlySalary / total;
  const perSecond = dailyWage / shape.dailySeconds;
  const hourlyWage = dailyWage / (shape.dailySeconds / 3600);
  const working = isWorkday(today, schedule.restPolicy, cal);
  const { status, workedSeconds, countdown } = todaySlice(
    secondsSinceMidnight(now),
    working,
    shape,
  );

  const beforeCount = workdays.filter((d) => d < today).length;
  const todayProgress = workedSeconds / shape.dailySeconds;
  const { monthEarned, monthProgress } = monthTotals(
    beforeCount,
    workedSeconds,
    todayProgress,
    total,
    dailyWage,
    perSecond,
    schedule.monthlySalary,
  );

  return {
    status,
    dailyWage,
    perSecond,
    hourlyWage,
    todayEarned: workedSeconds * perSecond,
    todayProgress,
    workedSeconds,
    dailySeconds: shape.dailySeconds,
    monthEarned,
    monthProgress,
    workdayIndex: beforeCount + (working ? 1 : 0),
    workdaysTotal: total,
    countdown,
  };
}
