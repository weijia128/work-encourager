import type { FormState, UpdateForm } from "./form";

export function BasicsSection({
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
        称呼
        <input
          aria-label="称呼"
          value={form.nickname}
          onChange={(event) => update("nickname", event.target.value)}
        />
        {errors.nickname && <span className="field-error">{errors.nickname}</span>}
      </label>
      <label>
        月薪
        <input
          aria-label="月薪"
          type="number"
          value={form.monthlySalary}
          onChange={(event) => update("monthlySalary", event.target.value)}
        />
        {errors.monthlySalary && <span className="field-error">{errors.monthlySalary}</span>}
      </label>
    </>
  );
}
