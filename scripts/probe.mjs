import process from 'node:process';
const [mode, base = 'https://aislam-live.vercel.app'] = process.argv.slice(2);
if (!['status', 'database', 'text', 'image'].includes(mode)) throw new Error('Usage: npm run probe -- status|database|text|image [https://host]');
const url = new URL(base);
if (!['localhost', '127.0.0.1', 'aislam-live.vercel.app', 'app.aislam.cc'].includes(url.hostname)
  || (url.protocol !== 'https:' && !['localhost', '127.0.0.1'].includes(url.hostname))) throw new Error('Probe host is not allowlisted.');
const token = process.env.AISLAM_OPERATOR_TOKEN;
if (mode !== 'status' && !token) throw new Error('AISLAM_OPERATOR_TOKEN is missing.');
const response = await fetch(new URL(mode === 'status' ? '/api/status' : '/api/probe', url), mode === 'status'
  ? { signal: AbortSignal.timeout(10_000), redirect: 'error' }
  : { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify({ mode }), signal: AbortSignal.timeout(55_000), redirect: 'error' });
const body = await response.json();
if (!response.ok) throw new Error(`Probe HTTP ${response.status}: ${body.error}`);
if (body.result?.data) { body.result.bytes = Buffer.from(body.result.data, 'base64').length; delete body.result.data; }
console.log(JSON.stringify(body, null, 2));
