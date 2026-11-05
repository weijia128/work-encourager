import { toDateKey } from "./dates";

export interface Merit {
  readonly date: string;
  readonly today: number;
  readonly total: number;
}

export function rolloverMerit(merit: Merit, now: Date): Merit {
  const date = toDateKey(now);
  if (merit.date === date) return { ...merit };
  return { date, today: 0, total: merit.total };
}

export function tapMerit(merit: Merit, now: Date): Merit {
  const rolled = rolloverMerit(merit, now);
  return { ...rolled, today: rolled.today + 1, total: rolled.total + 1 };
}
