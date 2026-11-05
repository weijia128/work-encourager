import { computeSnapshot } from "../domain/earnings";
import { buildCopyCandidates } from "../domain/copywriter";
import { needsMonthPrompt, monthKey } from "../domain/monthPrompt";
import type { HolidayCalendar } from "../domain/holidays";
import type { Settings } from "../domain/settings";
import { useNow } from "../hooks/useNow";
import { useTraySync } from "../hooks/useTraySync";
import { CopyLine } from "./CopyLine";
import { EarnedBlock } from "./EarnedBlock";
import { MonthPrompt } from "./MonthPrompt";
import { ProgressBars } from "./ProgressBars";
import { StatusBlock } from "./StatusBlock";

export default function Panel({
  settings,
  calendar,
  onOpenSettings,
  onSettingsChange,
}: {
  settings: Settings;
  calendar: HolidayCalendar;
  onOpenSettings: () => void;
  onSettingsChange: (settings: Settings) => void;
}) {
  const now = useNow(1000);
  const snapshot = computeSnapshot(now, settings, calendar);
  const badge = needsMonthPrompt(now, settings, calendar);
  useTraySync(snapshot, badge, now);
  const copy = buildCopyCandidates({
    snapshot,
    nickname: settings.nickname,
    wishlist: settings.wishlist,
    quotes: [],
    lunchStart: settings.lunch?.start ?? null,
    now,
  })[0];
  const confirm = () => onSettingsChange({ ...settings, lastConfirmedMonth: monthKey(now) });
  const dateText = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")} ${"日一二三四五六"[now.getDay()]} ${now.toLocaleTimeString("zh-CN", { hour12: false })}`;
  return (
    <main className="panel">
      <header>
        <b>💰 上班鼓励器</b>
        <button type="button" onClick={onOpenSettings}>
          ⚙ 设置
        </button>
      </header>
      <div className="date muted">{dateText}</div>
      <StatusBlock nickname={settings.nickname} snapshot={snapshot} />
      <EarnedBlock snapshot={snapshot} />
      {badge && <MonthPrompt onConfirm={confirm} onEdit={onOpenSettings} />}
      <CopyLine text={copy} />
      <ProgressBars snapshot={snapshot} />
      <div className="panel-slot" aria-label="TickerChips slot" />
      <div className="panel-slot" aria-label="Muyu slot" />
    </main>
  );
}
