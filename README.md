# AI Slam: Live-App

Eigenes Ziel für die erst auf der Bühne bestimmte Publikums-App. Die derzeitige Seite ist ausdrücklich eine technische Veröffentlichungsprobe: ein gerätelokaler Zähler ohne Speicherung oder gemeinsamen Serverzustand.

## Auf dem Zenbook veröffentlichen

`powershell -NoProfile -ExecutionPolicy Bypass -File .\Deploy.ps1`

Das Skript prüft JavaScript, veröffentlicht direkt ins bestehende Projekt `aislam-live` im Team `stevos-projects-876dfee2` und prüft den öffentlichen HTTPS-Aufruf. Für den Showauftrag können HTML/CSS/JS ersetzt werden; einen Backend- oder API-Auftrag vorher gesondert zuschneiden. Die Probe nutzt keine Provider-API und enthält keine Zugangsdaten.

GitHub `neomagic75/aislam-live`, Branch `main`, ist zusätzlich mit Vercel verbunden. Bei Entwicklung zuerst den kleinsten sinnvollen Test ausführen, dann veröffentlichen und das eigentliche Nutzerverhalten am öffentlichen Alias prüfen. Keine internen Dokumente, Aufnahmen, Regiecodes oder Schlüssel in dieses Repository kopieren. Git verwendet die verifizierte Identität `99567493+neomagic75@users.noreply.github.com`.

Öffentlicher Alias: https://aislam-live.vercel.app/. Vorgesehene eigene Domain: https://app.aislam.cc/; sie ist erst nach externer DNS-/TXT-Einrichtung, Verifikation und HTTPS-Smoke bereit. Die separate Foto-App bleibt https://aislam-app.vercel.app/.

Erst die tatsächliche Show-App nach erfolgreichem Domain-Smoke in `C:\Projects\aislam-site\content\results.json` als Ergebnis freischalten. Die technische Probe ist kein fertiges Showergebnis.
