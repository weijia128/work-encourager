import { useEffect, useRef } from "react";
import type { Snapshot } from "../domain/earnings";
import { useServices } from "../services/ServicesContext";

export function useTraySync(
  snapshot: Snapshot,
  badge: boolean,
  now: Date,
  tooltip = `上班鼓励器 · 今日 ¥${snapshot.todayEarned.toFixed(2)}`,
  enabled = true,
): void {
  const { platform } = useServices();
  const previous = useRef<{ minute: number; badge: boolean } | null>(null);
  const minute = Math.floor(now.getTime() / 60000);
  useEffect(() => {
    if (!enabled) return;
    const old = previous.current;
    if (old && old.minute === minute && old.badge === badge) return;
    previous.current = { minute, badge };
    const title = `¥${Math.floor(snapshot.todayEarned)}`;
    void platform.setTrayStatus(title, tooltip, badge);
  }, [badge, enabled, minute, platform, snapshot.todayEarned, tooltip]);
}
