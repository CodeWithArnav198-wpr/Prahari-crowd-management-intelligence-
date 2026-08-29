import { useState } from "react";

export default function WhatIfPanel({ awaitingOperator, onAction }) {
  const [preview, setPreview] = useState(
    "Awaiting a live alert to simulate an intervention against."
  );
  const [busy, setBusy] = useState(false);

  const handleOpenGate = async () => {
    setBusy(true);
    setPreview("Simulating: Gate C opened → projected Central Corridor density in 60s: ~240 (safe). Confirming…");
    await new Promise((r) => setTimeout(r, 1400));
    onAction("open_gate_c");
    setPreview("Operator confirmed: Gate C opened. Live directional signage updated, flow redistributing.");
    setBusy(false);
  };

  const handlePA = () => {
    setPreview(
      "Simulating: PA hold-back announcement → projected inflow rate -18%, insufficient alone to clear threshold in time. Recommend combining with a gate action."
    );
  };

  return (
    <div>
      <div className="flex flex-col gap-2 mb-3.5">
        <button
          onClick={handleOpenGate}
          disabled={!awaitingOperator || busy}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-line bg-panel2 text-[12.5px]
                     disabled:opacity-30 disabled:cursor-not-allowed hover:border-signalDim hover:bg-signal/5 transition text-left"
        >
          <span>Open Gate C (alt corridor)</span>
          <span className="font-mono text-[9.5px] text-signal border border-signalDim px-1.5 py-0.5 rounded-full">
            SIMULATE
          </span>
        </button>
        <button
          onClick={handlePA}
          disabled={!awaitingOperator}
          className="flex items-center justify-between px-3.5 py-2.5 rounded-lg border border-line bg-panel2 text-[12.5px]
                     disabled:opacity-30 disabled:cursor-not-allowed hover:border-signalDim hover:bg-signal/5 transition text-left"
        >
          <span>Trigger PA hold-back announcement</span>
          <span className="font-mono text-[9.5px] text-signal border border-signalDim px-1.5 py-0.5 rounded-full">
            SIMULATE
          </span>
        </button>
      </div>
      <div
        className={`rounded-lg p-3 text-[11.5px] font-mono leading-relaxed min-h-[52px] flex items-center border
          ${awaitingOperator ? "border-signalDim text-signal bg-signal/[0.04]" : "border-dashed border-line text-textDim"}`}
      >
        {preview}
      </div>
    </div>
  );
}
