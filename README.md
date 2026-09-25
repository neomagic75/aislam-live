# Kinderzeit · Niedersachsen

Öffentlicher Familienfinder unter https://app.aislam.cc/ (Vercel-Alias https://aislam-live.vercel.app/). Entstanden beim AI Slam am 25.09.2026. [Quellcode](https://github.com/neomagic75/aislam-live) unter [MIT](LICENSE).

## Nutzerweg

Landkreis, Region Hannover oder kreisfreie Stadt wählen; optional Ort, Einrichtungsname oder Interesse eingeben; offizielles Programm öffnen. 45 regionale Auswahlwerte, eine bewusst begrenzte Auswahl von 11 Einrichtungen in 7 Regionen und drei einzeln quellengeprüfte kommende Veranstaltungen bilden den Start. Leere Regionen werden ausdrücklich als Abdeckungslücken erklärt. Ohne Konto, Besucher-KI oder Datenbankzugriff. Filter sind flüchtiger Browserzustand.

## Quellen und Pflege

`src/data/venues.json` ist der gemeinsame veröffentlichte Datenbestand. Er wird bei Build gebündelt. Einträge enthalten offizielle Programm- und Quellenlinks sowie `checkedAt`. Termine enthalten nur belegte Kalendertage; die Oberfläche zeigt ausschließlich Termine ab dem aktuellen Berliner Kalendertag. Für Uhrzeit, Anmeldung und Änderungen gilt die Originalseite.

Es läuft **kein automatischer Aktualisierungsjob**. Aktualisierung: Originalquellen lesen, Datensatz fachlich prüfen/ersetzen, `Deploy.ps1` ausführen. DREDGER recherchierte den Ausgangsbestand; eine anschließende Quellenprüfung reduzierte ihn. `DATA_REVIEW.md` dokumentiert Annahme und Ausschlüsse. Verwaltungsauswahl: [Niedersächsisches Innenministerium](https://www.mi.niedersachsen.de/startseite/themen/kommunen/landkreise/landkreise-und-kreisfreie-staedte-157705.html), 36 Landkreise, Region Hannover und 8 kreisfreie Städte. Göttingen wird geografisch unter Landkreis Göttingen geführt, Hannover unter Region Hannover. Vollständigkeit der Einrichtungen wird nicht behauptet.

## Entwicklung und Veröffentlichung

React, TypeScript, Vite. `npm.cmd ci`, `npm.cmd test`, `npm.cmd run validate`, `npm.cmd run build`, `npm.cmd run dev`. `Deploy.ps1` prüft Tests, Verträge und Build, veröffentlicht direkt auf dem bestehenden Vercel-Projekt und prüft beide HTTPS-Hosts einschließlich API und gebündeltem Datenstand. Der Browser-Smoke prüft Filter, leere Treffer und mobile Darstellung separat. Guide: `/kurzanleitung.html`; Herkunft und Grenzen: `/settings`.

## Bestehende Regietechnik

`/rehearsal` bleibt eine technische Regieoberfläche. Alle Daten-/KI-Aktionen über `POST /api/probe` benötigen den serverseitigen Operator-Bearer. `GET /api/status` liefert sichere Konfigurationsbooleans, Release und Modus `family-finder`. Die Publikums-App ruft keine dieser Proben auf.

Sechs serverseitige Umgebungsvariablen stehen in `.env.example`; `.env.local` ist ignoriert. Kein Secret im Frontend, keine `VITE_`-Keys. Die einzige Datenbanktabelle `aislam_live_probe` bleibt service-only, mit RLS ohne Browser-Policies. Der Familienfinder speichert keine Besucher- oder Profildaten. Bestehende Adapter- und Autorisierungstests laufen ohne echte Provideraufrufe. Text-/Bildproben sind kostenpflichtig und ausschließlich explizite Regieaktionen, niemals Teil von Test oder Deployment.
