const LEVEL_TEXT = { safe: "text-white", amber: "text-amber", red: "text-red" };
const BAR_COLOR = { safe: "bg-signal", amber: "bg-amber", red: "bg-red" };

function SignalBars({ pct, level }) {
  const bars = Array.from({ length: 24 });
  return (
    <div className="flex-1 h-5 bg-panel2 rounded border border-lineSoft relative overflow-hidden">
      <div className="absolute inset-0 flex items-end gap-[2px] p-[2px]">
        {bars.map((_, i) => {
          const active = i / bars.length < pct;
          const h = active ? 30 + ((i * 37) % 70) : 8 + ((i * 13) % 10);
          return (
            <i
              key={i}
              style={{ height: `${h}%` }}
              className={`flex-1 rounded-[1px] ${active ? BAR_COLOR[level] : "bg-lineSoft"}`}
            />
          );
        })}
      </div>
    </div>
  );
}

export default function SignalPanel({ zones }) {
  return (
    <div className="flex flex-col gap-2.5">
      {Object.entries(zones).map(([key, z]) => (
        <div key={key} className="flex items-center gap-2.5">
          <div className="w-24 shrink-0 font-mono text-[10.5px] text-textDim truncate">{z.name}</div>
          <SignalBars pct={Math.min(1, z.count / 520)} level={z.level} />
          <div className={`w-16 shrink-0 text-right font-mono text-[11px] ${LEVEL_TEXT[z.level] || "text-white"}`}>
            {z.count}
          </div>
        </div>
      ))}
    </div>
  );
}
