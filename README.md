# Zahlen-Suchsel

Ein Generator für Suchsel (Wortsuchrätsel) mit Lösungszahl: Wer alle versteckten Wörter findet und markiert, sieht eine Zahl.

Die Wörter liegen nicht zufällig im Feld, sondern bilden die Striche der Ziffern – ähnlich wie auf einer Digitalanzeige. Rundherum stehen Füllbuchstaben.

## So funktioniert es

1. **Thema und Wörter:** Thema eingeben und «Wörter vorschlagen» klicken. Vorschläge anklicken oder eigene Wörter ergänzen (mehrere mit Komma).
2. **Lösungszahl:** z. B. `7` oder `2026`. Die Seite zeigt laufend, wie viele Wörter mindestens nötig sind.
3. **Suchsel erstellen:** Das Feld wird so gross, wie es die Wörter verlangen.

Lässt sich die Zahl mit den Wörtern nicht bilden (zu wenige Wörter, zu viele Buchstaben, oder die Wortlängen gehen nicht auf), erklärt die Seite den Grund und schlägt eine Lösung mit einer anderen Ziffer vor.

Mindestens nötige Wörter je Ziffer (ein Wort pro Strich):

| Ziffer | 1 | 7 | 4 | 0 3 9 | 2 5 6 8 |
|---|---|---|---|---|---|
| Wörter | 1 | 2 | 3 | 4 | 5 |

Mit ein, zwei Wörtern mehr als dem Minimum klappt es fast immer.

## Einstellungen

- Wörter dürfen sich überlappen (letzter Buchstabe des einen = erster des nächsten)
- Ziffern dürfen unterschiedlich gross sein
- Ziffern dürfen liegen (zufällig um 90° gedreht)
- Ziffern nebeneinander oder untereinander
- Wörter auch rückwärts verstecken
- Die 1 mit schrägem Fähnchen
- Umlaute ersetzen (Ä → AE …)
- Wortliste auf dem Blatt, Gitterlinien, Abstand der Ziffern, Rand

## Im Browser lösen und drucken

- Wörter lassen sich direkt im Feld markieren: vom ersten bis zum letzten Buchstaben ziehen oder beide antippen.
- «Lösung zeigen» blendet alle Wörter ein, «Neu mischen» erzeugt eine neue Anordnung.
- «Drucken» gibt ein A4-Arbeitsblatt aus, auf Wunsch mit Lösungsblatt als zweite Seite.

## Wortvorschläge

- **Als Claude-Artefakt** kommen die Vorschläge für jedes beliebige Thema von Claude.
- **Als normale Webseite** (z. B. über GitHub Pages) gibt es Vorschläge für 21 eingebaute Themen: Tiere, Obst und Gemüse, Berufe, Sport, Musikinstrumente, Länder, Wetter, Schule, Körper, Verkehr, Weltraum, Pflanzen und Wald, Essen und Küche, Kleidung, Farben und Formen, Meer und Wasser, Jahreszeiten, Weihnachten, Steinzeit, Römer, Mittelalter. Eigene Wörter gehen immer.

## Technik

Alles steckt in einer einzigen Datei, [`index.html`](index.html) – ohne Build-Schritt und ohne Abhängigkeiten (nur die Schrift Inter von Google Fonts). Thema, Wörter und Lösungszahl gelten nur für den geöffneten Tab (`sessionStorage`): Neu laden behält sie, ein neuer Tab beginnt leer. Die Einstellungen bleiben im Browser gespeichert (`localStorage`).

Im Skript gibt es zwei Teile:

- **Kern** (zwischen `KERN-START` und `KERN-ENDE`): baut die Ziffern aus geraden Strichen, verteilt die Wortlängen exakt auf die Striche (Suche mit Rückverfolgung) und setzt danach die Wörter samt Füllbuchstaben ins Feld. Dabei steht kein Wort zufällig ein zweites Mal im Feld.
- **Bedienung:** Eingaben, Wortvorschläge, Meldungen und Alternativen, Anzeige als SVG, Markieren, Drucken und Herunterladen.

Zum Veröffentlichen genügt es, GitHub Pages für den Branch `main` einzuschalten (Settings → Pages). Die Seite ist dann unter `https://fabulousteaching.github.io/Zahlensuchsel/` erreichbar.
