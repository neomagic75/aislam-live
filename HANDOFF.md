# Auftrag für den Live-App-Bau

Arbeite in `C:\Projects\aislam-live`. Die Publikums-App wird am 25.09.2026 erst auf der Bühne bestimmt. Lies README.md, app-draft.json und die vom Operator gelieferte Idee. Behalte das bestehende Repository, den Vercel-Projekteintrag und die serverseitigen Secrets.

Aus der Idee zunächst klären: Zielgruppe und ein nützliches Ergebnis; notwendige Eingaben und Ausgaben; kürzester Ablauf und Ansichten; Datenmodell und Löschung; Zugriff (ein Gerät, gemeinsame öffentliche Daten oder persönliche Konten). Fehlende Produktentscheidungen nicht durch beliebige Demo-Funktionen ersetzen. Die Ankündigung ist noch keine fertige Publikums-App.

Vorhanden sind React/TypeScript/Vite, ein Guide unter `/kurzanleitung.html`, `server/gemini.js` für Text/Bild und eine serverseitige Supabase-Verbindung in `server/database.js`. Gemini-Adapter enthalten keine Wiederholung und keine Modell-Fallbacks. Modelle und Schlüssel bleiben serverseitig. Die Operator-Probe `/api/probe` ist ausschließlich für Regietests und kein Publikumseingang.

Der gemeinsame Supabase-Server darf keine anonymen oder Publishable-Schlüssel an diesen Browser ausgeben. Neue Datenzugriffe über autorisierte App-API-Routen führen; erst die tatsächliche App-Identität und zulässige Operationen festlegen. Service-Key nie in `src`, `public`, Vite-Variablen oder Ausgaben schreiben. Jede neue Tabelle mit Präfix `aislam_live_` exakt migrieren; kein pauschales `db push` oder Datenbank-Reset. `aislam_live_probe` enthält ausschließlich kurzlebige technische Testzeilen und ist kein fachliches Datenmodell.

Für öffentliche kostenpflichtige KI-Aktionen vor Freischaltung ein konkretes Zugriffs- und Kostenbudget implementieren. Der Operator-Schlüssel darf niemals zum Publikumsschlüssel oder Client-Konstanten werden. Nicht nur einen versteckten Button als Berechtigungsprüfung verwenden.

Implementiere die kleinste vollständige Nutzeraktion; passe Guide, README und app-draft.json an das tatsächlich Gebaute an. Prüfe Erlaubt/Verweigert, Datenisolierung und Kostenbegrenzung entsprechend dem gewählten Zugangsmodell. Führe `npm test`, `npm run validate` und `npm run build` aus. Release nur im vom Root beauftragten Umfang, danach tatsächlichen Produktionsablauf auf Smartphone und Desktop prüfen. Providerproben kosten Geld: nie automatisch in Tests, Build, Deploy oder Seitenaufruf ausführen.

Der Root integriert die Ergebnisseite `aislam-site`; sie bekommt erst nach Live-Smoke einen Link zum echten Showergebnis. Fotos bleiben ein eigenes Projekt. Keine Repo-Sichtbarkeit, Lizenz oder fremde Website ohne den dafür bestehenden Auftrag ändern.
