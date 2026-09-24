# AI Slam Live-App

Open Source unter der [MIT-Lizenz](LICENSE). [Quellcode auf GitHub](https://github.com/neomagic75/aislam-live) · [Problem melden oder Idee beitragen](https://github.com/neomagic75/aislam-live/issues). Der veröffentlichte Code enthält keine Zugangsschlüssel; für einen eigenen Betrieb werden eigene Serverkonfiguration und Providerzugänge benötigt. Die verwendeten npm-Abhängigkeiten behalten ihre jeweiligen Lizenzen.

Vorbereitete Infrastruktur für die am **25. September 2026** live bestimmte Publikums-App. React, TypeScript und Vite stammen aus dem verifizierten privaten `neomagic75/magic-app-draft-template` (Commit `965a0e7169fb384a47326e78507cb87562b324be`), gezielt in das bestehende Repository übernommen. Die Vorlage liefert die Build-Struktur; ihre generischen Einträge, Kamera und anonyme Browseranmeldung wurden nicht übernommen.

## Was bereitsteht

- `/`: öffentliche Ankündigung; `/settings`: Stand und Kurzanleitung.
- `/kurzanleitung.html`: öffentliches, deutschsprachiges Nutzerdokument.
- `/rehearsal`: Regieoberfläche. Die Oberfläche ist öffentlich erreichbar, jede Daten- oder KI-Aktion verlangt den Operator-Schlüssel. Kein Schlüssel in URL, Cookie oder Browserstorage; er lebt nur im React-Arbeitsspeicher dieser Seite.
- `GET /api/status`: Konfigurationsbooleans und Modellnamen; keine Verbindungsprobe, keine Schlüssel.
- `POST /api/probe`: Bearer-geschützte technische Proben mit exakt `{ "mode": "database" }`, `text` oder `image`. Keine frei gewählten Prompts, Modelle, Tabellen oder Datensatz-IDs.
- `server/gemini.js`: wiederverwendbarer, ausschließlich serverseitiger REST-Adapter. Ein Providerrequest pro Aktion, kein Retry/Fallback. Text: 2.000 Zeichen Eingabe, 256 Ausgabetokens, 20 Sekunden. Bild: 1K, 45 Sekunden, beschränkte Antwortgröße. Das API-Probe-Prompt ist fest und harmlos.
- `server/database.js`: service-only Supabase-Probe. Eigene zufällige UUID schreiben, wieder lesen, auch bei ungewissem Insert per UUID löschen, Löschung erneut prüfen. Jeder Request maximal 8 Sekunden; bis zu vier Requests. Keine fachlichen Publikumsdaten.

Öffentlicher Alias: https://aislam-live.vercel.app/. Eigene Domain: https://app.aislam.cc/ nach eigenem DNS/TLS-Nachweis. Die separate Foto-App bleibt https://aislam-app.vercel.app/. `noindex, nofollow, noarchive` schützt nicht vor Zugriff; es sind Suchmaschinenhinweise.

## Secrets und Datenbank

Sechs serverseitige Umgebungsvariablen stehen in `.env.example`: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `GEMINI_API_KEY`, `AISLAM_OPERATOR_TOKEN` (mindestens 32 Zeichen), `GEMINI_TEXT_MODEL`, `GEMINI_IMAGE_MODEL`. Root provisioniert sie getrennt; `.env.local` bleibt ignoriert. Kein `VITE_`-Secret, kein Supabase-Anon/Publishable-Key im Browser.

Die einzige vorbereitete Migration ist `supabase/migrations/20260924_aislam_live_probe.sql`, ausschließlich auf dem gemeinsamen Projekt `qmrzujmwkiwlgfpxqikl`. Sie erstellt `aislam_live_probe`, aktiviert RLS, entzieht PUBLIC/anon/authenticated alle Tabellenrechte und gibt service_role SELECT/INSERT/DELETE. Es existieren absichtlich keine Browser-RLS-Policies. Eine spätere echte App braucht zuerst ihr eigenes Identitäts-/Berechtigungsmodell. Bei fehlgeschlagener Löschung ist die Probe fehlgeschlagen; ihre synthetische Zeile kann zurückbleiben und muss durch den Operator geprüft werden.

## Lokal prüfen und veröffentlichen

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run validate
npm.cmd run build
npm.cmd run dev
```

Vite zeigt lokal nur die Oberfläche. Für die API lokal `vercel.cmd dev` mit den serverseitigen Umgebungsvariablen nutzen. Tests mocken alle Dienstaufrufe und kosten nichts. Der neutrale Template-Validator erwartet standardmäßig `auth.uid()` und authenticated-Grants; diese Annahmen gelten ausdrücklich nicht für den gewählten service-only Zugang. `scripts/validate-app.mjs` prüft stattdessen Revokes, Service-Grants, Geheimnisgrenze, Guide und die ausgesparten API-Routen. Die Skill-Prüfung kann außerdem die externe Guide-CSS-Hyphenation nicht erkennen.

`Deploy.ps1` führt Tests, Vertragsprüfung, Build, den bestehenden direkten Vercel-Produktionsdeploy und einen kostenfreien HTTP/API-Smoke aus. Das Skript verändert die Produktion und wird ausschließlich im beauftragten Veröffentlichungsumfang ausgeführt. Git-`main` ist zusätzlich mit Vercel verbunden.

Explizite Operator-Proben nach dem Deployment:

```powershell
npm.cmd run probe -- status
npm.cmd run probe -- database
npm.cmd run probe -- text
npm.cmd run probe -- image
```

`text` und `image` kosten jeweils einen Modellaufruf. Keiner dieser Schritte läuft automatisch. Das Skript liest das Token aus der ignorierten Umgebung und druckt weder Secrets noch Bild-Base64. Es akzeptiert nur die App-Hosts und localhost, ohne Redirect-Weitergabe des Tokens. Die Regieoberfläche kann ein generiertes Probe-Bild direkt zeigen.

## Noch von der Live-Idee abhängig

Zweck und Ergebnis, Eingabefelder, Ansichten und Aktionen, fachliche Tabellen sowie Publikumsauthentifizierung/Sharing. Öffentliche KI-Operationen brauchen anschließend ein echtes Zugriffs- und Kostenbudget. Der jetzige Operator-Bearer ist dafür keine Publikumsanmeldung. Der genaue Weiterbauauftrag steht in `HANDOFF.md`.

## Szenarien und Nachweise

| ID | Ablauf | Nachweisstand |
|---|---|---|
| A1 | Publikum öffnet Ankündigung, Einstellungen und Guide ohne Anmeldung | Implementiert; visuelle Live-Prüfung durch Root ausstehend |
| A2 | Unberechtigter Probe-Aufruf löst keinen Dienstaufruf aus | Automatisierter Test |
| A3 | Ungültige, zu große oder modifizierte Probe wird abgewiesen | Automatisierter Test |
| A4 | Operator schreibt/liest/löscht ausschließlich die eigene zufällige Probe | Automatisierter Adaptertest; echter Cloud-Smoke durch Root |
| A5 | Expliziter Text-/Bildklick startet genau einen Request; Fehler/Timeout bleibt sichtbar | Automatisierter Adapter-/Deadline-Test; echter Provider- und UI-Smoke durch Root |
| A6 | Secrets bleiben serverseitig; API wird nicht zum SPA-HTML umgeschrieben | Vertragsprüfung; echte Routing-/Bundle-Prüfung durch Root |

Die technische Vorbereitung ist kein fertiges Showergebnis und bleibt bis zum echten App-Bau von der Ergebnisfreischaltung getrennt.
