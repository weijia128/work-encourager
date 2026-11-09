export { createMemoryStore } from "../services/kvStore";
export type { KeyValueStore } from "../services/kvStore";
import type { MarketProvider } from "../services/eastmoney";
import type { DailyClose } from "../domain/market";
import type { Instrument } from "../domain/settings";
import type { Platform } from "../services/platform";

export function createFakeMarketProvider(
  overrides: Partial<MarketProvider> = {},
): MarketProvider & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async fetchDailyCloses(secid: string): Promise<DailyClose[]> {
      calls.push(`fetchDailyCloses:${secid}`);
      return overrides.fetchDailyCloses ? overrides.fetchDailyCloses(secid) : [];
    },
    async search(query: string): Promise<Instrument[]> {
      calls.push(`search:${query}`);
      return overrides.search ? overrides.search(query) : [];
    },
  };
}

export function createFakePlatform(): Platform & {
  calls: Array<{ method: string; args: unknown[] }>;
  failures: Set<string>;
} {
  const calls: Array<{ method: string; args: unknown[] }> = [];
  const failures = new Set<string>();
  const record = (method: string, ...args: unknown[]) => {
    calls.push({ method, args });
    if (failures.has(method)) return Promise.reject(new Error("platform failure"));
    return Promise.resolve();
  };
  return {
    calls,
    failures,
    setTrayStatus: (...args) => record("setTrayStatus", ...args),
    setAlwaysOnTop: (...args) => record("setAlwaysOnTop", ...args),
    setAutostart: (...args) => record("setAutostart", ...args),
    setWindowHeight: (...args) => record("setWindowHeight", ...args),
    setWindowSize: (...args) => record("setWindowSize", ...args),
    setMinSize: (...args) => record("setMinSize", ...args),
    setResizable: (...args) => record("setResizable", ...args),
    setShadow: (...args) => record("setShadow", ...args),
    closeWindow: () => record("closeWindow"),
    minimizeWindow: () => record("minimizeWindow"),
    toggleMaximizeWindow: () => record("toggleMaximizeWindow"),
  };
}
