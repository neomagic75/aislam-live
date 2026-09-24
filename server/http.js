import { createHash, timingSafeEqual } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function requireOperator(req, env) {
  const expected = env.AISLAM_OPERATOR_TOKEN;
  if (!expected || expected.length < 32) throw new HttpError(503, 'Operator-Zugang ist nicht eingerichtet.');
  const received = req.headers.authorization;
  const digest = value => createHash('sha256').update(value).digest();
  if (typeof received !== 'string' || received.length > 1024
    || !timingSafeEqual(digest(received), digest(`Bearer ${expected}`))) {
    throw new HttpError(401, 'Operator-Zugang erforderlich.');
  }
}

export function json(res, status, body) {
  res.setHeader('Cache-Control', 'no-store, private');
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = status;
  res.end(JSON.stringify(body));
}

export function probeMode(req) {
  if (!/^application\/json(?:\s*;|$)/i.test(req.headers['content-type'] ?? '')) {
    throw new HttpError(415, 'JSON erforderlich.');
  }
  if (Number(req.headers['content-length']) > 256) throw new HttpError(413, 'Anfrage zu groß.');
  let body = req.body;
  if (Buffer.isBuffer(body)) body = body.toString('utf8');
  if (typeof body === 'string') {
    if (Buffer.byteLength(body) > 256) throw new HttpError(413, 'Anfrage zu groß.');
    try { body = JSON.parse(body); } catch { throw new HttpError(400, 'Ungültiges JSON.'); }
  }
  if (!body || typeof body !== 'object' || Array.isArray(body)
    || Object.keys(body).length !== 1 || !['database', 'text', 'image'].includes(body.mode)) {
    throw new HttpError(400, 'Genau einen Modus wählen: database, text oder image.');
  }
  return body.mode;
}

export function publicError(error) {
  return error instanceof HttpError
    ? { status: error.status, message: error.message }
    : { status: 502, message: 'Technische Probe fehlgeschlagen. Keine automatische Wiederholung.' };
}

export async function fetchJson(url, options, { fetcher = fetch, timeoutMs = 20_000, maxBytes = 1_000_000 } = {}) {
  const signal = AbortSignal.timeout(timeoutMs);
  try {
    const response = await fetcher(url, { ...options, signal });
    if (!response.ok) throw new HttpError(502, `Dienst meldet HTTP ${response.status}. Keine automatische Wiederholung.`);
    if (Number(response.headers.get('content-length')) > maxBytes) throw new HttpError(502, 'Dienstantwort zu groß.');
    const reader = response.body?.getReader();
    if (!reader) throw new HttpError(502, 'Leere Dienstantwort.');
    const chunks = []; let size = 0;
    try {
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > maxBytes) throw new HttpError(502, 'Dienstantwort zu groß.');
        chunks.push(value);
      }
    } finally { await reader.cancel(); }
    try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
    catch { throw new HttpError(502, 'Dienstantwort enthält kein gültiges JSON.'); }
  } catch (error) {
    if (signal.aborted) throw new HttpError(504, 'Zeitlimit erreicht. Keine automatische Wiederholung.');
    throw error;
  }
}
