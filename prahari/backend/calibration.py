"""
Calibration
-----------
In a real deployment, we never observe "number of people" directly — we
observe RF signal metrics (Wi-Fi AP association counts, passive probe-request
rate, average RSSI attenuation) and have to convert those into an estimated
occupancy per zone. That conversion is a per-zone regression fit against a
one-time ground-truth calibration pass (e.g. turnstile counts on a quiet day).

This module simulates that: it fits a small linear regression once at
startup on synthetic (signal_metric -> true_count) pairs, standing in for the
real calibration dataset a venue would collect. `estimate()` is what a real
ingestion pipeline would call per zone, per tick, on live AP data.
"""

import numpy as np
from sklearn.linear_model import LinearRegression


class SignalCalibrator:
    """Fits signal_density -> estimated_occupancy per zone."""

    def __init__(self, seed: int = 7):
        rng = np.random.default_rng(seed)
        # Synthetic calibration dataset: signal_metric roughly correlates
        # with true occupancy, plus sensor noise — stands in for a real
        # calibration pass against turnstile ground truth.
        true_counts = rng.uniform(0, 550, 400)
        noise = rng.normal(0, 12, 400)
        signal_metric = true_counts * 0.92 + noise + 5
        X = signal_metric.reshape(-1, 1)
        y = true_counts
        self.model = LinearRegression().fit(X, y)

    def estimate(self, signal_metric: float) -> int:
        """Convert one raw signal reading into an estimated occupancy count."""
        pred = self.model.predict([[signal_metric]])[0]
        return max(0, round(pred))

    def to_signal_metric(self, true_count: float) -> float:
        """Inverse helper used only by the simulator to fabricate plausible
        raw signal readings from a target occupancy (real deployments skip
        this — they start from the signal, not the count)."""
        coef, intercept = self.model.coef_[0], self.model.intercept_
        return (true_count - intercept) / coef


# Singleton used by the app — fit once at import time.
calibrator = SignalCalibrator()
