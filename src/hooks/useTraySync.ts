import { useEffect, useRef } from "react";
import type { Snapshot } from "../domain/earnings";
import { useServices } from "../services/ServicesContext";

export function useTraySync(
  snapshot: Snapshot,
  badge: boolean,
  now: Date,
  tooltip = `上班鼓励器 · 今日 ¥${snapshot.todayEarned.toFixed(2)}`,
  enabled = true,
  hideAmount = false,
): void {
  const { platform } = useServices();
  const previous = useRef<{
    minute: number;
    badge: boolean;
    title: string;
    tooltip: string;
  } | null>(null);
  const minute = Math.floor(now.getTime() / 60000);
  const title = hideAmount ? "" : `¥${Math.floor(snapshot.todayEarned)}`;
  const visibleTooltip = hideAmount ? tooltip.replace(/ · 今日 ¥.*$/, "") : tooltip;
  useEffect(() => {
    if (!enabled) return;
    const old = previous.current;
    if (
      old &&
      old.minute === minute &&
      old.badge === badge &&
      old.title === title &&
      old.tooltip === visibleTooltip
    )
      return;
    previous.current = { minute, badge, title, tooltip: visibleTooltip };
    void platform.setTrayStatus(title, visibleTooltip, badge);
  }, [badge, enabled, minute, platform, title, visibleTooltip]);
}
