"""
Prahari backend
===============
A runnable stand-in for the real ingestion + intelligence pipeline:

  simulator.py     -> stands in for RF/Wi-Fi hardware (edge collectors)
  calibration.py   -> signal_metric -> estimated occupancy (scikit-learn)
  risk_engine.py   -> explainable per-zone risk assessment + forecast
  main.py (this)   -> FastAPI service: WebSocket telemetry + REST control

Run with:
    pip install -r requirements.txt
    uvicorn main:app --reload --port 8000

Then open the frontend (see ../frontend/README) which connects to
ws://localhost:8000/ws/telemetry and calls the REST endpoints below.
"""

import asyncio
import time
import uuid
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from simulator import simulator
from risk_engine import ZoneHistory, assess, forecast, AMBER_THRESHOLD, RED_THRESHOLD
from calibration import calibrator

app = FastAPI(title="Prahari Telemetry Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # demo only — lock this down in production
    allow_methods=["*"],
    allow_headers=["*"],
)

# Per-zone rolling history used by the risk engine.
histories: dict[str, ZoneHistory] = {key: ZoneHistory() for key in simulator.zones}

# Tracks which alert "state" each zone is in, so we only emit a new alert
# event when the level actually changes rather than every tick.
last_level: dict[str, str] = {key: "safe" for key in simulator.zones}

connected: set[WebSocket] = set()


# ---------------------------------------------------------------- schemas --

class WhatIfRequest(BaseModel):
    action: str  # "open_gate_c" | "trigger_pa"


# ------------------------------------------------------------- REST routes --

@app.get("/api/zones")
def get_zones():
    """Static zone metadata (used by the frontend to lay out the map)."""
    return {key: {"name": z.name, "base": z.base} for key, z in simulator.zones.items()}


@app.post("/api/scenario/start")
def start_scenario():
    simulator.start_scenario()
    return {"ok": True, "phase": simulator.current_phase}


@app.post("/api/scenario/reset")
def reset_scenario():
    simulator.reset()
    for h in histories.values():
        h.samples.clear()
    for k in last_level:
        last_level[k] = "safe"
    return {"ok": True}


@app.post("/api/whatif")
def whatif(req: WhatIfRequest):
    result = simulator.apply_whatif(req.action)
    return result


@app.get("/api/calibration/estimate")
def calibration_estimate(signal_metric: float):
    """Demonstrates the signal -> occupancy conversion in isolation."""
    return {"signal_metric": signal_metric, "estimated_occupancy": calibrator.estimate(signal_metric)}


# ------------------------------------------------------------- WebSocket --

@app.websocket("/ws/telemetry")
async def telemetry_ws(ws: WebSocket):
    await ws.accept()
    connected.add(ws)
    try:
        while True:
            await asyncio.sleep(3600)  # connection stays open; broadcast loop pushes data
    except WebSocketDisconnect:
        connected.discard(ws)


async def broadcast_loop():
    """Ticks the simulator, updates risk history, and pushes a telemetry
    frame to every connected client at a fixed interval."""
    tick_seconds = 0.5
    while True:
        await asyncio.sleep(tick_seconds)
        simulator.tick(tick_seconds)
        snap = simulator.snapshot()
        now = time.time()

        zones_out = {}
        event = None

        for key, z in snap.items():
            # Convert the raw signal metric back to an estimated occupancy —
            # this is the step a real deployment performs on live AP data.
            estimated = calibrator.estimate(z["signal_metric"])
            hist = histories[key]
            hist.push(now, estimated)
            risk = assess(hist, z["name"])

            zones_out[key] = {
                "name": z["name"],
                "count": estimated,
                "signal_metric": z["signal_metric"],
                "level": risk["level"],
                "cause": risk["cause"],
                "time_to_critical": risk["time_to_critical"],
            }

            if risk["level"] != last_level[key]:
                # Only fire an alert event on state *transitions*.
                if risk["level"] in ("amber", "red") or last_level[key] in ("amber", "red"):
                    event = {
                        "id": str(uuid.uuid4()),
                        "level": risk["level"],
                        "zone": z["name"],
                        "title": _event_title(risk["level"], z["name"]),
                        "body": risk["cause"],
                        "time_to_critical": risk["time_to_critical"],
                    }
                last_level[key] = risk["level"]

        payload = {
            "t": now,
            "phase": simulator.current_phase,
            "awaiting_operator": simulator.awaiting_operator,
            "zones": zones_out,
            "forecast_central": forecast(histories["central"]),
            "event": event,
        }

        dead = []
        for client in connected:
            try:
                await client.send_json(payload)
            except Exception:
                dead.append(client)
        for d in dead:
            connected.discard(d)


def _event_title(level: str, zone_name: str) -> str:
    if level == "red":
        return f"Explainable Risk Alert — RED: {zone_name}"
    if level == "amber":
        return f"Risk Engine: Amber Warning — {zone_name}"
    return f"{zone_name} recovered to safe level"


@app.on_event("startup")
async def on_startup():
    asyncio.create_task(broadcast_loop())
