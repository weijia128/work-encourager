import { useMemo, useState, type FormEvent } from "react";
import { useServices } from "../services/ServicesContext";
import { mondayOf, toDateKey } from "../domain/dates";
import { BasicsSection } from "./setup/BasicsSection";
import { ScheduleSection } from "./setup/ScheduleSection";
import { RestPolicySection } from "./setup/RestPolicySection";
import { WatchlistSection } from "./setup/WatchlistSection";
import { WishlistSection } from "./setup/WishlistSection";
import { OptionsSection } from "./setup/OptionsSection";
import {
  formToSettings,
  monthKey,
  settingsToForm,
  validateSettings,
  type FormState,
} from "./setup/form";
import type { Settings } from "../domain/settings";

export function SetupWizard({
  initial,
  onDone,
}: {
  initial?: Settings;
  onDone: (settings: Settings) => void;
}) {
  const { now } = useServices();
  const reference = now();
  const [form, setForm] = useState<FormState>(() => settingsToForm(initial, reference));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const thisMonday = useMemo(() => mondayOf(toDateKey(reference)), [reference]);
  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((old) => ({ ...old, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const result = validateSettings(formToSettings(form, now()));
    if (result.settings) {
      setErrors({});
      onDone(result.settings);
      return;
    }
    setErrors(result.errors);
  };
  const summary = Object.entries(errors).filter(
    ([key]) =>
      ![
        "nickname",
        "monthlySalary",
        "workStart",
        "workEnd",
        "lunch",
        "lunch.start",
        "lunch.end",
      ].includes(key) &&
      !key.startsWith("watchlist") &&
      !key.startsWith("wishlist"),
  );
  return (
    <main className="setup-wizard">
      <h1>开始设置</h1>
      <form onSubmit={submit}>
        <BasicsSection form={form} update={update} errors={errors} />
        <ScheduleSection form={form} update={update} errors={errors} />
        <RestPolicySection form={form} update={update} />
        <WatchlistSection form={form} update={update} errors={errors} />
        <WishlistSection form={form} update={update} errors={errors} />
        <OptionsSection form={form} update={update} />
        {summary.map(([key, message]) => (
          <div className="field-error" key={key}>
            {message}
          </div>
        ))}
        <button type="submit">开始上班</button>
      </form>
      <small className="setup-month">
        本月：{monthKey(reference)} · 本周一：{thisMonday}
      </small>
    </main>
  );
}

export default SetupWizard;
