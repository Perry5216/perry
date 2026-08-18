# Versions

A hiring-manager summary of what changed and why. Details in the [README](../README.md) and [ARCHITECTURE.md](ARCHITECTURE.md).

## v1 — `perry-system` (public, kept)

**Question:** Can I run a multi-agent platform on my own hardware?

**Shipped:** Express coordinator, SQLite task pool, MCP worker fleet (subscription CLIs), event-driven skills, Ollama + Comfy + LoRA, VPN scouting, novel-writing domain, React dashboard.

**Learned:** The platform idea was right. One coordinator + one database does not stay the source of truth. Learning that is not forced into the next model call is optional. Cost-model (subscriptions) leaked into architecture.

**Repo:** https://github.com/Perry5216/perry-system  
That repository is **not** overwritten by v2. The public v2 map is https://github.com/Perry5216/perry .

## v2 — this repo (public map of the private runtime)

**Question:** Can I rebuild it as a fleet with seams?

**Shipped:** 18-package TypeScript monorepo, `PerryRuntime`, DAG/council/pipeline, node-aware GPUs (5070 / 5090 / Spark), fail-closed gates, book swarm + eyes, coding council, local deep research, gluetun web egress, Cursor-style browser, journal harvest.

**Learned:** Seams scale features. They do not give you one answer to “what did the agent see?” Multiple loops and multiple logs make the system feel powerful and unreliable at the same time. The composition root became the new god object.

## v3 — in design

**Question:** Can the same products sit on a kernel I can replay?

**Plan:** Vendored agent harness as the session + loop kernel. Perry as a bundle of plugins (fleet router, approval, net, research, browser, learn). v2 products stay sidecars. Learning injects through the log. A `minimal` profile exists so evals are honest.

**Not a plan:** Deleting v1. Porting the book engine into a plugin. Publishing the private lab tree.
