const LAYOUT = {
  entry: "left-[36%] bottom-0 w-[28%] h-[15%]",
  southcorr: "left-[8%] bottom-[19%] w-[22%] h-[15%]",
  central: "left-[36%] bottom-[19%] w-[28%] h-[15%]",
  northcorr: "left-[70%] bottom-[19%] w-[22%] h-[15%]",
  gatea: "left-[8%] bottom-[38%] w-[22%] h-[15%]",
  altgate: "left-[36%] bottom-[38%] w-[28%] h-[15%]",
  gateb: "left-[70%] bottom-[38%] w-[22%] h-[15%]",
  concourse: "left-[20%] bottom-[57%] w-[60%] h-[16%]",
};

const LEVEL_STYLES = {
  safe: "border-greenDim shadow-[inset_0_0_0_1px_rgba(62,224,138,0.15)]",
  amber: "border-amberDim bg-amber/[0.06] shadow-[inset_0_0_0_1px_rgba(245,166,35,0.2)]",
  red: "border-redDim bg-red/[0.09] shadow-[0_0_22px_-4px_rgba(255,92,92,0.35),inset_0_0_0_1px_rgba(255,92,92,0.3)] ring-pulse",
};

const COUNT_COLOR = {
  safe: "text-green",
  amber: "text-amber",
  red: "text-red",
};

export default function ZoneMap({ zones }) {
  return (
    <div className="p-5 pb-7">
      <div className="relative w-full mx-auto" style={{ aspectRatio: "4/3", maxHeight: 400 }}>
        <div className="radar-sweep absolute left-1/2 top-1/2 w-px h-px pointer-events-none" />
        {Object.entries(zones).map(([key, z]) => (
          <div
            key={key}
            className={`absolute rounded-[10px] border bg-panel2 flex flex-col items-center justify-center
                        transition-colors duration-500 ${LAYOUT[key]} ${LEVEL_STYLES[z.level] || LEVEL_STYLES.safe}`}
          >
            <div className="font-mono text-[10px] tracking-wide text-textDim uppercase">{z.name}</div>
            <div className={`font-display text-[17px] font-semibold mt-0.5 ${COUNT_COLOR[z.level] || COUNT_COLOR.safe}`}>
              {z.count}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
