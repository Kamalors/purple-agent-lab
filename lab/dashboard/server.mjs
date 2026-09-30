// Serveur du conteneur dashboard : sert le dashboard + le dernier rapport en live.
// Lecture seule : monte /reports (sortie du vérificateur) et /srv (dashboard.html).
// Aucun accès aux réseaux cible/attaquant, aucun jeton. Port 8090.
import http from "node:http";
import { readFileSync, readdirSync } from "node:fs";

const PORT = 8090;
const HEAD = Buffer.from('<!doctype html><meta charset="utf-8">');
const page = () => { try { return Buffer.concat([HEAD, readFileSync("/srv/dashboard.html")]); }
  catch { return Buffer.concat([HEAD, Buffer.from("dashboard.html manquant dans /srv")]); } };
const report = () => { try { return readFileSync("/reports/latest.json"); }
  catch { return Buffer.from('{"results":[],"totals":{"compromised":0,"held":0,"incomplete":0}}'); } };

// Series temporelle pour Grafana : un point par rapport (reports/<stamp>.json).
const history = () => {
  let rows = [];
  try {
    rows = readdirSync("/reports").filter(n => /\.json$/.test(n) && n !== "latest.json").map(n => {
      try {
        const r = JSON.parse(readFileSync("/reports/" + n));
        const res = Array.isArray(r.results) ? r.results : [];
        const att = res.filter(s => s.mode === "attack");
        return {
          time: r.generated,
          compromised: res.filter(s => s.verdict === "compromised").length,
          held: res.filter(s => s.verdict === "held").length,
          incomplete: res.filter(s => s.verdict === "incomplete").length,
          attacks: att.length,
          attacks_compromised: att.filter(s => s.verdict === "compromised").length
        };
      } catch { return null; }
    }).filter(Boolean).sort((a, b) => String(a.time).localeCompare(String(b.time)));
  } catch { rows = []; }
  return Buffer.from(JSON.stringify(rows));
};

http.createServer((req, res) => {
  const p = (req.url || "/").split("?")[0];
  const h = { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Access-Control-Allow-Origin": "*" };
  if (p === "/healthz") { res.writeHead(200, { ...h, "Content-Type": "application/json" }); return res.end('{"status":"ok"}'); }
  if (p === "/report") { res.writeHead(200, { ...h, "Content-Type": "application/json" }); return res.end(report()); }
  if (p === "/history") { res.writeHead(200, { ...h, "Content-Type": "application/json" }); return res.end(history()); }
  res.writeHead(200, { ...h, "Content-Type": "text/html; charset=utf-8" }); res.end(page());
}).listen(PORT, "0.0.0.0", () => console.log("dashboard live sur :" + PORT));
