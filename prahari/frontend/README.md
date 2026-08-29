# Prahari — Frontend (Signal Command Dashboard)

A dark-themed, interactive command-center dashboard built with **React +
Vite + Tailwind CSS**. It's a fully self-contained prototype: it runs the
same zone/risk/forecast logic as `../backend` directly in the browser
(`src/lib/engine.js`), so it needs **no server** to deploy — perfect for a
static Vercel deployment you can link straight from a pitch deck.

```
frontend/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── vercel.json
└── src/
    ├── main.jsx              Entry point
    ├── App.jsx               Top-level layout
    ├── index.css             Tailwind + custom animations (radar sweep, etc.)
    ├── lib/
    │   └── engine.js         JS port of the backend's simulator + risk engine
    ├── hooks/
    │   └── useSimulation.js  Runs the engine on a tick loop, exposes React state
    └── components/
        ├── TopBar.jsx        Brand, live clock, overall status pill
        ├── Controls.jsx      Run/Reset buttons + phase progress tracker
        ├── ZoneMap.jsx       Schematic venue map with live density coloring
        ├── SignalPanel.jsx   RF signal spectrum bars per zone
        ├── AlertFeed.jsx     Scrolling explainable-risk-engine alert feed
        ├── WhatIfPanel.jsx   Operator intervention buttons + outcome preview
        ├── DensityChart.jsx  Central Corridor density trend + forecast (recharts)
        └── Panel.jsx         Shared card wrapper
```

## Running locally

```bash
cd frontend
npm install
npm run dev
```

Open the printed local URL (usually `http://localhost:5173`). Click
**▶ Run Demo Scenario** to play the full 60-second normal → surge →
bottleneck → operator action → recovered cycle, exactly as described in the
pitch deck. While the risk engine is waiting on a decision (bottleneck
phase), the **What-If Simulator** panel lights up — try **Open Gate C** to
resolve it.

## Building for production

```bash
npm run build      # outputs to dist/
npm run preview    # serve the production build locally to sanity-check it
```

## Deploying to Vercel

You need a link you can put in the pitch deck — here's the fastest path.

### Option A — Vercel dashboard (no CLI, easiest)

1. Push this repo to GitHub (see the root `README.md` for the git commands).
2. Go to [vercel.com/new](https://vercel.com/new) and sign in with GitHub.
3. Import the repo.
4. When it asks for the **Root Directory**, set it to `frontend`
   (important — the repo root is not the Vite project, `frontend/` is).
5. Vercel auto-detects Vite (build command `npm run build`, output `dist`)
   from `frontend/vercel.json` — just click **Deploy**.
6. You'll get a URL like `https://prahari.vercel.app` in about a minute.
   That's your prototype link for the deck.

### Option B — Vercel CLI

```bash
npm install -g vercel
cd frontend
vercel login
vercel --prod
```

Answer the prompts (link to a new project, keep defaults). It builds and
deploys directly from your machine and prints the live URL at the end.

Either way, every future `git push` to your main branch will auto-redeploy
if you used Option A (Vercel's GitHub integration watches the repo).

## Connecting to the real backend instead of the built-in simulation

By default this dashboard runs entirely client-side using
`src/lib/engine.js`. If you've got `../backend` running and want the
dashboard to reflect the *actual* Python risk engine over a live WebSocket
instead, see the "Connecting the frontend to this backend" section in
`backend/README.md`.
