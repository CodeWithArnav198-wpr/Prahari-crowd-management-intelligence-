import { useEffect, useState } from "react";

const STATUS_STYLES = {
  safe: "border-greenDim bg-green/10 text-green",
  amber: "border-amberDim bg-amber/10 text-amber",
  red: "border-redDim bg-red/10 text-red pulse-red",
};

export default function TopBar({ overallLevel, statusText }) {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-GB"));

  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toLocaleTimeString("en-GB")), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center justify-between px-6 py-3 border-b border-line bg-gradient-to-b from-panel2 to-bg">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-signal to-panel2 flex items-center justify-center relative overflow-hidden">
          <span className="relative z-10 font-mono text-xs font-bold text-signal">PR</span>
        </div>
        <div>
          <h1 className="font-display text-base font-semibold tracking-wide">Prahari — Signal Command</h1>
          <p className="font-mono text-[10px] text-textDim uppercase tracking-wider">
            RF crowd density · no cameras · no biometrics
          </p>
        </div>
      </div>

      <div className="flex items-center gap-5">
        <div className="text-right font-mono">
          <div className="text-[15px]">{time}</div>
          <div className="text-[9.5px] text-textFaint uppercase tracking-wider">Riverside Arena · Gate Concourse</div>
        </div>
        <div
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full border font-mono text-[11.5px] tracking-wide ${STATUS_STYLES[overallLevel]}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current shadow-[0_0_8px_currentColor]" />
          {statusText}
        </div>
      </div>
    </div>
  );
}
