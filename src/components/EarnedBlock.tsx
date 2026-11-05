import type { Snapshot } from "../domain/earnings";
export function EarnedBlock({ snapshot }: { snapshot: Snapshot }) {
  return (
    <section className="earned-block">
      <span className="muted">今日已赚</span>
      <strong>¥{snapshot.todayEarned.toFixed(4)}</strong>
      <span className="muted">
        速度 ¥{snapshot.perSecond.toFixed(4)} / 秒 · 时薪 ¥{snapshot.hourlyWage.toFixed(2)}
      </span>
    </section>
  );
}
