# Prahari

**Real-time crowd flow intelligence to prevent stadium stampedes — without cameras.**

Built for Build with Bharat 2.0 (National Level Hackathon) by **Sorcerers of Code**.

> Team: Arnav Aggarwal (Team Leader), Akshat Tyagi(jims) , Nakul Jain, Aradhye Bhushan , Trihan Walecha

> College: GGSIPU (Guru Gobind Singh Indraprastha University)

---

## The problem

Venues track total headcount, but that number says nothing about which
specific corridor or stairwell is compressing toward a crush right now.
Crowd crushes (Elphinstone Road 2017, Vaishno Devi 2022, Itaewon 2022,
Astroworld 2021) build gradually over minutes but strike without warning,
because nothing is watching the right variable — local density and flow,
zone by zone, continuously. Camera-based crowd analytics exist, but they
fail exactly when needed most (smoke, darkness, panic-induced occlusion)
and require expensive new hardware at every corridor.

## The idea

**Prahari** estimates crowd density and flow per zone from the phones
people already carry — Wi-Fi access-point association counts and passive
probe-request rates — instead of cameras. That signal is fused into an
explainable risk engine that flags exactly *where* flow is failing, states
*why*, and estimates *how long* until it becomes critical — all before an
operator has to guess. A human always confirms the response: the system
recommends and simulates outcomes, but never acts unilaterally.

Why not just open every gate as a blanket fix? Because every open gate
needs security screening staff, and flooding a fixed-width internal choke
point with more simultaneous inflow can create new converging-crowd risk
rather than remove it. Prahari's whole value is opening the *one* alternate
route the risk engine actually identifies as needed — targeted response,
not brute force.

## What's in this repo

```
prahari/
├── backend/     Real FastAPI service: the actual intelligence pipeline
│                (RF simulation → scikit-learn calibration → explainable
│                 risk engine), runnable locally against real hardware
│                once wired in. See backend/README.md.
│
└── frontend/    Interactive dark-themed dashboard (React + Vite +
                 Tailwind). Runs the same zone/risk logic client-side, so
                 it deploys as a zero-backend static site — this is what
                 you link from the pitch deck. See frontend/README.md.
```

Both implement the exact same model (same zones, same thresholds, same
scenario), so the *deployed prototype* and the *real backend architecture*
tell a consistent story — the frontend README explains how to point the
dashboard at the real backend once you're ready to wire in actual RF
hardware instead of the built-in simulation.


Full instructions, API reference, and architecture notes are in
[`backend/README.md`](backend/README.md) and
[`frontend/README.md`](frontend/README.md).

## Tech stack

| Layer          | Choice                                                   |
|----------------|-----------------------------------------------------------|
| Frontend       | React, Vite, Tailwind CSS, Recharts                       |
| Backend        | Python, FastAPI, async WebSockets                         |
| Sensing (real) | Cisco Meraki / UniFi AP client-count APIs, ESP32 passive Wi-Fi sniffers, MQTT |
| Intelligence   | scikit-learn (calibration regression), rule-based explainable risk engine |

## License

Built for a hackathon submission. Use, fork, and extend freely.
