import { json, probeMode, publicError, requireOperator } from '../server/http.js';
import { probeDatabase } from '../server/database.js';
import { generate } from '../server/gemini.js';

export function createProbeHandler({ env = process.env, database = probeDatabase, generation = generate } = {}) {
  return async function handler(req, res) {
    if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return json(res, 405, { error: 'POST erforderlich.' }); }
    try {
      requireOperator(req, env);
      const mode = probeMode(req);
      const result = mode === 'database' ? await database(env)
        : await generation(mode, mode === 'text'
          ? 'Antworte mit einem kurzen deutschen Satz: Die technische Verbindung ist bereit.'
          : 'Create one simple flat illustration of a single yellow circle on a plain dark blue background. No text, no people.', env);
      return json(res, 200, { ok: true, mode, result });
    } catch (error) {
      const safe = publicError(error);
      return json(res, safe.status, { error: safe.message });
    }
  };
}

export default createProbeHandler();
