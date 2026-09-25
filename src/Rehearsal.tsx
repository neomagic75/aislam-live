import { useState } from 'react';

type ProbeMode = 'database' | 'text' | 'image';
type ProbeResult = { mode: ProbeMode; result: { text?: string; model?: string; mimeType?: string; data?: string } };

export default function Rehearsal() {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ProbeResult | null>(null);
  const [status, setStatus] = useState('');
  async function check(mode?: ProbeMode) {
    if (busy) return;
    setBusy(true); setError(''); setResult(null); setStatus('');
    try {
      const response = await fetch(mode ? '/api/probe' : '/api/status', mode ? {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ mode }), signal: AbortSignal.timeout(55_000),
      } : { signal: AbortSignal.timeout(10_000) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || `HTTP ${response.status}`);
      if (mode) setResult(body);
      else setStatus(`Konfiguration: Datenbank ${body.configured.database ? 'gesetzt' : 'fehlt'}, Gemini ${body.configured.gemini ? 'gesetzt' : 'fehlt'}, Operator-Zugang ${body.configured.operator ? 'gesetzt' : 'fehlt'}. Modelle: ${body.models.text}, ${body.models.image}. Dies prüft keine Dienstverbindung.`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Probe fehlgeschlagen.');
    } finally { setBusy(false); }
  }
  return <main className="page">
    <p className="eyebrow">Nur für die Regie</p><h1>Technische Probe</h1>
    <p>Jede Probe startet erst per Klick. Text und Bild lösen jeweils einen kostenpflichtigen Gemini-Aufruf aus. Die Datenbankprobe schreibt einen Testdatensatz, liest ihn zurück und löscht ihn wieder.</p>
    <section className="panel">
      <label htmlFor="operator-token">Operator-Schlüssel</label>
      <input id="operator-token" type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} placeholder="Nur für autorisierte Regie" />
      <p className="small">Der Schlüssel bleibt nur bis zum Verlassen dieser Seite im Arbeitsspeicher.</p>
      <div className="actions">
        <button disabled={busy} onClick={() => void check()}>Konfiguration prüfen</button>
        <button disabled={busy || !token} onClick={() => void check('database')}>Speichern, lesen, löschen</button>
        <button disabled={busy || !token} onClick={() => void check('text')}>Text testen · kostenpflichtig</button>
        <button disabled={busy || !token} onClick={() => void check('image')}>Bild testen · kostenpflichtig</button>
      </div>
      {busy && <p role="status">Probe läuft. Bitte warten …</p>}
      {error && <p role="alert" className="error">{error}</p>}
      {status && <p role="status">{status}</p>}
      {result && <div role="status" className="result"><h2>Probe erfolgreich</h2>
        {result.mode === 'database' && <p>Testdatensatz gespeichert, zurückgelesen und gelöscht. Löschung bestätigt.</p>}
        {result.result.text && <p>{result.result.text}</p>}
        {result.result.data && <img alt="Technisches Testbild: ein gelber Kreis auf blauem Grund" src={`data:${result.result.mimeType};base64,${result.result.data}`} />}
        {result.result.model && <p className="small">Modell: {result.result.model}</p>}
      </div>}
    </section>
  </main>;
}


