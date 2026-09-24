import { randomUUID } from 'node:crypto';
import { HttpError, fetchJson } from './http.js';

export const PROBE_TABLE = 'aislam_live_probe';

function connection(env) {
  if (env.SUPABASE_URL !== 'https://qmrzujmwkiwlgfpxqikl.supabase.co' || !env.SUPABASE_SERVICE_KEY) {
    throw new HttpError(503, 'Supabase ist nicht eingerichtet.');
  }
  return { base: `${env.SUPABASE_URL}/rest/v1/${PROBE_TABLE}`, headers: {
    apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json', Prefer: 'return=representation',
  } };
}

// This service-only probe never accepts a table name, row id or payload from its caller.
export async function probeDatabase(env, options = {}) {
  const { base, headers } = connection(env);
  const id = randomUUID();
  const payload = { probe: 'aislam-live', nonce: randomUUID() };
  const request = (url, init) => fetchJson(url, { ...init, headers }, { timeoutMs: 8000, maxBytes: 16_000, ...options });
  try {
    await request(base, { method: 'POST', body: JSON.stringify({ id, payload }) });
    const rows = await request(`${base}?id=eq.${id}&select=id,payload`, { method: 'GET' });
    if (!Array.isArray(rows) || rows.length !== 1 || rows[0].id !== id || rows[0].payload?.nonce !== payload.nonce) {
      throw new HttpError(502, 'Gespeicherte Probe konnte nicht bestätigt werden.');
    }
  } finally {
    // Even an uncertain insert is cleaned up by its server-generated id. Cleanup failures remain visible.
    await request(`${base}?id=eq.${id}`, { method: 'DELETE' });
  }
  const remaining = await request(`${base}?id=eq.${id}&select=id`, { method: 'GET' });
  if (!Array.isArray(remaining) || remaining.length) throw new HttpError(502, 'Löschung der Probe konnte nicht bestätigt werden.');
  return { saved: true, read: true, deleted: true };
}
