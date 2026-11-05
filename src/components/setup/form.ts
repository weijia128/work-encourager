import { mondayOf, toDateKey } from "../../domain/dates";
import { defaultSettingsDraft, type Settings, settingsSchema } from "../../domain/settings";

export type FormState = {
  nickname: string;
  monthlySalary: string;
  workStart: string;
  workEnd: string;
  lunchStart: string;
  lunchEnd: string;
  noLunch: boolean;
  restKind: "double" | "single" | "bigSmall";
  smallWeek: boolean;
  watchlist: Settings["watchlist"];
  wishlist: Settings["wishlist"];
  autostart: boolean;
  alwaysOnTop: boolean;
  muyuSound: boolean;
};

export type UpdateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => void;

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function settingsToForm(initial: Settings | undefined, reference: Date): FormState {
  const draft =
    initial ?? ({ ...defaultSettingsDraft(), nickname: "", monthlySalary: 0 } as Settings);
  const policy = draft.restPolicy;
  return {
    nickname: draft.nickname,
    monthlySalary: draft.monthlySalary ? String(draft.monthlySalary) : "",
    workStart: draft.workStart,
    workEnd: draft.workEnd,
    lunchStart: draft.lunch?.start ?? "12:00",
    lunchEnd: draft.lunch?.end ?? "13:00",
    noLunch: !draft.lunch,
    restKind: policy.kind,
    smallWeek:
      policy.kind === "bigSmall" && policy.smallWeekMonday === mondayOf(toDateKey(reference)),
    watchlist: draft.watchlist.map((item) => ({ ...item })),
    wishlist: draft.wishlist.map((item) => ({ ...item })),
    autostart: draft.autostart,
    alwaysOnTop: draft.alwaysOnTop,
    muyuSound: draft.muyuSound,
  };
}

export function formToSettings(form: FormState, now: Date): Settings {
  const currentMonday = mondayOf(toDateKey(now));
  const previousMonday = new Date(`${currentMonday}T00:00:00`);
  previousMonday.setDate(previousMonday.getDate() - 7);
  const restPolicy =
    form.restKind === "bigSmall"
      ? {
          kind: "bigSmall" as const,
          smallWeekMonday: form.smallWeek ? currentMonday : toDateKey(previousMonday),
        }
      : { kind: form.restKind };
  return {
    nickname: form.nickname,
    monthlySalary: Number(form.monthlySalary),
    workStart: form.workStart,
    workEnd: form.workEnd,
    lunch: form.noLunch ? null : { start: form.lunchStart, end: form.lunchEnd },
    restPolicy,
    watchlist: form.watchlist,
    wishlist: form.wishlist,
    autostart: form.autostart,
    alwaysOnTop: form.alwaysOnTop,
    muyuSound: form.muyuSound,
    lastConfirmedMonth: monthKey(now),
  };
}

export function validateSettings(settings: Settings): {
  settings?: Settings;
  errors: Record<string, string>;
} {
  const result = settingsSchema.safeParse(settings);
  if (result.success) return { settings: result.data, errors: {} };
  const errors: Record<string, string> = {};
  result.error.issues.forEach((issue) => {
    const path = issue.path.join(".");
    if (!errors[path]) errors[path] = issue.message;
    if (issue.path[0] === "lunch" && !errors.lunch) errors.lunch = issue.message;
  });
  return { errors };
}
