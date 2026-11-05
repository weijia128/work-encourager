import { STATUS_LABEL, type Snapshot } from "../domain/earnings";
import { formatDuration } from "../domain/copywriter";

const COUNTDOWN_LABEL = {
  toOffWork: "距离下班",
  toLunchEnd: "距离午休结束",
  toWork: "距离上班",
} as const;
export function StatusBlock({ nickname, snapshot }: { nickname: string; snapshot: Snapshot }) {
  const countdown = snapshot.countdown;
  return (
    <section className="status-block">
      <strong>
        {nickname}，{STATUS_LABEL[snapshot.status]}
      </strong>
      {countdown && (
        <span>
          {" "}
          · {COUNTDOWN_LABEL[countdown.kind]} {formatDuration(countdown.seconds)}
        </span>
      )}
    </section>
  );
}
