import http from 'node:http';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readFileSync, writeFileSync, renameSync, mkdirSync, readdirSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { scenarios, publicScenarios, systemPrompt } from './scenarios.mjs';

const here = fileURLToPath(new URL('.', import.meta.url));
const error = (status, message) => Object.assign(new Error(message), { status });
function exactObject(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).some(k => !keys.includes(k))) throw error(400, 'Champs de requête invalides.');
}
function matches(value, expected) {
  const a = Buffer.from(value), b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
async function body(req) {
  if (!/^application\/json(?:;|$)/i.test(req.headers['content-type'] || '')) throw error(415, 'JSON requis.');
  const chunks = []; let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 20000) throw error(413, 'Requête trop longue.');
    chunks.push(chunk);
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); } catch { throw error(400, 'JSON invalide.'); }
}

export function createLab({ dataDir = process.env.DATA_DIR || './data', reportDir = process.env.REPORT_DIR || './reports', humanToken = process.env.LAB_HUMAN_TOKEN, hermesToken = process.env.LAB_HERMES_TOKEN, ollama = process.env.OLLAMA_URL || 'http://ollama-target:11434', model = process.env.TARGET_MODEL || 'qwen2.5:1.5b', timeout = 180000 } = {}) {
  if (!humanToken || !hermesToken || humanToken.length < 32 || hermesToken.length < 32 || humanToken === hermesToken) throw new Error('Two distinct access tokens of at least 32 characters are required.');
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const sessions = new Map();
  for (const name of readdirSync(dataDir).filter(n => /^[a-f0-9]{32}\.json$/.test(n))) {
    const s = JSON.parse(readFileSync(join(dataDir, name), 'utf8'));
    // An interrupted generation is evidence of an incomplete attempt, never a success.
    if (s.turns.at(-1)?.status === 'pending') { s.turns.at(-1).status = 'error'; s.turns.at(-1).error = 'server_restart'; }
    sessions.set(s.id, s);
  }
  const persist = s => {
    const path = join(dataDir, s.id + '.json');
    writeFileSync(path + '.tmp', JSON.stringify(s, null, 2), { mode: 0o600 });
    renameSync(path + '.tmp', path);
  };
  for (const s of sessions.values()) persist(s);
  const view = s => ({ id: s.id, scenario: s.scenario, person: s.person, source: s.owner, mode: s.mode, created: s.created, model: s.model, turns: s.turns });
  // ponytail: one generation at a time bounds CPU/RAM on this demonstration VM.
  let busy = false;
  const server = http.createServer(async (req, res) => {
    const send = (code, data, type = 'application/json; charset=utf-8') => {
      res.writeHead(code, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'" });
      res.end(type.startsWith('application/json') ? JSON.stringify(data) : data);
    };
    try {
      const path = new URL(req.url, 'http://localhost').pathname;
      if (req.method === 'GET' && ['/','/app.js','/style.css'].includes(path)) {
        const name = path === '/' ? 'index.html' : path.slice(1);
        return send(200, readFileSync(join(here, 'public', name)), name.endsWith('.html') ? 'text/html; charset=utf-8' : name.endsWith('.js') ? 'text/javascript; charset=utf-8' : 'text/css; charset=utf-8');
      }
      if (path === '/healthz' && req.method === 'GET') return send(200, { status: 'ok' });
      const token = (req.headers.authorization || '').replace(/^Bearer /, '');
      const owner = matches(token, humanToken) ? 'human' : matches(token, hermesToken) ? 'hermes' : null;
      if (!owner) throw error(401, 'Jeton d’accès requis.');
      if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}`) throw error(403, 'Origine refusée.');
      if (req.method === 'GET' && path === '/api/scenarios') return send(200, { provisional: true, model, scenarios: publicScenarios() });
      if (req.method === 'GET' && path === '/api/sessions') return send(200, [...sessions.values()].filter(s => s.owner === owner).map(view));
      if (req.method === 'GET' && path === '/api/reports') {
        if (owner !== 'human') throw error(403, 'Rapport réservé aux présentateurs.');
        try { return send(200, JSON.parse(readFileSync(join(reportDir, 'latest.json'), 'utf8'))); }
        catch (e) { if (e.code === 'ENOENT') throw error(404, 'Aucun rapport indépendant généré.'); throw e; }
      }
      if (req.method === 'POST' && path === '/api/sessions') {
        const input = await body(req); exactObject(input, ['scenario', 'mode']);
        const scenario = scenarios.find(s => s.id === input.scenario);
        if (!scenario || !['baseline','attack'].includes(input.mode)) throw error(400, 'Scénario ou mode invalide.');
        if (owner === 'hermes' && input.mode !== 'attack') throw error(403, 'Hermes est limité aux essais d’attaque.');
        if (sessions.size >= 500 || [...sessions.values()].filter(s => s.owner === owner).length >= 250) throw error(429, 'Limite de sessions atteinte.');
        const secret = 'LAB_' + randomBytes(16).toString('hex');
        const s = { schema: 1, id: randomBytes(16).toString('hex'), scenario: scenario.id, rule: scenario.rule, person: scenario.person, owner, mode: input.mode, created: new Date().toISOString(), model, secret, system: systemPrompt(scenario, secret), turns: [] };
        persist(s); sessions.set(s.id, s); return send(201, view(s));
      }
      const route = path.match(/^\/api\/sessions\/([a-f0-9]{32})(\/messages)?$/);
      if (!route) throw error(404, 'Route inconnue.');
      const s = sessions.get(route[1]);
      if (!s || s.owner !== owner) throw error(404, 'Session inconnue.');
      if (req.method === 'GET' && !route[2]) return send(200, view(s));
      if (req.method !== 'POST' || !route[2]) throw error(405, 'Méthode refusée.');
      const input = await body(req); exactObject(input, ['message']);
      if (typeof input.message !== 'string' || !input.message.trim() || input.message.length > 4000) throw error(400, 'Message requis, de 1 à 4000 caractères.');
      if (s.turns.length >= 8 || s.turns.reduce((n,t) => n + t.user.length + (t.assistant || '').length, 0) + input.message.length > 9000) throw error(409, 'Budget conversationnel atteint ; créez une nouvelle session.');
      if (busy) throw error(429, 'Une génération est déjà en cours ; réessayez après sa fin.');
      busy = true;
      const turn = { index: s.turns.length + 1, at: new Date().toISOString(), user: input.message, status: 'pending' };
      try {
        const history = s.turns.filter(t => t.status === 'complete').flatMap(t => [{ role: 'user', content: t.user }, { role: 'assistant', content: t.assistant }]);
        s.turns.push(turn); persist(s);
        const start = performance.now();
        const response = await fetch(`${ollama}/api/chat`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(timeout), body: JSON.stringify({ model, messages: [{ role: 'system', content: s.system }, ...history, { role: 'user', content: input.message }], stream: false, keep_alive: '2m', options: { num_ctx: 4096, num_predict: 256, num_thread: 2, temperature: 0, seed: 42 } }) });
        if (!response.ok) throw new Error('ollama_' + response.status);
        const result = await response.json();
        if (result.done !== true || typeof result.message?.content !== 'string' || result.message.content.length > 20000) throw new Error('invalid_model_response');
        Object.assign(turn, { status: 'complete', assistant: result.message.content, duration_ms: Math.round(performance.now() - start), prompt_tokens: result.prompt_eval_count ?? null, output_tokens: result.eval_count ?? null, finish_reason: result.done_reason ?? null });
        persist(s); send(200, view(s));
      } catch (e) {
        turn.status = 'error'; turn.error = e.name === 'TimeoutError' ? 'timeout' : 'generation_failed'; persist(s);
        console.error(JSON.stringify({ event: 'generation_error', session: s.id, type: turn.error }));
        throw error(502, 'Génération interrompue. L’essai reste journalisé comme incomplet.');
      } finally { busy = false; }
    } catch (e) {
      if (!res.headersSent) send(e.status || 500, { error: e.status ? e.message : 'Erreur interne.' });
      else res.end();
    }
  });
  server.requestTimeout = 20000;
  server.headersTimeout = 10000;
  server.maxConnections = 32;
  return server;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  createLab().listen(Number(process.env.PORT || 8080), process.env.BIND || '127.0.0.1', () => console.log('LLM lab API ready'));
}
