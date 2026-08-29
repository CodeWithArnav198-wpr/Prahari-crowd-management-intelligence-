const PHASE_LABELS = [
  "01 · Normal Flow",
  "02 · Inflow Surge",
  "03 · Bottleneck",
  "04 · Operator Action",
  "05 · Recovered",
];

const PHASE_ORDER = ["normal", "surge", "bottleneck", "action", "recovered"];

export default function Controls({ phase, onRun, onReset, isRunning }) {
  const activeIndex = PHASE_ORDER.indexOf(phase);

  return (
    <div className="flex items-center gap-3 px-6 py-3.5 border-t border-b border-line bg-panel2 flex-wrap">
      <button
        onClick={onRun}
        disabled={isRunning}
        className="font-display font-semibold text-sm bg-signal text-[#04201e] px-5 py-2.5 rounded-lg
                   disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] transition"
      >
        {isRunning ? "Running…" : "▶ Run Demo Scenario"}
      </button>

      <div className="flex-1 flex gap-1.5 min-w-[260px]">
        {PHASE_LABELS.map((label, i) => (
          <div
            key={label}
            className={`flex-1 text-center px-2.5 py-2 rounded-md font-mono text-[10px] tracking-wide border transition
              ${
                i === activeIndex
                  ? "bg-signal/10 border-signalDim text-signal"
                  : i < activeIndex
                  ? "bg-textDim/10 border-line text-textDim"
                  : "bg-panel border-line text-textFaint"
              }`}
          >
            {label}
          </div>
        ))}
      </div>

      <button
        onClick={onReset}
        className="font-mono text-[11px] text-textDim border border-line px-3.5 py-2.5 rounded-lg
                   hover:text-white hover:border-textFaint transition"
      >
        ↺ Reset
      </button>
    </div>
  );
}
