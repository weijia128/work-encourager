import { useEffect, useState } from "react";
import SetupWizard from "./components/SetupWizard";
import Panel from "./components/Panel";
import { loadSettings, saveSettings } from "./services/settingsRepo";
import { loadCalendar } from "./services/holidayLoader";
import { httpFetchJson } from "./services/http";
import { useServices } from "./services/ServicesContext";
import { EMPTY_CALENDAR, type HolidayCalendar } from "./domain/holidays";
import type { Settings } from "./domain/settings";

function App() {
  const services = useServices();
  const [settings, setSettings] = useState<Settings | null | undefined>(undefined);
  const [calendar, setCalendar] = useState<HolidayCalendar>(EMPTY_CALENDAR);
  const [editing, setEditing] = useState(false);
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
  }, [services.kv, services.market, services.now]);
  const onDone = async (next: Settings) => {
    const saved =
      editing && settings ? { ...next, lastConfirmedMonth: settings.lastConfirmedMonth } : next;
    try {
      await saveSettings(services.kv, saved);
      setSettings(saved);
      setEditing(false);
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
  if (settings === null || editing)
    return (
      <>
        <SetupWizard initial={settings ?? undefined} onDone={onDone} />
        {platformNote && <p role="status">{platformNote}</p>}
      </>
    );
  return (
    <>
      <Panel
        settings={settings}
        calendar={calendar}
        onOpenSettings={() => setEditing(true)}
        onSettingsChange={onDone}
      />
      {platformNote && <p role="status">{platformNote}</p>}
    </>
  );
}
export default App;
