# Capacity Planning & System Sizing for Agentic, RAG & Traditional Applications

A practical, formula-first guide to sizing systems — how much capacity you need, how many GPUs/servers or which API tier, how much it will cost, and where it breaks under load. Every formula here is implemented in the companion calculator (`index.html`), and every input/output in the calculator maps back to a section here.

> **Scope.** Four domains: (1) **Agentic apps** that call hosted model APIs, (2) **RAG apps** with a vector database, (3) **Self-hosted inference** on your own GPUs, and (4) **Traditional applications** (web/app/API + database + cache). A shared **queueing** layer ties them together (concurrency, utilization, headroom).

> **The calculator has two modes.** A **Wizard** walks you through one domain step by step (pick a system type → choose your model → answer a few grouped questions → get a summary you can turn into a printable report), and an **Expert** mode exposes every input on tabs. Same engine behind both.

> **Numbers are defaults, not gospel.** Token counts, latencies, and prices change with your workload and with model releases. Treat every default as a starting point and measure your own. Prices below are current as of **June 2026**; Claude pricing is authoritative, other providers are approximate and editable in the calculator.

---

## Table of contents

1. [How to use this guide (and the calculator)](#1-how-to-use-this-guide-and-the-calculator)
2. [First principles: the sizing pipeline](#2-first-principles-the-sizing-pipeline)
3. [Agentic applications](#3-agentic-applications)
4. [RAG applications](#4-rag-applications)
5. [Self-hosted inference & system sizing](#5-self-hosted-inference--system-sizing)
6. [Traditional applications](#6-traditional-applications)
7. [Queueing theory: concurrency, utilization, headroom](#7-queueing-theory-concurrency-utilization-headroom)
8. [Worked examples](#8-worked-examples)
9. [Reference tables](#9-reference-tables)
10. [Glossary of abbreviations](#10-glossary-of-abbreviations)
11. [Sources](#11-sources)

---

## 1. How to use this guide (and the calculator)

Capacity planning answers four questions, in order:

1. **What is one unit of work?** (a task, a query, a request) — model its token/compute footprint.
2. **How much of it happens, and when?** — convert demand (users, tasks/day) into rates (per-second, per-minute), then to **peak**.
3. **What does it take to serve the peak?** — API rate-limit tier, number of GPUs/replicas, RAM/storage — with **headroom**.
4. **What does it cost?** — per task, per user, per month; and self-host vs API breakeven.

Work top-to-bottom. The calculator mirrors this: each module takes demand + per-unit assumptions and produces capacity + cost. In the **Wizard**, you pick one of four system types — agentic, RAG, self-hosted GPU, or traditional — choose your model, and answer the grouped questions in order, ending on a summary. The **Report** then prints the assumptions, the equations with your numbers substituted, the results, and a glossary — so a reviewer can audit every figure.

---

## 2. First principles: the sizing pipeline

```
 demand            workload model           capacity                  cost
┌────────┐       ┌────────────────┐      ┌──────────────┐        ┌──────────┐
│ users, │  ──▶  │ tokens/unit,   │ ──▶  │ rate vs       │  ──▶   │ $/unit,  │
│ tasks/ │       │ calls/unit,    │      │ limits;       │        │ $/user,  │
│ day    │       │ latency/unit   │      │ #GPUs/replicas│        │ $/month  │
└────────┘       └────────────────┘      └──────────────┘        └──────────┘
                                              ▲
                              peak factor + utilization headroom
```

Five rules that hold across all three domains:

- **Model the unit of work first.** Everything scales from tokens-per-task (agentic), bytes-per-vector (RAG), or VRAM-per-request (self-host).
- **Convert demand to a rate.** `rate = volume / time_window`. A daily number becomes per-second by dividing by 86,400.
- **Size for peak, not average.** Real traffic clusters. Multiply average by a **peak-to-average ratio** (2–5× typical).
- **Keep headroom.** Never plan to run at 100% utilization — latency explodes near saturation (see §6). Target ~70% utilization and add a safety margin.
- **Cost follows capacity, but output dominates.** For LLMs, output tokens are priced ~4–5× input; agents that "reason out loud" are output-heavy.

---

## 3. Agentic applications

An **agent** runs a loop: call the model → maybe call a tool → feed the result back → repeat until done. So one user "task" is **many** model calls, and context **grows** each step.

### 3.1 Token model — one call

```
input_tokens_per_call =
    system_prompt
  + tool_definitions
  + conversation_history
  + user_input
  + tool_outputs (retrieved/observed)
```

Typical defaults (per call): system prompt **2,000**, tool definitions (5–10 tools) **1,000**, user input **300**, tool outputs **1,500**, output **500**. Anthropic's tool use adds ~290–675 system tokens automatically when tools are enabled.

### 3.2 Token model — one task

A task is a loop of `N` calls:

```
tokens_per_task = calls_per_task × (avg_input_per_call + avg_output_per_call)
```

| Task type | Typical LLM calls |
|---|---|
| Simple reasoning + 1 tool | 2–3 |
| Multi-step automation | 5–8 |
| Complex research/analysis | 8–15 |
| Full reasoning + RAG loop | 10–20+ |

**Context growth.** Without compaction, step `N` re-sends everything before it:

```
context_at_step_N = system + Σ(input_i + output_i for i<N) + current_input
```

This makes naive multi-step agents cost **5N–10N×** the base input. Summarization/compaction caps growth at ~3–4× base. The calculator models this with a "conversation growth" toggle.

### 3.3 Multi-agent fan-out

An orchestrator that spawns sub-agents multiplies tokens:

```
tokens_multi_agent ≈ orchestrator_calls × tokens_per_orch_call
                   + (num_subagents × calls_per_subagent × tokens_per_call)
```

> **Rule of thumb:** Anthropic reported their multi-agent research system used **~15× the tokens** of a single chat — and justified it only because the task value was high. Use multi-agent when value > ~15× the cost.

### 3.4 Throughput: demand → rates

```
tasks_per_sec = DAU × tasks_per_user_per_day / 86,400
TPM (tokens/min) = tasks_per_sec × tokens_per_task × 60
RPM (requests/min) = tasks_per_sec × calls_per_task × 60
```

**Peak.** Multiply by a peak-to-average ratio (default **3×**; mobile/global audiences 5–10×):

```
peak_TPM = TPM × peak_ratio
```

### 3.5 Concurrency (Little's Law)

The number of requests in flight at once:

```
L = λ × W
  concurrent_requests = (calls_per_sec) × (avg_request_latency_seconds)
```

Size connection pools, semaphores, and rate-limit headroom to **≥ L × safety** (3–5×).

### 3.6 Latency

```
step_latency  = TTFT + (output_tokens / tokens_per_sec) + tool_execution_time
task_latency  = Σ step_latency  + network_overhead_per_hop
```

Frontier-model defaults (2026): TTFT ~0.7–1.1 s, output ~80–95 tok/s. Agents wait for complete responses, so **throughput (tok/s) matters more than TTFT** for agent workloads.

### 3.7 Provider rate limits

Sizing against a tier means checking your **peak** load against both token and request limits.

- **Anthropic** limits by **ITPM** (input tokens/min), **OTPM** (output tokens/min), and **RPM**. Crucially, for most Claude models **only *uncached* input counts toward ITPM**, so caching multiplies effective input headroom: `effective_ITPM = stated_ITPM / (1 − cache_hit_rate)`.
- **OpenAI** counts all input tokens toward TPM (no cache discount on the limit).

Example Claude tiers (Opus): T1 — ITPM 500K / OTPM 80K / RPM 50; T2 — 2M / 200K / 1,000; T3 — 5M / 400K / 2,000; T4 — 10M / 800K / 4,000. The calculator flags pass/fail and tells you the minimum tier that fits.

### 3.8 Cost

```
cost_per_task = (input_tokens × input_price + output_tokens × output_price) / 1e6
cost_per_user_per_month = cost_per_task × tasks_per_user_per_day × 30
monthly_cost = cost_per_task × DAU × tasks_per_user_per_day × 30
```

Output is priced ~5× input on Claude, so **output tokens dominate** an agent's bill. Reducing reasoning verbosity or `max_tokens` is usually the highest-leverage cost lever.

### 3.9 Prompt caching & batch

**Prompt caching** turns a large, stable prefix (system prompt, tool defs, retrieved docs) into a cheap reuse:

- Cache **read** ≈ **0.1×** base input price.
- Cache **write** ≈ **1.25×** (5-min TTL) or **2.0×** (1-hour TTL).
- Break-even: a 5-min cache write pays for itself after ~**1 read**.

```
cached_input_cost = uncached_tokens × base_price + cached_tokens × 0.1 × base_price
```

**Batch API** = **50% off** input and output, for non-latency-sensitive work (≤24 h turnaround). Blend: `cost = (1−batch%) × sync + batch% × 0.5 × sync`.

### 3.10 Reliability & headroom

```
effective_requests = base_requests × (1 + retry_rate × avg_retries)
provisioned_capacity = peak_load × (1 + headroom_fraction)
```

Defaults: retry rate 2%, avg 2 retries (~4% amplification); total headroom 40–80% over base. Use exponential backoff with jitter to avoid retry storms.

---

## 4. RAG applications

A RAG system has two cost/capacity centers: **the index** (build once, store forever, query often) and **generation** (per query). Size both.

### 4.1 Corpus & chunking

```
total_tokens = num_documents × avg_tokens_per_document
num_chunks ≈ ceil((total_tokens − chunk_size) / (chunk_size − overlap)) + 1
num_vectors = num_chunks
```

Defaults: 1,500 tokens/doc, chunk **512**, overlap **10%** (≈51 tokens), top-k **5**.

### 4.2 Embedding sizing

```
embedding_cost = total_tokens × price_per_1M / 1e6
embed_time ≈ total_tokens / throughput_tokens_per_sec
```

| Model | Dims | $/1M tokens |
|---|---|---|
| OpenAI text-embedding-3-small | 1,536 | ~$0.02 |
| OpenAI text-embedding-3-large | 3,072 | ~$0.13 |
| Cohere embed v4 | 1,536 | ~$0.12 |
| BGE-large-en-v1.5 (OSS) | 1,024 | self-host |
| MiniLM (OSS) | 384 | self-host |
| Nomic-embed (OSS) | 768 | self-host |

Re-embedding cadence (full re-index) is typically quarterly; budget ×1.25–×4/year for growth + refresh.

### 4.3 Vector database sizing

The single most-asked RAG sizing question. Start from raw vectors, then add index and overhead:

```
raw_bytes = num_vectors × dims × bytes_per_dim     (fp32=4, fp16=2, int8=1)
total = raw_bytes × index_multiplier × (1 + metadata_overhead) × replication_factor
```

**Index multipliers** (× raw vector size):

| Index | Multiplier | Notes |
|---|---|---|
| FLAT | 1.0 | exact, small datasets |
| IVF_FLAT | 1.05 | good recall, medium scale |
| HNSW | ~1.8 | high accuracy, RAM-heavy |
| IVF_SQ8 | 0.30 | 4× compression |
| IVF_PQ | 0.12 | 8–10× compression |

HNSW per-vector memory ≈ `dims × 4 + M × 2 × 4` bytes (M = connections/node, typically 16–64). Quantization (scalar int8 → 4× smaller, ~<1% accuracy loss; product/binary → up to 32×) is the main lever for large indexes. Metadata/overhead default **+50%**; each replica **+100%**.

> **Worked check:** 100M vectors × 768 dims × 4 B = **307 GB** raw → HNSW (×1.8) ≈ **553 GB**; IVF_PQ (×0.12) ≈ **37 GB**.

### 4.4 Ingestion & query throughput

- Vector write throughput: ~10,000–50,000 vectors/sec (production); `ingest_time = num_vectors / write_rate`.
- Query latency budget (P50 50–500 ms): encode 10–50 ms + ANN search 1–50 ms + optional rerank 100–300 ms.
- Reranking (cross-encoder/Cohere rerank) is the biggest per-query latency add — include it only if you need the recall.

### 4.5 End-to-end query: tokens & cost

```
gen_input_tokens = system_prompt + query + (top_k × chunk_size)
cost_per_query = (gen_input_tokens × in_price + gen_output_tokens × out_price) / 1e6
monthly_gen_cost = queries_per_month × cost_per_query
```

Two knobs dominate generation cost: **top-k** (each extra chunk ≈ +chunk_size input tokens) and **chunk size** (doubling it doubles retrieved-context tokens).

### 4.6 Storage totals

```
chunk_text_storage = num_chunks × chunk_size × ~4 bytes/token
embedding_storage  = num_vectors × dims × bytes_per_dim
total_storage = source_docs + chunk_text + embedding_storage × index_multiplier
              × (1 + metadata) × replication
```

---

## 5. Self-hosted inference & system sizing

If you run your own GPUs, two limits decide everything: **memory** (does it fit?) and **throughput** (how fast?).

### 5.1 GPU memory (VRAM)

```
weights_GB = params_billions × bytes_per_param         (FP16=2, INT8=1, INT4=0.5)
KV_cache_bytes = 2 × layers × kv_heads × head_dim × seq_len × batch_size × bytes_per_param
total_VRAM ≈ (weights + KV_cache + activations) × overhead(~1.2) + framework(~1–2 GB)
```

The `2` is for the K and V tensors. **GQA/MQA** shrinks KV cache by using fewer KV heads than query heads (Llama-3 70B uses 8 KV heads vs 64 query heads → 8× smaller cache). KV cache dominates at long context / large batch.

Rule of thumb: **FP16 ≈ 2 GB per billion params**; INT4 ≈ 0.5 GB/B. A 70B model ≈ 140 GB weights (FP16), ~160–180 GB total with overhead.

```
GPUs_per_replica = ceil(total_VRAM / GPU_VRAM)     (tensor-parallel when > 1)
```

### 5.2 Throughput

Decode is **memory-bandwidth-bound**:

```
tokens_per_sec_per_gpu ≈ memory_bandwidth_GBs / model_size_GB    (batch=1, rough)
```

Continuous batching (vLLM) lifts aggregate throughput ~3–5×; INT4 ~2×; speculative decoding ~2×. Max batch size is capped by KV-cache memory.

### 5.3 Replicas for a target QPS

```
service_rate_per_replica (req/s) = tokens_per_sec_per_replica / avg_output_tokens_per_req
replicas = ceil( peak_QPS / (service_rate_per_replica × ρ_target) )
```

with `ρ_target ≈ 0.7` (see §6). Add headroom on top for spikes and scale-up lag.

### 5.4 Self-host vs API breakeven

```
self_host_$_per_1M_tok = GPU_$/hr / (tokens_per_sec × 3600 × utilization) × 1e6
```

Compare to the API's blended `$/1M`. Self-hosting typically wins only at **high, steady utilization** (>~50% for small models) and high volume; bursty/low-utilization workloads favor the API's multi-tenant pooling. Add 1.3–2× for engineering/ops overhead.

GPU specs (2026): **H100** 80 GB / 3,350 GB/s (~$2.5–3.5/hr), **A100-80** 80 GB / 2,039 GB/s (~$1.8/hr), **A100-40** 40 GB / ~1,600 GB/s.

---

## 6. Traditional applications

Classic web/app/API services backed by a database and a cache. The unit of work is a **request**; you size compute, bandwidth, storage growth, cache, and the database. (LLM apps are traditional apps *plus* the token/GPU layers above — the traffic, server, storage, and DB math here applies to the non-LLM tiers of any system.)

### 6.1 Traffic → rate
```
requests_per_day = users × requests_per_user_per_day
avg_RPS = requests_per_day / 86,400
peak_RPS = avg_RPS × peak_ratio
concurrency (Little's Law) = peak_RPS × avg_processing_time
```

### 6.2 Compute / app servers
```
app_instances = ceil( peak_RPS / (RPS_per_instance × target_utilization) ) × (1 + redundancy)
```
Run instances at ~0.6 utilization (headroom for spikes), and add redundancy (e.g. +50%, N+1-style) so a single instance failure doesn't drop you below capacity.

### 6.3 Bandwidth
```
egress_Mbps (peak) = peak_RPS × avg_response_KB × 1024 × 8 / 1e6
monthly_egress_GB  = requests_per_day × avg_response_KB / 1,048,576 × 30
```
Ingress is the same with request size. Egress is usually the line item you pay for.

### 6.4 Storage growth
```
growth_per_year = new_records_per_day × bytes_per_record × 365
projected = (current + growth_per_year × horizon_years) × replication_factor
```

### 6.5 Cache
```
cache_RAM = projected_dataset × hot_fraction        (the working set)
```
The cache **hit ratio** decides how much read traffic reaches the database — it's the single biggest lever on DB load.

### 6.6 Database
```
write_QPS = peak_RPS × write_ratio
read_QPS  = peak_RPS × (1 − write_ratio)
uncached_reads = read_QPS × (1 − cache_hit)
DB_IOPS = write_QPS × IOPS_per_write + uncached_reads × IOPS_per_read
read_replicas = ceil( uncached_reads / read_QPS_per_replica )
DB_nodes = 1 primary + read_replicas
```

### 6.7 Cost (rough, all unit costs editable)
```
monthly = app_instances×$server + DB_nodes×$db + cache_GB×$cache
        + storage_GB×$store + monthly_egress_GB×$egress
```

**Defaults:** peak 3–4× · RPS/instance 200–250 · utilization 0.6 · redundancy +50% · replication 3 · cache hot fraction 15–20% · cache hit 80–85% · write ratio 15–20% · IOPS/write 3 · IOPS/read 1.

---

## 7. Queueing theory: concurrency, utilization, headroom

Why you can't run at 100%.

```
Little's Law:   L = λ × W              (in-flight = arrival rate × time in system)
Utilization:    ρ = λ / (c × μ)        (c servers, service rate μ each)
Replicas:       c = ceil( (λ/μ) / ρ_target )
```

As `ρ → 1`, wait time grows roughly like `1/(1−ρ)` — the **latency cliff**:

| ρ | relative wait |
|---|---|
| 0.5 | 1× |
| 0.7 | ~1.5–2× |
| 0.8 | ~5× |
| 0.9 | ~10× |
| 0.95 | ~20× |

So **target ρ ≈ 0.7** and never design for ρ > ~0.8. **Bursty demand is the real cost driver**: the same average with high variance can need several× the capacity of smooth demand (autoscaling helps but can't beat the math because scale-up takes minutes while spikes arrive in seconds).

---

## 8. Worked examples

### 8.1 SaaS support agent (Claude Sonnet 4.6) — simplified
A back-of-envelope pass: 5,000 DAU, 2 tasks/user/day, 4 calls/task; assume ~1,500 input and ~500 output tokens per call.
- tasks/sec = 5,000 × 2 / 86,400 = **0.116**; RPM = 0.116 × 4 × 60 ≈ **28** → peak ×3 ≈ **~84 RPM** (well within T2).
- per task ≈ 4 × 1,500 = 6,000 input, 4 × 500 = 2,000 output → cost/task ≈ (6,000 × $3 + 2,000 × $15)/1e6 = **$0.048**; monthly = 0.048 × 10,000 × 30 ≈ **$14.4K**.
- With 80% cache hit + 40% batch, expect ~**40–55% savings**.

> **The calculator is more precise.** Its default model re-sends the system prompt + tool definitions on *every* call and lets context grow each step, so for the same scenario it reports a higher, more realistic figure (~**$0.13/task**, ~**$39K/mo** with growth on). Turn off "context grows each step" to approximate compaction and bring it back toward this simplified estimate.

### 8.2 Enterprise RAG (50M vectors)
50M vectors, 1,536 dims, HNSW, ×1.5 replication.
- raw = 50e6 × 1,536 × 4 = **307 GB** → HNSW ×1.8 = **553 GB** → +50% metadata = 830 GB → ×1.5 replicas ≈ **1.24 TB RAM**.
- 5 chunks/query × 1,024 + 1,000 system ≈ 6,200 input tokens; on Sonnet, ~$0.026/query.

### 8.3 Self-host Llama-70B
FP16, 80 layers, 8 KV heads, head_dim 128, 8K context, batch 8, on H100 80 GB.
- weights ≈ 70 × 2 = **140 GB** (fits in 2× H100 by itself), but you must also hold the KV cache and overhead.
- KV cache = 2 × 80 × 8 × 128 × 8,192 × 2 ≈ **2.7 GB/request** → **~21 GB** across a batch of 8.
- total VRAM ≈ (140 + 21 + 7) × 1.2 + 1.5 ≈ **204 GB** → **3× H100 per replica** (tensor-parallel). KV cache grows with context × batch, so long contexts push this up fast.
- Throughput ≈ 3,350 / 140 ≈ **24 tok/s** base, ≈ **96 tok/s** at 4× continuous batching → size replicas against peak QPS at ρ = 0.7.

### 8.4 Traditional web app
500K DAU × 40 req/day, peak 4×, 40 KB responses; 20M new records/day × 800 B; replication 3, 85% cache hit.
- peak RPS = 500,000 × 40 / 86,400 × 4 ≈ **926**; at 250 RPS/instance × 0.6 util → 7 base × 1.5 (HA) ≈ **11 instances**.
- egress ≈ 926 × 40 KB ≈ **303 Mbps** peak; ~24 TB/month.
- storage/yr = 20M × 800 B × 365 ≈ **5.8 TB/yr** → 3-yr projected × 3 replicas ≈ **56 TB**.
- with 85% cache hit, uncached reads ≈ **118 qps** → DB IOPS ≈ **535**, **1 read replica** (+ primary).

---

## 9. Reference tables

**Agentic defaults:** system 2,000 · tools 1,000 · user 300 · tool-output 1,500 · output 500/call · 3 calls/task · peak 3× · retry 2% · headroom 50%.

**Claude prices (per 1M, current; editable):** Fable 5 $10/$50 · Opus 4.8 $5/$25 · Opus 4.7 $5/$25 · Opus 4.6 $5/$25 · Sonnet 4.6 $3/$15 · Haiku 4.5 $1/$5. Context 1M (Haiku 200K). Cache read 0.1× · write 1.25× (5 m) / 2× (1 h). Batch 50% off.

**OpenAI (approximate, editable):** GPT-5.5 ~$2.50/$30 · embeddings 3-small ~$0.02, 3-large ~$0.13.

**Embedding dims:** 3-small 1,536 · 3-large 3,072 · Cohere v4 1,536 · BGE-large 1,024 · MiniLM 384 · Nomic 768.

**Vector index multipliers:** FLAT 1.0 · IVF_FLAT 1.05 · HNSW 1.8 · IVF_SQ8 0.30 · IVF_PQ 0.12.

**GPU specs:** H100 80 GB / 3,350 GB/s · A100-80 80 GB / 2,039 GB/s · A100-40 40 GB / ~1,600 GB/s. **Bytes/param:** FP16 2 · INT8 1 · INT4 0.5.

**Model presets:** Llama-70B (80 layers, 8 KV heads, head_dim 128) · Llama-8B (32, 8, 128) · Llama-405B (~126 layers).

**Traditional defaults:** peak 3–4× · RPS/instance 200–250 · utilization 0.6 · redundancy +50% · replication 3 · cache hot fraction 15–20% · cache hit 80–85% · write ratio 15–20% · IOPS/write 3 · IOPS/read 1.

---

## 10. Glossary of abbreviations

- **DAU** — Daily Active Users.
- **TTFT** — Time To First Token; latency until the first output token.
- **TPM / RPM** — Tokens / Requests Per Minute (rate-limit units).
- **ITPM / OTPM** — Input / Output Tokens Per Minute (Anthropic rate limits).
- **QPS / RPS** — Queries / Requests Per Second.
- **Token** — the unit LLMs read/write (~3–4 chars of English).
- **Context window** — max tokens a model can attend to at once.
- **Prompt caching** — reusing a stable prompt prefix at reduced cost.
- **Batch API** — asynchronous, discounted (≈50%) bulk processing.
- **RAG** — Retrieval-Augmented Generation.
- **Chunk** — a slice of a document that gets embedded and retrieved.
- **Embedding** — a vector representation of text for similarity search.
- **Vector DB** — database that stores/searches embeddings (Pinecone, Qdrant, Weaviate, Milvus, pgvector).
- **ANN** — Approximate Nearest Neighbor search.
- **HNSW** — Hierarchical Navigable Small World (graph ANN index).
- **IVF** — Inverted File index; **PQ** — Product Quantization; **SQ** — Scalar Quantization.
- **top-k** — number of chunks retrieved per query.
- **Reranker** — model that re-orders retrieved chunks for relevance.
- **VRAM** — GPU video memory.
- **KV cache** — cached attention Keys/Values; grows with context × batch.
- **GQA / MQA** — Grouped / Multi-Query Attention; shrink KV cache.
- **Quantization** — lower-precision weights (FP16/INT8/INT4).
- **Tensor parallelism** — splitting one model across multiple GPUs.
- **Continuous batching** — dynamically batching requests (vLLM) for throughput.
- **Little's Law** — L = λ × W; in-flight = arrival rate × time in system.
- **ρ (utilization)** — fraction of capacity in use; latency spikes as ρ→1.
- **Erlang-C** — queueing formula for probability of waiting / servers needed.
- **Peak-to-average ratio** — peak load ÷ average load.
- **Headroom** — spare capacity reserved above expected peak.
- **IOPS** — Input/Output Operations Per Second; storage/disk throughput unit for databases.
- **Working set** — the hot subset of data actively accessed; what you size cache against.
- **Cache hit ratio** — fraction of reads served from cache instead of the database.
- **Read replica** — read-only DB copy that absorbs read traffic to scale reads.
- **Redundancy (N+1)** — extra capacity so the system survives an instance failure.
- **Replication factor** — number of stored copies of data; multiplies storage.
- **Bandwidth** — network throughput (ingress/egress), here in Mbps/Gbps.

---

## 11. Sources

- **Claude pricing, rate limits, prompt caching, batch** — Anthropic platform docs (authoritative; reflected in the `claude-api` reference, June 2026).
- **Agentic workload & multi-agent token economics** — Anthropic engineering ("Building Effective Agents", multi-agent research system ~15× tokens); OpenAI rate-limit docs.
- **RAG / vector-DB sizing** — Pinecone, Qdrant, Weaviate, Milvus, pgvector sizing & cost guides; embedding-provider pricing.
- **GPU memory & throughput** — NVIDIA hardware specs, vLLM continuous-batching benchmarks, LLM-inference roofline analyses.
- **Queueing** — Little's Law and Erlang-C / M/M/c references applied to LLM serving.

*Defaults are starting points — measure your own workload with token-counting and load tests before committing budget or hardware.*
