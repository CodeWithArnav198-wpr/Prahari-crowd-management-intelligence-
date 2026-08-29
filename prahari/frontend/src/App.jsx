import { useMemo, useState } from "react";
import TopBar from "./components/TopBar";
import Controls from "./components/Controls";
import Panel from "./components/Panel";
import ZoneMap from "./components/ZoneMap";
import SignalPanel from "./components/SignalPanel";
import AlertFeed from "./components/AlertFeed";
import WhatIfPanel from "./components/WhatIfPanel";
import DensityChart from "./components/DensityChart";
import { useSimulation } from "./hooks/useSimulation";

const STATUS_TEXT = {
  safe: "ALL ZONES NOMINAL",
  amber: "AMBER · CENTRAL CORRIDOR RISING",
  red: "RED · CRITICAL — CENTRAL CORRIDOR",
};

export default function App() {
  const { zones, phase, awaitingOperator, alerts, centralForecast, centralHistory, runScenario, reset, whatIf } =
    useSimulation();
  const [isRunning, setIsRunning] = useState(false);

  const overallLevel = useMemo(() => {
    const levels = Object.values(zones).map((z) => z.level);
    if (levels.includes("red")) return "red";
    if (levels.includes("amber")) return "amber";
    return "safe";
  }, [zones]);

  const handleRun = () => {
    setIsRunning(true);
    runScenario();
  };

  const handleReset = () => {
    setIsRunning(false);
    reset();
  };

  const handleWhatIf = (action) => {
    const result = whatIf(action);
    if (result.ok) {
      setTimeout(() => setIsRunning(false), 6000); // scenario settles into "recovered"
    }
    return result;
  };

  return (
    <div className="min-h-screen bg-bg text-white font-body">
      <TopBar overallLevel={overallLevel} statusText={STATUS_TEXT[overallLevel]} />
      <Controls phase={phase} onRun={handleRun} onReset={handleReset} isRunning={isRunning} />

      <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-4 p-5 max-w-[1440px] mx-auto">
        <div className="flex flex-col gap-4">
          <Panel title="Venue Zone Map" tag="Estimated occupancy · live">
            <ZoneMap zones={zones} />
          </Panel>
          <Panel title="Central Corridor — Density Trend" tag="Forecast horizon 90s">
            <DensityChart history={centralHistory} forecast={centralForecast} />
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <Panel title="RF Signal Readout" tag="AP association + probe rate">
            <SignalPanel zones={zones} />
          </Panel>
          <Panel title="Risk Engine — Alerts">
            <AlertFeed alerts={alerts} />
          </Panel>
          <Panel title="What-If Simulator" tag="Operator confirms before action">
            <WhatIfPanel awaitingOperator={awaitingOperator} onAction={handleWhatIf} />
          </Panel>
        </div>
      </div>

      <footer className="text-center py-6 font-mono text-[10px] text-textFaint tracking-wide">
        PRAHARI PROTOTYPE — SIMULATED TELEMETRY FOR DEMONSTRATION · NO REAL DEVICES ARE SENSED OR STORED
      </footer>
    </div>
  );
}
