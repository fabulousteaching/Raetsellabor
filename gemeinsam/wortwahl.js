/* Rätsellabor – gemeinsamer Baustein «Thema und Wörter»
   Thema eingeben, Wortvorschläge holen, Vorschläge anklicken, eigene Wörter ergänzen.
   Woher die Vorschläge kommen: zuerst die eingebauten Themen; sonst aus dem Internet (kindgerechte Nomen aus den passenden
   Artikeln im Klexikon und in Wikipedia, ohne Claude). Im Claude-Artefakt ist das Internet gesperrt – dort hilft Claude aus.
   Braucht gemeinsam/wortschatz.js (vorher einbinden).
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
  // Die Wörter der eingebauten Themen sind kindgerecht ausgewählt: auch sie gehören zum Grundwortschatz
  // (ohne Länder und Farben – die kommen in Texten oft als Namen oder Adjektive vor).
  if (typeof Wortschatz !== 'undefined') THEMEN.forEach(function(th){
    if (th.name === 'Länder' || th.name === 'Farben und Formen') return;
    th.w.split(' ').forEach(function(w){ if (w !== 'Deutsch') Wortschatz.aufnehmen(w); });
  });
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

  /* ---------- Vorschläge aus dem Internet ----------
     Quellen: das Klexikon (Kinderlexikon, klexikon.zum.de) und die deutsche Wikipedia. Beide erlauben Abfragen direkt
     aus dem Browser (origin=*), ohne Anmeldung und ohne Claude.
     Ausgewählt werden Nomen, die
       – im Artikel vorkommen (häufig und in der Einleitung zählt mehr; Literatur, Weblinks usw. werden abgeschnitten),
       – Kinder von 8 bis 14 kennen: Sie stehen im Grundwortschatz (gemeinsam/wortschatz.js) oder sind aus zwei
         Wörtern daraus zusammengesetzt; im Klexikon geschriebene Wörter gelten auch so als kindgerecht,
       – das Suchwort nicht enthalten (bei «Film» also kein «Spielfilm»). */
  var WIKI = 'https://de.wikipedia.org/w/api.php?format=json&formatversion=2&origin=*&';
  var KLEX = 'https://klexikon.zum.de/api.php?format=json&formatversion=2&origin=*&';
  var STOPP = {};
  ('jahr jahre jahren jahres jahrhundert jahrhunderts jahrhunderte jahrzehnt jahrzehnte zeit zeiten zeitpunkt teil teile teilen beispiel beispiele art arten ' +
   'weise ende anfang beginn begriff begriffe bezeichnung bezeichnungen name namen form formen fall fälle grund gründe bereich bereiche rahmen folge ' +
   'folgen seite seiten hälfte mitte stelle stellen zahl zahlen anzahl menge prozent million millionen milliarde milliarden mal verlauf entwicklung ' +
   'geschichte gegensatz unterschied unterschiede bedeutung möglichkeit möglichkeiten literatur weblinks einzelnachweise siehe sie ihr ihre ihnen ' +
   'januar februar märz april mai juni juli august september oktober november dezember montag dienstag mittwoch donnerstag freitag samstag sonntag ' +
   'herr frau mann deutschland schweiz österreich usa land länder welt person personen mensch menschen leute thema themen wort wörter liste listen version ' +
   'gebiet gebiete ort orte gruppe gruppen typ typen sinne sinn verwendung zusammenhang ebene stand anteil höhe länge grösse gewicht ' +
   'regel regeln quelle quellen angaben angabe ergebnis ergebnisse aspekt aspekte rolle beispielsweise wikipedia artikel kapitel abschnitt ' +
   'hinweis hinweise information informationen faktor faktoren prinzip methode problem probleme sekunde sekunden minute minuten stunde stunden ' +
   'tag tage tagen woche wochen monat monate monaten staat staaten hause').split(' ').forEach(function(w){ STOPP[w] = 1; });
  // Abschnitte am Ende eines Artikels, die nur Bücher, Links und Belege aufzählen
  var META = /^(literatur|weblinks|einzelnachweise|anmerkungen|siehe auch|quellen|belege|fussnoten|fußnoten|filmografie|diskografie|bibliografie|bibliographie|werke|schriften|publikationen|veröffentlichungen|auszeichnungen|ehrungen|rezeption|trivia|verfilmungen|weiterführende)/i;
  var ARTIKEL = {};
  'der die das den dem des ein eine einen einem einer eines kein keine keinen keinem keiner sein seine seinen seinem ihr ihre ihren ihrem unser unsere jede jeder jedes jedem jeden diese dieser dieses diesem diesen alle viele mehrere einige beide zwei drei vier zum zur im am vom beim ins'
    .split(' ').forEach(function(w){ ARTIKEL[w] = 1; });
  var FUELL = {}; 'und oder im in der die das den dem des von vom mit am für zum zur ein eine auf bei aus the'.split(' ').forEach(function(w){ FUELL[w] = 1; });

  function holeJson(url, ms){
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, uhr = setTimeout(function(){ if (ctl) ctl.abort(); }, ms || 9000);
    return fetch(url, ctl ? { signal:ctl.signal } : {}).then(function(r){ clearTimeout(uhr); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
      function(e){ clearTimeout(uhr); throw e; });
  }
  function adresse(basis, titel){ return basis + encodeURIComponent(titel.replace(/ /g, '_')); }

  /* Wikipedia: Artikel als reiner Text, Überschriften als «== … ==» */
  function wikiSeite(j){
    var p = j && j.query && j.query.pages && j.query.pages[0];
    if (!p || p.missing || p.invalid) return null;
    if (p.pageprops && 'disambiguation' in p.pageprops) return null;   // Begriffsklärung
    if (!p.extract || p.extract.length < 400) return null;
    return { titel:p.title, text:p.extract, url:adresse('https://de.wikipedia.org/wiki/', p.title) };
  }
  function wikiArtikel(titel){
    return holeJson(WIKI + 'action=query&redirects=1&prop=extracts|pageprops&ppprop=disambiguation&explaintext=1&exsectionformat=wiki&titles=' + encodeURIComponent(titel)).then(wikiSeite);
  }
  function wikipedia(thema){
    return wikiArtikel(thema).then(function(s){
      if (s) return s;
      // sonst die ersten Suchtreffer der Reihe nach, bis einer ein richtiger Artikel ist
      return holeJson(WIKI + 'action=query&list=search&srlimit=4&srsearch=' + encodeURIComponent(thema)).then(function(j){
        var treffer = ((j.query && j.query.search) || []).map(function(x){ return x.title; });
        function naechster(i){ return i >= treffer.length ? null : wikiArtikel(treffer[i]).then(function(s2){ return s2 || naechster(i + 1); }); }
        return naechster(0);
      });
    });
  }
  /* Klexikon: Seite als HTML holen und den Fliesstext herauslösen. Antwortet es nicht, geht es ohne. */
  function klexikon(titel){
    if (typeof DOMParser === 'undefined') return Promise.resolve(null);
    return holeJson(KLEX + 'action=parse&prop=text&redirects=1&disabletoc=1&page=' + encodeURIComponent(titel), 6000).then(function(j){
      var t = j && !j.error && j.parse && j.parse.text;
      if (t && typeof t === 'object') t = t['*'];
      if (!t || typeof t !== 'string') return null;
      var doc = new DOMParser().parseFromString(t, 'text/html');
      [].forEach.call(doc.querySelectorAll('table, sup, style, script, .reference, .mw-editsection, .toc, .navbox, .noprint'), function(n){ n.remove(); });
      var text = [].map.call(doc.querySelectorAll('p, li, h2'), function(n){ return n.tagName === 'H2' ? '\n== ' + n.textContent.trim() + ' ==\n' : n.textContent; }).join('\n');
      if (text.replace(/\s+/g, '').length < 200) return null;
      return { titel:j.parse.title, text:text, url:adresse('https://klexikon.zum.de/wiki/', j.parse.title) };
    }).catch(function(){ return null; });
  }

  /* Einleitung und Hauptteil eines Artikels; Literatur, Weblinks, Einzelnachweise usw. fallen weg */
  function abschnitte(text){
    var t = String(text || '').split(/^==[ \t]*([^=\n][^\n]*?)[ \t]*==[ \t]*$/m), rest = [];
    for (var i = 1; i < t.length; i += 2) if (!META.test(t[i].trim())) rest.push(t[i + 1] || '');
    function ohneTitel(x){ return x.replace(/^=+[^\n]*=+[ \t]*$/gm, ''); }
    return { einleitung:ohneTitel(t[0]), rest:ohneTitel(rest.join('\n')) };
  }
  /* Woran man Wörter erkennt, die das Suchwort enthalten (Film → Filme, Spielfilm; Vulkane → Vulkanologe) */
  function ohneUmlaut(w){ return w.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u'); }
  function themaStaemme(thema){
    return schluessel(thema).split(' ').filter(function(w){ return w.length >= 3 && !FUELL[w]; }).map(function(w){
      var g = typeof Wortschatz !== 'undefined' && Wortschatz.grundform(w);
      var s = g && g.teile === 1 ? schluessel(g.form) : w;
      if (!g){ var k = s.replace(/(en|er|e|n|s)$/, ''); if (k.length >= 4) s = k; }
      return ohneUmlaut(s);
    });
  }
  function enthaeltThema(wort, staemme){
    var w = ohneUmlaut(schluessel(wort));
    return staemme.some(function(s){
      if (s.length >= 4) return w.indexOf(s) >= 0;
      return w === s || w.indexOf(s) === 0 || w.slice(-s.length) === s;   // kurze Stämme nur am Anfang oder Ende
    });
  }
  /* Kandidaten aus mehreren Texten: [{ text, gewicht, kinder }] → Wörter nach Wichtigkeit */
  function kandidaten(quellen, thema){
    var roh = {}, staemme = themaStaemme(thema);
    quellen.forEach(function(q){
      var saetze = String(q.text || '').replace(/([.!?:;])\s+/g, '$1\n').split(/\n+/);
      saetze.forEach(function(satz){
        var vorher = '';
        (satz.match(/[A-Za-zÄÖÜäöüß]+/g) || []).forEach(function(w, i){
          var gross = /^[A-ZÄÖÜ][a-zäöüß]+$/.test(w);
          if (gross){
            var n = w.replace(/ß/g, 'ss'), r = roh[n] || (roh[n] = { mitte:0, anfang:0, kinder:0, andere:0, artikel:0 });
            if (i === 0) r.anfang += q.gewicht; else { r.mitte += q.gewicht; if (q.kinder) r.kinder++; else r.andere++; }
            if (ARTIKEL[vorher]) r.artikel++;
          }
          vorher = w.toLocaleLowerCase('de-CH');
        });
      });
    });
    var z = {}, inKlex = {}, inWiki = {};
    Object.keys(roh).forEach(function(n){
      var r = roh[n];
      if (!r.mitte || n.length < 3 || n.length > 16 || STOPP[n.toLocaleLowerCase('de-CH')]) return;   // Satzanfänge allein sind keine Nomen
      var g = typeof Wortschatz !== 'undefined' ? Wortschatz.grundform(n) : null;
      if (!g && r.kinder >= 2 && r.artikel >= 1 && n.length <= 13 && !/(ung|heit|keit|ismus|tät|nis|ion)$/.test(n)) g = { form:n, teile:1 };   // im Klexikon: kindgerecht
      if (!g || STOPP[schluessel(g.form)] || enthaeltThema(g.form, staemme)) return;
      if (g.teile > 1 && g.form.length > 14) return;   // lange Zusammensetzungen sind schwer
      z[g.form] = (z[g.form] || 0) + (r.mitte + r.anfang) * (g.teile > 1 ? 0.7 : 1);
      if (r.kinder) inKlex[g.form] = true;
      if (r.andere) inWiki[g.form] = true;
    });
    // In beiden Lexika erwähnt: sicher wichtig. Nur einmal nebenbei erwähnt: weglassen.
    Object.keys(z).forEach(function(f){ if (inKlex[f] && inWiki[f]) z[f] *= 1.5; });
    var top = Object.keys(z).reduce(function(m, f){ return Math.max(m, z[f]); }, 0), mindestens = Math.max(2, top * 0.05);
    var sortiert = Object.keys(z).sort(function(a, b){ return z[b] - z[a] || a.localeCompare(b, 'de'); });
    var gut = sortiert.filter(function(f){ return z[f] >= mindestens; });
    return sortiert.slice(0, Math.min(60, Math.max(gut.length, 10)));   // bei kurzen Artikeln auf 10 auffüllen
  }
  /* zum Testen und für andere Bausteine: Nomen aus einem einzelnen Text */
  function nomen(text, thema){ var a = abschnitte(text); return kandidaten([{ text:a.einleitung, gewicht:3 }, { text:a.rest, gewicht:1 }], thema); }

  var netzCache = {};
  function ausDemInternet(thema){
    var k = schluessel(thema);
    if (netzCache[k]) return netzCache[k];
    var klex = klexikon(thema), wikiFehler = null;
    netzCache[k] = Promise.all([klex, wikipedia(thema).catch(function(e){ wikiFehler = e; return null; })]).then(function(r){
      var kl = r[0], wi = r[1];
      // Klexikon kennt das Stichwort nicht so? Dann mit dem Titel aus Wikipedia nochmals (Vulkane → Vulkan)
      var klex2 = !kl && wi && schluessel(wi.titel) !== k ? klexikon(wi.titel) : Promise.resolve(kl);
      return klex2.then(function(kl2){
        if (!kl2 && !wi){ if (wikiFehler) throw wikiFehler; return { woerter:[] }; }
        var quellen = [];
        if (kl2){ var a = abschnitte(kl2.text); quellen.push({ text:a.einleitung, gewicht:5, kinder:true }, { text:a.rest, gewicht:3, kinder:true }); }
        if (wi){ var b = abschnitte(wi.text); quellen.push({ text:b.einleitung, gewicht:3 }, { text:b.rest, gewicht:1 }); }
        return { woerter:kandidaten(quellen, thema), klexikon:kl2 && { titel:kl2.titel, url:kl2.url }, wikipedia:wi && { titel:wi.titel, url:wi.url } };
      });
    }).catch(function(e){ delete netzCache[k]; throw e; });
    return netzCache[k];
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
      var th = findeThema(t), staemme = themaStaemme(t);
      // eingebaute Liste, aber ohne Wörter, die das Suchwort enthalten (Fussball → kein «Fussballschuh»)
      var liste = th ? th.w.split(' ').filter(function(w){ return !enthaeltThema(w, staemme); }) : [];
      if (th && !vorschlag.pool){
        var rest = liste.filter(function(w){ return !vorschlag.gezeigt[norm(w)]; });
        if (rest.length >= 8 || !mehr){
          if (rest.length < 20) rest = rest.concat(liste.filter(function(w){ return rest.indexOf(w) < 0; }));
          zeige(mischen(rest).slice(0, 20), 'Themenliste'); return;
        }
      }
      if (vorschlag.pool){ ausPool(); return; }
      if (Labor.imArtefakt()){ claudeFragen(t, mehr, th && liste, staemme, token); return; }   // im Artefakt ist das Internet gesperrt
      laedt(true, 'Passende Wörter werden im Klexikon und in Wikipedia gesucht …');
      ausDemInternet(t).then(function(r){
        if (token !== lauf || aus) return;
        laedt(false);
        if (r.woerter.length < 6 && th){ zeige(mischen(liste).slice(0, 20), 'Themenliste'); return; }
        if (!r.woerter.length){
          if (r.wikipedia || r.klexikon) info('In ' + artikelLinks(r) + ' stehen kaum Wörter, die Kinder gut kennen. Versuch ein einfacheres oder allgemeineres Stichwort oder gib eigene Wörter ein.');
          else info('Zu «' + esc(t) + '» gibt es keinen passenden Artikel. Versuch ein anderes Stichwort oder gib eigene Wörter ein.');
          return;
        }
        vorschlag.pool = r.woerter; vorschlag.netz = r;
        ausPool();
      }).catch(function(){
        if (token !== lauf || aus) return;
        laedt(false);
        if (th){ zeige(mischen(liste).slice(0, 20), 'Themenliste'); return; }
        info('Die Vorschläge aus dem Internet konnten nicht geladen werden. Prüfe die Internetverbindung und versuch es nochmals. ' + eingebaute());
      });
    }
    function artikelLinks(r){   // «aus dem Artikel …» bzw. «aus den Artikeln … und …»
      function a(x, wo){ return '<a href="' + esc(x.url) + '" target="_blank" rel="noopener">«' + esc(x.titel) + '»</a> (' + wo + ')'; }
      var l = [r.klexikon && a(r.klexikon, 'Klexikon'), r.wikipedia && a(r.wikipedia, 'Wikipedia')].filter(Boolean);
      return (l.length > 1 ? 'den Artikeln ' : 'dem Artikel ') + l.join(' und ');
    }
    // Aus dem Fundus der Artikel: beim ersten Mal die 14 wichtigsten Wörter und 6 weitere, gemischt; danach die nächsten
    function ausPool(){
      var neu = vorschlag.pool.filter(function(w){ return !vorschlag.gezeigt[norm(w)]; });
      if (!neu.length){ info('Aus diesen Artikeln gibt es keine weiteren Vorschläge. Versuch ein verwandtes Stichwort oder gib eigene Wörter ein.'); return; }
      zeige(vorschlag.woerter.length ? neu.slice(0, 20) : mischen(neu.slice(0, 14).concat(mischen(neu.slice(14, 30)).slice(0, 6))), 'Internet');
    }
    function claudeFragen(t, mehr, liste, staemme, token){
      laedt(true, 'Claude sucht passende Wörter …');
      Labor.claude('sample').then(function(ki){
        if (token !== lauf || aus) return;
        if (!ki || kiAus){
          laedt(false);
          if (liste) zeige(mischen(liste).slice(0, 20), 'Themenliste');
          else info('Für «' + esc(t) + '» gibt es hier keine Vorschläge. ' + eingebaute());
          return;
        }
        var schon = Object.keys(vorschlag.gezeigt).slice(-80);
        var prompt = 'Du hilfst einer Lehrperson, ein Worträtsel zu erstellen.\nThema: «' + t.slice(0, 80) + '»\n' +
          'Schlage genau 20 passende deutsche Wörter zu diesem Thema vor.\n' +
          'Regeln:\n- Je ein einzelnes Wort, meist Nomen, ohne Leerzeichen, Bindestriche, Ziffern oder Abkürzungen.\n' +
          '- 3 bis 12 Buchstaben, gemischte Längen.\n- Schweizer Rechtschreibung (ss statt ß), normale Gross- und Kleinschreibung.\n' +
          '- Für Kinder von 8 bis 14 Jahren verständlich, eindeutig zum Thema, keine Wiederholungen.\n' +
          '- Kein Wort darf «' + t.slice(0, 80) + '» enthalten (keine Zusammensetzungen mit dem Thema selbst).\n' +
          (schon.length ? '- Nicht diese Wörter (schon vorgeschlagen): ' + schon.join(', ') + '\n' : '') +
          'Antworte nur mit einem JSON-Array aus 20 Strings, z. B. ["Apfel", "Birne"].';
        ki.json(prompt, mehr ? { modelTier:'quick', cache:false } : { modelTier:'quick' }).then(function(liste){
          if (token !== lauf || aus) return;
          laedt(false);
          var gut = [], seen = {};
          (Array.isArray(liste) ? liste : []).forEach(function(x){
            var w = schreibweise(String(x == null ? '' : x).replace(/ß/g, 'ss')), n = norm(w);
            if (!/^[\p{L}]+$/u.test(w) || n.length < 2 || n.length > 16 || seen[n] || enthaeltThema(w, staemme)) return;
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
            if (liste){ zeige(mischen(liste).slice(0, 20), 'Themenliste'); return; }
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
      var netz = quelle === 'Internet' && vorschlag.netz;
      $('#vorschlagTitel').innerHTML = 'Vorschläge zu «' + esc(vorschlag.thema) + '»<span class="quelle">' +
        (quelle === 'Claude' ? 'von Claude' : netz ? 'aus ' + [netz.klexikon && 'Klexikon', netz.wikipedia && 'Wikipedia'].filter(Boolean).join(' und ') : 'eingebaute Liste') + '</span>';
      $('#vorschlagInfo').innerHTML = 'Anklicken, um ein Wort zu übernehmen oder wieder zu entfernen.' + (netz ?
        ' Nomen, die Kinder kennen, aus ' + artikelLinks(netz) + '.' : '');
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

  return { THEMEN:THEMEN, findeThema:findeThema, schluessel:schluessel, html:html, verbinde:verbinde, nomen:nomen, kandidaten:kandidaten, abschnitte:abschnitte, enthaeltThema:enthaeltThema, themaStaemme:themaStaemme };
})();
