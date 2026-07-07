# System Designer Studio

An interactive, Packet-Tracer-style playground for designing system architectures by
drag-and-drop, configuring each component, and estimating **how many users the design can
serve** — with the bottleneck called out.

Built with **React + TypeScript + Tailwind + [React Flow](https://reactflow.dev)**, and a
small **Node/Express** server for serving the build and saving designs.

## Run it

```bash
cd studio
npm install
npm run dev        # http://localhost:5174  (hot-reloading dev app)
```

Production / server mode (serve the built app + save designs to disk):

```bash
npm run build
npm run server     # http://localhost:8787
```

## What you can do

- **Drag** components (Load Balancer, API Gateway, App Server/VM, IdP, Cache, Queue, DB,
  Vector DB, LLM, Object Store, CDN, Client) from the left palette onto the canvas.
- **Wire** them: drag from a node's right handle to the next node's left handle.
- **Edit fluidly** with a floating toolbar (top-left of the canvas):
  - **Snap to grid** — toggle on/off and pick the grid size (10–40px); the dotted
    background matches the active grid.
  - **Pan vs. Select mode** — *Pan* drags the canvas (Shift-drag still box-selects);
    *Select* drags a selection box (pan with middle/right mouse).
  - **Multi-select** — box-select an area, or Shift-click to add/remove. The inspector then
    shows bulk tools: **align** (left/center/right · top/middle/bottom), **duplicate**, and
    **delete**.
  - **Auto-arrange** (`⤢ Arrange`) — a layered (dagre) layout that removes node overlaps
    and untangles connections, laid out **left→right** or **top→bottom** (`LR`/`TB` toggle,
    which also flips the node handle sides). Undoable, and grid-snapped when snap is on.
  - **Undo / redo**, with coalesced field edits so a burst of typing is one step.
  - **Shortcuts**: ⌘Z/⌘⇧Z undo·redo, ⌘A select-all, ⌘C/⌘V copy·paste, ⌘D duplicate,
    Delete/Backspace remove, Esc clear. (A `?` button lists them.)
- **Configure** any component in the right inspector. Every field has a sensible default,
  so a freshly-dropped component already simulates. Examples: API Gateway → routes & rate
  limit; VM → vCPU / memory / storage / instances; DB → engine, QPS, read replicas; LLM →
  TPM/RPM and tokens/request.
- **See capacity live**: each node shows a utilization bar; the bottleneck is outlined in
  red; the bottom pill shows the system's max users.
- **Switch Graph ⇄ JSON** (top toolbar): the JSON view is a live, editable representation of
  the design in the same format as `Save .json`. Edit it and press **Apply changes** to load
  it back into the canvas (parsed + validated), or **Revert**. While untouched it stays in
  sync with the graph.
- **Generate a report** (top-right): headline max-users, per-component utilization, derived
  formulas, warnings, and rough monthly cost. **Download as Markdown**, or **Print / Save as
  PDF** — which renders a proper standalone document (light theme, real typography, the
  architecture diagram embedded) in an isolated iframe, so the PDF is the report itself, not
  a screenshot of the app.
- **Export / import / share**:
  - **Editable file** — `Save .json` / `Open` round-trips the full design (`*.sysdesign.json`).
  - **Image** — `Export PNG` renders the diagram framed to fit.
  - **Share link** — packs the whole design (compressed) into the URL hash and copies it
    to the clipboard. Fully self-contained: opening the link decodes the design locally — no
    server or storage needed. A typical design is ~1–2k characters; very large designs warn
    you to use `Save .json` instead.
- **Switch icon themes** in the header (see *Themes* below).

## How capacity is calculated

Each **traffic source** (a Users/Client node) emits its own configured peak load — either a
**population** (`users × req/s per user × peak`) or a **fixed rate** (`req/s × peak`) for
API/service consumers. Add several sources to mix human and programmatic traffic; their
demand **sums** at shared components. Demand is propagated through the wired graph, where a
node passes `demand × outflow` downstream — so a **cache hit ratio** reduces what reaches the
database behind it.

Because demand is linear in traffic, the whole system can grow by
`scaleMultiplier = min(capacity ÷ demand)` over the constrained nodes; that tightest node is
the **bottleneck**, and each population source can then serve `users × scaleMultiplier`. The
headline shows the headroom multiplier plus max users (and per-source maxima are in the
report). Global workload values act as **defaults** for sources that don't override them.

Capacity models and default constants are grounded in [`../capacity-planning-guide.md`](../capacity-planning-guide.md)
(~200–250 RPS/instance, target utilization ~0.6, cache hit 80–85%, peak 3–4×, read replicas
scale reads, LLM bound by TPM/RPM, etc.). Tune any of these in the **Workload assumptions**
panel and per-component fields. Numbers are planning estimates — measure and load-test
before committing budget or hardware.

## Themes (vendor icon packs)

Icons are resolved through a registry so the community can ship vendor-specific packs
(AWS, Azure, GCP, OCI, …). A theme overrides any subset of components and falls back to the
generic line set for the rest.

```ts
// src/themes/index.tsx
import { registerTheme } from './themes'

registerTheme({
  id: 'aws',
  name: 'AWS',
  vendor: 'AWS',
  icons: {
    server: MyEc2Icon,
    db: MyRdsIcon,
    // …only the ones you want to override
  },
})
```

Each icon is a React component taking `{ size?, className? }` and drawing with
`currentColor` (so the node chrome can tint it). Two built-in packs ship today: **Generic
(line)** and **Solid badge** (a template for vendor packs).

## Project layout

```
studio/
  src/
    catalog.ts            # component definitions: fields, defaults, capacity models
    capacity.ts           # graph traversal → bottleneck & max-users analysis
    store.ts              # Zustand state (nodes, edges, globals, theme)
    types.ts
    themes/               # icon registry + packs (default, solid; add vendor packs here)
    lib/                  # export (PNG/JSON), report (markdown), sample design
    components/           # Canvas, Palette, ConfigPanel, ReportPanel, Toolbar, ComponentNode
  server/index.js         # Express: serve build + GET/PUT /api/designs
```

## Adding a new component type

1. Add a `ComponentType` in `src/types.ts`.
2. Add a catalog entry in `src/catalog.ts` (label, category, fields, defaults, and a
   `capacity()` function returning sustainable `req/s`). Optionally add `outflowMultiplier`
   (traffic-shaping like a cache) and `monthlyCost`.
3. Add an icon for it in `src/themes/default.tsx`.

That's it — palette, inspector, capacity engine, and report pick it up automatically.
