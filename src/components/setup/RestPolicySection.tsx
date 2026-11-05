import type { FormState, UpdateForm } from "./form";

const policies = [
  ["double", "双休"],
  ["single", "单休"],
  ["bigSmall", "大小周"],
] as const;

export function RestPolicySection({ form, update }: { form: FormState; update: UpdateForm }) {
  return (
    <fieldset>
      <legend>休息制度</legend>
      {policies.map(([value, label]) => (
        <label key={value}>
          <input
            type="radio"
            name="rest"
            checked={form.restKind === value}
            onChange={() => update("restKind", value)}
          />
          {label}
        </label>
      ))}
      {form.restKind === "bigSmall" && (
        <div>
          <label>
            <input
              type="radio"
              name="week"
              checked={form.smallWeek}
              onChange={() => update("smallWeek", true)}
            />
            本周是 小周（周六上班）
          </label>
          <label>
            <input
              type="radio"
              name="week"
              checked={!form.smallWeek}
              onChange={() => update("smallWeek", false)}
            />
            本周是 大周（周六休）
          </label>
        </div>
      )}
    </fieldset>
  );
}
