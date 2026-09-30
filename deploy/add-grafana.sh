#!/bin/bash
# Lance Grafana (courbes dans le temps + alerting) sur le reseau llmlab-dash.
# Lit /history du conteneur dashboard via le datasource Infinity (provisionne).
# Publie 127.0.0.1:3000, acces anonyme (derriere tunnel SSH uniquement).
# Prerequis : /opt/llm-security-lab/grafana/{provisioning,dashboards} presents.
set -euo pipefail
cd /opt/llm-security-lab
[ -d grafana/provisioning ] && [ -d grafana/dashboards ] || { echo "grafana/ incomplet (provisioning + dashboards)"; exit 1; }
chmod -R a+rX grafana
docker network inspect llmlab-dash >/dev/null 2>&1 || \
  docker network create --opt com.docker.network.bridge.name=br-llmlab-dash llmlab-dash
docker volume create llmlab-grafana-data >/dev/null
docker rm -f llmlab-grafana 2>/dev/null || true
docker run -d --name llmlab-grafana --restart unless-stopped --network llmlab-dash \
  --cap-drop ALL --security-opt no-new-privileges:true \
  --memory 512m --cpus 1 \
  -e GF_INSTALL_PLUGINS=yesoreyeram-infinity-datasource \
  -e GF_AUTH_ANONYMOUS_ENABLED=true -e GF_AUTH_ANONYMOUS_ORG_ROLE=Admin \
  -e GF_AUTH_BASIC_ENABLED=false -e GF_USERS_DEFAULT_THEME=dark \
  -e GF_SECURITY_ALLOW_EMBEDDING=true \
  -v llmlab-grafana-data:/var/lib/grafana \
  -v /opt/llm-security-lab/grafana/provisioning:/etc/grafana/provisioning:ro \
  -v /opt/llm-security-lab/grafana/dashboards:/etc/dashboards:ro \
  -p 127.0.0.1:3000:3000 \
  grafana/grafana-oss:11.2.0
docker ps --filter name=llmlab-grafana --format '{{.Names}}: {{.Status}}'
echo "OK (1er demarrage : telechargement du plugin Infinity, ~30-60 s)."
echo "Tunnel : ssh -L 3000:127.0.0.1:3000 lab-guest  puis http://localhost:3000"
