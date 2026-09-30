#!/bin/bash
# Lance (ou relance) le conteneur dashboard LIVE dans la VM du lab.
# Lit reports/ en lecture seule, sert le dashboard sur 127.0.0.1:8090.
# Reseau : bridge Docker par defaut (docker0), NON bloque par firewall.sh
#          -> visible via tunnel, isolation cible/attaquant preservee.
# Prerequis : /opt/llm-security-lab/dashboard/{server.mjs,dashboard.html} presents.
set -euo pipefail
cd /opt/llm-security-lab
IMG='node@sha256:5cbc7caba8c2c0f0bca675d1b61b9f2857e1cf1853c6164ee9dd409501a936e7'
[ -f dashboard/server.mjs ] && [ -f dashboard/dashboard.html ] || { echo "Fichiers manquants dans dashboard/ (server.mjs + dashboard.html)"; exit 1; }
chmod -R a+rX dashboard
# reseau dedie (non bloque par firewall.sh : seul br-llmlab-front/tgt le sont)
docker network inspect llmlab-dash >/dev/null 2>&1 || \
  docker network create --opt com.docker.network.bridge.name=br-llmlab-dash llmlab-dash
docker rm -f llmlab-dashboard 2>/dev/null || true
docker run -d --name llmlab-dashboard --restart unless-stopped --network llmlab-dash \
  --cap-drop ALL --security-opt no-new-privileges:true --read-only \
  --user 1000:1000 --pids-limit 64 --memory 128m --cpus 0.5 \
  --tmpfs /tmp:size=8m,uid=1000,gid=1000 \
  -v /opt/llm-security-lab/reports:/reports:ro \
  -v /opt/llm-security-lab/dashboard:/srv:ro \
  -p 127.0.0.1:8090:8090 \
  "$IMG" node /srv/server.mjs
docker ps --filter name=llmlab-dashboard --format '{{.Names}}: {{.Status}}'
echo "OK. Tunnel : ssh -L 8090:127.0.0.1:8090 lab-guest  puis http://localhost:8090"
