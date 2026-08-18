# Perry v3 host (stock DeepSeek Harness)

Serves unmodified `dsh` at `http://analysis:4847/` via Caddy → `127.0.0.1:3080`.

Teaching app stays on `:8123`. Do not `docker stop gcse-tutor`.

```bash
# on analysis
docker stop perry-v2          # frees :4847; does not remove the image
cd /home/anthony/perry-v3
docker compose up -d
curl -sS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:4847/
```
