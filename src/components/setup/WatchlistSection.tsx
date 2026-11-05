import { DEFAULT_WATCHLIST } from "../../domain/settings";
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
  const restore = () =>
    update(
      "watchlist",
      DEFAULT_WATCHLIST.map((item) => ({ ...item })),
    );
  return (
    <fieldset>
      <legend>关注品种</legend>
      <div className="watchlist-chips">
        {form.watchlist.map((item) => (
          <span className="watchlist-chip" key={item.secid}>
            {item.name}
            <button
              type="button"
              aria-label={`移除${item.name}`}
              onClick={() => remove(item.secid)}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      {form.watchlist.length === 0 && (
        <button type="button" onClick={restore}>
          恢复默认
        </button>
      )}
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
