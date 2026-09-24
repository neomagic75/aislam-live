import { HttpError, fetchJson } from './http.js';

export const DEFAULT_MODELS = Object.freeze({ text: 'gemini-3.8-flash', image: 'gemini-3.1-flash-lite-image' });

export function models(env) {
  return { text: env.GEMINI_TEXT_MODEL || DEFAULT_MODELS.text, image: env.GEMINI_IMAGE_MODEL || DEFAULT_MODELS.image };
}

// Server-only adapters. New audience routes must authorize their caller before invoking these.
export async function generate(mode, prompt, env, options = {}) {
  if (!['text', 'image'].includes(mode) || typeof prompt !== 'string' || !prompt.trim() || prompt.length > 2000) {
    throw new HttpError(400, 'Ungültige Generierungsanfrage.');
  }
  if (!env.GEMINI_API_KEY) throw new HttpError(503, 'Gemini ist nicht eingerichtet.');
  const model = models(env)[mode];
  if (!/^[a-z0-9.-]+$/.test(model)) throw new HttpError(503, 'Modellkonfiguration ist ungültig.');
  const generationConfig = mode === 'image'
    ? { responseModalities: ['TEXT', 'IMAGE'], imageConfig: { aspectRatio: '1:1', imageSize: '1K' } }
    : { maxOutputTokens: 256, thinkingConfig: { thinkingLevel: 'low' } };
  const data = await fetchJson(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': env.GEMINI_API_KEY },
    body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig }),
  }, { timeoutMs: mode === 'image' ? 45_000 : 20_000, maxBytes: mode === 'image' ? 8_000_000 : 32_000, ...options });
  const parts = data.candidates?.[0]?.content?.parts;
  if (!Array.isArray(parts)) throw new HttpError(502, 'Gemini hat kein Ergebnis geliefert.');
  if (mode === 'text') {
    const text = parts.filter(part => !part.thought && typeof part.text === 'string').map(part => part.text).join('').trim();
    if (!text) throw new HttpError(502, 'Gemini hat keinen Text geliefert.');
    return { model, text };
  }
  const images = parts.filter(part => !part.thought && part.inlineData).map(part => part.inlineData);
  if (images.length !== 1 || !['image/png', 'image/jpeg', 'image/webp'].includes(images[0].mimeType)
    || typeof images[0].data !== 'string' || !/^[A-Za-z0-9+/]+={0,2}$/.test(images[0].data)) {
    throw new HttpError(502, 'Gemini hat kein einzelnes gültiges Bild geliefert.');
  }
  if (images[0].data.length > 4_000_000) throw new HttpError(502, 'Bild überschreitet das Ausgabelimit.');
  return { model, mimeType: images[0].mimeType, data: images[0].data };
}
