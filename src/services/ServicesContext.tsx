import { createContext, useContext, type ReactNode } from "react";
import type { KeyValueStore } from "./kvStore";
import type { MarketProvider } from "./eastmoney";
import type { Platform } from "./platform";

export interface Services {
  kv: KeyValueStore;
  market: MarketProvider;
  platform: Platform;
  now: () => Date;
}

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({
  services,
  children,
}: {
  services: Services;
  children: ReactNode;
}) {
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const services = useContext(ServicesContext);
  if (!services) throw new Error("ServicesProvider 未配置");
  return services;
}
