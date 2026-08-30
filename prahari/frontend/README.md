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

