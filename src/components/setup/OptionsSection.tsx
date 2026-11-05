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
      <label>
        <input
          type="checkbox"
          checked={form.hideTodayEarned}
          onChange={(event) => update("hideTodayEarned", event.target.checked)}
        />
        隐藏今日收入详情
      </label>
      <label>
        <input
          type="checkbox"
          checked={form.hideProgressAmount}
          onChange={(event) => update("hideProgressAmount", event.target.checked)}
        />
        隐藏进度金额
      </label>
      <label>
        <input
          type="checkbox"
          checked={form.hideWorkDuration}
          onChange={(event) => update("hideWorkDuration", event.target.checked)}
        />
        隐藏工作时长
      </label>
    </fieldset>
  );
}
