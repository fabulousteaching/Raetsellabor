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

- **Wortarten wählen:** Unter dem Thema lässt sich ankreuzen, was vorgeschlagen wird: *Nomen*, *Verben*, *Adjektive* – einzeln oder kombiniert (mindestens eine). Bei mehreren Wortarten sind die Vorschläge nach Wortart gruppiert. Nomen werden gross geschrieben, Verben (Grundform) und Adjektive klein. Die Wahl gilt für alle Generatoren, bis die Seite neu geladen wird; wer sie ändert, bekommt gleich neue Vorschläge.
- **Die Vorschläge kommen von einer KI: Mistral** (Mistral AI, Paris, Server in Europa) – über den eigenen Server `api/woerter.php`. Der Schlüssel liegt nur dort; alle können die Seite benutzen, ohne etwas einzutragen. Mistral ist im Tarif «Experiment» kostenlos (Anmeldung mit Telefonnummer; im Gratis-Tarif darf Mistral die Anfragen zum Verbessern der Modelle verwenden – übermittelt werden nur Thema und Wortarten).
- **Auftrag an die KI:** nur Wörter, die Kinder von 8 bis 14 Jahren sicher kennen und verstehen (einfache, alltagsnahe Wörter aus dem Grundwortschatz, keine Fachbegriffe, Fremdwörter oder seltenen Wörter), eng zum Thema, ohne Namen.
- Jede Antwort wird geprüft: einzelne Wörter, ß → ss, nichts doppelt und kein Wort, das das Suchwort enthält (bei «Film» also kein «Spielfilm», kein «filmen»). «Andere Vorschläge» zeigt zuerst die restlichen Wörter und fragt dann nochmals nach, ohne die schon gezeigten.
- **Schutz auf dem Server:** nur Anfragen von der eigenen Seite, höchstens 60 pro Stunde und Netz und 1000 pro Tag; gleiche Themen und Wortarten kommen 30 Tage aus dem Zwischenspeicher. Gespeichert werden nur Zähler (IP-Adresse verschlüsselt) und Wortlisten (`api/daten/`).
- **Wenn die KI nicht erreichbar ist** (oder ohne eigenen Server, z. B. auf GitHub Pages), kommen bei 22 bekannten Themen (Tiere, Fussball, Berufe, Weltraum, Römer …) eingebaute Listen mit Nomen, sonst ein Hinweis mit dem Grund.
- Im Claude-Artefakt schlägt Claude vor.

Eigene Wörter gehen immer; sie bleiben so geschrieben, wie man sie eingibt.

Thema, Wörter, Lösungszahl und Einstellungen bleiben erhalten, solange die Seite offen ist (auch beim Wechsel zu einem anderen Generator); beim Neuladen beginnt alles frisch.

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

### QR-Code

Aus einem Text oder Link wird ein QR-Code – in zwei Varianten:

- **Zum Ausmalen:** Die Kinder malen die richtigen Felder eines Rasters aus. Ist alles richtig, lässt sich der Code mit Tablet oder Handy scannen (Selbstkontrolle). Was dann erscheint, ist wählbar:
  - *Text* – ein kurzer Text wie «Super gemacht!»,
  - *Link* – ein Ziellink, der sich öffnet (ohne «https://» wird es ergänzt; ungültige Adressen werden erkannt),
  - *Botschaft* – eine ganze Botschaft mit Titel und Symbol, die sich als eigene Seite öffnet. Sie wird auf dem eigenen Server gespeichert (`api/botschaft.php`, Ablage `api/daten/botschaften/`, Seiten unter `/B/<ID>/`), der Code enthält nur den kurzen Link in Grossbuchstaben (sparsamer Alphanumerik-Modus, darum ein kleines Raster). Gleiche Botschaft → gleiche ID; höchstens 30 neue pro Stunde und Netz, 300 pro Tag. Nur mit eigenem Server (Infomaniak), nicht auf GitHub Pages.
  Wer am Bildschirm fertig ausmalt, bekommt den Knopf «Link öffnen» bzw. «Botschaft öffnen».
  Woran die Kinder die Felder erkennen:
  - *Kreise* – Felder mit Kreis ausmalen (ab der 1. Klasse; Kreise mit weisser Mitte, damit das leere Blatt nicht schon scannbar ist),
  - *Zahlen* – gerade Zahlen (bis 20, 50 oder 100) oder Zahlen einer Einmaleins-Reihe (3er bis 10er, bis 10·k),
  - *Rechnungen* – Plus/Minus bis 20, Plus und Minus bis 100, Einmaleins mal oder geteilt; ist das Ergebnis gerade, wird ausgemalt.
  Die Erkennungsquadrate in den Ecken können vorgedruckt sein, Zeilen und Spalten sind nummeriert. Die **Fehlertoleranz** (gering bis sehr hoch) bestimmt, wie viele falsch ausgemalte Felder der Code verzeiht; die Seite nennt die Zahl (vorsichtig geschätzt und mit einem QR-Leser nachgemessen). Am Bildschirm lässt sich der Code auch ausmalen (tippen oder ziehen). Drucken mit Lösungsblatt.
- **Fertige QR-Codes:** ein oder mehrere Codes mit Titel, 1 bis 12 pro Blatt, auf Wunsch mit Schnittlinien und dem Inhalt als Text; einzeln als PNG oder SVG speicherbar. **Gestaltung:** Vorlagen (Klassisch, Fabulous, Punkte, Weich, Blatt, Nacht) oder selbst: Form der Punkte (Quadrate, abgerundet, Punkte, fliessend, Rauten), Ecken aussen und innen (eckig, abgerundet, rund, Blatt – nur Paare, die Scanner sicher erkennen), Farbe mit Verlauf, eigene Farbe für die Ecken, Hintergrund (auch durchsichtig) und ein Logo in der Mitte (Rätsellabor oder eigenes Bild, 12–30 %; dann automatisch höchste Fehlertoleranz). Jeder Code wird im Browser mit dem QR-Leser *jsQR* (Apache-2.0, `gemeinsam/extern/jsQR.js`, wird nur hier geladen) geprüft und als «lässt sich scannen» oder «schwer lesbar» markiert; zu wenig Kontrast und helle Punkte auf dunklem Grund werden gemeldet.

Links mit «www.» bekommen automatisch «https://» davor, damit das Handy sie direkt öffnet. Die Codes berechnet die Bibliothek *qrcode-generator* von Kazuhiko Arase (MIT-Lizenz, `gemeinsam/extern/`).

### Labyrinth

Zwei Arten, oben in der ersten Karte wählbar:

**Mit Start und Ziel** – ein Labyrinth als Rechteck, Kreis, Herz oder Stern.

- Die Form wird in Felder zerlegt; darin entsteht ein «perfektes» Labyrinth: Jedes Feld ist erreichbar, und zwischen zwei Feldern gibt es genau einen Weg (Algorithmus «wachsender Baum»). Start links, Ziel rechts – unter mehreren Randfeldern wird das Paar mit dem längsten Weg gewählt.
- **Schwierigkeit:** *Leicht* bis *Sehr schwer* – schmalere Gänge und längere, verschlungenere Wege.
- **Start und Ziel:** 🐭 → 🧀, 🐰 → 🥕, 🐝 → 🌻, 🚀 → 🪐, 🐶 → 🦴, 🦜 → 💰 oder ▶ → 🏁, mit passendem Auftrag («Hilf der Maus zum Käse!»).
- Einstellungen: Titel, Liniendicke, Farbe der Wände, Form leicht einfärben.

**Mit Lösungssatz** – in jedem Feld steht ein Buchstabe, ohne Lücken. Nur auf dem einzigen Weg vom Eingang (Pfeil links) zum Ausgang (Pfeil rechts) ergeben die Buchstaben den Satz, z. B. «Die nächste Lösung findest du im Kühlschrank» (`labyrinth-satz.js`).

- Ein Feld pro Buchstabe: Die Wörter stehen ohne Lücke hintereinander, Leer- und Satzzeichen fallen weg; Gross- und Kleinschreibung bleibt wie eingegeben (oder auf Wunsch nur Grossbuchstaben). Lösungsblatt und Bildschirm zeigen den Satz, wie er eingegeben wurde.
- Zuerst entsteht ein Weg mit genau so vielen Feldern, wie der Satz Buchstaben hat (Tiefensuche, die bei jedem Schritt prüft, ob der Rest bis zur rechten Spalte noch aufgeht; der Weg rückt gleichmässig nach rechts vor, schwingt dabei über die ganze Höhe und biegt oft ab). Danach wachsen die Irrwege darum herum – so gibt es genau einen richtigen Weg.
- In den Irrwegen stehen Zufallsbuchstaben aus dem Satz selbst (gleich häufig wie im Satz), damit der richtige Weg nicht auffällt.
- **Schwierigkeit:** etwa drei (*Leicht*), fünf, acht oder zwölf (*Sehr schwer*) Mal so viele Felder, wie der Satz Buchstaben hat. Schrift Andika (gut unterscheidbare Buchstaben), Linien zum Aufschreiben auf dem Blatt.

Beide Arten: am Bildschirm lösbar (Weg vom Start aus ziehen; durch Wände geht es nicht, zurückziehen löscht), Lösung zeigen, «Neu mischen», Drucken mit Lösungsblatt.

## Aufbau

```
index.html                      Rätsellabor: Kopfleiste mit Menü, Startseite, Platz für den Generator
gemeinsam/labor.css             gemeinsames Aussehen (Farben, Schriften, Kopfleiste, Menü, Karten, Knöpfe)
gemeinsam/labor.js              Menü, Startseite und Wechsel zwischen den Generatoren
gemeinsam/wortwahl.js           Baustein «Thema und Wörter»: Wortarten, KI-Vorschläge, eingebaute Listen, Wort-Chips
gemeinsam/gitter.js             Baustein «Buchstabengitter»: Zeichnen, Markieren, Füllbuchstaben
api/woerter.php                 Server-Teil (PHP): fragt Mistral für Wortvorschläge; Schlüssel in api/geheim.php (entsteht beim Hochladen)
raetsel/zahlen-suchsel/         der Generator «Zahlen-Suchsel»
  zahlen-suchsel.js             Kern (Ziffern bauen, Wörter verteilen), Oberfläche, Bedienung
  zahlen-suchsel.css            Aussehen dieses Generators (nur aktiv, solange er offen ist)
raetsel/suchsel/                der Generator «Suchsel» (Wörter setzen, Oberfläche, Bedienung)
raetsel/rebus/                  der Generator «Rebus»
  rebus.js                      Bilderliste, Kern (Zerlegung), Oberfläche, Bedienung
  rebus.css                     Aussehen dieses Generators
raetsel/qr-code/                der Generator «QR-Code» (zum Ausmalen und fertige Codes)
raetsel/labyrinth/              der Generator «Labyrinth»
  labyrinth.js                  Art «Mit Start und Ziel» (Figuren) und Auswahl der Art
  labyrinth-satz.js             Art «Mit Lösungssatz» (Buchstaben in jedem Feld)
gemeinsam/extern/qrcode.js      QR-Code-Bibliothek (qrcode-generator 2.0.4, MIT-Lizenz, unverändert; Lizenz daneben)
gemeinsam/extern/jsQR.js        QR-Leser zum Prüfen gestalteter Codes (jsQR 1.4.0, Apache-2.0, unverändert; Lizenz daneben)
B/                              Botschaftsseiten /B/<ID>/ (werden auf dem Server angelegt)
api/botschaft.php               Server-Teil (PHP): speichert Botschaften für QR-Codes; Anzeige: api/botschaft-seite.php
.htaccess                       Server-Regel: Seite, Skripte und Stile nicht ungeprüft aus dem Browser-Cache nehmen
```

**Neu laden = frisch anfangen (gilt für alle Generatoren, auch künftige):**

- Beim Laden der Seite löscht `Labor.start()` alle gespeicherten Eingaben und Einstellungen (`sessionStorage` und `localStorage`). Solange die Seite offen ist, bleiben Eingaben beim Wechsel zwischen den Generatoren erhalten.
- Der Server schickt Seite, Skripte und Stile mit `Cache-Control: no-cache` (`.htaccess`): Der Browser fragt bei jedem Laden nach, ob es eine neue Version gibt.
- Beim Hochladen hängt der GitHub-Workflow eine Versionsnummer an alle Skripte und Stile (`…/labor.js?v=1a2b3c4d`, auch für die Stile der Generatoren). Nach jeder Änderung lädt der Browser so sicher die neuen Dateien.

Kein Build-Schritt; ausser den Schriften Fredoka, Inter und Andika von Google Fonts und der mitgelieferten QR-Code-Bibliothek keine Abhängigkeiten. Für Wortvorschläge fragt die Seite den eigenen Server (`api/woerter.php`), der Mistral fragt. Die Seite wechselt über die Adresse: `…/#zahlen-suchsel`, `…/#suchsel`, `…/#rebus`, `…/#qr-code` oder `…/#labyrinth` öffnet direkt einen Generator, `…/#start` die Startseite.

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
4. **KI für die Wortvorschläge:** auf [console.mistral.ai](https://console.mistral.ai) ein Konto erstellen, den kostenlosen Tarif «Experiment» wählen, unter «API Keys» einen Schlüssel erstellen und als weiteres Secret `KI_SCHLUESSEL` anlegen. Beim Hochladen schreibt GitHub den Schlüssel in `api/geheim.php` auf dem Server; im Repository steht er nie.
5. **GitHub → Actions → «Auf Infomaniak hochladen» → Run workflow.** Nach ein bis zwei Minuten ist die Seite online. Danach geht es bei jeder Änderung von selbst. Nach einer Änderung an einem Secret den Workflow einmal von Hand starten.

### GitHub Pages

GitHub Pages für den Branch `main` einschalten (Settings → Pages). Die Seite ist dann unter `https://fabulousteaching.github.io/Raetsellabor/` erreichbar (das Repository hiess früher «Zahlensuchsel»; die alte Adresse funktioniert nach dem Umbenennen nicht mehr). Beide Wege können parallel laufen.
