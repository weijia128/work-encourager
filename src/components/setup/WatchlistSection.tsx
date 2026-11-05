import { DEFAULT_WATCHLIST } from "../../domain/settings";
import type { FormState, UpdateForm } from "./form";
import { useState } from "react";
import type { Instrument } from "../../domain/settings";
import { AddInstrumentDialog } from "../AddInstrumentDialog";

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
  const [adding, setAdding] = useState(false);
  const restore = () =>
    update(
      "watchlist",
      DEFAULT_WATCHLIST.map((item) => ({ ...item })),
    );
  const add = (instrument: Instrument) => {
    if (!form.watchlist.some((item) => item.secid === instrument.secid)) {
      update("watchlist", [...form.watchlist, instrument]);
    }
    setAdding(false);
  };
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
      <button type="button" onClick={() => setAdding(true)}>
        ＋ 添加
      </button>
      {form.watchlist.length === 0 && (
        <button type="button" onClick={restore}>
          恢复默认
        </button>
      )}
      {adding && <AddInstrumentDialog onAdd={add} onClose={() => setAdding(false)} />}
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
