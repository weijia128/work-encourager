import { useEffect, useState } from "react";
import SetupWizard from "./components/SetupWizard";
import SettingsView from "./components/SettingsView";
import Panel from "./components/Panel";
import { loadSettings, saveSettings } from "./services/settingsRepo";
import { loadCalendar } from "./services/holidayLoader";
import { httpFetchJson } from "./services/http";
import { useServices } from "./services/ServicesContext";
import { EMPTY_CALENDAR, type HolidayCalendar } from "./domain/holidays";
import { computeSnapshot } from "./domain/earnings";
import { monthKey, needsMonthPrompt } from "./domain/monthPrompt";
import { useNow } from "./hooks/useNow";
import { useTraySync } from "./hooks/useTraySync";
import type { Settings } from "./domain/settings";

function LiveApp({
  settings,
  calendar,
  view,
  fromMonthPrompt,
  onOpenSettings,
  onSave,
  onCancel,
}: {
  settings: Settings;
  calendar: HolidayCalendar;
  view: "panel" | "settings";
  fromMonthPrompt: boolean;
  onOpenSettings: (fromMonthPrompt?: boolean) => void;
  onSave: (settings: Settings, fromMonthPrompt: boolean, source?: "panel" | "settings") => void;
  onCancel: () => void;
}) {
  const now = useNow(1000);
  const snapshot = computeSnapshot(now, settings, calendar);
  const badge = needsMonthPrompt(now, settings, calendar);
  const tooltip = `${settings.nickname}，${snapshot.status === "working" ? "上班中" : snapshot.status === "lunch" ? "午休中" : snapshot.status === "beforeWork" ? "还没上班" : snapshot.status === "afterWork" ? "已下班" : "今天休息"} · 今日 ¥${snapshot.todayEarned.toFixed(2)}`;
  useTraySync(snapshot, badge, now, tooltip);
  if (view === "settings")
    return (
      <SettingsView
        settings={settings}
        fromMonthPrompt={fromMonthPrompt}
        onSave={(next) => onSave(next, fromMonthPrompt, "settings")}
        onCancel={onCancel}
      />
    );
  return (
    <Panel
      settings={settings}
      calendar={calendar}
      liveNow={now}
      liveSnapshot={snapshot}
      syncTray={false}
      onOpenSettings={onOpenSettings}
      onSettingsChange={(next) => onSave(next, false, "panel")}
    />
  );
}

function App() {
  const services = useServices();
  const [settings, setSettings] = useState<Settings | null | undefined>(undefined);
  const [calendar, setCalendar] = useState<HolidayCalendar>(EMPTY_CALENDAR);
  const [view, setView] = useState<"panel" | "settings">("panel");
  const [fromMonthPrompt, setFromMonthPrompt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [platformNote, setPlatformNote] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    loadSettings(services.kv)
      .then((value) => {
        if (active) setSettings(value);
      })
      .catch(() => {
        if (active) setError("设置加载失败，请重启应用后重试");
      });
    return () => {
      active = false;
    };
  }, [services.kv]);
  useEffect(() => {
    const year = services.now().getFullYear();
    loadCalendar([year, year + 1], services.kv, httpFetchJson)
      .then(setCalendar)
      .catch(() => setCalendar(EMPTY_CALENDAR));
  }, [services.kv, services.now]);
  const applySettings = async (
    next: Settings,
    source: "setup" | "panel" | "settings",
    fromPrompt = false,
  ) => {
    const saved =
      source === "setup"
        ? next
        : fromPrompt
          ? { ...next, lastConfirmedMonth: monthKey(services.now()) }
          : source === "settings" && settings
            ? { ...next, lastConfirmedMonth: settings.lastConfirmedMonth }
            : next;
    try {
      await saveSettings(services.kv, saved);
      setSettings(saved);
      setView("panel");
      setFromMonthPrompt(false);
      setPlatformNote(null);
      try {
        await Promise.all([
          services.platform.setAlwaysOnTop(saved.alwaysOnTop),
          services.platform.setAutostart(saved.autostart),
        ]);
      } catch {
        setPlatformNote("系统设置未能立即应用，可稍后重试");
      }
    } catch {
      setPlatformNote("设置保存失败，请检查输入后重试");
    }
  };
  if (error)
    return (
      <main className="container">
        <p role="alert">{error}</p>
      </main>
    );
  if (settings === undefined)
    return (
      <main className="container">
        <p>正在加载设置…</p>
      </main>
    );
  if (settings === null)
    return (
      <>
        <SetupWizard onDone={(next) => applySettings(next, "setup")} />
        {platformNote && <p role="status">{platformNote}</p>}
      </>
    );
  return (
    <>
      <LiveApp
        settings={settings}
        calendar={calendar}
        view={view}
        fromMonthPrompt={fromMonthPrompt}
        onOpenSettings={(fromPrompt = false) => {
          setFromMonthPrompt(fromPrompt);
          setView("settings");
        }}
        onSave={(next, fromPrompt, source = "settings") => applySettings(next, source, fromPrompt)}
        onCancel={() => {
          setFromMonthPrompt(false);
          setView("panel");
        }}
      />
      {platformNote && <p role="status">{platformNote}</p>}
    </>
  );
}
export default App;
