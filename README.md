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

- **Wortarten wählen:** Unter dem Thema lässt sich ankreuzen, was vorgeschlagen wird: *Nomen*, *Verben*, *Adjektive* – einzeln oder kombiniert (mindestens eine). Bei mehreren Wortarten sind die Vorschläge nach Wortart gruppiert. Nomen werden gross geschrieben, Verben (Grundform) und Adjektive klein. Die Wahl bleibt im Browser gespeichert und gilt für alle Generatoren; wer sie ändert, bekommt gleich neue Vorschläge.
- **Eingebaute Themen:** 22 Themen (Tiere, Fussball, Berufe, Weltraum, Römer …) mit Nomen; sie kommen sofort, auch ohne Internet, wenn nur «Nomen» gewählt ist.
- **Alles andere schlägt eine KI vor** – mit dem klaren Auftrag: nur Wörter, die Kinder von 8 bis 14 Jahren sicher kennen und verstehen (einfache, alltagsnahe Wörter aus dem Grundwortschatz, keine Fachbegriffe, Fremdwörter oder seltenen Wörter), eng zum Thema, ohne Namen.
  - **Über den eigenen Server (Infomaniak):** Die Seite fragt `api/woerter.php`; der Server fragt die KI (Mistral oder Pollinations.ai) mit seinem eigenen Schlüssel. Niemand muss einen Schlüssel eintragen. Den Schlüssel legt man als GitHub-Secret `KI_SCHLUESSEL` ab (siehe «Veröffentlichen»); welche KI gefragt wird, erkennt der Server am Schlüssel (Pollinations-Schlüssel beginnen mit `sk_`, sonst Mistral mit dem Modell `mistral-small-latest`). Schutz: nur Anfragen von der eigenen Seite, höchstens 60 pro Stunde und Netz und 1000 pro Tag; gleiche Themen und Wortarten kommen 30 Tage aus dem Zwischenspeicher. Gespeichert werden nur Zähler (IP-Adresse verschlüsselt) und Wortlisten (`api/daten/`).
  - **Ohne eigenen Server (z. B. GitHub Pages):** über [Pollinations.ai](https://pollinations.ai) direkt aus dem Browser. Dafür braucht es einen kostenlosen Schlüssel (beginnt mit `sk_`), den man im Labor unter «KI für Wortvorschläge» einträgt; er bleibt nur im eigenen Browser gespeichert.
  - **Im Claude-Artefakt** schlägt Claude vor.
- Jede Antwort der KI wird geprüft: einzelne Wörter, ß → ss, nichts doppelt und kein Wort, das das Suchwort enthält (bei «Film» also kein «Spielfilm», kein «filmen»). Das gilt auch für die eingebauten Listen. «Andere Vorschläge» zeigt zuerst die restlichen Wörter und fragt dann nochmals nach, ohne die schon gezeigten.
- Antwortet die KI nicht, steht unter den Vorschlägen der Grund; bei einem eingebauten Thema kommt dessen Liste.

Eigene Wörter gehen immer; sie bleiben so geschrieben, wie man sie eingibt.

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
gemeinsam/wortwahl.js           Baustein «Thema und Wörter»: Themenlisten, Wortarten, KI-Vorschläge, Wort-Chips
gemeinsam/gitter.js             Baustein «Buchstabengitter»: Zeichnen, Markieren, Füllbuchstaben
api/woerter.php                 Server-Teil (PHP): fragt die KI für Wortvorschläge; Schlüssel in api/geheim.php (entsteht beim Hochladen)
raetsel/zahlen-suchsel/         der Generator «Zahlen-Suchsel»
  zahlen-suchsel.js             Kern (Ziffern bauen, Wörter verteilen), Oberfläche, Bedienung
  zahlen-suchsel.css            Aussehen dieses Generators (nur aktiv, solange er offen ist)
raetsel/suchsel/                der Generator «Suchsel» (Wörter setzen, Oberfläche, Bedienung)
raetsel/rebus/                  der Generator «Rebus»
  rebus.js                      Bilderliste, Kern (Zerlegung), Oberfläche, Bedienung
  rebus.css                     Aussehen dieses Generators
```

Kein Build-Schritt, keine Abhängigkeiten ausser den Schriften Fredoka und Inter von Google Fonts. Für Wortvorschläge fragt die Seite eine KI: über den eigenen Server (`api/woerter.php`) oder, ohne Server, über Pollinations.ai (`gen.pollinations.ai`) direkt aus dem Browser. Die Seite wechselt über die Adresse: `…/#zahlen-suchsel`, `…/#suchsel` oder `…/#rebus` öffnet direkt einen Generator, `…/#start` die Startseite.

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

### Infomaniak (Webhosting)

Das Rätsellabor läuft unter **`https://raetsellabor.fabulousteaching.ch`**, als eigene Website (Subdomain) im Webhosting von fabulousteaching.ch. Jede Änderung auf dem Branch `main` wird automatisch dorthin hochgeladen (GitHub Action `.github/workflows/infomaniak.yml`, per FTPS, nur geänderte Dateien). Einmalig einrichten:

1. **Infomaniak-Manager → Webhosting → Website hinzufügen:** als Typ die Subdomain `raetsellabor` von `fabulousteaching.ch` wählen. Die Website liegt dann im Ordner `/sites/raetsellabor.fabulousteaching.ch` (steht auf ihrer Übersicht). Das kostenlose **SSL-Zertifikat** (Let's Encrypt) für die Subdomain aktivieren.
2. **Infomaniak-Manager → Webhosting → FTP / SSH:** ein FTP-Konto erstellen; **Server** (Form `xyzb.ftp.infomaniak.com`), **Benutzername** und **Passwort** notieren.
3. **GitHub → Repository → Settings → Secrets and variables → Actions → New repository secret:** vier Secrets anlegen:
   `FTP_SERVER`, `FTP_BENUTZER`, `FTP_PASSWORT` und `FTP_ORDNER` (Ordner der Website mit `/` am Ende: `/sites/raetsellabor.fabulousteaching.ch/`).
4. **Für KI-Wortvorschläge über den Server:** ein weiteres Secret `KI_SCHLUESSEL` mit dem Schlüssel der KI anlegen – von [Mistral](https://console.mistral.ai) (API-Schlüssel) oder von [Pollinations.ai](https://enter.pollinations.ai) (beginnt mit `sk_`). Optional `KI_ANBIETER` mit `mistral` oder `pollinations`. Beim Hochladen schreibt GitHub den Schlüssel in `api/geheim.php` auf dem Server; im Repository steht er nie.
5. **GitHub → Actions → «Auf Infomaniak hochladen» → Run workflow.** Nach ein bis zwei Minuten ist die Seite online. Danach geht es bei jeder Änderung von selbst. Nach einer Änderung an einem Secret den Workflow einmal von Hand starten.

### GitHub Pages

GitHub Pages für den Branch `main` einschalten (Settings → Pages). Die Seite ist dann unter `https://fabulousteaching.github.io/Raetsellabor/` erreichbar (das Repository hiess früher «Zahlensuchsel»; die alte Adresse funktioniert nach dem Umbenennen nicht mehr). Beide Wege können parallel laufen.
