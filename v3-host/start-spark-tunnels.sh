#!/bin/bash
# Same path NVIDIA Sync uses: SSH as perry5216 + nvsync.key, local port forwards.
# Run on analysis (not inside a fork of dsh).
set -euo pipefail
KEY="${HOME}/.ssh/nvsync.key"
ssh_opts=(-fN -o BatchMode=yes -o ExitOnForwardFailure=yes -o IdentitiesOnly=yes -o ServerAliveInterval=30 -i "$KEY")

# drop stale listeners we own
for port in 11001 11002 19120; do
  pid=$(ss -lptn "sport = :$port" 2>/dev/null | sed -n 's/.*pid=\([0-9]*\).*/\1/p' | head -1 || true)
  if [ -n "${pid:-}" ]; then kill "$pid" 2>/dev/null || true; fi
done

# spark1 gx10-ca64 — Ollama + optional agent :9120
ssh "${ssh_opts[@]}" -L 127.0.0.1:11001:127.0.0.1:11434 -L 127.0.0.1:19120:127.0.0.1:9120 perry5216@192.168.1.139
# spark2 gx10-9f38 — Ollama
ssh "${ssh_opts[@]}" -L 127.0.0.1:11002:127.0.0.1:11434 perry5216@192.168.1.146

echo "tunnels: spark1 ollama :11001  spark1 agent :19120  spark2 ollama :11002"
