import type { Snapshot } from "../domain/earnings";

function EyeIcon({ hidden }: { hidden: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" />
      <circle cx="12" cy="12" r="2.5" />
      {hidden && <path d="m4 4 16 16" />}
    </svg>
  );
}

export function EarnedBlock({
  snapshot,
  hidden,
  onToggle,
}: {
  snapshot: Snapshot;
  hidden: boolean;
  onToggle: () => void;
}) {
  return (
    <section className="earned-block">
      <div className="earned-label muted">
        <span>今日已赚</span>
        <button
          type="button"
          className="earned-privacy"
          onClick={onToggle}
          aria-label={hidden ? "显示今日已赚" : "隐藏今日已赚"}
          title={hidden ? "显示收入详情" : "隐藏收入详情"}
          aria-pressed={hidden}
        >
          <EyeIcon hidden={hidden} />
        </button>
      </div>
      <strong>{hidden ? "¥••••••" : `¥${snapshot.todayEarned.toFixed(4)}`}</strong>
      <span className="muted">
        {hidden ? "收入详情已隐藏" : `时薪 ¥${snapshot.hourlyWage.toFixed(2)}`}
      </span>
    </section>
  );
}
