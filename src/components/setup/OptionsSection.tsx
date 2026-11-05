import type { FormState, UpdateForm } from "./form";

export function OptionsSection({ form, update }: { form: FormState; update: UpdateForm }) {
  return (
    <fieldset>
      <legend>选项</legend>
      <label>
        <input
          type="checkbox"
          checked={form.autostart}
          onChange={(event) => update("autostart", event.target.checked)}
        />
        开机自启
      </label>
      <label>
        <input
          type="checkbox"
          checked={form.alwaysOnTop}
          onChange={(event) => update("alwaysOnTop", event.target.checked)}
        />
        面板置顶
      </label>
      <label>
        <input
          type="checkbox"
          checked={form.muyuSound}
          onChange={(event) => update("muyuSound", event.target.checked)}
        />
        木鱼声音
      </label>
    </fieldset>
  );
}
