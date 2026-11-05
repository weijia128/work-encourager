import type { FormState, UpdateForm } from "./form";

export function WatchlistSection({
  form,
  update,
  errors,
}: {
  form: FormState;
  update: UpdateForm;
  errors: Record<string, string>;
}) {
  const remove = (secid: string) =>
    update(
      "watchlist",
      form.watchlist.filter((item) => item.secid !== secid),
    );
  return (
    <fieldset>
      <legend>关注品种</legend>
      <div className="watchlist-chips">
        {form.watchlist.map((item) => (
          <button type="button" key={item.secid} onClick={() => remove(item.secid)}>
            {item.name} ×
          </button>
        ))}
      </div>
      {Object.entries(errors)
        .filter(([key]) => key.startsWith("watchlist"))
        .map(([key, message]) => (
          <span className="field-error" key={key}>
            {message}
          </span>
        ))}
    </fieldset>
  );
}
