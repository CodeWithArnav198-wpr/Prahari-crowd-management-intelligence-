// Same zone model and scenario logic as backend/simulator.py, ported to
// JavaScript. This lets the static prototype (deployed on Vercel with no
// server) reproduce the exact same behaviour as the real Python backend,
// which you run locally / on your own infra when you're ready to wire in
// real RF hardware (see backend/README.md).

export const ZONES = {
  entry: { name: "Entry Plaza", base: 310 },
  southcorr: { name: "South Corridor", base: 140 },
  central: { name: "Central Corridor", base: 205 },
  northcorr: { name: "North Corridor", base: 133 },
  gatea: { name: "Gate A", base: 88 },
  altgate: { name: "Gate C (Alt)", base: 14 },
  gateb: { name: "Gate B", base: 91 },
  concourse: { name: "Concourse Ring", base: 412 },
};

// [name, duration_seconds, central-corridor target count]
export const PHASES = [
  ["normal", 15, 230],
  ["surge", 15, 360],
  ["bottleneck", 15, 452],
  ["action", 15, 240],
  ["recovered", Infinity, 230],
];

export const AMBER_THRESHOLD = 300;
export const RED_THRESHOLD = 420;
const SURGE_RATE_PER_SEC = 8;

export function createSimulator() {
  const zones = {};
  for (const [key, cfg] of Object.entries(ZONES)) {
    zones[key] = { key, name: cfg.name, base: cfg.base, value: cfg.base, target: cfg.base };
  }

  return {
    zones,
    scenarioRunning: false,
    phaseIndex: 0,
    phaseStartedAt: 0,
    awaitingOperator: false,
    actionTaken: null,
  };
}

export function startScenario(sim, now) {
  sim.scenarioRunning = true;
  sim.phaseIndex = 0;
  sim.phaseStartedAt = now;
  sim.awaitingOperator = false;
  sim.actionTaken = null;
  applyPhaseTargets(sim);
}

export function resetSimulator(sim) {
  sim.scenarioRunning = false;
  sim.phaseIndex = 0;
  sim.awaitingOperator = false;
  sim.actionTaken = null;
  for (const z of Object.values(sim.zones)) {
    z.value = z.base;
    z.target = z.base;
  }
}

export function applyWhatIf(sim, action, now) {
  if (!sim.awaitingOperator) {
    return { ok: false, reason: "No active alert awaiting a decision." };
  }
  sim.actionTaken = action;
  sim.awaitingOperator = false;
  sim.phaseIndex = 3; // -> "action"
  sim.phaseStartedAt = now;
  if (action === "open_gate_c") {
    sim.zones.central.target = 240;
    sim.zones.altgate.target = 180;
  } else if (action === "trigger_pa") {
    sim.zones.central.target = 340; // weaker effect on its own
  }
  return { ok: true };
}

function applyPhaseTargets(sim) {
  const [, , centralTarget] = PHASES[sim.phaseIndex];
  const c = sim.zones.central;
  c.target = centralTarget;
  const delta = centralTarget - c.base;
  sim.zones.southcorr.target = sim.zones.southcorr.base + delta * 0.25;
  sim.zones.northcorr.target = sim.zones.northcorr.base + delta * 0.2;
}

export function currentPhase(sim) {
  if (!sim.scenarioRunning) return "idle";
  return PHASES[sim.phaseIndex][0];
}

export function tick(sim, dt, now) {
  if (sim.scenarioRunning) {
    const [phaseName, duration] = PHASES[sim.phaseIndex];
    if (phaseName === "bottleneck") {
      sim.awaitingOperator = true;
    } else if (now - sim.phaseStartedAt >= duration * 1000) {
      if (sim.phaseIndex < PHASES.length - 1) {
        sim.phaseIndex += 1;
        sim.phaseStartedAt = now;
        applyPhaseTargets(sim);
      }
    }
  }

  for (const z of Object.values(sim.zones)) {
    const diff = z.target - z.value;
    z.value += diff * Math.min(1, dt * 0.6);
    z.value += (Math.random() - 0.5) * 4;
    z.value = Math.max(0, z.value);
  }
}

export function snapshot(sim) {
  const out = {};
  for (const [key, z] of Object.entries(sim.zones)) {
    out[key] = { name: z.name, count: Math.round(z.value) };
  }
  return out;
}

// ---------------------------------------------------------------- risk ---

export function createHistory(maxLen = 20) {
  return { maxLen, samples: [] };
}

export function pushHistory(hist, t, count) {
  hist.samples.push([t, count]);
  if (hist.samples.length > hist.maxLen) hist.samples.shift();
}

export function ratePerSec(hist) {
  if (hist.samples.length < 2) return 0;
  const [t0, c0] = hist.samples[0];
  const [t1, c1] = hist.samples[hist.samples.length - 1];
  const dt = (t1 - t0) / 1000;
  if (dt <= 0) return 0;
  return (c1 - c0) / dt;
}

export function latest(hist) {
  return hist.samples.length ? hist.samples[hist.samples.length - 1][1] : 0;
}

export function assess(hist, zoneLabel) {
  const count = latest(hist);
  const rate = ratePerSec(hist);

  if (count >= RED_THRESHOLD) {
    let cause = `Density ${count} exceeds critical threshold (${RED_THRESHOLD})`;
    if (rate > 0) cause += `, still rising at ~${rate.toFixed(1)} devices/sec`;
    return { level: "red", cause, timeToCritical: 0 };
  }

  if (count >= AMBER_THRESHOLD) {
    let ttc = null;
    if (rate > 0.5) ttc = Math.round((RED_THRESHOLD - count) / rate);
    let cause = `Density ${count} above baseline threshold (${AMBER_THRESHOLD})`;
    if (rate > SURGE_RATE_PER_SEC) cause += ` — inflow rate spiking at ~${rate.toFixed(1)} devices/sec`;
    else if (rate > 0) cause += `, rising at ~${rate.toFixed(1)} devices/sec`;
    return { level: "amber", cause, timeToCritical: ttc };
  }

  let ttc = null;
  if (rate > 0.5) ttc = Math.round((RED_THRESHOLD - count) / rate);
  return { level: "safe", cause: `Density ${count} within safe range for ${zoneLabel}`, timeToCritical: ttc };
}

export function forecast(hist, steps = 8, stepSeconds = 4) {
  if (hist.samples.length < 2) return [];
  const rate = ratePerSec(hist);
  const last = latest(hist);
  return Array.from({ length: steps }, (_, i) => Math.round((last + rate * stepSeconds * (i + 1)) * 10) / 10);
}
