import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import { RED_THRESHOLD } from "../lib/engine";

export default function DensityChart({ history, forecast }) {
  const historyPoints = history.map((v, i) => ({ idx: i, actual: v }));
  const lastIdx = historyPoints.length - 1;
  const forecastPoints = forecast.map((v, i) => ({ idx: lastIdx + i + 1, forecast: v }));
  const data = [...historyPoints, ...forecastPoints];

  return (
    <div>
      <div style={{ width: "100%", height: 130 }}>
        <ResponsiveContainer>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="densityFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#45e0d4" stopOpacity={0.28} />
                <stop offset="100%" stopColor="#45e0d4" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="idx" hide />
            <YAxis domain={[0, 520]} hide />
            <ReferenceLine y={RED_THRESHOLD} stroke="#ff5c5c" strokeDasharray="4 4" strokeOpacity={0.5} />
            <Area type="monotone" dataKey="actual" stroke="none" fill="url(#densityFill)" isAnimationActive={false} />
            <Line type="monotone" dataKey="actual" stroke="#45e0d4" strokeWidth={2} dot={false} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="forecast"
              stroke="#f5a623"
              strokeWidth={1.6}
              strokeDasharray="3 3"
              dot={false}
              isAnimationActive={false}
            />
            <Tooltip
              contentStyle={{ background: "#111820", border: "1px solid #1f2b36", fontSize: 11, borderRadius: 8 }}
              labelFormatter={() => ""}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <div className="flex gap-3.5 mt-2">
        <Legend color="#45e0d4" label="Estimated density (ppl)" />
        <Legend color="#ff5c5c" label="Critical threshold" />
        <Legend color="#f5a623" label="Forecast (90s)" />
      </div>
    </div>
  );
}

function Legend({ color, label }) {
  return (
    <span className="font-mono text-[9.5px] text-textDim flex items-center gap-1.5">
      <i className="w-2 h-2 rounded-sm inline-block" style={{ background: color }} />
      {label}
    </span>
  );
}
