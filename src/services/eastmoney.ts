import { z } from "zod";
import type { DailyClose } from "../domain/market";
import type { Instrument } from "../domain/settings";

export interface MarketProvider {
  fetchDailyCloses(secid: string): Promise<DailyClose[]>;
  search(query: string): Promise<Instrument[]>;
}

const klineSchema = z.object({
  data: z.object({ klines: z.array(z.string()) }),
});
const searchSchema = z.object({
  QuotationCodeTable: z.object({
    Data: z.array(
      z.object({
        QuoteID: z.string(),
        Name: z.string(),
        MktNum: z.union([z.string(), z.number()]),
      }),
    ),
  }),
});

export function parseKline(json: unknown): DailyClose[] {
  const data = klineSchema.parse(json);
  return data.data.klines.map((line) => {
    const [date, close, ...rest] = line.split(",");
    if (rest.length > 0 || !/^\d{4}-\d{2}-\d{2}$/.test(date ?? "") || close === undefined) {
      throw new Error("行情K线格式错误");
    }
    const value = Number(close);
    if (!Number.isFinite(value)) throw new Error("行情收盘价格式错误");
    return { date, close: value };
  });
}

export function parseSearch(json: unknown): Instrument[] {
  const data = searchSchema.parse(json);
  return data.QuotationCodeTable.Data.filter(
    (item) => item.MktNum === "0" || item.MktNum === "1" || item.MktNum === 0 || item.MktNum === 1,
  ).map((item) => ({ secid: item.QuoteID, name: item.Name }));
}

const KLINE_URL = "https://push2his.eastmoney.com/api/qt/stock/kline/get";
const SEARCH_URL = "https://searchapi.eastmoney.com/api/suggest/get";

export function createEastmoneyProvider(
  fetchJson: (url: string) => Promise<unknown>,
): MarketProvider {
  return {
    async fetchDailyCloses(secid) {
      const params = new URLSearchParams({
        secid,
        fields1: "f1,f2,f3",
        fields2: "f51,f53",
        klt: "101",
        fqt: "1",
        lmt: "300",
        end: "20500101",
      });
      return parseKline(await fetchJson(`${KLINE_URL}?${params.toString()}`));
    },
    async search(query) {
      const params = new URLSearchParams({
        input: query,
        type: "14",
        token: "D43BF722C8E33BDC906FB84D85E326E8",
        count: "10",
      });
      return parseSearch(await fetchJson(`${SEARCH_URL}?${params.toString()}`));
    },
  };
}
