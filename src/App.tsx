import { useEffect, useState } from "react";
import SetupWizard from "./components/SetupWizard";
import { loadSettings, saveSettings } from "./services/settingsRepo";
import { useServices } from "./services/ServicesContext";
import type { Settings } from "./domain/settings";

function PanelStub({ settings }: { settings: Settings }) {
  return (
    <main className="container">
      <h1>💰 上班鼓励器</h1>
      <p>{settings.nickname}，准备开始今天的工作。</p>
    </main>
  );
}

function App() {
  const services = useServices();
  const [settings, setSettings] = useState<Settings | null | undefined>(undefined);
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
  const onDone = async (next: Settings) => {
    try {
      await saveSettings(services.kv, next);
      setSettings(next);
      setPlatformNote(null);
      try {
        await Promise.all([
          services.platform.setAlwaysOnTop(next.alwaysOnTop),
          services.platform.setAutostart(next.autostart),
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
  return (
    <>
      {settings === null ? <SetupWizard onDone={onDone} /> : <PanelStub settings={settings} />}
      {platformNote && <p role="status">{platformNote}</p>}
    </>
  );
}

export default App;
