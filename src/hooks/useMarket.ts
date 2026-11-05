import { useCallback, useEffect, useRef, useState } from "react";
import { isTradingTime, monthToDateChange, yearToDateChange, type Quote } from "../domain/market";
import { toDateKey } from "../domain/dates";
import type { HolidayCalendar } from "../domain/holidays";
import type { Instrument } from "../domain/settings";
import { loadQuotes, saveQuotes } from "../services/settingsRepo";
import { useServices } from "../services/ServicesContext";

interface CachedQuote extends Quote {
  name: string;
}

type QuoteMap = Record<string, CachedQuote>;

function cachedForWatchlist(raw: unknown, watchlist: readonly Instrument[]): QuoteMap {
  if (!raw || typeof raw !== "object") return {};
  const source = raw as Record<string, unknown>;
  return Object.fromEntries(
    watchlist.flatMap((item) => {
      const value = source[item.secid];
      if (!value || typeof value !== "object") return [];
      const quote = value as Partial<CachedQuote>;
      if (typeof quote.change !== "number" || typeof quote.asOf !== "string") return [];
      const cached: CachedQuote = {
        secid: item.secid,
        name: item.name,
        change: quote.change,
        yearChange:
          typeof quote.yearChange === "number" && Number.isFinite(quote.yearChange)
            ? quote.yearChange
            : undefined,
        asOf: quote.asOf,
        stale: Boolean(quote.stale),
      };
      return [[item.secid, cached]];
    }),
  );
}

export function useMarket(watchlist: readonly Instrument[], cal: HolidayCalendar) {
  const { market, kv, now } = useServices();
  const [quotes, setQuotes] = useState<QuoteMap>({});
  const [refreshing, setRefreshing] = useState(false);
  const quotesRef = useRef(quotes);
  const watchlistRef = useRef(watchlist);
  const lastPollRef = useRef(0);
  const closeFetchDayRef = useRef<string | null>(null);
  quotesRef.current = quotes;
  watchlistRef.current = watchlist;

  const refresh = useCallback(
    async (instruments: readonly Instrument[] = watchlistRef.current) => {
      setRefreshing(true);
      try {
        const current = quotesRef.current;
        const next = { ...current };
        await Promise.all(
          instruments.map(async (instrument) => {
            try {
              const closes = await market.fetchDailyCloses(instrument.secid);
              const latest = closes[closes.length - 1];
              if (!latest) return;
              next[instrument.secid] = {
                secid: instrument.secid,
                name: instrument.name,
                change: monthToDateChange(closes, now()) ?? 0,
                yearChange: yearToDateChange(closes, now()) ?? undefined,
                asOf: latest.date,
                stale: false,
              };
            } catch {
              const old = next[instrument.secid];
              if (old) next[instrument.secid] = { ...old, stale: true };
            }
          }),
        );
        setQuotes(next);
        await saveQuotes(kv, next);
      } finally {
        setRefreshing(false);
      }
    },
    [kv, market, now],
  );

  useEffect(() => {
    let active = true;
    const load = async () => {
      const cached = cachedForWatchlist(await loadQuotes<QuoteMap>(kv), watchlist);
      if (!active) return;
      setQuotes(cached);
      quotesRef.current = cached;
      await refresh(watchlist);
    };
    void load();
    return () => {
      active = false;
    };
  }, [kv, refresh, watchlist]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const current = now();
      lastPollRef.current += 60_000;
      const day = toDateKey(current);
      const closeCheck = new Date(current);
      closeCheck.setHours(14, 59, 0, 0);
      const afterClose = current.getHours() >= 15 && closeFetchDayRef.current !== day;
      if (afterClose && isTradingTime(closeCheck, cal)) {
        closeFetchDayRef.current = day;
        void refresh();
      } else if (lastPollRef.current >= 180_000 && isTradingTime(current, cal)) {
        lastPollRef.current = 0;
        void refresh();
      }
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [cal, now, refresh]);
  return { quotes, refresh, refreshing };
}
