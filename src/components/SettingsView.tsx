import SetupWizard from "./SetupWizard";
import { monthKey } from "../domain/monthPrompt";
import { useServices } from "../services/ServicesContext";
import type { Settings } from "../domain/settings";

export default function SettingsView({
  settings,
  onSave,
  onCancel,
  fromMonthPrompt = false,
}: {
  settings: Settings;
  onSave: (settings: Settings) => void;
  onCancel: () => void;
  fromMonthPrompt?: boolean;
}) {
  const { now } = useServices();
  return (
    <main className="settings-view">
      <button type="button" className="settings-cancel" onClick={onCancel}>
        取消
      </button>
      <SetupWizard
        initial={settings}
        submitLabel="保存"
        stampMonth={false}
        onDone={(next) =>
          onSave(fromMonthPrompt ? { ...next, lastConfirmedMonth: monthKey(now()) } : next)
        }
      />
    </main>
  );
}
