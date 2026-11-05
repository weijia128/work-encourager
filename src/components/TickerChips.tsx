import { useState } from "react";
import type { Quote } from "../domain/market";
import type { Instrument } from "../domain/settings";
import { AddInstrumentDialog } from "./AddInstrumentDialog";

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
  const [period, setPeriod] = useState<"month" | "year">("month");
  const periodLabel = period === "month" ? "本月" : "今年";
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
        <span>关注行情</span>
        <div className="ticker-actions">
          <div className="market-period" aria-label="行情周期">
            <button
              type="button"
              className={period === "month" ? "active" : ""}
              aria-pressed={period === "month"}
              onClick={() => setPeriod("month")}
            >
              本月
            </button>
            <button
              type="button"
              className={period === "year" ? "active" : ""}
              aria-pressed={period === "year"}
              onClick={() => setPeriod("year")}
            >
              今年
            </button>
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
          const quoteValue = period === "month" ? quote?.change : quote?.yearChange;
          const value = quoteValue ?? 0;
          return (
            <span
              className={`ticker-chip ${value >= 0 ? "up" : "down"}`}
              key={item.secid}
              title={quote ? `${periodLabel}涨跌幅 · 数据截至 ${quote.asOf}` : "等待行情数据"}
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
