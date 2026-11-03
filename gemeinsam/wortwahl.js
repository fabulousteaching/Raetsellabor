/* Rätsellabor – gemeinsamer Baustein «Thema und Wörter»
   Thema eingeben, Wortvorschläge holen, Vorschläge anklicken, eigene Wörter ergänzen.
   Woher die Vorschläge kommen: zuerst die eingebauten Themen; sonst aus dem Internet (Nomen aus dem passenden
   Wikipedia-Artikel, ohne Claude). Im Claude-Artefakt ist das Internet gesperrt – dort hilft Claude aus.
   Ein Generator bindet den Baustein so ein:
     html:  Wortwahl.html(1)                                   → Karte «Thema und Wörter» (Schritt 1)
     start: var ww = Wortwahl.verbinde(bereich, {
              zustand: st,                                    // { titel:'', woerter:[] } wird direkt verändert
              norm: function(w){ … },                         // Wort → Vergleichsform (z. B. Grossbuchstaben)
              geaendert: function(notiz){ … },                // nach jeder Änderung an Wörtern
              titelGeaendert: function(){ … } });            // nach jeder Änderung am Thema
            ww.zeichne();                                     // Wort-Chips anzeigen */
var Wortwahl = (function(){
  'use strict';

  var THEMEN = [
    { name:'Tiere', alias:['tier', 'haustiere', 'zoo', 'bauernhof'], w:'Hund Katze Pferd Kuh Schaf Ziege Schwein Hase Maus Fuchs Wolf Bär Löwe Tiger Elefant Giraffe Zebra Affe Igel Eule Adler Frosch Delfin Krokodil Pinguin Biber Hirsch Dachs Esel Kamel Papagei Schildkröte' },
    { name:'Fussball', alias:['fußball', 'fussballspiel', 'soccer', 'kicken'], w:'Tor Ball Torwart Stürmer Verteidiger Schiedsrichter Elfmeter Penalty Abseits Ecke Freistoss Trikot Stadion Rasen Pfiff Karte Fans Pokal Meister Liga Trainer Mannschaft Kopfball Flanke Dribbling Anstoss Halbzeit Tribüne Mittelfeld Fussballschuh Schienbeinschoner Weltmeister' },
    { name:'Obst und Gemüse', alias:['obst', 'gemüse', 'früchte', 'frucht'], w:'Apfel Birne Banane Kirsche Traube Erdbeere Himbeere Pflaume Zitrone Orange Melone Ananas Mango Kiwi Karotte Gurke Tomate Paprika Zwiebel Kartoffel Salat Spinat Kürbis Lauch Erbse Bohne Brokkoli Radieschen Sellerie Knoblauch Aprikose Feige' },
    { name:'Berufe', alias:['beruf', 'arbeit'], w:'Bäcker Lehrerin Arzt Pilot Koch Maler Gärtner Polizist Förster Bauer Metzger Schreiner Elektriker Pflegerin Coiffeur Fischer Kellner Zahnarzt Tierarzt Richter Journalist Architekt Mechaniker Floristin Sänger Schneider Apotheker Postbote Dachdecker Informatiker Hebamme Zimmermann' },
    { name:'Sport', alias:['sportarten'], w:'Fussball Tennis Handball Hockey Golf Rudern Segeln Skifahren Schwimmen Turnen Boxen Judo Reiten Klettern Laufen Radfahren Volleyball Basketball Badminton Curling Biathlon Fechten Tischtennis Surfen Tauchen Rugby Eishockey Snowboard Kanu Yoga Schwingen Unihockey' },
    { name:'Musikinstrumente', alias:['musik', 'instrumente', 'instrument'], w:'Gitarre Klavier Geige Flöte Trompete Posaune Trommel Harfe Cello Orgel Tuba Oboe Fagott Klarinette Saxofon Bratsche Kontrabass Akkordeon Xylofon Banjo Ukulele Mundharmonika Alphorn Hackbrett Triangel Pauke Zither Dudelsack Blockflöte Schlagzeug Horn Tamburin' },
    { name:'Länder', alias:['land', 'staaten', 'geografie', 'europa'], w:'Schweiz Deutschland Österreich Italien Frankreich Spanien Portugal Belgien Polen Ungarn Schweden Norwegen Finnland Dänemark Irland Island Griechenland Türkei Kroatien Rumänien Japan China Indien Brasilien Kanada Mexiko Ägypten Kenia Peru Chile Australien Marokko' },
    { name:'Wetter', alias:['klima', 'wetterlage'], w:'Regen Sonne Wolke Wind Sturm Nebel Schnee Hagel Gewitter Blitz Donner Regenbogen Frost Tau Glatteis Hitze Orkan Tornado Föhn Bise Lawine Schauer Graupel Dunst Thermometer Hochdruck Tiefdruck Wetterbericht Nieselregen Schneeflocke Sonnenschein Kälte' },
    { name:'Schule', alias:['schulsachen', 'schulzimmer', 'unterricht'], w:'Heft Buch Füller Bleistift Radiergummi Lineal Schere Leim Pinsel Wandtafel Kreide Pause Lehrerin Klasse Zeugnis Prüfung Hausaufgabe Stundenplan Turnhalle Pult Zirkel Atlas Etui Spitzer Mathematik Deutsch Musik Zeichnen Schulweg Ferien Pausenplatz Wörterbuch' },
    { name:'Körper', alias:['körperteile', 'mensch', 'menschlicher körper'], w:'Kopf Auge Nase Mund Ohr Hals Schulter Arm Ellbogen Hand Finger Daumen Bauch Rücken Bein Knie Fuss Zehe Herz Lunge Magen Leber Niere Gehirn Haut Knochen Muskel Zahn Zunge Wimper Stirn Kinn' },
    { name:'Verkehr', alias:['fahrzeuge', 'fahrzeug', 'mobilität'], w:'Auto Bus Zug Tram Velo Motorrad Lastwagen Traktor Flugzeug Schiff Fähre Helikopter Rakete Taxi Ampel Strasse Brücke Tunnel Bahnhof Flughafen Hafen Kreisel Trottoir Fahrplan Gondel Seilbahn Roller Kutsche Ballon Lokomotive Zebrastreifen Autobahn' },
    { name:'Weltraum', alias:['all', 'weltall', 'universum', 'planeten', 'astronomie'], w:'Sonne Mond Erde Mars Venus Merkur Jupiter Saturn Uranus Neptun Stern Komet Planet Galaxie Rakete Astronaut Satellit Meteorit Krater Teleskop Raumstation Umlaufbahn Asteroid Sternbild Milchstrasse Schwerkraft Raumanzug Mondlandung Polarstern Sonnensystem Weltall Sternschnuppe' },
    { name:'Pflanzen und Wald', alias:['pflanzen', 'wald', 'bäume', 'blumen'], w:'Baum Blume Tanne Fichte Buche Eiche Birke Ahorn Linde Moos Farn Pilz Rose Tulpe Nelke Lilie Sonnenblume Löwenzahn Klee Efeu Kaktus Wurzel Stamm Rinde Blatt Knospe Blüte Samen Zapfen Lichtung Waldboden Brombeere' },
    { name:'Essen und Küche', alias:['essen', 'küche', 'lebensmittel', 'kochen'], w:'Brot Butter Käse Milch Joghurt Honig Nudeln Reis Suppe Pizza Salat Kuchen Gipfeli Rösti Fondue Raclette Müesli Wurst Schinken Pfanne Topf Löffel Gabel Messer Teller Tasse Ofen Herd Rezept Gewürz Schokolade Zopf' },
    { name:'Kleidung', alias:['kleider', 'mode'], w:'Hose Hemd Jacke Mantel Pullover Rock Kleid Socke Schuh Stiefel Mütze Schal Handschuh Gürtel Krawatte Bluse Weste Pyjama Badehose Sandale Kappe Hut Regenjacke Strumpfhose Unterhemd Turnschuh Kapuze Knopf Reissverschluss Anzug Schürze Halstuch' },
    { name:'Farben und Formen', alias:['farben', 'formen', 'geometrie'], w:'Rot Blau Gelb Grün Violett Rosa Braun Schwarz Weiss Grau Türkis Silber Gold Kreis Dreieck Quadrat Rechteck Kugel Würfel Kegel Zylinder Pyramide Oval Raute Stern Herz Spirale Linie Punkt Fünfeck Sechseck Prisma' },
    { name:'Meer und Wasser', alias:['meer', 'wasser', 'see', 'ozean'], w:'Meer See Fluss Bach Welle Strand Insel Muschel Koralle Qualle Fisch Wal Robbe Krebs Seestern Anker Leuchtturm Boot Segel Hafen Ebbe Flut Ufer Quelle Wasserfall Gletscher Tropfen Algen Möwe Tintenfisch Seepferdchen Delfin' },
    { name:'Jahreszeiten', alias:['herbst', 'winter', 'frühling', 'sommer', 'jahreszeit'], w:'Frühling Sommer Herbst Winter Kastanie Eichel Laub Drachen Ernte Kürbis Nebel Pilz Igel Eichhörnchen Vogelzug Regenschirm Gummistiefel Marroni Laterne Schneemann Schlitten Knospe Badesee Glace Gewitter Blütenduft Osterhase Maikäfer Sonnenhut Erntedank Raureif Eiszapfen' },
    { name:'Weihnachten', alias:['advent', 'weihnacht', 'winterfest'], w:'Advent Kerze Krippe Engel Stern Geschenk Tannenbaum Christkind Lebkuchen Guetzli Schlitten Rentier Schneemann Glocke Kugel Lametta Adventskranz Samichlaus Schmutzli Grittibänz Zimtstern Mandarine Nüsse Krippenspiel Lichterkette Bescherung Hirten Ochse Esel Weihnachtsmarkt Tannzapfen Geschenkpapier' },
    { name:'Steinzeit', alias:['urgeschichte', 'altsteinzeit', 'jungsteinzeit', 'steinzeitmenschen'], w:'Faustkeil Mammut Höhle Feuer Speer Jäger Sammler Fell Knochen Beeren Pfeil Bogen Nadel Hirsch Zelt Rentier Harpune Feuerstein Höhlenbild Wollnashorn Sippe Schaber Speerschleuder Bernstein Pfahlbau Getreide Töpfern Sichel Mahlstein Langhaus Webstuhl Steinbeil' },
    { name:'Römer', alias:['römerzeit', 'rom', 'antike', 'römisches reich'], w:'Kolosseum Aquädukt Legionär Toga Therme Forum Tempel Senat Kaiser Gladiator Amphore Mosaik Villa Strasse Münze Latrine Tunika Wagen Schild Arena Zenturio Sklave Konsul Triumphbogen Kastell Helm Sandalen Galeere Lorbeerkranz Hypokaustum Abakus Wölfin' },
    { name:'Mittelalter', alias:['ritter', 'burg', 'ritterzeit'], w:'Burg Ritter König Königin Knappe Page Turnier Lanze Schwert Rüstung Wappen Zugbrücke Burggraben Bergfried Kloster Mönch Nonne Markt Händler Bauer Zunft Handwerker Pest Kathedrale Gaukler Minnesänger Pranger Stadtmauer Schmied Kogge Burgfräulein Urkunde' }
  ];
  function schluessel(t){ return String(t || '').toLocaleLowerCase('de-CH').replace(/ß/g, 'ss').replace(/[^\p{L} ]/gu, '').replace(/\s+/g, ' ').trim(); }
  function findeThema(t){
    var k = schluessel(t);
    if (!k) return null;
    for (var i = 0; i < THEMEN.length; i++){
      var th = THEMEN[i];
      if (schluessel(th.name) === k || th.alias.some(function(a){ return schluessel(a) === k; })) return th;
    }
    return null;
  }
  function esc(t){ return String(t).replace(/[&<>"']/g, function(c){ return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]; }); }
  function mischen(a){ a = a.slice(); for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function teileListe(t){ return String(t).split(/[\n,;\t]+/).map(function(s){ return s.trim(); }).filter(Boolean); }
  function schreibweise(w){ w = String(w).trim(); return w && w === w.toLocaleLowerCase('de-CH') ? w.charAt(0).toLocaleUpperCase('de-CH') + w.slice(1) : w; }

  /* ---------- Vorschläge aus dem Internet: Nomen aus dem passenden Wikipedia-Artikel ----------
     Die deutsche Wikipedia erlaubt Abfragen direkt aus dem Browser (origin=*), ohne Anmeldung.
     Deutsche Nomen erkennt man an der Grossschreibung mitten im Satz; allgemeine Wörter werden ausgefiltert,
     Mehrzahl- und Genitivformen zur Grundform zusammengefasst, ß wird ss. */
  var API = 'https://de.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*&';
  var STOPP = {};
  ('jahr jahre jahren jahres jahrhundert jahrhunderts jahrhunderte jahrzehnt jahrzehnte zeit zeiten zeitpunkt teil teile teilen beispiel beispiele art arten ' +
   'weise ende anfang beginn begriff begriffe bezeichnung bezeichnungen name namen form formen fall fälle grund gründe bereich bereiche rahmen folge ' +
   'folgen seite seiten hälfte mitte stelle stellen zahl zahlen anzahl menge prozent million millionen milliarde milliarden mal verlauf entwicklung ' +
   'geschichte gegensatz unterschied unterschiede bedeutung möglichkeit möglichkeiten literatur weblinks einzelnachweise siehe sie ihr ihre ihnen ' +
   'januar februar märz april mai juni juli august september oktober november dezember montag dienstag mittwoch donnerstag freitag samstag sonntag ' +
   'herr frau deutschland schweiz österreich europa usa land länder welt person personen menschen leute thema themen wort wörter liste listen version ' +
   'gebiet gebiete ort orte platz gruppe gruppen typ typen sinne sinn verwendung zusammenhang ebene stand anteil höhe länge grösse gewicht ' +
   'regel regeln quelle quellen angaben angabe ergebnis ergebnisse aspekt aspekte rolle beispielsweise wikipedia artikel kapitel abschnitt ' +
   'bild bilder abbildung karte kategorie hinweis hinweise information informationen faktor faktoren prinzip methode problem probleme ' +
   'sekunde sekunden minute minuten stunde stunden tag tage tagen woche wochen monat monate monaten ' +
   'nähe umgebung struktur strukturen rand ränder rändern richtung ursache ursachen wirkung zustand vorgang prozess system systeme ' +
   'eigenschaft eigenschaften merkmal merkmale bestandteil bestandteile verbindung beziehung möglichkeit fläche flächen gesamt').split(' ').forEach(function(w){ STOPP[w] = 1; });
  function holeJson(url){
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, uhr = setTimeout(function(){ if (ctl) ctl.abort(); }, 9000);
    return fetch(url, ctl ? { signal:ctl.signal } : {}).then(function(r){ clearTimeout(uhr); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
      function(e){ clearTimeout(uhr); throw e; });
  }
  function seite(j){
    var p = j && j.query && j.query.pages && j.query.pages[0];
    if (!p || p.missing || p.invalid) return null;
    if (p.pageprops && 'disambiguation' in p.pageprops) return null;   // Begriffsklärung
    if (!p.extract || p.extract.length < 400) return null;
    return { titel:p.title, text:p.extract };
  }
  function artikel(titel){ return holeJson(API + 'action=query&redirects=1&prop=extracts|pageprops&ppprop=disambiguation&explaintext=1&titles=' + encodeURIComponent(titel)).then(seite); }
  function nomen(text, thema){
    var saetze = text.replace(/([.!?:;])\s+/g, '$1\n').split(/\n+/), mitte = {}, anfang = {}, z = {};
    saetze.forEach(function(satz){
      (satz.match(/[A-Za-zÄÖÜäöüß-]+/g) || []).forEach(function(w, i){
        if (!/^[A-ZÄÖÜ][a-zäöüß]+$/.test(w)) return;             // nur «Grossbuchstabe + Kleinbuchstaben», keine Abkürzungen
        var n = w.replace(/ß/g, 'ss');
        if (n.length < 3 || n.length > 15 || STOPP[n.toLocaleLowerCase('de-CH')]) return;
        if (i === 0) anfang[n] = (anfang[n] || 0) + 1; else mitte[n] = (mitte[n] || 0) + 1;
      });
    });
    var thw = schluessel(thema).split(' ');
    Object.keys(mitte).forEach(function(n){ if (thw.indexOf(n.toLocaleLowerCase('de-CH')) < 0) z[n] = mitte[n] + (anfang[n] || 0); });
    // Mehrzahl- und Genitivformen zur kürzeren Grundform zählen (Spielern → Spieler, Tore → Tor).
    // Nicht «-er»: sonst würde aus «Spieler» ein «Spiel».
    Object.keys(z).sort(function(a, b){ return a.length - b.length; }).forEach(function(b){
      if (!(b in z)) return;
      ['s', 'es', 'n', 'en', 'e', 'ns'].forEach(function(suf){ if ((b + suf) in z){ z[b] += z[b + suf]; delete z[b + suf]; } });
    });
    return Object.keys(z).sort(function(a, b){ return z[b] - z[a] || b.length - a.length; }).slice(0, 60);
  }
  var wikiCache = {};
  function wikipedia(thema){
    var k = schluessel(thema);
    if (wikiCache[k]) return wikiCache[k];
    wikiCache[k] = artikel(thema).then(function(s){
      if (s) return s;
      // sonst die ersten Suchtreffer der Reihe nach, bis einer ein richtiger Artikel ist
      return holeJson(API + 'action=query&list=search&srlimit=4&srsearch=' + encodeURIComponent(thema)).then(function(j){
        var treffer = ((j.query && j.query.search) || []).map(function(x){ return x.title; });
        function naechster(i){ return i >= treffer.length ? null : artikel(treffer[i]).then(function(s2){ return s2 || naechster(i + 1); }); }
        return naechster(0);
      });
    }).then(function(s){
      if (!s) return { woerter:[] };
      return { titel:s.titel, url:'https://de.wikipedia.org/wiki/' + encodeURIComponent(s.titel.replace(/ /g, '_')), woerter:nomen(s.text, thema) };
    }).catch(function(e){ delete wikiCache[k]; throw e; });
    return wikiCache[k];
  }

  /* Karte «Thema und Wörter» */
  function html(nr){
    return '<div class="karte">' +
      '<div class="karte-kopf"><span class="stufe" aria-hidden="true">' + (nr || 1) + '</span>' +
        '<div><h2>Thema und Wörter</h2><p>Thema eingeben und Wörter vorschlagen lassen. Vorschläge anklicken – eigene Wörter gehen immer.</p></div></div>' +
      '<label class="feld-label" for="titel">Thema</label>' +
      '<div class="zeile"><input type="text" id="titel" maxlength="60" placeholder="z. B. Fussball, Weltraum, Römer …" autocomplete="off">' +
        '<button type="button" class="btn soft" id="vorschlagen">Wörter vorschlagen</button></div>' +
      '<div class="vorschlaege" id="vorschlaege" hidden>' +
        '<div class="vorschlaege-kopf"><strong id="vorschlagTitel"></strong><span>' +
          '<button type="button" class="btn ghost klein" id="alleUebernehmen">Alle übernehmen</button>' +
          '<button type="button" class="btn ghost klein" id="mehrVorschlaege">Andere Vorschläge</button></span></div>' +
        '<div class="chips" id="vorschlagChips" role="group" aria-label="Vorgeschlagene Wörter"></div>' +
        '<p class="hinweis" id="vorschlagInfo" aria-live="polite"></p></div>' +
      '<div class="trenner"></div>' +
      '<div class="woerter-kopf"><span class="feld-label">Deine Wörter<span class="zaehler" id="wortZaehler"></span></span>' +
        '<button type="button" class="btn ghost klein" id="alleWeg">Alle entfernen</button></div>' +
      '<div class="chips gewaehlt" id="wortChips" aria-live="polite"></div>' +
      '<div class="zeile"><input type="text" id="eigenesWort" maxlength="200" placeholder="Eigenes Wort (mehrere mit Komma)" autocomplete="off" spellcheck="false" aria-label="Eigenes Wort hinzufügen">' +
        '<button type="button" class="btn" id="wortPlus">Hinzufügen</button></div>' +
      '<p class="hinweis" id="wortInfo" aria-live="polite"></p>' +
    '</div>';
  }

  function verbinde(bereich, o){
    var $ = function(s){ return bereich.querySelector(s); }, st = o.zustand, norm = o.norm, aus = false;
    var titel = $('#titel'), vorschlag = null, lauf = 0, kiAus = false;
    titel.value = st.titel || '';
    titel.addEventListener('input', function(){
      st.titel = titel.value; if (o.titelGeaendert) o.titelGeaendert();
      if (!vorschlag || !vorschlag.woerter.length) $('#vorschlaege').hidden = true;
    });
    titel.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); vorschlagen(false); } });
    $('#vorschlagen').addEventListener('click', function(){ vorschlagen(false); });

    function vorschlagen(mehr){
      var t = titel.value.trim(), token = ++lauf;
      if (!t){ titel.focus(); info('Gib zuerst ein Thema ein.'); return; }
      if (!mehr || !vorschlag || vorschlag.thema !== t) vorschlag = { thema:t, woerter:[], gezeigt:{}, pool:null };
      var th = findeThema(t);
      if (th && !vorschlag.pool){
        var rest = th.w.split(' ').filter(function(w){ return !vorschlag.gezeigt[norm(w)]; });
        if (rest.length >= 8 || !mehr){
          if (rest.length < 20) rest = rest.concat(th.w.split(' ').filter(function(w){ return rest.indexOf(w) < 0; }));
          zeige(mischen(rest).slice(0, 20), 'Themenliste'); return;
        }
      }
      if (vorschlag.pool){ ausPool(); return; }
      if (Labor.imArtefakt()){ claudeFragen(t, mehr, th, token); return; }   // im Artefakt ist das Internet gesperrt
      laedt(true, 'Passende Wörter werden in Wikipedia gesucht …');
      wikipedia(t).then(function(r){
        if (token !== lauf || aus) return;
        laedt(false);
        if (!r.woerter.length){
          if (th){ zeige(mischen(th.w.split(' ')).slice(0, 20), 'Themenliste'); return; }
          info('Zu «' + esc(t) + '» gibt es keinen passenden Wikipedia-Artikel. Versuch ein anderes Stichwort oder gib eigene Wörter ein.'); return;
        }
        vorschlag.pool = r.woerter; vorschlag.artikel = r.titel; vorschlag.url = r.url;
        ausPool();
      }).catch(function(){
        if (token !== lauf || aus) return;
        laedt(false);
        if (th){ zeige(mischen(th.w.split(' ')).slice(0, 20), 'Themenliste'); return; }
        info('Die Vorschläge aus dem Internet konnten nicht geladen werden. Prüfe die Internetverbindung und versuch es nochmals. ' + eingebaute());
      });
    }
    // Aus dem Wikipedia-Fundus: beim ersten Mal 20 der häufigsten Wörter, danach die nächsten
    function ausPool(){
      var neu = vorschlag.pool.filter(function(w){ return !vorschlag.gezeigt[norm(w)]; });
      if (!neu.length){ info('Aus diesem Artikel gibt es keine weiteren Vorschläge. Versuch ein verwandtes Stichwort oder gib eigene Wörter ein.'); return; }
      zeige(vorschlag.woerter.length ? neu.slice(0, 20) : mischen(neu.slice(0, 30)).slice(0, 20), 'Wikipedia');
    }
    function claudeFragen(t, mehr, th, token){
      laedt(true, 'Claude sucht passende Wörter …');
      Labor.claude('sample').then(function(ki){
        if (token !== lauf || aus) return;
        if (!ki || kiAus){
          laedt(false);
          if (th) zeige(mischen(th.w.split(' ')).slice(0, 20), 'Themenliste');
          else info('Für «' + esc(t) + '» gibt es hier keine Vorschläge. ' + eingebaute());
          return;
        }
        var schon = Object.keys(vorschlag.gezeigt).slice(-80);
        var prompt = 'Du hilfst einer Lehrperson, ein Worträtsel zu erstellen.\nThema: «' + t.slice(0, 80) + '»\n' +
          'Schlage genau 20 passende deutsche Wörter zu diesem Thema vor.\n' +
          'Regeln:\n- Je ein einzelnes Wort, meist Nomen, ohne Leerzeichen, Bindestriche, Ziffern oder Abkürzungen.\n' +
          '- 3 bis 12 Buchstaben, gemischte Längen.\n- Schweizer Rechtschreibung (ss statt ß), normale Gross- und Kleinschreibung.\n' +
          '- Allgemein bekannt, eindeutig zum Thema, keine Wiederholungen.\n' +
          (schon.length ? '- Nicht diese Wörter (schon vorgeschlagen): ' + schon.join(', ') + '\n' : '') +
          'Antworte nur mit einem JSON-Array aus 20 Strings, z. B. ["Apfel", "Birne"].';
        ki.json(prompt, mehr ? { modelTier:'quick', cache:false } : { modelTier:'quick' }).then(function(liste){
          if (token !== lauf || aus) return;
          laedt(false);
          var gut = [], seen = {};
          (Array.isArray(liste) ? liste : []).forEach(function(x){
            var w = schreibweise(String(x == null ? '' : x).replace(/ß/g, 'ss')), n = norm(w);
            if (!/^[\p{L}]+$/u.test(w) || n.length < 2 || n.length > 16 || seen[n]) return;
            seen[n] = true; gut.push(w);
          });
          if (!gut.length){ info('Es kamen keine brauchbaren Vorschläge. Versuch es nochmals oder formuliere das Thema etwas anders.'); return; }
          zeige(gut.slice(0, 20), 'Claude');
        }).catch(function(e){
          if (token !== lauf || aus) return;
          laedt(false);
          var c = e && e.code;
          if (c === 'cancelled') return;
          if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(c) >= 0){
            kiAus = true;
            if (th){ zeige(mischen(th.w.split(' ')).slice(0, 20), 'Themenliste'); return; }
            info('Vorschläge von Claude sind hier nicht verfügbar. ' + eingebaute());
          } else if (c === 'rate_limited') info('Gerade zu viele Anfragen – bitte in einem Moment nochmals versuchen.');
          else if (c === 'session_expired') info('Bitte melde dich bei Claude neu an und versuche es dann nochmals.');
          else info('Die Vorschläge konnten nicht geladen werden. Versuch es nochmals oder formuliere das Thema etwas anders.');
        });
      });
    }
    function eingebaute(){ return 'Eingebaute Themen mit Vorschlägen: ' + THEMEN.map(function(th){ return th.name; }).join(', ') + '. Oder gib eigene Wörter ein.'; }
    function laedt(ja, text){
      $('#vorschlagen').disabled = ja; $('#mehrVorschlaege').disabled = ja;
      if (ja){
        $('#vorschlaege').hidden = false;
        $('#vorschlagTitel').innerHTML = 'Vorschläge zu «' + esc(vorschlag.thema) + '»';
        $('#vorschlagInfo').innerHTML = '<span class="lade" aria-hidden="true"></span>' + esc(text);
      }
    }
    function info(h){
      $('#vorschlaege').hidden = false;
      if (!vorschlag || !vorschlag.woerter.length){ $('#vorschlagChips').innerHTML = ''; $('#vorschlagTitel').textContent = 'Wortvorschläge'; }
      $('#vorschlagInfo').innerHTML = h;
      $('#alleUebernehmen').hidden = $('#mehrVorschlaege').hidden = !vorschlag || !vorschlag.woerter.length;
    }
    function zeige(woerter, quelle){
      vorschlag.woerter = woerter;
      woerter.forEach(function(w){ vorschlag.gezeigt[norm(w)] = true; });
      $('#vorschlaege').hidden = false;
      $('#vorschlagTitel').innerHTML = 'Vorschläge zu «' + esc(vorschlag.thema) + '»<span class="quelle">' +
        (quelle === 'Claude' ? 'von Claude' : quelle === 'Wikipedia' ? 'aus Wikipedia' : 'eingebaute Liste') + '</span>';
      $('#vorschlagInfo').innerHTML = 'Anklicken, um ein Wort zu übernehmen oder wieder zu entfernen.' + (quelle === 'Wikipedia' && vorschlag.url ?
        ' Gefunden im Wikipedia-Artikel <a href="' + esc(vorschlag.url) + '" target="_blank" rel="noopener">«' + esc(vorschlag.artikel) + '»</a>.' : '');
      $('#alleUebernehmen').hidden = $('#mehrVorschlaege').hidden = false;
      var box = $('#vorschlagChips'); box.innerHTML = '';
      woerter.forEach(function(w){
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'chip-vorschlag'; b.textContent = w;
        b.addEventListener('click', function(){ if (b.getAttribute('aria-pressed') === 'true') entferne(norm(w)); else hinzu([w]); });
        box.appendChild(b);
      });
      status();
    }
    $('#alleUebernehmen').addEventListener('click', function(){ if (vorschlag) hinzu(vorschlag.woerter); });
    $('#mehrVorschlaege').addEventListener('click', function(){ vorschlagen(true); });

    function hinzu(liste){
      var drin = {}, kurz = [], schon = [];
      st.woerter.forEach(function(w){ drin[norm(w)] = true; });
      liste.forEach(function(w){
        w = schreibweise(w); var n = norm(w);
        if (n.length < 2){ if (w) kurz.push(w); return; }
        if (drin[n]){ schon.push(w); return; }
        drin[n] = true; st.woerter.push(w);
      });
      var notiz = [];
      if (kurz.length) notiz.push('Zu kurz: ' + kurz.map(esc).join(', '));
      if (schon.length && liste.length === 1) notiz.push('«' + esc(schon[0]) + '» ist schon in der Liste');
      zeichne(); o.geaendert(notiz.join(' · '));
    }
    function entferne(n){ st.woerter = st.woerter.filter(function(w){ return norm(w) !== n; }); zeichne(); o.geaendert(''); }
    function zeichne(){
      var box = $('#wortChips'), gesehen = {};
      box.innerHTML = '';
      st.woerter.forEach(function(w){
        var n = norm(w), chip = document.createElement('span'), problem = n.length < 2 ? 'zu kurz' : gesehen[n] ? 'doppelt' : '';
        gesehen[n] = true;
        chip.className = 'chip-wort' + (problem ? ' ungueltig' : '');
        if (problem) chip.title = 'Wird weggelassen (' + problem + ')';
        chip.innerHTML = '<span></span><button type="button" aria-label="' + esc(w) + ' entfernen" title="Entfernen">×</button>';
        chip.firstChild.textContent = w;
        chip.lastChild.addEventListener('click', function(){ var i = st.woerter.indexOf(w); if (i >= 0) st.woerter.splice(i, 1); zeichne(); o.geaendert(''); });
        box.appendChild(chip);
      });
      status();
    }
    function status(){
      var drin = {}; st.woerter.forEach(function(w){ drin[norm(w)] = true; });
      [].forEach.call(bereich.querySelectorAll('#vorschlagChips .chip-vorschlag'), function(b){ b.setAttribute('aria-pressed', drin[norm(b.textContent)] ? 'true' : 'false'); });
    }
    var eigen = $('#eigenesWort');
    function eigene(){ var l = teileListe(eigen.value); if (!l.length){ eigen.focus(); return; } eigen.value = ''; hinzu(l); eigen.focus(); }
    $('#wortPlus').addEventListener('click', eigene);
    eigen.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); eigene(); } });
    eigen.addEventListener('paste', function(e){
      var t = (e.clipboardData || window.clipboardData).getData('text');
      if (!/[\n,;\t]/.test(t)) return;
      e.preventDefault(); hinzu(teileListe(t));
    });
    var loeschTimer = 0;
    $('#alleWeg').addEventListener('click', function(){
      var b = this;
      if (!st.woerter.length) return;
      if (!b.classList.contains('sicher')){
        b.classList.add('sicher'); b.textContent = 'Wirklich alle entfernen?';
        clearTimeout(loeschTimer); loeschTimer = setTimeout(function(){ b.classList.remove('sicher'); b.textContent = 'Alle entfernen'; }, 4000);
        return;
      }
      clearTimeout(loeschTimer); b.classList.remove('sicher'); b.textContent = 'Alle entfernen';
      st.woerter = []; zeichne(); o.geaendert('');
    });

    return { zeichne:zeichne, stopp:function(){ aus = true; lauf++; clearTimeout(loeschTimer); } };
  }

  return { THEMEN:THEMEN, findeThema:findeThema, schluessel:schluessel, html:html, verbinde:verbinde, nomen:nomen };
})();
