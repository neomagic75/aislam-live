import test from 'node:test';
import assert from 'node:assert/strict';
import { createProbeHandler } from '../api/probe.js';
import status from '../api/status.js';
import { generate } from '../server/gemini.js';
import { probeDatabase } from '../server/database.js';
import { fetchJson } from '../server/http.js';

const token = 'test-operator-token-long-enough-for-checks';
const env = { AISLAM_OPERATOR_TOKEN: token, GEMINI_API_KEY: 'server-only-secret', SUPABASE_URL: 'https://qmrzujmwkiwlgfpxqikl.supabase.co', SUPABASE_SERVICE_KEY: 'server-database-secret' };
function response() {
  return { headers: {}, statusCode: 0, body: null, setHeader(key, value) { this.headers[key] = value; }, end(value) { this.body = JSON.parse(value); } };
}
function request(body = { mode: 'text' }, authorization = `Bearer ${token}`) {
  return { method: 'POST', headers: { 'content-type': 'application/json', authorization }, body };
}

test('missing, wrong, and absent configured operator token never call services', async () => {
  let calls = 0;
  for (const [configured, authorization, code] of [[env, undefined, 401], [env, 'Bearer wrong', 401], [{}, `Bearer ${token}`, 503]]) {
    const handler = createProbeHandler({ env: configured, database: async () => { calls++; }, generation: async () => { calls++; } });
    const req = request(); req.headers.authorization = authorization;
    const res = response(); await handler(req, res);
    assert.equal(res.statusCode, code);
  }
  assert.equal(calls, 0);
});

test('method, content type, malformed, oversized, and custom prompt/model payloads fail before services', async () => {
  let calls = 0;
  const handler = createProbeHandler({ env, database: async () => { calls++; }, generation: async () => { calls++; } });
  const cases = [
    [{ ...request(), method: 'GET' }, 405],
    [{ ...request(), headers: { authorization: `Bearer ${token}`, 'content-type': 'text/plain' } }, 415],
    [request('{broken'), 400], [request(' '.repeat(300)), 413],
    [request({ mode: 'image', prompt: 'user-selected' }), 400],
    [request({ mode: 'text', model: 'override' }), 400],
    [request({ mode: 'unknown' }), 400], [request([]), 400], [request(null), 400],
    [{ ...request(), headers: { ...request().headers, 'content-length': '999' } }, 413],
  ];
  for (const [req, code] of cases) { const res = response(); await handler(req, res); assert.equal(res.statusCode, code); }
  assert.equal(calls, 0);
});

test('authorized explicit actions invoke one selected service; credentials do not appear in error', async () => {
  let calls = 0;
  const handler = createProbeHandler({ env, generation: async (mode, prompt) => { calls++; assert.equal(mode, 'text'); assert.match(prompt, /technische Verbindung/); return { text: 'Bereit.' }; } });
  const res = response(); await handler(request(), res);
  assert.equal(res.statusCode, 200); assert.equal(calls, 1); assert.equal(res.body.result.text, 'Bereit.');
  const failure = createProbeHandler({ env, generation: async () => { throw new Error(env.GEMINI_API_KEY); } });
  const failed = response(); await failure(request(), failed);
  assert.equal(failed.statusCode, 502); assert.ok(!JSON.stringify(failed.body).includes(env.GEMINI_API_KEY));
});

test('Gemini text and image use fixed server model, bounded options, a single provider request and no key in URL', async () => {
  for (const mode of ['text', 'image']) {
    let calls = 0;
    const result = await generate(mode, 'Benign test', env, { fetcher: async (url, init) => {
      calls++; assert.ok(!url.includes(env.GEMINI_API_KEY)); assert.equal(init.headers['x-goog-api-key'], env.GEMINI_API_KEY);
      assert.match(url, new RegExp(mode === 'text' ? 'gemini-3.8-flash:' : 'gemini-3.1-flash-lite-image:'));
      assert.ok(init.signal instanceof AbortSignal);
      const body = JSON.parse(init.body); assert.equal(body.contents[0].parts[0].text, 'Benign test');
      return Response.json({ candidates: [{ content: { parts: mode === 'text' ? [{ text: 'Bereit.' }] : [{ inlineData: { mimeType: 'image/png', data: 'cG5n' } }] } }] });
    } });
    assert.equal(calls, 1); assert.equal(mode === 'text' ? result.text : result.mimeType, mode === 'text' ? 'Bereit.' : 'image/png');
  }
});

test('provider failures and invalid outputs are visible without automatic retry', async () => {
  let calls = 0;
  await assert.rejects(generate('text', 'test', env, { fetcher: async () => { calls++; return new Response('secret-provider-debug', { status: 429 }); } }), /HTTP 429/);
  assert.equal(calls, 1);
  await assert.rejects(generate('image', 'test', env, { fetcher: async () => Response.json({ candidates: [{ content: { parts: [{ text: 'no image' }] } }] }) }), /kein einzelnes/);
  await assert.rejects(generate('text', 'x'.repeat(2001), env), /Ungültige/);
});

test('deadline aborts stalled fetch and does not retry', async () => {
  let calls = 0;
  // Keep the test process alive: AbortSignal.timeout intentionally uses an unref timer.
  const keepAlive = setTimeout(() => {}, 1000);
  try {
    await assert.rejects(fetchJson('https://test.invalid', {}, { timeoutMs: 10, fetcher: async (_, { signal }) => {
      calls++;
      return new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason), { once: true }));
    } }), /Zeitlimit/);
  } finally { clearTimeout(keepAlive); }
  assert.equal(calls, 1);
});

test('oversized streamed service response is rejected', async () => {
  await assert.rejects(fetchJson('https://test.invalid', {}, { maxBytes: 10, fetcher: async () => new Response('x'.repeat(11)) }), /zu groß/);
});

test('database saves, reads and deletes only its random probe and verifies deletion', async () => {
  const calls = []; let row;
  const result = await probeDatabase(env, { fetcher: async (url, init) => {
    calls.push({ url, method: init.method }); assert.equal(init.headers.apikey, env.SUPABASE_SERVICE_KEY);
    if (init.method === 'POST') { row = JSON.parse(init.body); assert.match(row.id, /^[a-f0-9-]{36}$/); return Response.json([row]); }
    assert.ok(url.includes(`id=eq.${row.id}`));
    if (init.method === 'DELETE') return Response.json([row]);
    return Response.json(calls.length === 4 ? [] : [row]);
  } });
  assert.deepEqual(calls.map(call => call.method), ['POST', 'GET', 'DELETE', 'GET']);
  assert.deepEqual(result, { saved: true, read: true, deleted: true });
});

test('uncertain database insert still attempts scoped cleanup; denied service config calls nothing', async () => {
  const methods = [];
  await assert.rejects(probeDatabase(env, { fetcher: async (_, init) => {
    methods.push(init.method); return init.method === 'POST' ? new Response('', { status: 500 }) : Response.json([]);
  } }), /HTTP 500/);
  assert.deepEqual(methods, ['POST', 'DELETE']);
  await assert.rejects(probeDatabase({ ...env, SUPABASE_URL: 'https://other.invalid' }), /nicht eingerichtet/);
});

test('status is safe metadata only and POST is disallowed', () => {
  const res = response(); status({ method: 'GET' }, res);
  assert.equal(res.statusCode, 200); assert.equal(res.body.app, 'aislam-live');
  assert.deepEqual(Object.keys(res.body.configured), ['database', 'gemini', 'operator']);
  assert.ok(!JSON.stringify(res.body).includes('SERVICE_KEY'));
  const post = response(); status({ method: 'POST' }, post); assert.equal(post.statusCode, 405);
});
