# Prahari — Backend

The real intelligence pipeline described in the pitch deck, implemented as a
runnable FastAPI service. It stands in for the RF/Wi-Fi hardware you'd wire
in at a real venue, and implements the exact same logic the deployed
prototype simulates client-side (see `../frontend`).

```
backend/
├── main.py          FastAPI app: WebSocket telemetry + REST control routes
├── simulator.py      Stands in for RF/Wi-Fi ingestion hardware
├── calibration.py     signal_metric -> estimated occupancy (scikit-learn)
├── risk_engine.py     Explainable per-zone risk assessment + forecast
└── requirements.txt
```

## How it fits together

1. **`simulator.py`** models 8 zones (Entry Plaza, Central Corridor, Gate A/B,
   etc.) and evolves their occupancy over time — either gentle idle jitter,
   or a scripted 60-second demo scenario (normal → inflow surge →
   bottleneck → operator action → recovered). In a real deployment, this
   file is replaced by whatever reads your Wi-Fi AP client-count API
   (Cisco Meraki / UniFi) or passive RF sniffers.

2. **`calibration.py`** converts a raw RF signal metric into an estimated
   person count using a small `scikit-learn` linear regression, fit once at
   startup on synthetic calibration data. In production this fit comes from
   a real one-time calibration pass against ground-truth turnstile counts
   for each zone.

3. **`risk_engine.py`** takes a rolling window of estimated occupancy per
   zone and produces an explainable risk level (`safe` / `amber` / `red`),
   a plain-language cause, and a time-to-critical estimate — extrapolated
   from the zone's current rate of change. This is a transparent, rule-based
   engine on purpose: every alert can be traced back to the exact numbers
   that triggered it.

4. **`main.py`** ties it together: a background loop ticks the simulator
   twice a second, runs it through calibration + the risk engine, and
   broadcasts a telemetry frame to every connected WebSocket client. REST
   routes let an operator (or the frontend) start/reset the demo scenario
   and confirm a what-if intervention.



### Telemetry frame shape

```json
{
  "t": 1735489600.1,
  "phase": "bottleneck",
  "awaiting_operator": true,
  "zones": {
    "central": {
      "name": "Central Corridor",
      "count": 431,
      "signal_metric": 463.2,
      "level": "red",
      "cause": "Density 431 exceeds critical threshold (420), still rising at ~7.5 devices/sec",
      "time_to_critical": 0
    }
  },
  "forecast_central": [438.5, 446.0, ...],
  "event": {
    "id": "…",
    "level": "red",
    "zone": "Central Corridor",
    "title": "Explainable Risk Alert — RED: Central Corridor",
    "body": "Density 431 exceeds critical threshold (420)…",
    "time_to_critical": 0
  }
}
```