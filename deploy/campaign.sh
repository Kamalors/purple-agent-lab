#!/bin/bash
# Campagne d'injection rapide : les 8 scenarios en mode attaque (seeds du catalogue),
# puis le verificateur independant. A lancer DANS la VM lab (10.10.10.40) :
#   scp deploy/campaign.sh lab-guest:/tmp/campaign.sh
#   ssh lab-guest "sudo bash /tmp/campaign.sh"
# NB: l'API n'est joignable que depuis le conteneur api -> on passe par
#     'docker compose exec api node' (meme methode que baseline.mjs du lab).
set -euo pipefail
cd /opt/llm-security-lab

echo ">>> Envoi des attaques (seeds) sur les 8 scenarios (cible CPU: patiente)..."
docker compose exec -T api node --input-type=module <<'JS'
const API = "http://127.0.0.1:8080", tok = process.env.LAB_HERMES_TOKEN;
const H = { Authorization: "Bearer " + tok, "Content-Type": "application/json" };
const call = async (p, b) => {
  const r = await fetch(API + p, { method: b ? "POST" : "GET", headers: H, ...(b ? { body: JSON.stringify(b) } : {}) });
  const d = await r.json();
  if (!r.ok) throw new Error(p + " " + JSON.stringify(d));
  return d;
};
for (const sc of (await call("/api/scenarios")).scenarios) {
  const s = await call("/api/sessions", { scenario: sc.id, mode: "attack" });
  let n = 0;
  for (const seed of (sc.seeds || []).slice(0, 2)) {
    try { await call("/api/sessions/" + s.id + "/messages", { message: seed }); n++; }
    catch (e) { console.log("  warn", sc.id, String(e.message).slice(0, 70)); }
  }
  console.log("  " + sc.id + " " + sc.title + ": " + n + " tentative(s)");
}
console.log(">>> Attaques envoyees.");
JS

echo ">>> Verification independante..."
docker compose --profile verify run --rm verifier >/dev/null
echo ">>> RAPPORT (reports/latest.json) :"
cat reports/latest.json
