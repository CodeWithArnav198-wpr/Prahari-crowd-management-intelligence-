import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSimulator,
  createHistory,
  startScenario,
  resetSimulator,
  applyWhatIf,
  tick,
  snapshot,
  currentPhase,
  pushHistory,
  assess,
  forecast,
} from "../lib/engine";

const TICK_MS = 500;

function eventTitle(level, zoneName) {
  if (level === "red") return `Explainable Risk Alert — RED: ${zoneName}`;
  if (level === "amber") return `Risk Engine: Amber Warning — ${zoneName}`;
  return `${zoneName} recovered to safe level`;
}

export function useSimulation() {
  const simRef = useRef(createSimulator());
  const historiesRef = useRef(
    Object.fromEntries(Object.keys(createSimulator().zones).map((k) => [k, createHistory()]))
  );
  const lastLevelRef = useRef(
    Object.fromEntries(Object.keys(createSimulator().zones).map((k) => [k, "safe"]))
  );
  const lastTickRef = useRef(performance.now());

  const [zones, setZones] = useState(() => snapshot(simRef.current));
  const [phase, setPhase] = useState("idle");
  const [awaitingOperator, setAwaitingOperator] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [centralForecast, setCentralForecast] = useState([]);
  const [centralHistory, setCentralHistory] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = performance.now();
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      const sim = simRef.current;
      tick(sim, dt, now);
      const snap = snapshot(sim);

      const nextZones = {};
      let newEvent = null;

      for (const [key, z] of Object.entries(snap)) {
        const hist = historiesRef.current[key];
        pushHistory(hist, now, z.count);
        const risk = assess(hist, z.name);

        nextZones[key] = { ...z, level: risk.level, cause: risk.cause, timeToCritical: risk.timeToCritical };

        const prevLevel = lastLevelRef.current[key];
        if (risk.level !== prevLevel) {
          if (risk.level !== "safe" || prevLevel !== "safe") {
            newEvent = {
              id: `${key}-${now}`,
              level: risk.level,
              zone: z.name,
              title: eventTitle(risk.level, z.name),
              body: risk.cause,
              timeToCritical: risk.timeToCritical,
              time: new Date().toLocaleTimeString("en-GB"),
            };
          }
          lastLevelRef.current[key] = risk.level;
        }
      }

      setZones(nextZones);
      setPhase(currentPhase(sim));
      setAwaitingOperator(sim.awaitingOperator);
      setCentralForecast(forecast(historiesRef.current.central));
      setCentralHistory((prevHist) => {
        const next = [...prevHist, nextZones.central.count];
        return next.length > 40 ? next.slice(next.length - 40) : next;
      });

      if (newEvent) {
        setAlerts((prev) => [...prev, newEvent]);
      }
    }, TICK_MS);

    return () => clearInterval(interval);
  }, []);

  const runScenario = useCallback(() => {
    setAlerts([]);
    lastLevelRef.current = Object.fromEntries(Object.keys(simRef.current.zones).map((k) => [k, "safe"]));
    Object.values(historiesRef.current).forEach((h) => (h.samples = []));
    setCentralHistory([]);
    startScenario(simRef.current, performance.now());
  }, []);

  const reset = useCallback(() => {
    resetSimulator(simRef.current);
    setAlerts([]);
    setCentralHistory([]);
    setCentralForecast([]);
    lastLevelRef.current = Object.fromEntries(Object.keys(simRef.current.zones).map((k) => [k, "safe"]));
    Object.values(historiesRef.current).forEach((h) => (h.samples = []));
  }, []);

  const whatIf = useCallback((action) => {
    return applyWhatIf(simRef.current, action, performance.now());
  }, []);

  return { zones, phase, awaitingOperator, alerts, centralForecast, centralHistory, runScenario, reset, whatIf };
}
