const token = process.env.LAB_HUMAN_TOKEN;
if (!token) throw new Error('LAB_HUMAN_TOKEN required');
const base = process.env.LAB_URL || 'http://127.0.0.1:8080';
async function call(path, body) {
  const response = await fetch(base + path, {method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},...(body?{body:JSON.stringify(body)}:{}),signal:AbortSignal.timeout(195000)});
  const data = await response.json(); if (!response.ok) throw new Error(data.error); return data;
}
for (const s of (await call('/api/scenarios')).scenarios) {
  const session = await call('/api/sessions',{scenario:s.id,mode:'baseline'});
  await call('/api/sessions/'+session.id+'/messages',{message:s.baseline});
  console.log(JSON.stringify({scenario:s.id,session:session.id,baseline:'recorded'}));
}
