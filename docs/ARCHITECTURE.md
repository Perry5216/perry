# Perry v2 — architecture (public map)

This is the public map of the **running v2 system**. It is written so a reader can see how the pieces fit without needing the private monorepo.

v1 architecture (Express coordinator, SQLite task pool, MCP workers) lives in [`perry-system/docs`](https://github.com/Perry5216/perry-system/tree/main/docs). This document is v2 only.

---

## 1. What v2 is

A self-hosted multi-domain AI fleet. Local GPUs run models. A TypeScript monorepo (Node ≥ 22, ESM) exposes the platform through:

- `PerryRuntime` — composition root that wires every package
- an HTTP server on `:4847` — dashboard + operator scripts
- the same runtime as an MCP server over stdio

Design goals that survived from v1 and got teeth in v2:

- private by default
- extensible at named seams (domains, tools, capabilities)
- fail-closed on outward actions
- parallel only when the graph says so

---

## 2. Package graph

Eighteen active workspaces. v1 package names (`core`, `dashboard-api`, `projects`) are tombstones — not in the workspace list, not in the image.

**Foundation**

| Package | Role |
|---|---|
| `@perry/types` | Shared types |
| `@perry/mcp-core` | Tool registry, in-process dispatcher, circuit breakers, compute profile |
| `@perry/node-limiter` | Per-backend concurrency gates for the DAG |

**Orchestration**

| Package | Role |
|---|---|
| `@perry/orchestration` | `runPipeline`, `runFanout`, council, `runJobGraph` |
| `@perry/domain-sdk` | `defineDomain()` — tools + agents + catalogs |
| `@perry/capabilities` | HTTP / MCP / CLI / FS adapters |
| `@perry/marketplace` | Signed domain install |

**Intelligence**

| Package | Role |
|---|---|
| `@perry/llm` | Provider interface: Ollama + OpenAI-compat |
| `@perry/compression` | Librarian — budgeted context compression |
| `@perry/memory` | Long-term markdown vault + embeddings |
| `@perry/canon` | House catalogs injected into prompts |
| `@perry/code-intel` | Deterministic code-health gate |

**Multimodal and trust**

| Package | Role |
|---|---|
| `@perry/voice` / `@perry/vision` | STT/TTS and vision registries |
| `@perry/vault` | Encrypted secrets |

**Composition**

| Package | Role |
|---|---|
| `@perry/bootstrap` | Runtime, HTTP server, books, tasks, research, cron, board |
| `@perry/mcp-adapter` | Runtime as MCP |
| `@perry/dashboard-v2` | Operator SPA |

---

## 3. Compute fabric

Every model endpoint is a config line.

| Seat | Hardware | Job |
|---|---|---|
| Door | RTX 5070 Ti | Aux, vision, secondary lane |
| Brain | RTX 5090 | Hot path: prose, coding, covers, Comfy |
| Fleet | DGX Spark / GX10 | Resident large models |
| Shim | `perry-grok` etc. | Flat-rate subscription CLIs |

A router picks a seat by surface and effort. A per-backend circuit breaker stops one dead lane from poisoning the others. `node-limiter` caps concurrency so a DAG cannot wedge a GPU.

---

## 4. Orchestration

Four primitives, reused by books, research, and the coding council:

- **Pipeline** — sequential
- **Fanout** — N-way + reducer
- **Council** — peer consult with depth / cycle / allowlist guards
- **Job graph** — DAG, Kahn-validated, bounded workers, per-node retry, resume-by-seed

A `StepEnvelope` carries depth, delegation, and deadline so recursion cannot run away.

---

## 5. Learning (v2)

Evidence first, injection second.

1. Tickets leave ledgers (rebuilds, escalations, tool-lane misses).
2. `POST /journal/harvest` (and a daily cron) clusters those into **standing rules** with counts. Scanning nothing is fail-closed.
3. Rules are prepended onto later coding jobs; `recordLesson` stores scoped lessons.
4. Agent souls keep a Lessons-Learned section. Persona changes slowly. A lesson two agents share becomes an ability, not a second soul edit.

v3’s brief is to make step 3 a **logged session event**, so “it learned” is something you can replay.

---

## 6. Network

`NetworkClient` proxies **web egress only** through optional gluetun HTTP proxies (`PERRY_WEB_PROXY` may be a comma-separated exit list: round-robin + failover). Stealth rotates real desktop UAs. Config persists in `operator/network.json`.

Local models and `:4847` never go through the VPN. Browser sessions can stay on the home IP when a site requires it (that is a provider choice, not a leak).

Research is a **local deep-research sidecar**. If it is down, the API returns an honest error. There is no silent Tavily fallback.

---

## 7. Why v3 from this map

v2’s seams are good at *adding* capabilities. They are weak at *remembering a turn*:

- chat history, task transcripts, SSE, and browser acts are four stores
- four coding loops do not share a definition of “what the model saw”
- harvest output is a file the next loop may ignore
- `PerryRuntime` accumulated every product

v3 treats the session log as the kernel and leaves this package graph’s *products* as sidecars. See the root [README](../README.md#v3--same-perry-reliable-kernel-in-design).
