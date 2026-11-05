import type { FormState, UpdateForm } from "./form";

export function ScheduleSection({
  form,
  update,
  errors,
}: {
  form: FormState;
  update: UpdateForm;
  errors: Record<string, string>;
}) {
  return (
    <>
      <label>
        上班时间
        <input
          aria-label="上班时间"
          type="time"
          value={form.workStart}
          onChange={(event) => update("workStart", event.target.value)}
        />
        {errors.workStart && <span className="field-error">{errors.workStart}</span>}
      </label>
      <label>
        下班时间
        <input
          aria-label="下班时间"
          type="time"
          value={form.workEnd}
          onChange={(event) => update("workEnd", event.target.value)}
        />
        {errors.workEnd && <span className="field-error">{errors.workEnd}</span>}
      </label>
      <fieldset>
        <legend>午休</legend>
        <label>
          <input
            type="checkbox"
            checked={form.noLunch}
            onChange={(event) => update("noLunch", event.target.checked)}
          />
          没有午休
        </label>
        {!form.noLunch && (
          <>
            <label>
              午休开始
              <input
                aria-label="午休开始"
                type="time"
                value={form.lunchStart}
                onChange={(event) => update("lunchStart", event.target.value)}
              />
              {errors["lunch.start"] && (
                <span className="field-error">{errors["lunch.start"]}</span>
              )}
            </label>
            <label>
              午休结束
              <input
                aria-label="午休结束"
                type="time"
                value={form.lunchEnd}
                onChange={(event) => update("lunchEnd", event.target.value)}
              />
              {errors["lunch.end"] && <span className="field-error">{errors["lunch.end"]}</span>}
            </label>
          </>
        )}
        {errors.lunch && <span className="field-error">{errors.lunch}</span>}
      </fieldset>
    </>
  );
}
