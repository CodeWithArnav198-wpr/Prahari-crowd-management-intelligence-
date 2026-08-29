"""
Simulator
---------
Stands in for real Wi-Fi/RF ingestion hardware. Maintains a live occupancy
value per zone and evolves it over time:

  - Idle mode:      gentle random jitter around each zone's baseline.
  - Demo scenario:  scripted 60-second phase sequence (normal -> inflow
                    surge -> bottleneck -> operator action -> recovered)
                    matching the "60-second transformation" walkthrough.
  - What-if actions: operator-triggered interventions (open the alternate
                    gate, trigger a PA hold-back) that change the target
                    trajectory mid-scenario.

Every zone's value is exposed as both a "true" occupancy and the raw signal
metric a real AP/RF sensor would have reported for it (via calibration.py),
so the rest of the pipeline can be built exactly as it would be against real
hardware.
"""

import time
import random
from dataclasses import dataclass, field

from calibration import calibrator

ZONES = {
    "entry": {"name": "Entry Plaza", "base": 310},
    "southcorr": {"name": "South Corridor", "base": 140},
    "central": {"name": "Central Corridor", "base": 205},
    "northcorr": {"name": "North Corridor", "base": 133},
    "gatea": {"name": "Gate A", "base": 88},
    "altgate": {"name": "Gate C (Alt)", "base": 14},
    "gateb": {"name": "Gate B", "base": 91},
    "concourse": {"name": "Concourse Ring", "base": 412},
}

# Scenario phases: (name, duration_seconds, central-corridor target count)
PHASES = [
    ("normal", 15, 230),
    ("surge", 15, 360),
    ("bottleneck", 15, 452),
    ("action", 15, 240),  # only reached if operator confirms an action
    ("recovered", 999999, 230),
]


@dataclass
class ZoneState:
    key: str
    name: str
    base: float
    value: float
    target: float


@dataclass
class Simulator:
    zones: dict = field(default_factory=dict)
    scenario_running: bool = False
    phase_index: int = 0
    phase_started_at: float = 0.0
    awaiting_operator: bool = False
    action_taken: str | None = None

    def __post_init__(self):
        for key, cfg in ZONES.items():
            self.zones[key] = ZoneState(
                key=key, name=cfg["name"], base=cfg["base"],
                value=cfg["base"], target=cfg["base"],
            )

    # ---------------- scenario control ----------------

    def start_scenario(self):
        self.scenario_running = True
        self.phase_index = 0
        self.phase_started_at = time.time()
        self.awaiting_operator = False
        self.action_taken = None
        self._apply_phase_targets()

    def reset(self):
        self.scenario_running = False
        self.phase_index = 0
        self.awaiting_operator = False
        self.action_taken = None
        for z in self.zones.values():
            z.value = z.base
            z.target = z.base

    def apply_whatif(self, action: str):
        """Operator confirms an intervention while paused at 'bottleneck'."""
        if not self.awaiting_operator:
            return {"ok": False, "reason": "No active alert awaiting a decision."}
        self.action_taken = action
        self.awaiting_operator = False
        self.phase_index = 3  # -> "action" phase
        self.phase_started_at = time.time()
        if action == "open_gate_c":
            self.zones["central"].target = 240
            self.zones["altgate"].target = 180
        elif action == "trigger_pa":
            # Weaker effect — PA alone doesn't fully clear the corridor.
            self.zones["central"].target = 340
        return {"ok": True}

    # ---------------- tick loop ----------------

    def tick(self, dt: float):
        now = time.time()

        if self.scenario_running:
            phase_name, duration, central_target = PHASES[self.phase_index]

            if phase_name == "bottleneck":
                # Hold here until the operator acts (mirrors the "What-If
                # simulator armed" moment) instead of auto-advancing.
                self.awaiting_operator = True
            elif now - self.phase_started_at >= duration:
                if self.phase_index < len(PHASES) - 1:
                    self.phase_index += 1
                    self.phase_started_at = now
                    self._apply_phase_targets()

        # Ease every zone's value toward its target, plus small jitter.
        for z in self.zones.values():
            diff = z.target - z.value
            z.value += diff * min(1.0, dt * 0.6)
            z.value += random.uniform(-2, 2)
            z.value = max(0, z.value)

    def _apply_phase_targets(self):
        phase_name, _, central_target = PHASES[self.phase_index]
        c = self.zones["central"]
        c.target = central_target
        # Ripple into neighboring corridors, matching the original demo.
        delta = central_target - c.base
        self.zones["southcorr"].target = self.zones["southcorr"].base + delta * 0.25
        self.zones["northcorr"].target = self.zones["northcorr"].base + delta * 0.2

    @property
    def current_phase(self) -> str:
        if not self.scenario_running:
            return "idle"
        return PHASES[self.phase_index][0]

    # ---------------- output ----------------

    def snapshot(self) -> dict:
        """Current state of all zones, including the raw signal metric a
        real RF sensor would report (via the inverse calibration helper)."""
        out = {}
        for key, z in self.zones.items():
            count = round(z.value)
            out[key] = {
                "name": z.name,
                "count": count,
                "signal_metric": round(calibrator.to_signal_metric(count), 1),
            }
        return out


simulator = Simulator()
