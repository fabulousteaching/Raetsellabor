# Rätsellabor

Eine Webseite mit Rätselgeneratoren für Schule und Freizeit. Man wählt einen Generator, gibt eigene Inhalte ein, und das Labor baut daraus ein Rätsel, das man am Bildschirm lösen oder als Arbeitsblatt ausgeben kann.

Die Startseite erklärt kurz, was das Labor kann, und zeigt alle Generatoren. Über das Menü oben rechts wechselt man jederzeit zwischen Startseite und Generatoren. Das Labor wird Schritt für Schritt um weitere Generatoren erweitert.

## Generatoren

### Zahlen-Suchsel

Ein Suchsel mit Lösungszahl: Die versteckten Wörter bilden zusammen die Ziffern einer Zahl, ähnlich wie auf einer Digitalanzeige.

1. **Thema und Wörter:** Thema eingeben und «Wörter vorschlagen» klicken. Vorschläge anklicken oder eigene Wörter ergänzen (mehrere mit Komma).
2. **Lösungszahl:** z. B. `7` oder `2026`. Die Seite zeigt laufend, wie viele Wörter mindestens nötig sind.
3. **Suchsel erstellen:** Das Feld wird so gross, wie es die Wörter verlangen.

Lässt sich die Zahl mit den Wörtern nicht bilden, erklärt die Seite den Grund und schlägt eine Lösung mit einer anderen Ziffer vor.

| Ziffer | 1 | 7 | 4 | 0 3 9 | 2 5 6 8 |
|---|---|---|---|---|---|
| Wörter mindestens | 1 | 2 | 3 | 4 | 5 |

Einstellungen: Wörter dürfen sich überlappen, Ziffern unterschiedlich gross oder liegend, Ziffern neben- oder untereinander, Wörter rückwärts, die 1 mit Fähnchen, Umlaute ersetzen, Wortliste, Gitterlinien, Abstand und Rand.

Wortvorschläge (gleich bei allen Generatoren mit Wörtern, `gemeinsam/wortwahl.js`):

- **Eingebaute Themen:** 22 Themen (Tiere, Fussball, Berufe, Weltraum, Römer …) funktionieren sofort, auch ohne Internet.
- **Jedes andere Thema – aus dem Internet, ohne Claude:** Die Seite sucht den passenden Artikel in der deutschen Wikipedia und schlägt die Nomen vor, die darin am häufigsten vorkommen. Allgemeine Wörter (Jahr, Teil, Beispiel …) werden ausgefiltert, Mehrzahlformen zusammengefasst, ß wird ss. Der Artikel wird verlinkt. «Andere Vorschläge» zeigt die nächsten Wörter aus demselben Artikel.
- **Im Claude-Artefakt** ist das Internet gesperrt; dort schlägt Claude die Wörter vor.

Eigene Wörter gehen immer.

Thema, Wörter und Lösungszahl gelten nur für den geöffneten Tab: Neu laden behält sie, ein neuer Tab beginnt leer. Die Einstellungen bleiben im Browser gespeichert.

### Suchsel

Das klassische Wortsuchrätsel: Die Wörter liegen kreuz und quer im Buchstabenfeld. Thema und Wörter wie beim Zahlen-Suchsel (Vorschläge zum Thema oder eigene Wörter).

- **Schwierigkeit:** *Leicht* (waagrecht → und senkrecht ↓), *Mittel* (dazu schräg ↘ ↗), *Schwer* (dazu rückwärts ← ↑ ↖ ↙). Wörter dürfen sich auf Wunsch kreuzen.
- **Feldgrösse:** automatisch (so klein wie möglich) oder fest 10 × 10 bis 20 × 20.
- Markieren am Bildschirm, Lösung zeigen, Drucken bzw. Herunterladen mit Lösungsblatt.

### Rebus

Aus Wörtern und ganzen Sätzen werden Bilderrätsel. Jedes Bild steht für ein Wort (Einzahl, ohne Artikel); die Regeln darunter wendet man der Reihe nach an:

| Regel | Bedeutung | Beispiel |
|---|---|---|
| `ko=i` | im Bildwort «ko» durch «i» ersetzen (auch mehrere Buchstaben) | 👨‍🍳 KOCH → ICH |
| `−m` | diesen Buchstaben weglassen | 🐭 MAUS → AUS |
| `+e` | diesen Buchstaben am Ende anhängen | 🐟 FISCH → FISCHE |
| einzelner Buchstabe | gehört so dazu | |

Beispiel «Ich arbeite gerne»: 👨‍🍳 `ko=i` · 🐜 `m=rb` `s=t` · 🍐 `bi=ge`.

Drei Stufen: *Einfach* (höchstens eine Regel pro Bild), *Mittel* (bis zwei Regeln), *Schwer* (bis drei Regeln, auch längere Buchstabengruppen). Meist ein Bild pro Wort, bei langen Wörtern auch mehrere. Bis zu 12 Rätsel pro Blatt (je bis 60 Buchstaben), jedes einzeln neu würfelbar; am Bildschirm mit Lösungsfeld, ausgedruckt mit Kästchen und Zeichenerklärung, auf Wunsch mit Lösungsblatt. Die Bilder sind rund 360 Emojis mit deutschen Namen (`LISTE` in `rebus.js`). Gesucht wird die Zerlegung mit möglichst wenigen Bildern und Regeln; jede Regel wird nachgespielt und muss eindeutig sein.

## Aufbau

```
index.html                      Rätsellabor: Kopfleiste mit Menü, Startseite, Platz für den Generator
gemeinsam/labor.css             gemeinsames Aussehen (Farben, Schriften, Kopfleiste, Menü, Karten, Knöpfe)
gemeinsam/labor.js              Menü, Startseite und Wechsel zwischen den Generatoren
gemeinsam/wortwahl.js           Baustein «Thema und Wörter»: Themenliste, Vorschläge (Wikipedia), Wort-Chips
gemeinsam/gitter.js             Baustein «Buchstabengitter»: Zeichnen, Markieren, Füllbuchstaben
raetsel/zahlen-suchsel/         der Generator «Zahlen-Suchsel»
  zahlen-suchsel.js             Kern (Ziffern bauen, Wörter verteilen), Oberfläche, Bedienung
  zahlen-suchsel.css            Aussehen dieses Generators (nur aktiv, solange er offen ist)
raetsel/suchsel/                der Generator «Suchsel» (Wörter setzen, Oberfläche, Bedienung)
raetsel/rebus/                  der Generator «Rebus»
  rebus.js                      Bilderliste, Kern (Zerlegung), Oberfläche, Bedienung
  rebus.css                     Aussehen dieses Generators
```

Kein Build-Schritt, keine Abhängigkeiten ausser den Schriften Fredoka und Inter von Google Fonts. Für Wortvorschläge zu Themen ausserhalb der eingebauten Liste fragt die Seite die Wikipedia-Schnittstelle (`de.wikipedia.org/w/api.php`) an, direkt aus dem Browser, ohne Anmeldung. Die Seite wechselt über die Adresse: `…/#zahlen-suchsel`, `…/#suchsel` oder `…/#rebus` öffnet direkt einen Generator, `…/#start` die Startseite.

## Einen neuen Generator hinzufügen

1. Ordner `raetsel/<name>/` mit `<name>.js` und `<name>.css` anlegen.
2. In `<name>.js` den Generator beim Labor anmelden:

   ```js
   Labor.registriere({
     id: 'mein-raetsel',                 // Adresse: …/#mein-raetsel
     titel: 'Mein Rätsel',
     kurz: 'ein Satz für das Menü',
     beschreibung: 'zwei, drei Sätze für die Startseite',
     merkmale: ['Stichwort', 'Stichwort'],
     symbol: '<svg …>…</svg>',           // zeichnet mit currentColor
     css: 'raetsel/mein-raetsel/mein-raetsel.css',
     html: '<div>…Oberfläche…</div>',
     start: function(bereich){
       // Oberfläche steht jetzt im Dokument: Ereignisse verbinden, loslegen
       return function stopp(){ /* aufräumen, wenn man das Rätsel verlässt */ };
     }
   });
   ```

3. In `index.html` unten eine Zeile ergänzen: `<script src="raetsel/mein-raetsel/mein-raetsel.js"></script>`

Der neue Generator erscheint dann automatisch im Menü und auf der Startseite. Gemeinsame Bausteine wie `.karte`, `.btn`, Eingabefelder und `.meldung` stehen in `gemeinsam/labor.css` bereit. Bausteine zum Wiederverwenden: `Wortwahl` (Thema und Wörter mit Vorschlägen) und `Gitter` (Buchstabengitter). In `gemeinsam/labor.js` gibt es Helfer für alle Generatoren: `Labor.imArtefakt()`, `Labor.claude(name)` (Claude-Fähigkeiten im Artefakt), `Labor.blattDatei(titel, html)` (Arbeitsblatt als Datei) und `Labor.esc()`.

## Veröffentlichen

GitHub Pages für den Branch `main` einschalten (Settings → Pages). Die Seite ist dann unter `https://fabulousteaching.github.io/Zahlensuchsel/` erreichbar. Wird das Repository umbenannt (z. B. in «Raetsellabor»), ändert sich die Adresse entsprechend.
