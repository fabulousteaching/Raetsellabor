# Rätsellabor

Eine Webseite mit Rätselgeneratoren für Schule und Freizeit. Man wählt einen Generator, gibt eigene Inhalte ein, und das Labor baut daraus ein Rätsel, das man am Bildschirm lösen oder als PDF-Arbeitsblatt mit Lösungsblatt herunterladen kann.

Die Startseite erklärt kurz, was das Labor kann, und zeigt alle Generatoren als gleich grosse Karten. Rechts neben «Rätsel im Labor» steht eine **Suche**: Sie sucht im Titel der Generatoren, und mit jedem Buchstaben bleiben weniger Karten übrig (Gross/klein, Umlaute – «rae» findet «Rätsel» –, Leerzeichen und Bindestriche spielen keine Rolle). Die Eingabetaste öffnet den ersten Treffer, Esc oder × leert die Suche. Über das Menü oben rechts wechselt man jederzeit zwischen Startseite und Generatoren. Das Labor wird Schritt für Schritt um weitere Generatoren erweitert.

## Für alle Arbeitsblätter

- **PDF herunterladen** statt Drucken: Arbeitsblatt und – wenn angekreuzt – Lösungsblatt kommen als A4-PDF, jedes Blatt auf eine Seite. Das PDF sieht aus wie der Ausdruck: `Labor.pdfHerunterladen()` zeichnet die Blätter mit *html2canvas* in einer Kopie der Seite, in der die Druckregeln (`@media print`) der Generatoren gelten, und legt sie mit *jsPDF* in die Datei (beide MIT-Lizenz, `gemeinsam/extern/`, erst beim ersten Download geladen). Grafiken bekommen ihre Stile und Schriften eingebettet; am Bildschirm eingeblendete Lösungen, Markierungen und gezogene Wege kommen nicht ins PDF. Im Claude-Artefakt gibt es stattdessen «Arbeitsblatt herunterladen» (HTML-Datei).
- **Titel** und **Arbeitsanweisung** lassen sich in der Werkzeugleiste über dem Blatt an- und abwählen (`Labor.blattSchalterHtml()`, `Labor.blattSchalter()`).
- **Schrift wählen:** In der Werkzeugleiste jedes Generators steht ein Schriftfeld wie in Word: anklicken zeigt die Auswahl (jede Schrift in ihrer eigenen Gestalt), Tippen sucht (Name oder Beschreibung, z. B. «schul», «lesbar»). Zur Wahl: *Standard* (Inter, Rätselbuchstaben in Andika), *Basisschrift* (die Deutschschweizer Basisschrift DCH-Basisschrift, unverbunden – urheberrechtlich geschützt: Lehrpersonen dürfen sie gratis für Unterrichtsdokumente nutzen, verbreitet werden darf sie nur mit schriftlicher Zustimmung der Dienststelle Volksschulbildung Kanton Luzern. Darum liegt die Schriftdatei nicht auf dem Server: Ist sie auf dem Computer installiert, kommt sie von dort; sonst wählt man die Datei einmal aus, sie wird nur im eigenen Browser gespeichert. Auch im PDF und im Bild), *Grundschrift* (Playwrite DE Grund), Andika, Atkinson Hyperlegible, Lexend, Nunito, Fredoka, Comic Neue, Patrick Hand und Merriweather. Tippt man einen anderen Namen, lässt sich jede Schrift von Google Fonts laden (z. B. «Roboto Slab»); gibt es sie nicht, kommt ein Hinweis. Die Wahl gilt für alle Generatoren, bleibt gespeichert und gilt auch im PDF und im Bild. Technisch: `gemeinsam/labor.js` setzt die CSS-Variablen `--blatt-schrift`, `--blatt-buchstaben` und `--blatt-display`, die die Blätter verwenden; Messungen im Canvas holen die Schrift mit `Labor.blattSchrift()`. Schriften werden erst geladen, wenn man sie braucht. Nicht bei «Text spiegeln» (kein Blatt – der kopierte Text übernimmt die Schrift des Zielprogramms).
- **Keine Beispieltexte** in Eingabefeldern (kein `placeholder`); was ein Feld bedeutet, steht in seiner Beschriftung.

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
- **Die Vorschläge kommen von einer KI: Mistral** (Mistral AI, Paris, Server in Europa) – über den eigenen Server `gemeinsam/paarliste.js          Baustein «Paarliste»: Wortpaare in Zeilen, mit automatischer Übersetzung (Triomino, Kettenrätsel)
api/woerter.php`. Der Schlüssel liegt nur dort; alle können die Seite benutzen, ohne etwas einzutragen. Mistral ist im Tarif «Experiment» kostenlos (Anmeldung mit Telefonnummer; im Gratis-Tarif darf Mistral die Anfragen zum Verbessern der Modelle verwenden – übermittelt werden nur Thema und Wortarten).
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
- Markieren am Bildschirm, Lösung zeigen, PDF mit Lösungsblatt.

### Rebus

Aus Wörtern und ganzen Sätzen werden Bilderrätsel. Jedes Bild steht für ein Wort (Einzahl, ohne Artikel); die Regeln darunter wendet man der Reihe nach an:

| Regel | Bedeutung | Beispiel |
|---|---|---|
| `ko=i` | im Bildwort «ko» durch «i» ersetzen (auch mehrere Buchstaben) | 👨‍🍳 KOCH → ICH |
| `−m` | diesen Buchstaben weglassen | 🐭 MAUS → AUS |
| `+e` | diesen Buchstaben am Ende anhängen | 🐟 FISCH → FISCHE |
| einzelner Buchstabe | gehört so dazu | |

Beispiel «Ich arbeite gerne»: 👨‍🍳 `ko=i` · 🐜 `m=rb` `s=t` · 🍐 `bi=ge`.

- **Alle Kärtchen gleich gross:** Auf einem Blatt haben alle Bildkärtchen dieselbe Breite und Höhe – so breit wie die längste Regel, so hoch wie das Bild mit den meisten Regeln (berechnet aus den Regeln, nicht aus der Bildschirmbreite, darum auch im PDF gleich).
- **Ein Kasten = ein Wort:** Besteht ein Wort aus mehreren Bildern (oder Bild und Buchstaben), steht ein gemeinsamer Kasten um alle Teile – so ist klar, was zusammengehört. Wörter aus einem Bild behalten ihr eigenes Kärtchen.
- **Bild austauschen:** Am Bildschirm lässt sich jedes Bild anklicken (oder mit Enter wählen); dann kommt für dasselbe Wortstück ein anderes Bild mit passenden Regeln, der Rest bleibt. Weggeklickte Bilder kommen im selben Wort nicht wieder (sind alle durch, beginnt es von vorn); gibt es für das Stück kein anderes Bild, wird ein Nachbarteil einbezogen. «Anders» würfelt das ganze Rätsel neu.

Drei Stufen: *Einfach* (höchstens eine Regel pro Bild), *Mittel* (bis zwei Regeln), *Schwer* (bis drei Regeln, auch längere Buchstabengruppen). Meist ein Bild pro Wort, bei langen Wörtern auch mehrere. Bis zu 12 Rätsel pro Blatt (je bis 60 Buchstaben), jedes einzeln neu würfelbar; am Bildschirm mit Lösungsfeld, als PDF, auf Wunsch mit Lösungsblatt (ohne Zeichenerklärung und ohne Kästchen oder Linie für die Lösung). Die Bilder sind rund 360 Emojis mit deutschen Namen (`LISTE` in `rebus.js`). Gesucht wird die Zerlegung mit möglichst wenigen Bildern und Regeln; jede Regel wird nachgespielt und muss eindeutig sein.

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
  - *Buchstaben* – Vokale (A, E, I, O, U), Konsonanten oder drei zufällig gewählte Buchstaben ausmalen (Grossbuchstaben, ohne Umlaute, Y, Q und X); die anderen Felder bekommen die übrigen Buchstaben.

  **Schon schwarz vorgedruckt:** keine Felder, die Hälfte, drei Viertel (Standard) oder neun Zehntel der schwarzen Felder sind schon gedruckt (zufällig gewählt, dazu auf Wunsch die Erkennungsquadrate) – die Kinder malen nur den Rest aus. Mit dem QR-Leser jsQR geprüft: Vor dem Ausmalen ist kein Code lesbar, auch nicht bei neun Zehnteln; fertig ausgemalt sind alle lesbar.
  Die Erkennungsquadrate in den Ecken können vorgedruckt sein, Zeilen und Spalten sind nummeriert. **Raster** wählbar: «So klein wie möglich» (Standard) oder fest 21 × 21 bis 41 × 41 Felder; zu kleine Raster (Inhalt passt nicht) und für die Ausmal-Art zu grosse sind gesperrt. Die Fehlertoleranz ergibt sich daraus – die höchste, die ins Raster passt. Jede Grösse nennt, wie viele falsch ausgemalte Felder der Code verzeiht (vorsichtig geschätzt und mit dem QR-Leser jsQR nachgemessen: in jeder Grösse mit so vielen zufälligen Fehlern 30 von 30 Mal lesbar), dazu die Zahl der auszumalenden Felder und – wenn es hilft – den Tipp, den Text in Grossbuchstaben zu schreiben (kleineres Raster). Am Bildschirm lässt sich der Code auch ausmalen (tippen oder ziehen). PDF mit Lösungsblatt.
- **Fertige QR-Codes:** ein oder mehrere Codes mit Titel, 1 bis 12 pro Blatt, auf Wunsch mit Schnittlinien und dem Inhalt als Text; einzeln als PNG oder SVG speicherbar. **Gestaltung:** Vorlagen (Klassisch, Fabulous, Punkte, Weich, Blatt, Nacht) oder selbst: Form der Punkte (Quadrate, abgerundet, Punkte, fliessend, Rauten), Ecken aussen und innen (eckig, abgerundet, rund, Blatt – nur Paare, die Scanner sicher erkennen), Farbe mit Verlauf, eigene Farbe für die Ecken, Hintergrund (auch durchsichtig) und ein Logo in der Mitte (Rätsellabor oder eigenes Bild, 12–30 %; dann automatisch höchste Fehlertoleranz). Jeder Code wird im Browser mit dem QR-Leser *jsQR* (Apache-2.0, `gemeinsam/extern/jsQR.js`, wird nur hier geladen) geprüft und als «lässt sich scannen» oder «schwer lesbar» markiert; zu wenig Kontrast und helle Punkte auf dunklem Grund werden gemeldet.

Links mit «www.» bekommen automatisch «https://» davor, damit das Handy sie direkt öffnet. Die Codes berechnet die Bibliothek *qrcode-generator* von Kazuhiko Arase (MIT-Lizenz, `gemeinsam/extern/`).

### Labyrinth

Zwei Arten, oben in der ersten Karte wählbar:

**Mit Start und Ziel** – ein Labyrinth als Rechteck, Kreis, Herz, Stern oder **Zufall**: eine bei jedem Erstellen und Mischen neue Form (ein Umriss um die Mitte, dessen Radius mit ein paar zufälligen Wellen schwankt).

- Die Form wird in Felder zerlegt; darin entsteht ein «perfektes» Labyrinth: Jedes Feld ist erreichbar, und zwischen zwei Feldern gibt es genau einen Weg (Algorithmus «wachsender Baum»). Start links, Ziel rechts – unter mehreren Randfeldern wird das Paar mit dem längsten Weg gewählt.
- **Schwierigkeit:** *Leicht* bis *Sehr schwer* – schmalere Gänge und längere, verschlungenere Wege.
- **Start und Ziel:** ▶ → 🏁 (zuerst), 🐭 → 🧀, 🐰 → 🥕, 🐝 → 🌻, 🚀 → 🪐, 🐶 → 🦴 oder 🦜 → 💰, mit passendem Auftrag («Hilf der Maus zum Käse!»). Die Bilder stehen neben den Öffnungen, mit Abstand zu allen Wänden auf ihrer Höhe – sie berühren keine Linie.
- Einstellungen: Titel, Liniendicke, Farbe der Wände, Form leicht einfärben.

**Mit Lösungssatz** – in jedem Feld steht ein Buchstabe, ohne Lücken. Nur auf dem einzigen Weg vom Eingang (Pfeil links) zum Ausgang (Pfeil rechts) ergeben die Buchstaben den Satz, z. B. «Die nächste Lösung findest du im Kühlschrank» (`labyrinth-satz.js`).

- Ein Feld pro Buchstabe: Die Wörter stehen ohne Lücke hintereinander, Leer- und Satzzeichen fallen weg; Gross- und Kleinschreibung bleibt wie eingegeben (oder auf Wunsch nur Grossbuchstaben). Lösungsblatt und Bildschirm zeigen den Satz, wie er eingegeben wurde.
- Zuerst entsteht ein Weg mit genau so vielen Feldern, wie der Satz Buchstaben hat (Tiefensuche, die bei jedem Schritt prüft, ob der Rest bis zur rechten Spalte noch aufgeht; der Weg rückt gleichmässig nach rechts vor, schwingt dabei über die ganze Höhe und biegt oft ab). Danach wachsen die Irrwege darum herum – so gibt es genau einen richtigen Weg.
- In den Irrwegen stehen Zufallsbuchstaben aus dem Satz selbst (gleich häufig wie im Satz), damit der richtige Weg nicht auffällt.
- **Schwierigkeit:** etwa drei (*Leicht*), fünf, acht oder zwölf (*Sehr schwer*) Mal so viele Felder, wie der Satz Buchstaben hat. Schrift Andika (gut unterscheidbare Buchstaben), Linien zum Aufschreiben auf dem Blatt.

Beide Arten: am Bildschirm lösbar (Weg vom Start aus ziehen; durch Wände geht es nicht, zurückziehen löscht), Lösung zeigen, «Neu mischen», PDF mit Lösungsblatt.

### Emoji-Rechnen

Rechenrätsel, in denen Emojis für Zahlen stehen: Gleiche Emojis haben den gleichen Wert. Aus den Hinweiszeilen findet man die Werte heraus und rechnet damit die letzte Zeile («?») aus.

- **Eindeutig lösbar:** Jede Hinweiszeile bringt genau ein neues Emoji, alle anderen darin sind schon bekannt – so lässt sich das Rätsel Zeile für Zeile lösen, und es gibt genau eine Lösung (nur natürliche Zahlen, keine negativen Zwischenergebnisse, Divisionen gehen auf). Die letzte Zeile ist nie gleich wie eine Hinweiszeile.
- **Schwierigkeit** (auf der Seite nur die Namen): *Leicht* (Plus im Zahlenraum 20, 3 Emojis), *Mittel* (Plus und Minus bis 100), *Schwer* (mit Mal und Punkt vor Strich, 3–4 Emojis), *Sehr schwer* (alle vier Grundoperationen, 4 Emojis, Zeilen gemischt; zwei Emojis findet man nur aus zwei Zeilen zusammen). Mal und Geteilt werden wie in der Schweiz als «·» und «:» geschrieben.
- **Emoji-Themen:** Früchte, Tiere, Meer, Süsses, Gemüse, Natur, Fahrzeuge, Sport, Schule, Musik, Weltall, Gesichter oder gemischt – ohne Emojis, die sich in klein zu ähnlich sehen.
- **Blatt:** 1, 2, 4 oder 6 Rätsel pro Blatt, auf Wunsch mit Hilfsfeldern für die Werte der Emojis («🍎 = …»). Am Bildschirm lassen sich Werte und Ergebnis eintippen (richtige werden grün), Lösung zeigen, neue Rätsel; PDF mit Lösungsblatt.

### Text spiegeln

Ein eigener Text (auch mehrere Zeilen) in fünf Fassungen: **horizontal gespiegelt** (Spiegelschrift, von rechts nach links), **vertikal gespiegelt** (an einer waagrechten Linie umgeklappt), **auf den Kopf gedreht** (beides, um 180°), **rückwärts** und **Wörter rückwärts** (jedes Wort rückwärts, Reihenfolge und Satzzeichen bleiben).

- **Kopieren mit einem Klick:** Ein Klick auf eine Fassung legt sie in die Zwischenablage (sonst wird der Text markiert, damit man ihn selbst kopieren kann). Die gespiegelten Fassungen bestehen aus ähnlich aussehenden Unicode-Zeichen (z. B. b → d, R → Я, a → ɐ, Umlaute mit Pünktchen oben bzw. unten) – so lassen sie sich überall einfügen; nicht jeder Buchstabe hat ein perfektes Gegenstück.
- Bewusst ein reines Werkzeug zum Kopieren – ohne Arbeitsblatt und PDF.

### Puzzle

Ein eigenes Bild wird zum Online-Puzzle mit klassischen Puzzle-Teilen (Nasen und Mulden). Gepuzzelt wird mit Maus oder Finger: Teile aufs Brett ziehen, am richtigen Platz rasten sie ein; oben stehen die gelegten Teile und die Zeit, am Schluss «Geschafft!».

- **Bild:** eigenes Bild auswählen oder hineinziehen (wird auf höchstens 1600 Pixel verkleinert; es bleibt auf dem Gerät, bis man einen QR-Code erstellt). Fertige Bilder gibt es bewusst nicht, und das ganze Bild lässt sich während des Puzzelns nicht ansehen.
- **Schwierigkeit:** 12, 24, 48, 96 oder 150 Teile. Die Teile dürfen leicht rechteckig sein, damit die Anzahl genau stimmt (nur bei sehr quadratischen oder sehr schmalen Bildern weicht sie um ein paar Teile ab; oben steht immer die echte Zahl). Auf Wunsch zeigt das Brett das Bild blass als Vorlage (leichter). «Neu mischen» verteilt die Teile neu, «Vollbild» für Tablets.
- **Teile neben dem Brett:** Gemischt liegen alle Teile samt Nasen neben dem Brett, nie darauf – zuerst auf freie Plätze, wenn sie nicht reichen, teilweise übereinander. Das Brett wird so gross gewählt, dass rundherum genug Platz bleibt; auch nach einer Grössenänderung (Vollbild, Drehen des Tablets) rückt kein Teil aufs Brett.
- **QR-Code zum Puzzle:** Das Puzzle wird auf dem eigenen Server gespeichert (`api/puzzle.php`; Angaben in `api/daten/puzzles/`, das Bild als `/P/<ID>/bild.jpg`, mit GD neu gespeichert), der Code führt zur Puzzle-Seite `/P/<ID>/` (Link in Grossbuchstaben → kleiner Code). Gleiches Puzzle → gleiche ID; höchstens 20 neue pro Stunde und Netz, 200 pro Tag. Dazu Link kopieren, QR als Bild (PNG) und ein PDF-Blatt mit QR-Code und Link (ohne das Bild; Titel und Anleitung wählbar). Nur mit eigenem Server (Infomaniak), nicht auf GitHub Pages.

### Geheimschriften

Ein eigener Text in einer von siebzehn Geheimschriften, jeweils mit Schlüssel:

- **Caesar-Verschiebung** (Verschiebung 1–25; im Schlüssel Tabelle und auf Wunsch eine **Caesar-Scheibe zum Basteln**) · **Rückwärts-Alphabet** (A ↔ Z) · **Zahlen-Code** (A = 1 … Z = 26) · **Handy-Tasten** (B = 22, mit Tastenfeld) · **Koordinaten-Gitter** (Polybios-Quadrat, Zeile und Spalte; I/J teilen sich ein Feld) · **Freimaurer-Code** (Pigpen: A–I im Gitter #, J–R im Gitter # mit Punkt, S–V im X, W–Z im X mit Punkt; Schlüssel mit den vier Figuren und einer Tabelle A–Z – früher ein eigener Generator, alte Links …/#freimaurer öffnen die Geheimschriften mit dem Freimaurer-Code) · **Vögel auf dem Draht** (Birds on a Wire, eigene Zeichnungen nach einem System: Blickrichtung, Schwanz kurz/lang/schräg, Haltung sitzend A–F, Flügel hoch G–L, pickend M–R, Küken S–X, liegend Y/Z; im Geheimtext sitzen alle Vögel einer Zeile auf einem durchgehenden Draht, auch über die Wortabstände) · **Kreis-Code** (Circles, genau nach der Vorlage von kryptografie.de nachgebaut: jedes Zeichen aus Kreisbögen und Strecken, auch Ziffern 0–9; 5 und S sehen wie in der Vorlage gleich aus) · **Bücher-Code** (das Bücher-Alphabet aus der Vorlage der Lehrperson: A–Z sowie Punkt, Komma, Ausrufezeichen und Bindestrich, ausgeschnitten als Bilder in `raetsel/geheimschrift/buecher/`, alle im gleichen Massstab mit gemeinsamer Grundlinie) · **Bärte-Code** (das Bärte-Alphabet aus der Vorlage der Lehrperson: 26 Gesichter A–Z, ohne Kartenrahmen ausgeschnitten, alle im gleichen Massstab und an der gleichen Stelle wie auf der Karte, in `raetsel/geheimschrift/baerte/`) · **Segment-Code** (14-Segment-Anzeige a–f, g1, g2, h–m wie in der Vorlage, gezeichnet als SVG; A–Z und 0–9 mit eindeutigen Zeichen. Aufgabe wählbar: *Segmente ausmalen* (Standard) – über jeder leeren Anzeige stehen die Namen der Segmente, im Lösungsblatt leuchten sie – oder *Anzeige lesen* – die leuchtenden Segmente sind gezeichnet. Schlüssel mit beschrifteter Anzeige und Tabelle) · **Altlatein** (selbst neu gezeichnet als Linien, mit dem Aufbau der Zeichen aus der Vorlage – welche Striche, wo, in welchem Winkel –, ohne Teile der Vorlage zu übernehmen; gleiche Höhe und Grundlinie, eigene Breite, Daten in `STRICHZEICHEN` in geheimschrift.js; C/G, I/J/Y und U/V/W haben wie in der Vorlage dasselbe Zeichen – steht im Schlüssel) · **Runen** (ebenso neu gezeichnet, mit Haupt- und Seitenstrichen, Bögen, Punkten und den Querbalken oben und unten; I/J und U/V/W gleich) · **Fingeralphabet** (Deutschschweizer Gebärdensprache, Darstellung des SGB-FSS Schweizerischer Gehörlosenbund aus dessen PDF «fingeralphabet-dsgs.pdf»: die Vektorgrafik ohne blauen Hintergrund gerendert und jede Hand einzeln ausgeschnitten, alle gleich hoch und unten bündig, in `raetsel/geheimschrift/finger/`; A–Z sowie eigene Zeichen für Ä, Ö, Ü, CH und SCH – CH und SCH werden im Text automatisch als ein Zeichen erkannt, ß wird zu SS; im Schlüssel steht die Quelle «© SGB-FSS») · **Morse-Code** (mit Ä, Ö, Ü, ß, Ziffern und Satzzeichen) · **Blindenschrift** (deutsche Basisschrift mit Umlauten und Zahlzeichen) · **Hieroglyphen** (Einkonsonantenzeichen; C/K, E/I, F/V, U/W teilen sich ein Zeichen – steht im Schlüssel).
- Umlaute werden als AE, OE, UE geschrieben (ausser bei Morse und Blindenschrift, die eigene Zeichen haben); Ziffern und Satzzeichen bleiben sonst stehen.
- **Blatt:** Zeichen klein, mittel oder gross, Titel; in der Leiste über dem Blatt Titel, Arbeitsanweisung und **Schreiblinien** ein- und ausblenden (für alle Schriften); «Lösung zeigen». **Herunterladen:** Geheimtext als PDF (wahlweise mit Schlüssel und Lösungsblatt) oder als Bild (PNG); der Schlüssel einzeln als PDF oder Bild. Hieroglyphen werden mit der Schrift «Noto Sans Egyptian Hieroglyphs» (Google Fonts) als Bild gezeichnet, damit sie auch im PDF sicher erscheinen.
- **Als Bild kopieren (für Word):** Ein Klick auf den Geheimtext legt ihn als Bild in die Zwischenablage (ohne Titel und Anweisung, nie mit Lösung, rechts auf den Inhalt zugeschnitten). In Word mit Ctrl+V bzw. Cmd+V einfügen. Klappt das Kopieren im Browser nicht, gibt es einen Hinweis auf «Als Bild».
- Neu in `gemeinsam/labor.js`: `Labor.bildHerunterladen(blatt, name)`, `Labor.bildKnopf()` und `Labor.bildKopieren(element, { eng })` – ein Blatt oder Teil davon als PNG (herunterladen oder in die Zwischenablage), gezeichnet wie im PDF.

### Kreuzworträtsel

Eigene Wörter mit Hinweisen werden waagrecht und senkrecht verschränkt (jedes Wort kreuzt mindestens ein anderes, kein Wort läuft neben einem anderen her; viele Anordnungen werden probiert, die kompakteste mit den meisten Wörtern gewinnt; «Neu anordnen» probiert andere). Wörter, die nirgends über Kreuz passen, werden genannt.

- **Eingabe:** Zeilen mit zwei Feldern – links das Wort, rechts der Hinweis. Unten steht immer eine leere Zeile; sobald man hineinschreibt, kommt eine neue dazu. Eingabetaste: Wort → Hinweis → nächste Zeile; × löscht eine Zeile. Eine eingefügte Liste (z. B. aus Excel oder Word, Wort und Hinweis durch Tabulator, «=», «;» oder « - » getrennt) wird auf Zeilen verteilt. Zähler; Leerzeichen und Bindestriche im Wort fallen weg, ß → SS, Ä/Ö/Ü bleiben ein Feld. Bis 30 Wörter.
- **Bilder als Deko:** bis 6 eigene Bilder (auswählen oder hineinziehen). Das Blatt ist eine feste A4-Seite (703 × 1032 Pixel, wie im PDF); nach dem Aufbau werden alle belegten Flächen gemessen (Titel, Anleitung, jedes Gitterfeld, jeder Hinweis). Jedes Bild kommt mittig in die grösste freie Lücke (auch in die Lücken des Gitters), so gross wie es dort gut wirkt (höchstens 190 Pixel) – mit Abstand zum Rätsel, zu den Texten, zu den anderen Bildern und mindestens 30 Pixel zum Blattrand. Reicht der Platz nicht, wird das Gitter kleiner; hat ein Bild trotzdem keinen Platz, liegt es klein unten rechts, und ein Hinweis erscheint.
- **Bilder selbst platzieren:** Jedes Bild auf dem Blatt lässt sich anklicken: ziehen verschiebt es, eine der vier Ecken ändert die Grösse (um die Mitte, Seitenverhältnis bleibt), der runde Griff oben dreht es (rastet bei 0°, 90° und 180° ein, mit der Umschalttaste in 15°-Schritten). Über dem Blatt steht dann eine Leiste mit Reglern für Grösse und Drehung, «Gerade», «Entfernen» und «Fertig»; mit der Tastatur verschieben die Pfeiltasten, Plus und Minus ändern die Grösse. Sobald man ein Bild anfasst, bleiben alle Bilder, wo sie sind – auch wenn sich Wörter oder Titel ändern (die Grösse des Gitters bleibt dabei gleich); neue Bilder kommen in die freien Lücken um sie herum. Das zuletzt angeklickte Bild liegt zuoberst. Liegt ein Bild über dem Gitter, dem Titel oder den Hinweisen, kommt ein Hinweis; «Bilder automatisch verteilen» setzt alle wieder an die freien Flächen. Lösungsblatt, PDF und Bild zeigen die Bilder genau so, gedreht und ohne Rahmen und Griffe.
- **Blatt:** alles eingemittet – Titel, Anleitung, Gitter und die beiden Hinweis-Spalten – mit gut 26 bis 34 Pixel Abstand zum Blattrand (am Bildschirm steht auch das Blatt mittig in der Spalte); Hinweise «Waagrecht» und «Senkrecht», auf Wunsch mit Anzahl Buchstaben; Titel und Anleitung wählbar; «Lösung zeigen»; Lösungsblatt (gleicher Aufbau, Bilder am gleichen Platz); PDF oder Bild.

### Triomino

(Früher «Trimino»; alte Links …/#trimino öffnen den Triomino.)


Dreieckige Spielsteine, die so aneinandergelegt werden, dass aufeinandertreffende Seiten zusammenpassen (Aufgabe und Ergebnis, Wort und Übersetzung). Alles entsteht direkt im Browser.

- **Formen:** Dreieck klein (9 Teile, 9 Paare), Stern (12 Teile, 12 Paare), Dreieck gross (16 Teile, 18 Paare), Sechseck (24 Teile, 30 Paare) – im Dreiecksgitter berechnet; Innenkanten tragen die Paare.
- **Fach zuerst:** Mathe, Englisch, Französisch oder Eigene Paare. Die Mathe-Themen und ihre Einstellungen erscheinen erst, wenn Mathe gewählt ist (das zuletzt gewählte Thema bleibt beim Wechseln erhalten).
- **Mathe (fertig erzeugt):** *Rechnen* mit Plus, Minus, Mal, Geteilt (frei kombinierbar) bis 10, 20, 100 oder 1000 · *Dezimalbrüche* (Zehntel, bis Hundertstel, bis Tausendstel: 7/100 ↔ 0.07) · *Stellenwerte* (Zahl mit farbiger Ziffer ↔ «4 Hundertstel»; Dezimalzahlen, ganze Zahlen oder gemischt) · *Brüche in Worten* («drei Fünftel» ↔ 3/5; bis Sechstel, Zehntel oder Zwölftel, bei Bedarf auch unechte Brüche). Dezimaltrennzeichen Punkt oder Komma. Kein Ergebnis kommt doppelt vor; wo das nicht möglich ist (z. B. Plus bis 10 hat nur 9 Ergebnisse), weist ein Hinweis darauf hin.
- **Englisch, Französisch, eigene Paare:** Zeilen mit zwei Feldern (links Deutsch, rechts Englisch bzw. Französisch; bei eigenen Paaren Begriff und Gegenstück). Unten steht immer eine leere Zeile; sobald man hineinschreibt, kommt eine neue dazu. Eingabetaste: links → rechts → nächste Zeile; × löscht eine Zeile. Eine eingefügte Liste (Tabellen aus Excel/Word oder Zeilen wie «Hund = dog», auch «;» oder « - ») wird auf Zeilen verteilt. **Automatisch übersetzen:** Bei Englisch und Französisch genügt ein Wort auf einer Seite – beim Verlassen des Feldes erscheint die Übersetzung im anderen Feld, in beide Richtungen (orange hinterlegt, bis man sie ändert; französische Nomen mit Artikel, britisches Englisch). Auf der Website über `api/uebersetzen.php` (Mistral, gleicher Schlüssel wie die Wortvorschläge, Zwischenspeicher je Wort, Grenzen pro Stunde und Tag), im Claude-Artefakt über Claude; ohne beides füllt man beide Felder selbst. Ein Zähler zeigt, wie viele Paare eingegeben sind und wie viele jede Form braucht. Doppelte Wörter werden nicht verwendet; zusätzliche Paare dienen auf Wunsch als Ablenker.
- **Aussenkanten:** leer (leichter, Randteile erkennbar) oder mit Ablenkern (Aufgaben/Lösungen, die nirgends passen).
- **Blatt:** Schnittbogen – die Teile liegen in der Form, aber vertauscht und gedreht: Man schneidet entlang gemeinsamer Linien, und der Bogen verrät die Lösung nicht. Dazu das Lösungsblatt (fertige Figur). Ecken farbig (Farbe wählbar), Titel und Anleitung wählbar, PDF. Die Schrift passt sich pro Teil an: alle drei Texte gleich gross, so gross wie möglich, ohne sich in den Ecken zu berühren; lange Begriffe auch zweizeilig. «Verwendete Paare» listet alle Paare zum Kontrollieren.

### Fleissner-Schablone

Ein eigener Text wird durch die Löcher einer Drehschablone in ein Quadrat geschrieben: Zeile für Zeile durch die Löcher, dann die Schablone eine Vierteldrehung im Uhrzeigersinn drehen, viermal. Lesen kann den Text nur, wer die passende Schablone hat – darum gehört sie immer dazu.

- **Dank:** Der Code stammt aus dem Excel-Generator von Jasmine Filippi (grafisch angepasst von myEscapeBox); das steht unten auf der Seite des Generators.
- **Grössen:** 4 × 4 (16 Buchstaben) und 6 × 6 (36) mit genau den Lochmustern aus dem Excel-Generator von Jasmine Filippi (myEscapeBox) – passend zu den Holzschablonen; geprüft: gleiche Anordnung wie im Excel.
- **Feste Grösse wie im Excel:** Felder quadratisch, 37 pt (13,05 mm), wie die Zeilen im Excel – nicht einstellbar. Die Blätter sind genau 703 Pixel breit, das PDF legt sie auf 186 mm – so stimmen die Millimeter (geprüft im PDF). Raster und Schablone sind SVG-Grafiken mit Breite und Höhe als Attribute in mm. Auf dem Schablonenblatt steht eine Kontrolllinie zum Nachmessen; beim Drucken «Tatsächliche Grösse» wählen.
- **Text:** Grossbuchstaben, Ä/Ö/Ü bleiben ein Feld, ß → SS, Ziffern bleiben, Leer- und Satzzeichen fallen weg. Zähler; freie Felder mit Zufallsbuchstaben (neu würfelbar) oder X; ist der Text zu lang, kommt ein Hinweis.
- **Blätter:** Arbeitsblatt (Buchstabenfeld, Anleitung, auf Wunsch eine Linie zum Aufschreiben der Lösung – bei 6 × 6 zwei), Lösungsblatt (Buchstaben farbig nach Stellung 1–4, aufgefüllte grau, Lösung auf der Linie), Schablone zum Ausschneiden (graue Löcher, Rand mit den Ziffern 1–4: die Ziffer oben zeigt die Stellung). Schablone auch einzeln als PDF. Ist «Lösung zeigen» eingeschaltet, wird es vor dem PDF ausgeschaltet.

### Kettenrätsel

(Verbinde-Rätsel) Kreise mit Wörtern oder Rechnungen. Wer bei START beginnt und jedes Wort mit seinem Partner in einem anderen Kreis verbindet, zeichnet einen Buchstaben oder eine Zahl.

- **Ablauf:** zuerst Buchstabe oder Zahl wählen, dann das Zeichen (A–Z oder 0–9), dann das Fach, dann die Paare.
- **Formen:** alle 26 Buchstaben und 10 Ziffern im Raster 4 × 6, geprüft (Kreise mindestens 1,4 Einheiten auseinander, keine Linie nahe an einem fremden Kreis). Jede Linie ist ein Paar; jeder Kreis der Form hat ein Wort je Linie (bei Verzweigungen wie A, B, E, K drei Wörter). Erster Punkt = START, Strichenden = ENDE; X hat zwei Teile, also zweimal START.
- **Felder liegen zur Linie hin:** Die Trennlinien im Kreis sind immer waagrecht. Jedes Wort kommt in das Feld, das seiner Linie am nächsten liegt (Zuordnung über alle Felder des Kreises zugleich), und die Linie beginnt am Rand dieses Feldes – nie muss ein Wort mit dem gegenüberliegenden Feld verbunden werden. Gehen beide Linien in dieselbe Richtung (z. B. unten am V), beginnt jede seitlich an ihrem Feld. Die Lösungslinien führen von Feldrand zu Feldrand und gehen durch keinen Kreis (geprüft mit allen 36 Zeichen, mit und ohne drei Felder).
- **Kreise mit drei Feldern** (wählbar): Ausgeschaltet gibt es nur zweigeteilte Kreise – Buchstaben mit Verzweigung oder Ring (A, B, D, E, F, H, K, O, P, Q, R, T, Y, 0, 6, 8, 9) haben dann eine vereinfachte Form: Querstriche stossen nicht an, Ringe haben eine kleine Lücke (Tabelle `ZEICHEN_EINFACH`, gleich geprüft).
- **Ablenker «fies» angeordnet:** Zuerst auf Plätze, an denen drei andere Buchstaben oder Zahlen ihre Kreise hätten, dann möglichst nahe bei der Form – so verrät die Anordnung die Form nicht.
- **Eindeutig:** Jedes Wort auf dem Blatt passt zu höchstens einem anderen. Ablenker-Kreise bekommen von übrigen Paaren nur je ein Wort – ihr Partner steht nirgends. Mathe: lauter verschiedene Ergebnisse (Plus, Minus, Mal, Geteilt; bis 20, 100, 1000). Getestet mit allen Zeichen und vielen Zufallsständen. Bei eigenen Wörtern kann das Programm nur gleiche Wörter erkennen – dass kein Wort *inhaltlich* zu einem zweiten passt (z. B. ein weiteres Reimwort), muss man selbst beachten.
- **Mathe** (erzeugt, alle Werte verschieden): *Plus & Minus* (bis 20, 100, 1000) · *Einmaleins* (kleines 1 × 1 mit den Reihen 1–10 oder grosses 1 × 1 mit den Reihen 11–20, Reihen frei wählbar; Mal und/oder Geteilt) · *Dezimalzahlen* (Bruch ↔ Dezimalzahl, Zehntel bis Tausendstel, kleiner oder grösser als 1, Punkt oder Komma) · *Brüche* (in Worten ↔ Bruch, echte oder unechte, bis Sechstel/Zehntel/Zwölftel; keine gleichwertigen Brüche im selben Rätsel). Brüche stehen übereinander (Zähler, Bruchstrich, Nenner); dafür sind die Kreise etwas grösser. Lange Wörter mit Leerzeichen werden im Kreis auf zwei Zeilen umbrochen.
- **Deutsch:** *Reimwörter*, *Einzahl – Mehrzahl* und *Gegenteile* werden gleich vorgeschlagen (eingebaute Listen; bei den Reimwörtern stammt jedes Paar aus einer anderen Reimfamilie, bei der Mehrzahl nur Wörter mit anderer Mehrzahlform), so viele, wie Form und Ablenker brauchen; «Andere Vorschläge» mischt neu, ändern und ergänzen geht jederzeit. Dazu *Eigene Paare*.
- **Englisch, Französisch:** eigene Paare mit automatischer Übersetzung. Ablenker-Kreise: keine, wenige, einige, viele; zufällig verteilt, nie auf eine Linie. «Neu anordnen» mischt neu.
- **Blatt:** A4 (Zeichenfläche 639 × 800 Pixel), Antwortlinie, «Lösung zeigen» (Linien und Lösung), Lösungsblatt, PDF.
- Die Paar-Eingabe (Zeilen, Einfügen, automatische Übersetzung) ist der gemeinsame Baustein `gemeinsam/paarliste.js`, den auch das Triomino nutzt.

### Drehscheiben

Konzentrische Scheiben zum Ausschneiden (wie gebastelte Drehscheiben mit Musterklammer): Die Zahlen, Buchstaben, ein Wort oder ein Satz stehen auf den Scheiben, mit dem Kopf nach aussen, und reichen über alle Ringe. Jede Scheibe trägt nur ihr Stück – wer die Scheiben richtig dreht, sieht die Zeichen.

- **Zahlen oder Buchstaben:** 1 bis 8, zufällig («Andere») oder selbst eingetippt («3 5 8»; auch Ä, Ö, Ü), rundum verteilt. «Anzahl» ergänzt zufällige Zeichen oder lässt welche weg. Zufällig kommen nie 6 und 9 oder M und W zusammen (auf dem Kopf gleich); bei eigenen Zeichen gibt es einen Hinweis.
- **Wort:** bis 12 Buchstaben (Leerzeichen trennen Wörter), nebeneinander und im Uhrzeigersinn lesbar. Zusammen nehmen sie höchstens 300° ein, damit man sieht, wo das Wort beginnt; die Buchstaben sind so gross, wie es dafür geht. «Andere» schlägt ein Wort vor. In der Lösung steht das Wort oben in der Mitte.
- **Satz:** bis 80 Zeichen, in waagrechten Zeilen von oben nach unten, so gross wie möglich (Zeilenhöhe 1.25 × Schrift). Jede Zeile reicht so weit, wie der Kreis an ihrer engsten Stelle breit ist; wo sie am Deckel vorbeiführt, hat sie einen linken und einen rechten Teil. Der Deckel ist dabei kleiner (24 mm), und die Ringe teilen den Bereich, den der Text wirklich belegt – so trägt auch die grösste Scheibe genug davon. Farben gelten hier je Wort; «Andere» schlägt einen Satz vor.
- **Farben:** Jedes Zeichen hat ein eigenes Farbfeld (Farbwähler); «Bunt» färbt alle verschieden, «Alle schwarz» setzt zurück. Die Farben gelten auf der Kopiervorlage, am Bildschirm und im Lösungsblatt.
- **Kreise:** 3 (leicht) bis 6 (schwer), jeweils mit dem Deckel; der Drehpfeil darauf lässt sich ausblenden. Der grösste Kreis misst immer genau 12 cm. Die Zeichen sind so gross wie möglich, ohne sich innen zu berühren (je mehr Zeichen, desto kleiner und weiter aussen; der Deckel wird entsprechend grösser). Die Ringe teilen die Höhe der Zeichen gleichmässig. Unter der nächstkleineren Scheibe reicht jedes Stück 1.5 mm weiter, damit beim Ausschneiden keine Lücken entstehen. Bei Ringen unter 4.5 mm kommt ein Hinweis. Auf Wunsch *Punkte als Ablenkung*.
- **Kopiervorlage:** Die Kreise in Originalgrösse (1 mm = 703/186 Pixel wie im PDF; Seite 703 × 1031 Pixel, damit das PDF nicht verkleinert), mit Schnittlinie, Mittelpunkt und gestricheltem Platz des nächstkleineren Kreises (ohne Nummern). Gut zum Ausschneiden: 8 mm Rand auf der Seite (beim Drucken kommen 12 mm dazu) und mindestens 6 mm zwischen den Kreisen – so viel mehr (bis 25 mm), wie auf gleich vielen Seiten Platz hat; jede Seite ist waagrecht und senkrecht eingemittet. Unten der Hinweis, in Originalgrösse (100 %) zu drucken. Titel und Bastelanleitung wählbar; Lösungsblatt mit den richtig gedrehten Scheiben; PDF.
- **Am Bildschirm drehen:** Die Scheiben liegen verdreht aufeinander und lassen sich mit Maus, Finger oder Tastatur (Tabulator, Pfeiltasten) drehen; nahe an der richtigen Stellung rasten sie ein, und am Schluss kommt «Geschafft!». «Lösung zeigen» dreht alle an ihren Platz, «Neu mischen» verteilt Zeichen und Drehung neu.

### Code-Schloss

Ein Feld mit Buchstaben (blau) und Emojis, daneben kleine Kästchen (2 × 2 Felder, 3 × 3 Punkte): An einem Punkt sitzt ein Emoji, an einem anderen das Schloss 🔐. Man sucht das Emoji im Feld und geht von dort genau so weit wie im Kästchen vom Emoji zum Schloss – nach oben, unten, links oder rechts. Dort steht ein Buchstabe. Die Emojis haben verschiedene Farben; die Farbpunkte beim Code (in Regenbogen-Reihenfolge rot, orange, gelb, grün, blau, violett) geben die Reihenfolge der Buchstaben an. So entsteht der Code fürs Zahlenschloss.

- **Code:** 3 bis 6 Buchstaben oder Ziffern (so viele, wie das Thema Farben hat); «Andere» schlägt ein Wort vor.
- **Emoji-Themen** mit je einem Emoji pro Farbe, das auf allen Geräten deutlich diese Farbe hat: *Früchte* 🍓🍊🍋🍏🫐🍇, *Gemüse* 🍅🥕🌽🥦🍆, *Tiere* 🐞🦊🐥🐸🐳, *Bücher* 📕📙📒📗📘, *Herzen* ❤️🧡💛💚💙💜, *Formen* 🔴🟠🟡🟢🔵🟣. Die übrigen Felder bekommen andere Emojis desselben Themas – nie eines der Ziel-Emojis, so steht jedes genau einmal im Feld.
- **Feld:** 5 × 5 (leicht), 6 × 6 oder 7 × 7 (schwer), etwa zur Hälfte Emojis. Jedes Kästchen bekommt einen eigenen Weg (Ecken und Seitenmitten, in alle Richtungen); die Kästchen stehen nicht in Code-Reihenfolge. Die Buchstaben des Codes kommen im Feld auch sonst vor, damit sie nichts verraten. Geprüft: jedes Kästchen führt zum richtigen Zeichen.
- **Blatt:** Feld, Kästchen, Code-Feld mit Farbpunkten und Linien, ein gezeichnetes Zahlenschloss; Titel und Anleitung wählbar. Lösung (am Bildschirm und Lösungsblatt): Ziel-Emojis mit Ring in ihrer Farbe, Ziel-Buchstaben gelb, Buchstabe beim Schloss, Emojis über den Punkten, der Code im Schloss 🥳. PDF.
- **Am Bildschirm lösen:** je Farbpunkt ein Feld; falsche Zeichen werden rot, beim richtigen Code: «Geschafft! 🥳 Das Schloss ist offen.»
- Die Emojis kommen aus der Emoji-Schrift des Geräts (auch im PDF). 🫐 gibt es erst seit 2020 – auf sehr alten Geräten fehlt es.

## Aufbau

```
index.html                      Rätsellabor: Kopfleiste mit Menü, Startseite, Platz für den Generator
gemeinsam/labor.css             gemeinsames Aussehen (Farben, Schriften, Kopfleiste, Menü, Karten, Knöpfe)
gemeinsam/labor.js              Menü, Startseite und Wechsel zwischen den Generatoren
gemeinsam/wortwahl.js           Baustein «Thema und Wörter»: Wortarten, KI-Vorschläge, eingebaute Listen, Wort-Chips
gemeinsam/gitter.js             Baustein «Buchstabengitter»: Zeichnen, Markieren, Füllbuchstaben
api/woerter.php                 Server-Teil (PHP): fragt Mistral für Wortvorschläge; Schlüssel in api/geheim.php (entsteht beim Hochladen)
api/uebersetzen.php             Server-Teil (PHP): übersetzt Wörter für das Triomino (Deutsch ↔ Englisch/Französisch), gleiche KI und gleicher Schlüssel
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
raetsel/emoji-rechnen/          der Generator «Emoji-Rechnen» (Kern: Rätsel bauen und prüfen; Oberfläche)
raetsel/text-spiegeln/          der Generator «Text spiegeln» (Kern: Unicode-Spiegelung; Oberfläche zum Kopieren)
raetsel/puzzle/                 der Generator «Puzzle»
  puzzle-spiel.js               das Spiel selbst (Teile, Mischen, Ziehen, Einrasten); auch für die Puzzle-Seite /P/<ID>/
  puzzle.js                     Oberfläche: Bild, Schwierigkeit, QR-Code
raetsel/geheimschrift/          der Generator «Geheimschriften» (Kern: Verschlüsseln; Zeichen, Schlüssel, Caesar-Scheibe)
raetsel/kreuzwort/              der Generator «Kreuzworträtsel» (Kern: Anordnen, freie Flächen für Bilder; Seite, Bilder, Lösung)
raetsel/fleissner/              der Generator «Fleissner-Schablone» (Kern: Lochmuster, Drehen, Verschlüsseln; Raster und Schablone in mm)
raetsel/kette/                  der Generator «Kettenrätsel» (Kern: Formen A–Z und 0–9, Paare belegen, Eindeutigkeit, Ablenker verteilen)
raetsel/codeschloss/            der Generator «Code-Schloss» (Kern: Themen, Wege in den Kästchen, Feld füllen)
raetsel/drehscheiben/           der Generator «Drehscheiben» (Kern: Grösse der Zeichen und Ringe, Wort, Satz setzen, Kreise auf Seiten verteilen)
raetsel/triomino/               der Generator «Triomino» (Kern: Formen, Kanten, Aufgaben, Belegung; Zeichnen mit Schriftanpassung)
gemeinsam/extern/qrcode.js      QR-Code-Bibliothek (qrcode-generator 2.0.4, MIT-Lizenz, unverändert; Lizenz daneben)
gemeinsam/extern/jsQR.js        QR-Leser zum Prüfen gestalteter Codes (jsQR 1.4.0, Apache-2.0, unverändert; Lizenz daneben)
gemeinsam/extern/html2canvas.min.js, jspdf.umd.min.js   für den PDF-Download (html2canvas 1.4.1, jsPDF 2.5.2, MIT, unverändert; Lizenzen daneben)
B/                              Botschaftsseiten /B/<ID>/ (werden auf dem Server angelegt)
api/botschaft.php               Server-Teil (PHP): speichert Botschaften für QR-Codes; Anzeige: api/botschaft-seite.php
P/                              Puzzle-Seiten /P/<ID>/ (werden auf dem Server angelegt)
api/puzzle.php                  Server-Teil (PHP): speichert Puzzles für QR-Codes; Puzzle-Seite: api/puzzle-seite.php
.htaccess                       Server-Regel: Seite, Skripte und Stile nicht ungeprüft aus dem Browser-Cache nehmen
```

**Neu laden = frisch anfangen (gilt für alle Generatoren, auch künftige):**

- Beim Laden der Seite löscht `Labor.start()` alle gespeicherten Eingaben und Einstellungen (`sessionStorage` und `localStorage`). Solange die Seite offen ist, bleiben Eingaben beim Wechsel zwischen den Generatoren erhalten.
- Der Server schickt Seite, Skripte und Stile mit `Cache-Control: no-cache` (`.htaccess`): Der Browser fragt bei jedem Laden nach, ob es eine neue Version gibt.
- Beim Hochladen hängt der GitHub-Workflow eine Versionsnummer an alle Skripte und Stile (`…/labor.js?v=1a2b3c4d`, auch für die Stile der Generatoren). Nach jeder Änderung lädt der Browser so sicher die neuen Dateien.
- Ist die Seite schon offen, wenn eine neue Version hochgeladen wird (das Labor wechselt zwischen den Generatoren ohne Neuladen), merkt sie das: Der Workflow schreibt die Versionsnummer in `version.txt`, die Seite fragt sie ab, wenn man zu ihr zurückkehrt und alle 10 Minuten. Bei einer neuen Version erscheint ein Hinweis «Neu laden», und der nächste Wechsel zu einem Generator lädt die Seite von selbst neu.

Kein Build-Schritt; ausser den Schriften Fredoka, Inter und Andika von Google Fonts und den mitgelieferten Bibliotheken in `gemeinsam/extern/` keine Abhängigkeiten. Für Wortvorschläge fragt die Seite den eigenen Server (`api/woerter.php`), der Mistral fragt. Die Seite wechselt über die Adresse: `…/#zahlen-suchsel`, `…/#suchsel`, `…/#rebus`, `…/#qr-code`, `…/#labyrinth`, `…/#emoji-rechnen`, `…/#text-spiegeln`, `…/#puzzle`, `…/#geheimschrift`, `…/#triomino`, `…/#kreuzwort`, `…/#fleissner`, `…/#kettenraetsel`, `…/#drehscheiben` oder `…/#code-schloss` öffnet direkt einen Generator, `…/#start` die Startseite.

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

Der neue Generator erscheint dann automatisch im Menü und auf der Startseite. Gemeinsame Bausteine wie `.karte`, `.btn`, Eingabefelder und `.meldung` stehen in `gemeinsam/labor.css` bereit. Bausteine zum Wiederverwenden: `Wortwahl` (Thema und Wörter mit Vorschlägen) und `Gitter` (Buchstabengitter). In `gemeinsam/labor.js` gibt es Helfer für alle Generatoren: `Labor.pdfKnopf(knopf, auftrag, fehler)` und `Labor.pdfName(art, titel)` (PDF-Download), `Labor.blattSchalterHtml()` und `Labor.blattSchalter(bereich, opt, nachher)` (Schriftwahl, Titel und Arbeitsanweisung an/aus; `nachher` zeichnet das Blatt neu, auch wenn die Schrift wechselt), `Labor.blattSchrift(art)` (gewählte Schrift für Messungen), `Labor.imArtefakt()`, `Labor.claude(name)` (Claude-Fähigkeiten im Artefakt), `Labor.blattDatei(titel, html)` (Arbeitsblatt als HTML-Datei) und `Labor.esc()`.

Jeder neue Generator bekommt: einen Knopf «PDF herunterladen» (statt Drucken) mit `Labor.pdfKnopf`, die Schalter für Titel und Arbeitsanweisung (mit der Schriftwahl), für Text auf dem Blatt die Schrift-Variablen statt fester Schriften, Druckregeln (`@media print`) für sein Blatt – sie gelten auch für das PDF – und keine Beispieltexte in Eingabefeldern.

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
