import { useEffect, useState, type CSSProperties } from "react";
import type { Merit } from "../domain/merit";
import muyuImage from "../assets/muyu.png";

function MuyuIcon() {
  return <img src={muyuImage} alt="" aria-hidden="true" draggable={false} />;
}

function playKnock() {
  const AudioContextClass =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass();
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = 180;
  oscillator.type = "sine";
  gain.gain.setValueAtTime(0.2, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.15);
  oscillator.connect(gain).connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.15);
  oscillator.addEventListener("ended", () => {
    void context.close();
  });
}

export default function MuyuButton({
  merit,
  sound,
  onTap,
  compact = false,
  progress = 0,
}: {
  merit: Merit;
  sound: boolean;
  onTap: () => void;
  compact?: boolean;
  progress?: number;
}) {
  const [flash, setFlash] = useState(0);
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(0), 800);
    return () => window.clearTimeout(timer);
  }, [flash]);
  const tap = () => {
    setFlash((current) => current + 1);
    if (sound) playKnock();
    onTap();
  };

  if (compact) {
    return (
      <button
        type="button"
        className="muyu-button compact-muyu-button"
        onClick={tap}
        aria-label="敲木鱼"
        title={`敲木鱼，功德 +1 · 今日进度 ${(progress * 100).toFixed(0)}%`}
        style={
          {
            "--muyu-progress": `${Math.min(1, Math.max(0, progress)) * 360}deg`,
          } as CSSProperties
        }
      >
        <MuyuIcon />
        {flash > 0 && (
          <span key={flash} className="compact-merit-flash">
            功德 +1
          </span>
        )}
      </button>
    );
  }

  return (
    <section className="muyu-section">
      <div className="section-heading">
        <span>功德木鱼</span>
        <small>敲一下，功德 +1</small>
      </div>
      <button type="button" className="muyu-button" onClick={tap} aria-label="敲木鱼">
        <MuyuIcon />
      </button>
      <div>
        今日功德 {merit.today} · 累计 {merit.total}
      </div>
      <small>点一下，班味 -1</small>
      {flash > 0 && (
        <span key={flash} className="merit-flash">
          功德 +1
        </span>
      )}
    </section>
  );
}
