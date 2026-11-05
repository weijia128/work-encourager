import { computeSnapshot, type Snapshot } from "../domain/earnings";
import { isDaoCopyTime, pickCopyLines } from "../domain/copywriter";
import { needsMonthPrompt, monthKey } from "../domain/monthPrompt";
import { formatClock } from "../domain/dates";
import { STATUS_LABEL } from "../domain/earnings";
import { nextHoliday, type HolidayCalendar } from "../domain/holidays";
import type { Settings } from "../domain/settings";
import { useNow } from "../hooks/useNow";
import { useTraySync } from "../hooks/useTraySync";
import { useMarket } from "../hooks/useMarket";
import { useCopyLibrary } from "../hooks/useCopyLibrary";
import { useEffect, useState } from "react";
import { loadMerit, saveMerit } from "../services/settingsRepo";
import { useServices } from "../services/ServicesContext";
import { tapMerit, type Merit } from "../domain/merit";
import { toDateKey } from "../domain/dates";
import { CopyLine } from "./CopyLine";
import { EarnedBlock } from "./EarnedBlock";
import { MonthPrompt } from "./MonthPrompt";
import { ProgressBars } from "./ProgressBars";
import { StatusBlock } from "./StatusBlock";
import TickerChips from "./TickerChips";
import MuyuButton from "./MuyuButton";

export default function Panel({
  settings,
  calendar,
  onOpenSettings,
  onSettingsChange,
  liveNow,
  liveSnapshot,
  syncTray = true,
}: {
  settings: Settings;
  calendar: HolidayCalendar;
  onOpenSettings: (fromMonthPrompt?: boolean) => void;
  onSettingsChange: (settings: Settings) => void;
  liveNow?: Date;
  liveSnapshot?: Snapshot;
  syncTray?: boolean;
}) {
  const { kv } = useServices();
  const internalNow = useNow(1000);
  const now = liveNow ?? internalNow;
  const snapshot = liveSnapshot ?? computeSnapshot(now, settings, calendar);
  const { quotes, refresh: refreshQuotes, refreshing } = useMarket(settings.watchlist, calendar);
  const copyLibrary = useCopyLibrary();
  const [merit, setMerit] = useState<Merit>(() => ({ date: toDateKey(now), today: 0, total: 0 }));
  useEffect(() => {
    void loadMerit<Merit>(kv).then((stored) => {
      if (
        stored &&
        typeof stored.date === "string" &&
        Number.isFinite(stored.today) &&
        Number.isFinite(stored.total)
      ) {
        setMerit(stored);
      }
    });
  }, [kv]);
  const badge = needsMonthPrompt(now, settings, calendar);
  const tooltip = `${settings.nickname}，${STATUS_LABEL[snapshot.status]} · 今日 ¥${snapshot.todayEarned.toFixed(2)}`;
  useTraySync(snapshot, badge, now, tooltip, syncTray);
  const copyLines = pickCopyLines({
    snapshot,
    nickname: settings.nickname,
    wishlist: settings.wishlist,
    quotes: [],
    lunchStart: settings.lunch?.start ?? null,
    now,
    copyLibrary,
  });
  const holiday = nextHoliday(now, calendar);
  const confirm = () => onSettingsChange({ ...settings, lastConfirmedMonth: monthKey(now) });
  const handleTap = () => {
    const next = tapMerit(merit, now);
    setMerit(next);
    void saveMerit(kv, next);
  };
  return (
    <main className="panel">
      <header data-tauri-drag-region>
        <b data-tauri-drag-region>上班鼓励器</b>
        <button type="button" onClick={() => onOpenSettings(false)}>
          设置
        </button>
      </header>
      <div className="date muted">
        <span>{formatClock(now)}</span>
        {holiday && (
          <span className="eternal-era">
            恒纪元 · 距{holiday.name} {holiday.days} 天
          </span>
        )}
      </div>
      <StatusBlock nickname={settings.nickname} snapshot={snapshot} />
      <EarnedBlock
        snapshot={snapshot}
        hidden={settings.hideTodayEarned}
        onToggle={() =>
          onSettingsChange({ ...settings, hideTodayEarned: !settings.hideTodayEarned })
        }
      />
      {badge && <MonthPrompt onConfirm={confirm} onEdit={() => onOpenSettings(true)} />}
      <CopyLine texts={copyLines} thirdLabel={isDaoCopyTime(now) ? "清静" : "班味"} />
      <ProgressBars
        snapshot={snapshot}
        hideAmount={settings.hideProgressAmount}
        hideDuration={settings.hideWorkDuration}
      />
      <div aria-label="TickerChips slot">
        <TickerChips
          watchlist={settings.watchlist}
          quotes={quotes}
          refreshing={refreshing}
          onRefresh={() => void refreshQuotes()}
          onChange={(watchlist) => onSettingsChange({ ...settings, watchlist })}
        />
      </div>
      <div aria-label="Muyu slot">
        <MuyuButton merit={merit} sound={settings.muyuSound} onTap={handleTap} />
      </div>
    </main>
  );
}
