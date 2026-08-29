"""
Risk Engine
-----------
Turns a rolling window of estimated occupancy (derived from RF/Wi-Fi signal
density, see calibration.py) into an explainable risk assessment per zone:

  - level:            "safe" | "amber" | "red"
  - cause:             plain-language reason the level fired
  - time_to_critical:  seconds until the zone crosses the critical threshold,
                        extrapolated from the current rate of change (None if
                        density is flat or falling)

This is intentionally a transparent, rule-based engine (density + rate of
change vs. fixed thresholds) rather than a black box — every alert can be
traced back to the exact numbers that triggered it, which is the whole
point of an "explainable" risk engine.
"""

from collections import deque
from dataclasses import dataclass, field


AMBER_THRESHOLD = 300
RED_THRESHOLD = 420
SURGE_RATE_PER_SEC = 8  # devices/sec growth considered "fast"


@dataclass
class ZoneHistory:
    """Rolling window of recent (timestamp, count) samples for one zone."""

    maxlen: int = 20
    samples: deque = field(default_factory=lambda: deque(maxlen=20))

    def push(self, t: float, count: int) -> None:
        self.samples.append((t, count))

    def rate_per_sec(self) -> float:
        """Average rate of change over the stored window (devices/sec)."""
        if len(self.samples) < 2:
            return 0.0
        (t0, c0), (t1, c1) = self.samples[0], self.samples[-1]
        dt = t1 - t0
        if dt <= 0:
            return 0.0
        return (c1 - c0) / dt

    def latest(self) -> int:
        return self.samples[-1][1] if self.samples else 0


def assess(history: ZoneHistory, zone_label: str) -> dict:
    """Return the current risk assessment for a single zone."""
    count = history.latest()
    rate = history.rate_per_sec()

    if count >= RED_THRESHOLD:
        cause = f"Density {count} exceeds critical threshold ({RED_THRESHOLD})"
        if rate > 0:
            cause += f", still rising at ~{rate:.1f} devices/sec"
        return {
            "level": "red",
            "cause": cause,
            "time_to_critical": 0,
        }

    if count >= AMBER_THRESHOLD:
        ttc = None
        if rate > 0.5:
            ttc = round((RED_THRESHOLD - count) / rate)
        cause = f"Density {count} above baseline threshold ({AMBER_THRESHOLD})"
        if rate > SURGE_RATE_PER_SEC:
            cause += f" — inflow rate spiking at ~{rate:.1f} devices/sec"
        elif rate > 0:
            cause += f", rising at ~{rate:.1f} devices/sec"
        return {
            "level": "amber",
            "cause": cause,
            "time_to_critical": ttc,
        }

    ttc = None
    if rate > 0.5:
        ttc = round((RED_THRESHOLD - count) / rate)
    return {
        "level": "safe",
        "cause": f"Density {count} within safe range for {zone_label}",
        "time_to_critical": ttc,
    }


def forecast(history: ZoneHistory, steps: int = 8, step_seconds: float = 4.0) -> list[float]:
    """Naive linear forecast of the next `steps` points, `step_seconds` apart."""
    if len(history.samples) < 2:
        return []
    rate = history.rate_per_sec()
    last = history.latest()
    return [round(last + rate * step_seconds * i, 1) for i in range(1, steps + 1)]
