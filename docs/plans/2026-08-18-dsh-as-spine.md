# DeepSeek Harness as Perry v3 spine

> **For agentic workers:** Implement task-by-task. Do not edit files under the harness checkout or `node_modules/@deepseek-ai/**`. If a change seems to require a harness patch, stop and add a Perry plugin or a profile overlay instead.

**Goal:** Run Perry v3 on an *unmodified* DeepSeek Harness (`dsh`) so a newer harness is a version bump plus our tests, not a merge. Lean into plugins. Do not keep the v2 fleet alive.

**Architecture:** `dsh` is the process (session log, agent loop, plugin loader). Perry is **only** `@perry/*` plugins + profiles stacked on `dsh-base`. The teaching app is the **only** live v2 product (`https://teach.5216perry.uk`, kids on it now). It **will** become `perry-tutor` (a plugin + the same student UI), but **not** by taking the live URL down. Dual-run until parity, then flip the tunnel. Dashboard `:4847` and the rest of the fleet are not live requirements.

**Tech stack:** Node ≥ 22, pnpm, `@deepseek-ai/dsh` (exact pin), TypeScript ESM. Tutor stays its own Docker/cloudflared stack. GPUs stay endpoints the fleet plugin talks to.

## Live freeze (teaching app — kids)

`teach.5216perry.uk` stays the production URL until a written cutover. Kids keep hitting `gcse-tutor` on `:8123` the whole time.

| Now | Later (only after parity) |
|---|---|
| Compose `/home/anthony/TUTOR-2ND-PC`, container `gcse-tutor` | Same hostname, tunnel pointed at the plugin-backed process |
| DB `tutor.db` is canonical | Plugin uses that DB (or a replica) — no fresh empty SQLite |
| LLM path in `tutor-fix` / `TUTOR-2ND-PC` unchanged | Optional: tutor calls `perry-llm-fleet` instead of its own `llm.js` |

**Cutover rule:** dual-run. `gcse-tutor` stays on the public host. `perry-tutor` boots on another port, we dogfood (and one kid session on a staging host if needed), compare session + skill_state, then flip cloudflared. Instant rollback = point the tunnel back at `:8123`.

Do not “rewrite tutor inside Cordis” as the first plugin. First plugin is a **wrapper**: register tools / LLM seat, leave `server.js` + `db.js` + the student SPA as the product. Rebuild the lesson engine only if the wrapper is boring and the kids never noticed a blip.

## Global constraints

- **Harness is read-only.** No forks, no `vendor/` edits, no patches to `agent-loop`, Cordis, or `dsh-base` source. Overlay only.
- **Swap path must stay one command:** bump the pinned version → install → `dsh --dump-config` → `perry-minimal` evals → fix *our* plugins if their public events/APIs moved.
- **Do not override v1** (`perry-system`) or force-push private `Perry-v2`.
- **Kids first.** Do not take down or schema-break `teach.5216perry.uk` while rebuilding. Tutor *may* become a plugin; production does not move until dual-run parity.
- **Plugin-first:** new capability = a Cordis plugin. No second `PerryRuntime`.
- **Fail-closed** on outward tools.
- **Linux `analysis` is the studio host.** This Windows box stays GPU + MCP lab providers.
- **No runtime self-modification of the kernel** on the lab box.

---

## How the swap works (lock this first)

```
perry-v3/                      our repo (new tree or app/perry-v3/)
  package.json                 "@deepseek-ai/dsh": "0.1.0-rc.7"   ← exact pin
  profiles/
    perry-minimal/
    perry-headless/
    perry-studio/
    perry-lab/
  packages/                    ONLY @perry/* plugins
    perry-llm-fleet/
    perry-router/
    perry-approval/
    perry-net/
    perry-research/
    perry-browser/
    perry-learn/
  sidecars/                    docs + compose overlays that already exist in v2
  scripts/upgrade-dsh.mjs      bump + smoke
```

Upgrade playbook (this is the whole point):

```bash
# 1. See what they published
npm view @deepseek-ai/dsh version

# 2. Pin the new version — do not edit their source
pnpm add @deepseek-ai/dsh@<new> -w

# 3. Confirm we still only overlay
pnpm dsh --profile perry-minimal --dump-config > /tmp/dsh-config.yml

# 4. Honest eval (costume off)
pnpm perry-eval minimal

# 5. Studio smoke (VPN/research/browser still sidecars)
pnpm perry-eval studio-smoke
```

If dump-config or evals fail, the fix is in `packages/perry-*` or `profiles/*/cordis.patch.yml`. Never in `node_modules/@deepseek-ai`.

**Do not** git-submodule the harness and commit local diffs. A submodule you patch is a fork. npm (or a **clean** submodule with zero local commits) is the swap.

---

## File map

| Path | Owns |
|---|---|
| `app/perry-v3/package.json` | Exact `dsh` pin, `perry` CLI wrapper |
| `app/perry-v3/profiles/*/cordis.patch.yml` | Overlay rows; never copies `dsh-base` |
| `app/perry-v3/packages/perry-llm-fleet` | Door / Brain / Spark / grok as `ctx.llm` adapters |
| `app/perry-v3/packages/perry-router` | `agent/request` waterfall → seat pick |
| `app/perry-v3/packages/perry-approval` | `tools/pre-execute` park |
| `app/perry-v3/packages/perry-net` | Wraps existing `NetworkClient` / gluetun |
| `app/perry-v3/packages/perry-research` | Tools that call LDR sidecar |
| `app/perry-v3/packages/perry-browser` | Tools that call `:3848` |
| `app/perry-v3/packages/perry-learn` | Harvest inject on `agent/pre-step` |
| `app/perry-v3/scripts/upgrade-dsh.mjs` | Version bump + dump-config + eval gate |
| v2 `compose.v2.yaml` | Sidecars stay; do not move into Cordis |

Canonical workdir on Linux: `/home/anthony/perry-migrate/perry-v2-private/app/perry-v3` (new sibling of `app/perry`, not a rewrite of v2).

---

### Task 1: Pin unmodified `dsh` next to v2

**Files:**
- Create: `app/perry-v3/package.json`
- Create: `app/perry-v3/.npmrc` (`ignore-scripts=false`, no hoist of `@deepseek-ai/*` into a place we edit)
- Create: `app/perry-v3/README.md` (one page: pin, profiles, “do not edit dsh”)
- Test: `app/perry-v3/scripts/check-dsh-clean.mjs`

**Interfaces:**
- Produces: `pnpm dsh` binary from the pinned package; `DSH_VERSION` written to `app/perry-v3/dsh.lock.json` `{ "name": "@deepseek-ai/dsh", "version": "<exact>" }`

- [ ] Create `app/perry-v3` on `analysis` (empty package, private, type module).
- [ ] `pnpm add @deepseek-ai/dsh@<current> -w` and commit **only** `package.json` + lockfile + `dsh.lock.json`.
- [ ] Add `scripts/check-dsh-clean.mjs`: fail CI if any file under `node_modules/@deepseek-ai/**` is dirty vs the published tarball (hash compare) or if a `patches/` for dsh exists.
- [ ] Run: `node scripts/check-dsh-clean.mjs` → pass.
- [ ] Run: `pnpm exec dsh --help` → their CLI, not ours.
- [ ] Commit: `chore(v3): pin unmodified @deepseek-ai/dsh`.

---

### Task 2: Wrapper CLI that only selects a Perry profile

**Files:**
- Create: `app/perry-v3/bin/perry.mjs`
- Create: `app/perry-v3/profiles/perry-minimal/cordis.patch.yml` (empty overlay first)

**Interfaces:**
- Produces: `perry --profile perry-minimal` → `dsh --profile <resolved> --patch profiles/perry-minimal/cordis.patch.yml`
- Consumes: `dsh` from Task 1

- [ ] `bin/perry.mjs` resolves profile dir, execs `dsh` with their flags plus `--patch` pointing at **our** yaml. No copy of their loop.
- [ ] `perry --profile perry-minimal --dump-config` prints a tree that still includes `dsh-base` rows (model adapter, session, tools) and **zero** `@perry/*` yet.
- [ ] Commit: `feat(v3): perry CLI is a profile wrapper around stock dsh`.

---

### Task 3: `perry-minimal` boots stock harness

**Files:**
- Modify: `profiles/perry-minimal/cordis.patch.yml` only if we must *disable* a default we do not want (whole-row replace, their rule). Prefer leaving defaults.
- Test: `scripts/smoke-minimal.sh`

- [ ] `perry --profile perry-minimal` starts (headless one-shot `"ping"`) against Spark or a stub LLM **via their adapter config**, not a forked provider.
- [ ] Session log is **theirs**. Do not wrap or replace `ctx.sessions`.
- [ ] Smoke: process exits 0; a session jsonl exists in the harness home.
- [ ] Commit: `test(v3): stock dsh boots under perry-minimal`.

This is the swap canary. If a new dsh cannot do Task 3, we do not upgrade.

---

### Task 4: First overlay plugin — `perry-approval`

**Files:**
- Create: `packages/perry-approval/src/index.ts` (Cordis plugin: `name`, `apply(ctx)`)
- Modify: `profiles/perry-headless/cordis.patch.yml` to **insert** a row (not edit `dsh-base` files)

**Interfaces:**
- Consumes: `ctx.on('tools/pre-execute', ...)` as documented by dsh
- Produces: `{ kind: 'deny' }` for outward tool names until v2 `/tasks` approve exists

- [ ] Plugin lives in `@perry/dsh-approval`. It only listens. It does not import harness internals.
- [ ] Mount only from our patch yaml `id: perry-approval`.
- [ ] Test: a dummy outward tool is denied; a `read` tool still calls `next()`.
- [ ] Commit: `feat(v3): approval overlay; harness untouched`.

If `tools/pre-execute` is renamed upstream, this package is what we fix on swap — one file.

---

### Task 5: Fleet seats as *their* LLM adapter API

**Files:**
- Create: `packages/perry-llm-fleet/src/index.ts`
- Create: `packages/perry-router/src/index.ts`

**Interfaces:**
- Consumes: `ctx.llm` `registerAdapter` (public)
- Produces: adapters `door`, `brain`, `spark`, `grok` pointing at existing v2 endpoints (`ollama-gpu1`, 5090, Spark, `perry-grok:8088`)
- Router: `agent/request` waterfall picks a seat; no CUDA UUIDs in the plugin

- [ ] Adapters are thin: URL + model name from config. Config is our `cordis.patch.yml`.
- [ ] `perry-minimal` can pin one adapter to prove swap isolation.
- [ ] Commit: `feat(v3): fleet adapters overlay dsh llm seam`.

---

### Task 6: Sidecar plugins (net, research, browser, learn)

Each is the same shape as Task 4: **HTTP/client to existing v2 sidecar**, log via session events if dsh lets a plugin append; otherwise `agent.inject()` so the model-visible path stays *their* log.

| Plugin | Calls | Must not |
|---|---|---|
| `perry-net` | v2 `NetworkClient` / `GET/POST /net` | reimplement gluetun |
| `perry-research` | LDR `runLocalDeepResearchBridge` | add a web fallback |
| `perry-browser` | `http://perry-browser:3848` | fork Playwright |
| `perry-learn` | harvest `guidance.json` + `agent/pre-step` inject | cluster inside the live loop |

- [ ] One plugin per PR. Each has a test that mocks the sidecar, not dsh internals.
- [ ] `perry-learn` off on `perry-minimal`.
- [ ] Commit per plugin.

---

### Task 7: Keep kids on `gcse-tutor`; plugin is dual-run later

**Files:** none in dsh for Plan A. Later: `packages/perry-tutor` wraps existing `server.js` / `db.js`, does not replace them on day one.

- [ ] Confirm `https://teach.5216perry.uk` still up after any analysis reboots. That URL does not change in Plan A–B.
- [ ] Do not bind v3 boot to `compose.v2.yaml` perry-v2 (dashboard) being healthy.
- [ ] Books, dashboard, harvest, board are rebuild-as-plugin if we want them — not live gates.
- [ ] `perry-tutor` is an explicit later task: wrap the live app, share `tutor.db`, listen on a side port, flip cloudflared only after parity. Rollback = tunnel back to `:8123`.

---

### Task 8: Upgrade script (the swap)

**Files:**
- Create: `scripts/upgrade-dsh.mjs`

```js
// usage: node scripts/upgrade-dsh.mjs 0.1.0-rc.8
// 1. pnpm add @deepseek-ai/dsh@$ver -w
// 2. write dsh.lock.json
// 3. check-dsh-clean
// 4. perry --profile perry-minimal --dump-config
// 5. smoke-minimal
// exit non-zero on any fail; leave lockfile dirty so the human can revert
```

- [ ] Document revert: `git checkout package.json pnpm-lock.yaml dsh.lock.json && pnpm install`.
- [ ] Commit: `chore(v3): upgrade-dsh does not patch upstream`.

---

## What we refuse

- `patch-package` / `pnpm patch` on `@deepseek-ai/*`
- Copying `dsh` into `vendor/` and “just changing one file”
- Replacing `ctx.sessions` or `agent-loop`
- Tracking upstream with a dirty submodule
- Letting the agent `self-modification` mount kernel plugins on the lab profile

If upstream is missing a seam we need, we: (1) file it against dsh, (2) keep a **Perry-side** workaround plugin, (3) drop the workaround when we bump. We do not carry a private harness fork.

---

## Done when

1. `perry --profile perry-minimal` runs **stock** dsh.
2. `check-dsh-clean` is green.
3. Approval + one fleet adapter + one sidecar plugin work as overlays.
4. `upgrade-dsh.mjs` can move pin → smoke without a source merge.
5. `teach.5216perry.uk` still up. v2 fleet is not a live gate.
6. `perry-system` and private `Perry-v2` git history unchanged.

---

## Suggested first week

| Day | Outcome |
|---|---|
| 1 | Task 1–2: pin + wrapper |
| 2 | Task 3: minimal boot on Spark or stub |
| 3 | Task 4: approval overlay |
| 4 | Task 5: one seat (Spark) then Door/Brain |
| 5 | Task 8: upgrade script dry-run against current version (no-op bump) |

Net/research/browser/learn after the canary is real, and only if we still want those capabilities — as plugins, not as a reason to keep v2 up.

Tutor stays the one live app. It becomes a plugin only via dual-run + tunnel flip, after the spine canary is real. Kids never sit on an unproven port.
