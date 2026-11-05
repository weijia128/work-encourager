import { useEffect, useState } from "react";
import type { Merit } from "../domain/merit";

function MuyuIcon() {
  return (
    <svg viewBox="0 0 120 96" aria-hidden="true">
      <defs>
        <radialGradient id="muyu-wood" cx=".36" cy=".24" r=".82">
          <stop offset="0" stopColor="#e2ad69" />
          <stop offset=".48" stopColor="#b8753d" />
          <stop offset="1" stopColor="#75401f" />
        </radialGradient>
        <linearGradient id="muyu-mallet-wood" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#d5a064" />
          <stop offset="1" stopColor="#86502c" />
        </linearGradient>
      </defs>
      <ellipse cx="61" cy="87" rx="38" ry="5" fill="#3c281d" opacity=".14" />
      <g className="muyu-mallet">
        <path
          d="m98 8-21 39"
          stroke="url(#muyu-mallet-wood)"
          strokeWidth="7"
          strokeLinecap="round"
        />
        <ellipse
          cx="74"
          cy="48"
          rx="13"
          ry="9"
          fill="url(#muyu-mallet-wood)"
          stroke="#754524"
          strokeWidth="1.5"
          transform="rotate(-48 74 48)"
        />
        <path d="m96 10-5 10" stroke="#efc58f" strokeWidth="2" strokeLinecap="round" opacity=".7" />
      </g>
      <path
        d="M22 54C21 34 36 17 58 14c22-3 42 11 46 31 5 24-10 40-35 43-24 3-45-10-47-34Z"
        fill="url(#muyu-wood)"
        stroke="#65361c"
        strokeWidth="1.8"
      />
      <path
        d="M33 35c9-13 29-20 46-13M38 29c10-8 24-11 35-7"
        fill="none"
        stroke="#f0c183"
        strokeWidth="2.6"
        strokeLinecap="round"
        opacity=".65"
      />
      <circle cx="83" cy="35" r="3.4" fill="#75401f" opacity=".8" />
      <circle cx="82.3" cy="34.2" r="1.1" fill="#e7b575" />
      <path
        d="M23 53c20-7 57-9 80 0-12 13-60 18-78 8Z"
        fill="#442419"
        stroke="#63341d"
        strokeWidth="1.4"
      />
      <path d="M27 58c22 5 50 3 72-2-10 12-52 17-70 7Z" fill="#713b22" />
      <path
        d="M30 53c20-4 46-5 65-1"
        fill="none"
        stroke="#d59653"
        strokeWidth="2"
        strokeLinecap="round"
        opacity=".65"
      />
      <path
        d="M41 73c14 7 32 6 44-2M46 79c11 3 23 2 31-1"
        fill="none"
        stroke="#5f311b"
        strokeWidth="1.7"
        strokeLinecap="round"
        opacity=".65"
      />
    </svg>
  );
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
}: {
  merit: Merit;
  sound: boolean;
  onTap: () => void;
}) {
  const [flash, setFlash] = useState(false);
  useEffect(() => {
    if (!flash) return;
    const timer = window.setTimeout(() => setFlash(false), 800);
    return () => window.clearTimeout(timer);
  }, [flash]);
  const tap = () => {
    setFlash(true);
    if (sound) playKnock();
    onTap();
  };
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
      {flash && <span className="merit-flash">功德 +1</span>}
    </section>
  );
}
