import { useEffect, useState } from "react";
import { useServices } from "../services/ServicesContext";

export function useNow(intervalMs: number): Date {
  const { now } = useServices();
  const [current, setCurrent] = useState(() => now());
  useEffect(() => {
    const timer = window.setInterval(() => setCurrent(now()), intervalMs);
    return () => window.clearInterval(timer);
  }, [intervalMs, now]);
  return current;
}
