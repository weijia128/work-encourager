import type { Snapshot } from "../domain/earnings";
function Bar({ value, color }: { value: number; color: string }) {
  return (
    <div className="progress-bar">
      <div style={{ width: `${Math.min(100, value * 100)}%`, background: color }} />
    </div>
  );
}
export function ProgressBars({
  snapshot,
  hideAmount = false,
  hideDuration = false,
}: {
  snapshot: Snapshot;
  hideAmount?: boolean;
  hideDuration?: boolean;
}) {
  const worked = snapshot.workedSeconds / 3600;
  const daily = snapshot.dailySeconds / 3600;
  return (
    <section className="progress-section">
      <div className="section-heading">
        <span>工作进度</span>
        <small>今日与本月</small>
      </div>
      <div>
        今日进度 <b>{(snapshot.todayProgress * 100).toFixed(1)}%</b>
        {!hideDuration && (
          <span>
            {worked.toFixed(2)} / {daily.toFixed(2)} h
          </span>
        )}
      </div>
      <Bar value={snapshot.todayProgress} color="#1f4e9c" />
      <div>
        本月进度 <b>{(snapshot.monthProgress * 100).toFixed(1)}%</b>
        <span>
          {!hideAmount && (
            <>
              ¥{snapshot.monthEarned.toFixed(0)} / ¥
              {snapshot.monthProgress
                ? (snapshot.monthEarned / snapshot.monthProgress).toFixed(0)
                : "0"}{" "}
              ·{" "}
            </>
          )}
          第 {snapshot.workdayIndex}/{snapshot.workdaysTotal} 天
        </span>
      </div>
      <Bar value={snapshot.monthProgress} color="#b5452a" />
    </section>
  );
}
