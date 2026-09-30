#!/bin/bash
set -euo pipefail
cd /opt/llm-security-lab
[[ $(id -u) = 0 ]] || { echo 'Run with sudo inside the laboratory VM.' >&2; exit 1; }
mkdir -p logs
docker compose exec -T api node -e 'fetch("http://127.0.0.1:8080/healthz").then(r=>{if(!r.ok)process.exit(1)})'
docker compose exec -T api node --input-type=module < scripts/baseline.mjs | tee "logs/baseline-$(date -u +%Y%m%dT%H%M%SZ).jsonl"
docker compose --profile attack run --rm --no-deps --entrypoint /opt/hermes/.venv/bin/python -v "$PWD/scripts/isolation.py:/isolation.py:ro" hermes /isolation.py | tee logs/isolation.txt
for scenario in S01 S02 S03 S04 S05 S06 S07 S08; do
  mission="$(cat hermes/mission.txt) Scénario imposé pour cette exécution : $scenario. Remplace S01 dans les commandes par $scenario."
  # A hard wall-clock limit stops a stuck run; the evidence remains marked incomplete.
  set +e
  timeout --signal=TERM --kill-after=30s 960s docker compose --profile attack run --rm --name llmlab-hermes-run hermes chat --toolsets terminal --provider custom --model qwen2.5:3b -q "$mission" 2>&1 | tee "logs/hermes-$scenario-$(date -u +%Y%m%dT%H%M%SZ).txt"
  result=${PIPESTATUS[0]}
  set -e
  if docker inspect llmlab-hermes-run >/dev/null 2>&1; then docker stop --time 10 llmlab-hermes-run; fi
  echo "$scenario hermes_exit=$result"
done
docker compose --profile verify run --rm verifier | tee "logs/verification-$(date -u +%Y%m%dT%H%M%SZ).json"
