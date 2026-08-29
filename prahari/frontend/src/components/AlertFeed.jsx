const BADGE_STYLES = {
  info: "bg-textDim/15 text-textDim",
  amber: "bg-amberDim text-amber",
  red: "bg-redDim text-red",
  green: "bg-greenDim text-green",
};

export default function AlertFeed({ alerts }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-[9.5px] text-textFaint uppercase tracking-wider">
          {alerts.length} events
        </span>
      </div>
      <div className="flex flex-col-reverse gap-2 max-h-[230px] overflow-y-auto thin-scroll pr-1">
        {alerts.length === 0 && (
          <div className="text-[12px] text-textFaint font-body py-4 text-center">
            No alerts yet — run the demo scenario to see the risk engine in action.
          </div>
        )}
        {alerts.map((a) => (
          <div key={a.id} className="slide-in p-2.5 rounded-lg border border-lineSoft bg-panel2 text-[12px] leading-relaxed">
            <div className="flex items-center gap-2 mb-1">
              <span className={`font-mono text-[9px] uppercase tracking-wide px-1.5 py-0.5 rounded ${BADGE_STYLES[a.level] || BADGE_STYLES.info}`}>
                {a.level}
              </span>
              <span className="font-mono text-[10px] text-textFaint">{a.time}</span>
            </div>
            <div className="text-textDim">
              <b className="text-white font-medium">{a.title}</b>
              <br />
              {a.body}
              {a.timeToCritical !== null && a.timeToCritical !== undefined && a.level !== "safe" && (
                <span className="text-textFaint"> · time to critical ~{a.timeToCritical}s</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
