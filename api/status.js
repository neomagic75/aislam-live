import { json } from '../server/http.js';
import { models } from '../server/gemini.js';

export default function handler(req, res) {
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return json(res, 405, { error: 'GET erforderlich.' }); }
  const env = process.env;
  return json(res, 200, {
    app: 'aislam-live', release: 'prepared-2026-09-24', mode: 'operator-rehearsal',
    configured: {
      database: env.SUPABASE_URL === 'https://qmrzujmwkiwlgfpxqikl.supabase.co' && Boolean(env.SUPABASE_SERVICE_KEY),
      gemini: Boolean(env.GEMINI_API_KEY), operator: Boolean(env.AISLAM_OPERATOR_TOKEN && env.AISLAM_OPERATOR_TOKEN.length >= 32),
    }, models: models(env),
  });
}
