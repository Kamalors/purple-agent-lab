'use strict';
const $ = id => document.getElementById(id);
let token = '', scenarios = [], selected, session;
function status(text) { $('status').textContent = text; }
async function api(path, data) {
  const r = await fetch(path, { method: data ? 'POST' : 'GET', headers: { Authorization: 'Bearer ' + token, ...(data ? {'Content-Type':'application/json'} : {}) }, ...(data ? {body:JSON.stringify(data)} : {}) });
  const result = await r.json(); if (!r.ok) throw new Error(result.error || 'Erreur serveur'); return result;
}
function guarded(fn) { return async e => { e?.preventDefault(); try { await fn(); } catch (err) { status(err.message); } }; }
function renderScenarios() {
  $('scenarios').replaceChildren();
  for (const s of scenarios.filter(s => !$('person').value || s.person === $('person').value)) {
    const b = document.createElement('button'); b.className = 'card'; b.textContent = s.id + ' · ' + s.title; b.setAttribute('aria-pressed', String(selected?.id === s.id));
    const sub = document.createElement('small'); sub.textContent = 'Présentateur ' + s.person; b.append(sub);
    b.onclick = () => { selected = s; session = null; $('submit').disabled = true; $('new').disabled = false; $('scenario-id').textContent = s.id + ' · PRÉSENTATEUR ' + s.person; $('title').textContent = s.title; $('objective').textContent = s.objective; $('chat').replaceChildren(); $('session').textContent = 'Ouvrez une nouvelle conversation'; renderScenarios(); renderSeeds(); }; $('scenarios').append(b);
  }
}
function renderSeeds() {
  $('seeds').replaceChildren(); if (!selected) return;
  const prompts = $('mode').value === 'baseline' ? [selected.baseline] : selected.seeds;
  prompts.forEach((p,i) => { const b = document.createElement('button'); b.textContent = 'Préparer le message ' + (i+1); b.onclick = () => { $('message').value = p; $('message').focus(); }; $('seeds').append(b); });
}
function renderChat() {
  $('chat').replaceChildren();
  for (const t of session.turns) for (const [role,text] of [['user',t.user],['target',t.assistant || ('Essai incomplet : ' + t.status)]]) {
    const d = document.createElement('div'); d.className = 'message ' + role; const label = document.createElement('strong'); label.textContent = role === 'user' ? 'VOUS' : 'MODÈLE CIBLE'; d.append(label,document.createTextNode(text)); $('chat').append(d);
  }
  $('chat').scrollTop = $('chat').scrollHeight; $('session').textContent = session.id.slice(0,8) + ' · ' + session.turns.length + '/8 tours · ' + session.mode;
}
$('login').onsubmit = guarded(async () => { token = $('token').value.trim(); const data = await api('/api/scenarios'); scenarios = data.scenarios; $('token').value = ''; renderScenarios(); status('Connecté · cible ' + data.model + ' · programme provisoire'); });
$('person').onchange = renderScenarios;
$('mode').onchange = () => { session = null; $('submit').disabled = true; $('session').textContent = 'Ouvrez une nouvelle conversation pour ce type d’essai'; renderSeeds(); };
$('new').onclick = guarded(async () => { session = await api('/api/sessions',{scenario:selected.id,mode:$('mode').value}); renderChat(); $('submit').disabled = false; status('Conversation ouverte.'); });
$('send').onsubmit = guarded(async () => {
  if (!session) throw new Error('Ouvrez une conversation.'); const id = session.id; $('submit').disabled = true; $('new').disabled = true; status('Génération en cours sur CPU…');
  try { const result = await api('/api/sessions/' + id + '/messages',{message:$('message').value}); if (session?.id === id) { session = result; renderChat(); $('message').value = ''; } status('Réponse journalisée.'); }
  finally { $('submit').disabled = !session; $('new').disabled = !selected; }
});
$('report').onclick = guarded(async () => { const r = await api('/api/reports'); $('results').textContent = JSON.stringify(r,null,2); status('Rapport indépendant du ' + r.generated); });
$('export').onclick = guarded(async () => { const data = await api('/api/sessions'); const u = URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})); const a = document.createElement('a'); a.href = u; a.download = 'conversations-lab.json'; a.click(); setTimeout(() => URL.revokeObjectURL(u),1000); });
