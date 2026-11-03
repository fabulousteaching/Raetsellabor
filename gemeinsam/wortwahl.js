/* Rätsellabor – gemeinsamer Baustein «Thema und Wörter»
   Thema eingeben, Wortarten wählen (Nomen, Verben, Adjektive), Wortvorschläge holen, anklicken, eigene Wörter ergänzen.
   Woher die Vorschläge kommen: von einer KI (Mistral) über den eigenen Server (api/woerter.php; der Schlüssel liegt nur
   dort, niemand muss etwas eintragen). Ist die KI nicht erreichbar, kommen bei bekannten Themen die eingebauten
   Listen (Nomen). Im Claude-Artefakt fragt die Seite Claude.
   Wichtig ist immer: Wörter, die Kinder von 8 bis 14 Jahren kennen und verstehen, und kein Wort, das das Thema enthält.
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

  /* ---------- Wortarten ---------- */
  var ARTEN = {
    nomen:    { name:'Nomen',     schluessel:'nomen',     regel:'Nomen in der Einzahl, mit grossem Anfangsbuchstaben, ohne Artikel (z. B. «Kamera»)' },
    verb:     { name:'Verben',    schluessel:'verben',    regel:'Verben in der Grundform (Infinitiv), klein geschrieben (z. B. «rennen»)' },
    adjektiv: { name:'Adjektive', schluessel:'adjektive', regel:'Adjektive in der Grundform, klein geschrieben (z. B. «schnell»)' }
  };
  var REIHE = ['nomen', 'verb', 'adjektiv'], ARTEN_SPEICHER = 'raetsellabor-wortarten';
  function wortarten(neu){
    try {
      if (neu) localStorage.setItem(ARTEN_SPEICHER, JSON.stringify(neu));
      var a = neu || JSON.parse(localStorage.getItem(ARTEN_SPEICHER) || 'null');
      a = Array.isArray(a) ? REIHE.filter(function(x){ return a.indexOf(x) >= 0; }) : [];
      return a.length ? a : ['nomen'];
    } catch(e){ return neu && neu.length ? neu : ['nomen']; }
  }
  function artenText(arten){   // «Nomen», «Nomen und Verben», «Nomen, Verben und Adjektive»
    var n = arten.map(function(a){ return ARTEN[a].name; });
    return n.length < 2 ? n.join('') : n.slice(0, -1).join(', ') + ' und ' + n[n.length - 1];
  }
  // Nomen gross, Verben und Adjektive klein
  function schreibweise(w, art){
    w = String(w || '').replace(/ß/g, 'ss').trim();
    return art === 'nomen' ? w.charAt(0).toLocaleUpperCase('de-CH') + w.slice(1) : w.toLocaleLowerCase('de-CH');
  }

  /* ---------- Kein Wort, das das Suchwort enthält (Film → kein «Spielfilm»; Vulkane → kein «Vulkanausbruch») ---------- */
  var FUELL = {}; 'und oder im in der die das den dem des von vom mit am für zum zur ein eine auf bei aus the'.split(' ').forEach(function(w){ FUELL[w] = 1; });
  function ohneUmlaut(w){ return w.replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u'); }
  function themaStaemme(thema){
    return schluessel(thema).split(' ').filter(function(w){ return w.length >= 3 && !FUELL[w]; }).map(function(w){
      var k = w.replace(/(en|er|e|n|s)$/, '');
      return ohneUmlaut(k.length >= 4 ? k : w);
    });
  }
  function enthaeltThema(wort, staemme){
    var w = ohneUmlaut(schluessel(wort));
    return staemme.some(function(s){
      if (s.length >= 4) return w.indexOf(s) >= 0;
      return w === s || w.indexOf(s) === 0 || w.slice(-s.length) === s;   // kurze Stämme nur am Anfang oder Ende
    });
  }

  /* ---------- Auftrag an die KI (gleich für den Server und für Claude im Artefakt) ---------- */
  function kiAuftrag(thema, arten, schon){
    var t = String(thema).slice(0, 80), je = Math.round(30 / arten.length);
    return {
      system:'Du hilfst Lehrpersonen in der Schweiz, Worträtsel für Kinder zu erstellen. Du antwortest nur mit JSON.',
      text:'Thema: «' + t + '»\n' +
        'Gesucht sind Wörter, die eng zu diesem Thema gehören:\n' +
        arten.map(function(a){ return '- ' + je + ' ' + ARTEN[a].regel; }).join('\n') + '\n' +
        'Ganz wichtig: Kinder von 8 bis 14 Jahren müssen jedes Wort sicher kennen und verstehen. Nimm einfache, alltagsnahe Wörter ' +
        'aus dem Grundwortschatz – keine Fachbegriffe, keine Fremdwörter, keine seltenen oder altmodischen Wörter. ' +
        'Lieber ein einfaches, bekanntes Wort als ein genaues, schwieriges.\n' +
        'Regeln:\n- Je ein einzelnes Wort ohne Leerzeichen, Bindestriche, Ziffern oder Abkürzungen, 3 bis 12 Buchstaben, gemischte Längen.\n' +
        '- Kein Wort darf «' + t + '» enthalten (keine Zusammensetzungen mit dem Thema selbst).\n' +
        '- Keine Namen von Personen, Marken oder Orten.\n- Schweizer Rechtschreibung: ss statt ß.\n' +
        (schon.length ? '- Nicht diese Wörter (schon vorgeschlagen): ' + schon.slice(-80).join(', ') + '\n' : '') +
        'Antworte nur mit JSON in dieser Form: {' + arten.map(function(a){ return '"' + ARTEN[a].schluessel + '": ["…"]'; }).join(', ') + '}'
    };
  }
  // Antwort der KI (Objekt mit Listen je Wortart, oder eine einfache Liste) → [{ wort, art }]
  function kiListe(daten, arten){
    var aus = [];
    if (Array.isArray(daten)){ daten.forEach(function(x){ aus.push({ wort:String(x == null ? '' : x), art:arten[0] }); }); return aus; }
    if (!daten || typeof daten !== 'object') return aus;
    arten.forEach(function(a){
      var l = daten[ARTEN[a].schluessel] || daten[a] || daten[ARTEN[a].name.toLowerCase()] || (a === 'nomen' && (daten.woerter || daten.words));
      if (Array.isArray(l)) l.forEach(function(x){ aus.push({ wort:String(x == null ? '' : x), art:a }); });
    });
    return aus;
  }

  /* ---------- KI über den eigenen Server (api/woerter.php) ----------
     Auf dem Infomaniak-Hosting fragt der Server die KI (Mistral) mit seinem eigenen Schlüssel. Niemand muss etwas eintragen. */
  var SERVER = 'api/woerter.php', serverStatus = null;
  function holeJson(url, ms){
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, uhr = setTimeout(function(){ if (ctl) ctl.abort(); }, ms || 9000);
    return fetch(url, ctl ? { signal:ctl.signal } : {}).then(function(r){ clearTimeout(uhr); if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); },
      function(e){ clearTimeout(uhr); throw e; });
  }
  function serverBereit(){
    if (serverStatus) return serverStatus;
    if ((typeof Labor !== 'undefined' && Labor.imArtefakt()) || !/^https?:$/.test(location.protocol)) return (serverStatus = Promise.resolve('keinServer'));
    // 'ok' · 'nichtEingerichtet' (Server da, Schlüssel fehlt) · 'keinServer' (z. B. GitHub Pages)
    serverStatus = holeJson(SERVER + '?status=1', 6000).then(function(j){ return j && j.bereit ? 'ok' : 'nichtEingerichtet'; }, function(){ return 'keinServer'; });
    return serverStatus;
  }
  function kiFehler(code){ var e = new Error(code); e.code = code; return e; }
  function serverKi(thema, arten, schon){
    var ctl = typeof AbortController !== 'undefined' ? new AbortController() : null, uhr = setTimeout(function(){ if (ctl) ctl.abort(); }, 40000);
    return fetch(SERVER, { method:'POST', headers:{ 'Content-Type':'application/json' }, body:JSON.stringify({ thema:thema, arten:arten, schon:schon.slice(-80) }),
      signal:ctl ? ctl.signal : undefined }).then(function(r){
      clearTimeout(uhr);
      return r.json().catch(function(){ return {}; }).then(function(j){
        if (r.ok && j && Array.isArray(j.woerter)){
          return { woerter:j.woerter.map(function(x){ return x && typeof x === 'object' ? { wort:String(x.wort || ''), art:String(x.art || arten[0]) } : { wort:String(x), art:arten[0] }; }),
            anbieter:j.anbieter || 'KI' };
        }
        throw kiFehler((j && j.fehler) || (r.status === 429 ? 'zuViele' : 'ki'));
      });
    }, function(){ clearTimeout(uhr); throw kiFehler('netz'); });
  }

  /* KI über den eigenen Server fragen. Liefert { woerter:[{ wort, art }], anbieter } */
  function kiFragen(thema, arten, schon){
    return serverBereit().then(function(stand){
      if (stand !== 'ok') throw kiFehler(stand);
      return serverKi(thema, arten, schon);
    });
  }

  /* Karte «Thema und Wörter» */
  function html(nr){
    return '<div class="karte">' +
      '<div class="karte-kopf"><span class="stufe" aria-hidden="true">' + (nr || 1) + '</span>' +
        '<div><h2>Thema und Wörter</h2><p>Thema eingeben, Wortarten wählen und Wörter vorschlagen lassen. Vorschläge anklicken – eigene Wörter gehen immer.</p></div></div>' +
      '<label class="feld-label" for="titel">Thema</label>' +
      '<div class="zeile"><input type="text" id="titel" maxlength="60" autocomplete="off">' +
        '<button type="button" class="btn soft" id="vorschlagen">Wörter vorschlagen</button></div>' +
      '<div class="wortarten" role="group" aria-label="Wortarten für die Vorschläge"><span class="wortarten-titel">Vorschlagen:</span>' +
        REIHE.map(function(a){ return '<label class="wortart"><input type="checkbox" value="' + a + '"><span>' + ARTEN[a].name + '</span></label>'; }).join('') + '</div>' +
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
      '<label class="feld-label eigenes-label" for="eigenesWort">Eigene Wörter (mehrere mit Komma trennen)</label>' +
      '<div class="zeile"><input type="text" id="eigenesWort" maxlength="200" autocomplete="off" spellcheck="false">' +
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

    /* Wortarten: mindestens eine bleibt gewählt; eine Änderung holt gleich neue Vorschläge */
    var kaestchen = [].slice.call(bereich.querySelectorAll('.wortart input'));
    function artenZeigen(){ var a = wortarten(); kaestchen.forEach(function(k){ k.checked = a.indexOf(k.value) >= 0; }); }
    kaestchen.forEach(function(k){
      k.addEventListener('change', function(){
        var a = kaestchen.filter(function(x){ return x.checked; }).map(function(x){ return x.value; });
        if (!a.length){ k.checked = true; return; }
        wortarten(a);
        if (titel.value.trim() && !$('#vorschlaege').hidden) vorschlagen(false);
      });
    });
    artenZeigen();

    function vorschlagen(mehr){
      var t = titel.value.trim(), token = ++lauf, arten = wortarten(), key = t + '|' + arten.join(',');
      if (!t){ titel.focus(); info('Gib zuerst ein Thema ein.'); return; }
      if (!mehr || !vorschlag || vorschlag.key !== key) vorschlag = { thema:t, arten:arten, key:key, woerter:[], gezeigt:{}, pool:null, alle:[] };
      var th = findeThema(t), staemme = themaStaemme(t);
      // eingebaute Liste (Nomen) als Ersatz, falls die KI nicht antwortet; ohne Wörter, die das Suchwort enthalten
      var liste = th && arten.indexOf('nomen') >= 0
        ? th.w.split(' ').filter(function(w){ return !enthaeltThema(w, staemme); }).map(function(w){ return { w:w, art:'nomen' }; }) : [];
      vorschlag.ctx = { liste:liste, staemme:staemme };
      if (vorschlag.pool){ ausPool(); return; }
      if (vorschlag.quelle === 'Themenliste' && liste.some(function(x){ return !vorschlag.gezeigt[norm(x.w)]; })){ ohneKi(vorschlag.notiz); return; }
      kiVersuch(token);
    }
    /* KI-Antwort prüfen: einzelne Wörter, passende Schreibweise, nichts doppelt, kein Suchwort im Wort */
    function aufbereiten(liste){
      var gut = [], seen = {};
      liste.forEach(function(x){
        var art = ARTEN[x.art] ? x.art : vorschlag.arten[0], w = schreibweise(x.wort, art), n = norm(w);
        if (vorschlag.arten.indexOf(art) < 0 || !/^[\p{L}]+$/u.test(w) || n.length < 3 || n.length > 14 || seen[n] || vorschlag.gezeigt[n] || enthaeltThema(w, vorschlag.ctx.staemme)) return;
        seen[n] = true; gut.push({ w:w, art:art });
      });
      return gut;
    }
    function kiVersuch(token){
      if (Labor.imArtefakt()){ claudeFragen(token); return; }   // im Artefakt ist das Internet gesperrt
      laedt(true, 'Die KI sucht passende ' + artenText(vorschlag.arten) + ' …');
      kiFragen(vorschlag.thema, vorschlag.arten, vorschlag.alle).then(function(r){
        if (token !== lauf || aus) return;
        var gut = aufbereiten(r.woerter);
        if (gut.length < 6) throw kiFehler(vorschlag.woerter.length ? 'keineNeuen' : 'antwort');
        laedt(false);
        vorschlag.kiName = r.anbieter; vorschlag.pool = gut; vorschlag.quelle = 'KI';
        ausPool();
      }).catch(function(e){
        if (token !== lauf || aus) return;
        ohneKi(kiNotiz(e && e.code));
      });
    }
    function kiNotiz(code){
      return code === 'keinServer' ? 'Die KI ist auf dieser Seite nicht verfügbar.' :
        code === 'nichtEingerichtet' ? 'Die KI ist noch nicht eingerichtet: Auf dem Server fehlt der Schlüssel.' :
        code === 'guthaben' ? 'Das Kontingent der KI ist aufgebraucht.' :
        code === 'zuViele' ? 'Die KI hat gerade zu viele Anfragen – bitte in einem Moment nochmals versuchen.' :
        code === 'serverSchluessel' ? 'Der KI-Schlüssel auf dem Server wurde abgelehnt.' :
        code === 'keineNeuen' ? 'Die KI hatte keine weiteren Vorschläge.' :
        code === 'netz' || code === 'ki' ? 'Die KI hat gerade nicht geantwortet – bitte nochmals versuchen.' : 'Die KI hat nicht brauchbar geantwortet – bitte nochmals versuchen.';
    }
    // Ohne KI: eingebaute Liste, falls es eine gibt, sonst eine Erklärung
    function ohneKi(notiz){
      laedt(false);
      vorschlag.notiz = notiz;
      var liste = vorschlag.ctx.liste.filter(function(x){ return !vorschlag.gezeigt[norm(x.w)]; });
      if (liste.length){ vorschlag.quelle = 'Themenliste'; zeige(mischen(liste).slice(0, 20), 'Themenliste'); return; }
      info(esc(notiz) + (vorschlag.woerter.length ? '' : ' ' + eingebaute()));
    }
    // Aus dem Vorrat der KI: bis 20 Wörter, die Wortarten abwechselnd; ist er fast leer, die KI nochmals fragen
    function ausPool(){
      var schlangen = vorschlag.arten.map(function(a){ return vorschlag.pool.filter(function(x){ return x.art === a && !vorschlag.gezeigt[norm(x.w)]; }); });
      var frei = schlangen.reduce(function(s, q){ return s + q.length; }, 0);
      if (frei < 6){ vorschlag.pool = null; kiVersuch(++lauf); return; }
      if (!vorschlag.woerter.length) schlangen = schlangen.map(mischen);
      var neu = [];
      while (neu.length < 20 && schlangen.some(function(q){ return q.length; })) schlangen.forEach(function(q){ if (q.length && neu.length < 20) neu.push(q.shift()); });
      zeige(neu, vorschlag.quelle || 'KI');
    }
    function claudeFragen(token){
      laedt(true, 'Claude sucht passende ' + artenText(vorschlag.arten) + ' …');
      Labor.claude('sample').then(function(ki){
        if (token !== lauf || aus) return;
        if (!ki || kiAus){ ohneKi('Vorschläge von Claude sind hier nicht verfügbar.'); return; }
        var a = kiAuftrag(vorschlag.thema, vorschlag.arten, vorschlag.alle);
        ki.json(a.system + '\n\n' + a.text, vorschlag.woerter.length ? { modelTier:'quick', cache:false } : { modelTier:'quick' }).then(function(d){
          if (token !== lauf || aus) return;
          var gut = aufbereiten(kiListe(d, vorschlag.arten));
          if (gut.length < 3){ ohneKi('Es kamen keine brauchbaren Vorschläge. Versuch es nochmals oder formuliere das Thema etwas anders.'); return; }
          laedt(false);
          vorschlag.kiName = 'Claude'; vorschlag.pool = gut; vorschlag.quelle = 'Claude';
          ausPool();
        }).catch(function(e){
          if (token !== lauf || aus) return;
          var c = e && e.code;
          if (c === 'cancelled'){ laedt(false); return; }
          if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].indexOf(c) >= 0){ kiAus = true; ohneKi('Vorschläge von Claude sind hier nicht verfügbar.'); }
          else if (c === 'rate_limited') ohneKi('Gerade zu viele Anfragen – bitte in einem Moment nochmals versuchen.');
          else if (c === 'session_expired') ohneKi('Bitte melde dich bei Claude neu an und versuche es dann nochmals.');
          else ohneKi('Die Vorschläge konnten nicht geladen werden. Versuch es nochmals oder formuliere das Thema etwas anders.');
        });
      });
    }
    function eingebaute(){ return 'Ohne KI gibt es Nomen zu diesen Themen: ' + THEMEN.map(function(th){ return th.name; }).join(', ') + '. Eigene Wörter gehen immer.'; }
    function kopf(){ return artenText(vorschlag.arten) + ' zu «' + esc(vorschlag.thema) + '»'; }
    function laedt(ja, text){
      $('#vorschlagen').disabled = ja; $('#mehrVorschlaege').disabled = ja;
      if (ja){
        $('#vorschlaege').hidden = false;
        $('#vorschlagTitel').innerHTML = kopf();
        $('#vorschlagInfo').innerHTML = '<span class="lade" aria-hidden="true"></span>' + esc(text);
      }
    }
    function info(h){
      $('#vorschlaege').hidden = false;
      if (!vorschlag || !vorschlag.woerter.length){ $('#vorschlagChips').innerHTML = ''; $('#vorschlagTitel').innerHTML = vorschlag ? kopf() : 'Wortvorschläge'; }
      $('#vorschlagInfo').innerHTML = h;
      $('#alleUebernehmen').hidden = $('#mehrVorschlaege').hidden = !vorschlag || !vorschlag.woerter.length;
    }
    /* Vorschläge anzeigen; bei mehreren Wortarten nach Wortart gruppiert */
    function zeige(eintraege, quelle){
      vorschlag.woerter = eintraege.map(function(x){ return x.w; });
      vorschlag.alle = vorschlag.alle.concat(vorschlag.woerter);
      eintraege.forEach(function(x){ vorschlag.gezeigt[norm(x.w)] = true; });
      $('#vorschlaege').hidden = false;
      $('#vorschlagTitel').innerHTML = kopf() + '<span class="quelle">' +
        (quelle === 'KI' || quelle === 'Claude' ? 'von ' + (quelle === 'Claude' ? 'Claude' : 'der KI') : 'eingebaute Liste') + '</span>';
      $('#vorschlagInfo').innerHTML = 'Anklicken, um ein Wort zu übernehmen oder wieder zu entfernen.' +
        (quelle === 'KI' ? ' Vorgeschlagen von einer KI (' + esc(vorschlag.kiName || 'KI') + ') – kurz prüfen, ob alles passt.' : '') +
        (quelle === 'Themenliste' && vorschlag.notiz ? '<br><span class="ki-notiz">' + esc(vorschlag.notiz) + '</span>' : '');
      $('#alleUebernehmen').hidden = $('#mehrVorschlaege').hidden = false;
      var box = $('#vorschlagChips'); box.innerHTML = '';
      var gruppen = REIHE.filter(function(a){ return eintraege.some(function(x){ return x.art === a; }); });
      gruppen.forEach(function(a){
        if (gruppen.length > 1){ var g = document.createElement('span'); g.className = 'chip-gruppe'; g.textContent = ARTEN[a].name; box.appendChild(g); }
        eintraege.filter(function(x){ return x.art === a; }).forEach(function(x){
          var b = document.createElement('button');
          b.type = 'button'; b.className = 'chip-vorschlag'; b.textContent = x.w;
          b.addEventListener('click', function(){ if (b.getAttribute('aria-pressed') === 'true') entferne(norm(x.w)); else hinzu([x.w]); });
          box.appendChild(b);
        });
      });
      status();
    }
    $('#alleUebernehmen').addEventListener('click', function(){ if (vorschlag) hinzu(vorschlag.woerter); });

    $('#mehrVorschlaege').addEventListener('click', function(){ vorschlagen(true); });

    /* ---------- Deine Wörter (so geschrieben, wie sie eingegeben werden) ---------- */
    function hinzu(liste){
      var drin = {}, kurz = [], schon = [];
      st.woerter.forEach(function(w){ drin[norm(w)] = true; });
      liste.forEach(function(w){
        w = String(w).trim(); var n = norm(w);
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

  return { THEMEN:THEMEN, ARTEN:ARTEN, findeThema:findeThema, schluessel:schluessel, html:html, verbinde:verbinde,
    enthaeltThema:enthaeltThema, themaStaemme:themaStaemme, kiAuftrag:kiAuftrag, kiListe:kiListe };
})();
