import { useState } from "react";
import type { Quote } from "../domain/market";
import type { Instrument } from "../domain/settings";
import { AddInstrumentDialog } from "./AddInstrumentDialog";

type Period = "month" | "halfYear" | "year";

const PERIODS: readonly { key: Period; label: string; title: string }[] = [
  { key: "month", label: "本月", title: "本月涨跌幅" },
  { key: "halfYear", label: "半年", title: "近半年涨跌幅" },
  { key: "year", label: "今年", title: "今年涨跌幅" },
];

function changeFor(quote: Quote | undefined, period: Period): number | undefined {
  if (!quote) return undefined;
  if (period === "month") return quote.change;
  if (period === "halfYear") return quote.halfYearChange;
  return quote.yearChange;
}

export default function TickerChips({
  watchlist,
  quotes,
  refreshing,
  onRefresh,
  onChange,
}: {
  watchlist: readonly Instrument[];
  quotes: Record<string, Quote & { name: string }>;
  refreshing: boolean;
  onRefresh: () => void;
  onChange: (next: Instrument[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<Period>("month");
  const { title: periodTitle } = PERIODS.find((item) => item.key === period) ?? PERIODS[0];
  const remove = (secid: string) => onChange(watchlist.filter((item) => item.secid !== secid));
  const add = (instrument: Instrument) => {
    if (!watchlist.some((item) => item.secid === instrument.secid)) {
      onChange([...watchlist, instrument]);
    }
    setOpen(false);
  };
  return (
    <section className="ticker-section" aria-label="关注品种">
      <div className="section-heading">
        <span>行情</span>
        <div className="ticker-actions">
          <div className="market-period" aria-label="行情周期">
            {PERIODS.map((item) => (
              <button
                key={item.key}
                type="button"
                className={period === item.key ? "active" : ""}
                aria-pressed={period === item.key}
                onClick={() => setPeriod(item.key)}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`market-refresh ${refreshing ? "refreshing" : ""}`}
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="刷新行情"
            title="立即刷新行情"
          >
            ↻
          </button>
        </div>
      </div>
      <div className="ticker-chips">
        {watchlist.map((item) => {
          const quote = quotes[item.secid];
          const quoteValue = changeFor(quote, period);
          const value = quoteValue ?? 0;
          return (
            <span
              className={`ticker-chip ${value >= 0 ? "up" : "down"}`}
              key={item.secid}
              title={quote ? `${periodTitle} · 数据截至 ${quote.asOf}` : "等待行情数据"}
            >
              {item.name}{" "}
              {quoteValue !== undefined
                ? `${value >= 0 ? "+" : ""}${(value * 100).toFixed(1)}%`
                : "—"}
              {quote?.stale && <small> 未更新</small>}
              <button
                type="button"
                aria-label={`移除${item.name}`}
                onClick={() => remove(item.secid)}
              >
                ×
              </button>
            </span>
          );
        })}
        <button
          type="button"
          className="ticker-add"
          onClick={() => setOpen(true)}
          aria-label="添加关注品种"
        >
          ＋
        </button>
      </div>
      {open && <AddInstrumentDialog onAdd={add} onClose={() => setOpen(false)} />}
    </section>
  );
}
