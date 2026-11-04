import { z } from "zod";
import type { WorkSchedule } from "./earnings";
import type { RestPolicy } from "./workdays";
import { parseHHMM } from "./dates";

export interface Instrument { readonly secid: string; readonly name: string }
export interface WishItem { readonly name: string; readonly price: number }
export interface Settings extends WorkSchedule {
  readonly nickname: string;
  readonly watchlist: readonly Instrument[];
  readonly wishlist: readonly WishItem[];
  readonly autostart: boolean;
  readonly alwaysOnTop: boolean;
  readonly muyuSound: boolean;
  readonly lastConfirmedMonth: string | null;
}

const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "时间格式必须为HH:MM");
const restPolicySchema: z.ZodType<RestPolicy> = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("double") }),
  z.object({ kind: z.literal("single") }),
  z.object({
    kind: z.literal("bigSmall"),
    smallWeekMonday: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "大小周日期格式错误"),
  }),
]);
const instrumentSchema = z.object({
  secid: z.string().min(1, "品种代码不能为空"),
  name: z.string().min(1, "品种名称不能为空"),
});
const wishSchema = z.object({
  name: z.string().min(1, "心愿名称不能为空"),
  price: z.number({ error: "心愿价格必须是有限数字" })
    .refine(Number.isFinite, "心愿价格必须是有限数字")
    .refine((v) => v > 0, "心愿价格必须大于0"),
});

export const settingsSchema: z.ZodType<Settings> = z.object({
  nickname: z.string().min(1, "称呼不能为空").max(12, "称呼不能超过12个字符"),
  monthlySalary: z.number({ error: "月薪必须是有限数字" }).refine(Number.isFinite, "月薪必须是有限数字").refine((v) => v > 0, "月薪必须大于0"),
  workStart: timeSchema,
  workEnd: timeSchema,
  lunch: z.union([z.null(), z.object({ start: timeSchema, end: timeSchema })]),
  restPolicy: restPolicySchema,
  watchlist: z.array(instrumentSchema),
  wishlist: z.array(wishSchema),
  autostart: z.boolean(),
  alwaysOnTop: z.boolean(),
  muyuSound: z.boolean(),
  lastConfirmedMonth: z.union([z.null(), z.string().regex(/^\d{4}-\d{2}$/, "月份格式错误")]),
}).superRefine((value, ctx) => {
  const startMinutes = parseHHMM(value.workStart);
  const endMinutes = parseHHMM(value.workEnd);
  if (endMinutes <= startMinutes) {
    ctx.addIssue({ code: "custom", path: ["workEnd"], message: "下班时间必须晚于上班时间" });
  }
  if (value.lunch) {
    const start = parseHHMM(value.lunch.start);
    const end = parseHHMM(value.lunch.end);
    if (end <= start) ctx.addIssue({ code: "custom", path: ["lunch", "end"], message: "午休结束时间必须晚于开始时间" });
    if (start < startMinutes || end > endMinutes) {
      ctx.addIssue({ code: "custom", path: ["lunch"], message: "午休必须在工作时间内" });
    }
  }
  const ids = new Set<string>();
  value.watchlist.forEach((item, index) => {
    if (ids.has(item.secid)) ctx.addIssue({ code: "custom", path: ["watchlist", index, "secid"], message: "关注品种不能重复" });
    ids.add(item.secid);
  });
});

export const DEFAULT_WATCHLIST: Instrument[] = [
  { secid: "1.000300", name: "沪深300" },
  { secid: "1.000688", name: "科创50" },
  { secid: "1.518880", name: "黄金ETF" },
];

export function defaultSettingsDraft(): Omit<Settings, "nickname" | "monthlySalary"> {
  return {
    workStart: "09:00", workEnd: "18:00", lunch: { start: "12:00", end: "13:00" },
    restPolicy: { kind: "double" }, watchlist: DEFAULT_WATCHLIST.map((item) => ({ ...item })), wishlist: [],
    autostart: false, alwaysOnTop: true, muyuSound: false, lastConfirmedMonth: null,
  };
}
