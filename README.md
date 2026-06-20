# System Sizer

Capacity planning and system sizing for four kinds of system — **agentic LLM apps**, **RAG apps**, **self-hosted GPU inference**, and **traditional web/app/API + database** systems. A guided wizard walks you from "what are you building" to a sizing summary and a printable, audit-ready report.

Two pieces, designed to be used together:

| File | What it is |
|---|---|
| [`capacity-planning-guide.md`](capacity-planning-guide.md) | The **how-to guide** — first principles, every formula written out, defaults, worked examples, reference tables, and a glossary. Read it to understand *why* the numbers come out the way they do. |
| [`index.html`](index.html) | The **interactive calculator** — implements every formula in the guide, as a guided wizard plus an expert control panel. Open it and start. |

## Open it

A single self-contained HTML file — **no install, no build, no server**:

- **Locally:** double-click `index.html` (or open it in any modern browser).
- **Host it:** drop `index.html` on any static host (GitHub Pages, S3, Netlify, an `nginx` root) — zero external dependencies, so it works behind a strict CSP.

## Two ways to use it

**Wizard (default).** Guided, one domain at a time:
1. **Pick what you're sizing** — Agentic LLM app · RAG application · Self-hosted LLM (GPU) · Traditional application.
2. **Choose your model** (for the LLM paths) — Claude / OpenAI / custom; prices pre-fill and stay editable.
3. **Answer a few grouped questions**, each with a short guidance note explaining what it drives.
4. **Get a summary** — the headline capacity and cost figures — then open the full report.

Quick-start examples on the welcome screen jump straight to a worked summary.

**Expert mode.** A tabbed control panel exposing every input at once (all four modules + global assumptions + an editable pricing/specs table + the report). Toggle between **Wizard** and **Expert** anytime in the header — both share the same state and engine.

## What each module sizes

- **Agentic LLM app** — DAU → tokens/task, calls/task, multi-agent fan-out → average & **peak** TPM/RPM, pass/fail against Anthropic rate-limit tiers, concurrency, **$/task · $/user/month · $/month**, prompt-caching + batch savings.
- **RAG application** — corpus → chunks → vectors, **vector-DB RAM & total storage** (HNSW/IVF/PQ, quantization, replication, metadata), embedding cost/time, per-query token assembly and **generation $/query · $/month**.
- **Self-hosted LLM (GPU)** — **VRAM** = weights + KV cache + overhead, GPUs/replica (tensor-parallel), throughput, **replicas for a target QPS** with utilization headroom, and **self-host vs API $/1M breakeven**.
- **Traditional application** — traffic → **peak RPS**, **app instances** (utilization + N+1 redundancy), **bandwidth**, **storage growth** projection, **cache RAM** (working set), **database** QPS/IOPS/read-replicas, and a rough **monthly infra cost**.

### The report
Generate a clean, audit-ready document that restates **every assumption**, shows **each equation with your numbers substituted** (so a reviewer can check the math by hand), lists the **results**, includes **how-to-read** notes, and appends a **glossary of all abbreviations**. Then **Print / Save as PDF**, or **download as Markdown / HTML**. Pick one module or all four.

### Other niceties
- **Editable everything** — model/GPU presets pre-fill prices/specs; override any field.
- **Shareable links** — "Copy link" encodes all inputs (and your mode) in the URL; "Copy JSON" exports the state.
- **Tooltips** on every field (hover the `i`), backed by the same glossary the report uses.

## Guide ↔ calculator mapping

| Guide section | Calculator module |
|---|---|
| §3 Agentic applications | **Agentic LLM app** |
| §4 RAG applications | **RAG application** |
| §5 Self-hosted inference | **Self-hosted LLM (GPU)** |
| §6 Traditional applications | **Traditional application** |
| §7 Queueing (Little's Law, ρ, headroom) | shared across all modules |
| §9 Reference tables | **Assumptions** tab (Expert) |
| §10 Glossary | **Report** appendix + field tooltips |

## Accuracy & maintenance

- **Claude pricing/limits** are current as of **June 2026** and authoritative. **OpenAI and other figures are approximate** — every value is editable, so set them to your own contract/measurements. The traditional-app unit costs are placeholders; set them to your provider's prices.
- Defaults are **starting points**. Before committing budget or hardware, measure your own token counts and run a load test. Model releases and prices change; update the `MODELS` / `GPUS` / `EMB` tables near the top of the `<script>` in `index.html` as needed.

Sources for the formulas and defaults are listed in [§11 of the guide](capacity-planning-guide.md#11-sources).
