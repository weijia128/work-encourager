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
import { useFitWindow } from "../hooks/useFitWindow";
import {
  COMPACT_WINDOW_HEIGHT,
  COMPACT_WINDOW_WIDTH,
  MIN_RESIZABLE_WINDOW_HEIGHT,
  MIN_RESIZABLE_WINDOW_WIDTH,
} from "../domain/windowFit";
import { useEffect, useRef, useState } from "react";
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
import { WindowControls } from "./WindowControls";

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
  const { kv, platform } = useServices();
  const internalNow = useNow(1000);
  const now = liveNow ?? internalNow;
  const snapshot = liveSnapshot ?? computeSnapshot(now, settings, calendar);
  const { quotes, refresh: refreshQuotes, refreshing } = useMarket(settings.watchlist, calendar);
  const copyLibrary = useCopyLibrary();
  const panelRef = useRef<HTMLElement>(null);
  const [compact, setCompact] = useState(false);
  useFitWindow(panelRef, !compact);
  useEffect(() => {
    document.documentElement.classList.toggle("compact-mode", compact);
    document.body.classList.toggle("compact-mode", compact);
    if (!compact)
      return () => {
        document.documentElement.classList.remove("compact-mode");
        document.body.classList.remove("compact-mode");
      };
    platform.setResizable(false).catch(() => undefined);
    platform
      .setMinSize(COMPACT_WINDOW_WIDTH, COMPACT_WINDOW_HEIGHT)
      .then(() => platform.setWindowSize(COMPACT_WINDOW_WIDTH, COMPACT_WINDOW_HEIGHT))
      .catch(() => undefined);
    platform.setAlwaysOnTop(true).catch(() => undefined);
    platform.setShadow(false).catch(() => undefined);
    return () => {
      document.documentElement.classList.remove("compact-mode");
      document.body.classList.remove("compact-mode");
      platform.setShadow(true).catch(() => undefined);
      platform.setResizable(true).catch(() => undefined);
      platform
        .setMinSize(MIN_RESIZABLE_WINDOW_WIDTH, MIN_RESIZABLE_WINDOW_HEIGHT)
        .catch(() => undefined);
      platform.setAlwaysOnTop(settings.alwaysOnTop).catch(() => undefined);
    };
  }, [compact, platform, settings.alwaysOnTop]);
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
  useTraySync(snapshot, badge, now, tooltip, syncTray, settings.hideTodayEarned);
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
  if (compact) {
    return (
      <main className="compact-panel" ref={panelRef} data-tauri-drag-region>
        <MuyuButton
          compact
          merit={merit}
          sound={settings.muyuSound}
          onTap={handleTap}
          progress={snapshot.todayProgress}
        />
        <div className="compact-summary">
          <small>{STATUS_LABEL[snapshot.status]}</small>
          <strong>
            {settings.hideTodayEarned ? "¥••••••" : `¥${snapshot.todayEarned.toFixed(2)}`}
          </strong>
        </div>
        <button
          type="button"
          className="compact-expand"
          onClick={() => setCompact(false)}
          aria-label="展开主窗口"
          title="展开主窗口"
        >
          <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
            <path d="M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5" />
          </svg>
        </button>
      </main>
    );
  }
  return (
    <main className="panel" ref={panelRef}>
      <header data-tauri-drag-region>
        <WindowControls />
        <b data-tauri-drag-region>上班鼓励器</b>
        <div className="panel-actions">
          <button
            type="button"
            onClick={() => setCompact(true)}
            aria-label="切换悬浮小窗"
            title="切换悬浮小窗"
          >
            小窗
          </button>
          <button type="button" onClick={() => onOpenSettings(false)}>
            设置
          </button>
        </div>
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
