/* Rätsellabor · Rebus
   Wörter und Sätze werden zu Bilderrätseln: Bilder (Emojis) mit klassischen Rebus-Zeichen.
   Teile: Kern (Zerlegung in Bilder und Zeichen), Vorlage (Oberfläche),
   Bedienung (wird bei jedem Öffnen gestartet und beim Verlassen mit stopp() aufgeräumt). */
(function(){
'use strict';

/* KERN-START */
/* ===== Kern des Rebus =====
   Ein Lösungswort wird von links nach rechts in Teile zerlegt. Jeder Teil ist ein Bild (Emoji mit deutschem Namen),
   dessen Name mit klassischen Rebus-Zeichen verändert wird, oder ein einzelner Buchstabe:
     ’ vor dem Bild  = so viele Buchstaben am Anfang weglassen     ’ nach dem Bild = am Ende weglassen
     A=E             = jedes A durch E ersetzen                     durchgestrichen = diesen Buchstaben streichen
     1 3 4           = nur diese Buchstaben in dieser Reihenfolge   Bild auf dem Kopf = rückwärts lesen
   Gesucht wird die Zerlegung mit den kleinsten «Kosten» (wenige Bilder, wenige Zeichen); ein wenig Zufall sorgt für Abwechslung. */
var Kern = (function(){
'use strict';

/* Bilder: Name (Einzahl, ohne Artikel) und Emoji. Nur gut erkennbare, verbreitete Emojis. */
var LISTE = (
  'HUND🐶 KATZE🐱 MAUS🐭 HAMSTER🐹 HASE🐰 FUCHS🦊 BÄR🐻 PANDA🐼 KOALA🐨 TIGER🐯 LÖWE🦁 KUH🐮 SCHWEIN🐷 FROSCH🐸 AFFE🐵 ' +
  'HUHN🐔 PINGUIN🐧 VOGEL🐦 KÜKEN🐤 ENTE🦆 ADLER🦅 EULE🦉 WOLF🐺 PFERD🐴 EINHORN🦄 BIENE🐝 RAUPE🐛 SCHMETTERLING🦋 ' +
  'SCHNECKE🐌 MARIENKÄFER🐞 AMEISE🐜 SPINNE🕷️ SCHILDKRÖTE🐢 SCHLANGE🐍 ECHSE🦎 KRAKE🐙 KRABBE🦀 HUMMER🦞 FISCH🐟 DELFIN🐬 ' +
  'WAL🐳 HAI🦈 KROKODIL🐊 ELEFANT🐘 GIRAFFE🦒 ZEBRA🦓 KAMEL🐫 KÄNGURU🦘 SCHAF🐑 ZIEGE🐐 HIRSCH🦌 HAHN🐓 TRUTHAHN🦃 ' +
  'PAPAGEI🦜 SCHWAN🦢 FLAMINGO🦩 PFAU🦚 TAUBE🕊️ IGEL🦔 FLEDERMAUS🦇 EICHHÖRNCHEN🐿️ OTTER🦦 STIER🐂 NASHORN🦏 NILPFERD🦛 ' +
  'RATTE🐀 FAULTIER🦥 GORILLA🦍 LAMA🦙 LEOPARD🐆 DINO🦕 DRACHE🐉 SKORPION🦂 WURM🪱 KÄFER🪲 FLIEGE🪰 MÜCKE🦟 ROBBE🦭 ' +
  'APFEL🍎 BIRNE🍐 BANANE🍌 TRAUBE🍇 ERDBEERE🍓 KIRSCHE🍒 ZITRONE🍋 ORANGE🍊 MELONE🍉 ANANAS🍍 KIWI🥝 KOKOSNUSS🥥 ' +
  'AVOCADO🥑 KAROTTE🥕 MAIS🌽 GURKE🥒 TOMATE🍅 KARTOFFEL🥔 ZWIEBEL🧅 KNOBLAUCH🧄 BROKKOLI🥦 PAPRIKA🫑 OLIVE🫒 PILZ🍄 ' +
  'ERDNUSS🥜 KASTANIE🌰 BROT🍞 BREZEL🥨 GIPFELI🥐 BAGUETTE🥖 KÄSE🧀 EI🥚 BUTTER🧈 SPECK🥓 WAFFEL🧇 PFANNKUCHEN🥞 ' +
  'PIZZA🍕 BURGER🍔 POMMES🍟 SANDWICH🥪 NUDELN🍝 REIS🍚 SUSHI🍣 KUCHEN🍰 TORTE🎂 KEKS🍪 DONUT🍩 POPCORN🍿 ' +
  'SCHOKOLADE🍫 BONBON🍬 LUTSCHER🍭 HONIG🍯 MILCH🥛 KAFFEE☕ TEE🍵 SAFT🧃 GLACE🍦 EIS🧊 SALZ🧂 LÖFFEL🥄 MESSER🔪 TOPF🍲 ' +
  'SONNE☀️ MOND🌙 STERN⭐ WOLKE☁️ REGENBOGEN🌈 BLITZ⚡ SCHNEEFLOCKE❄️ SCHNEEMANN⛄ FEUER🔥 TROPFEN💧 WELLE🌊 VULKAN🌋 ' +
  'BERG⛰️ INSEL🏝️ STEIN🪨 HOLZ🪵 ERDE🌍 PLANET🪐 KOMET☄️ TORNADO🌪️ BAUM🌳 TANNE🌲 PALME🌴 KAKTUS🌵 SONNENBLUME🌻 ' +
  'ROSE🌹 TULPE🌷 BLÜTE🌸 KLEE🍀 BLATT🍁 MUSCHEL🐚 FEDER🪶 ZELT⛺ SCHIRM☂️ ' +
  'HAUS🏠 BURG🏰 SCHULE🏫 KIRCHE⛪ TURM🗼 BRÜCKE🌉 FABRIK🏭 SPITAL🏥 HOTEL🏨 ' +
  'AUTO🚗 BUS🚌 TRAM🚋 ZUG🚆 LOK🚂 VELO🚲 TROTTINETT🛴 MOTORRAD🏍️ TRAKTOR🚜 LASTWAGEN🚚 FEUERWEHR🚒 TAXI🚕 FLUGZEUG✈️ ' +
  'RAKETE🚀 SCHIFF🚢 BOOT🚤 SEGELBOOT⛵ KANU🛶 HELIKOPTER🚁 AMPEL🚦 ANKER⚓ GONDEL🚡 UFO🛸 SATELLIT🛰️ BAUSTELLE🚧 ' +
  'SCHLÜSSEL🔑 SCHLOSS🔒 HAMMER🔨 AXT🪓 SÄGE🪚 SCHERE✂️ LINEAL📏 BLEISTIFT✏️ PINSEL🖌️ BUCH📖 BÜCHER📚 BRIEF✉️ PAKET📦 ' +
  'GESCHENK🎁 BALLON🎈 SCHLEIFE🎀 DRACHEN🪁 TEDDY🧸 WÜRFEL🎲 PUZZLE🧩 BALL⚽ POKAL🏆 MEDAILLE🥇 GITARRE🎸 KLAVIER🎹 ' +
  'TROMMEL🥁 TROMPETE🎺 GEIGE🎻 GLOCKE🔔 MIKROFON🎤 KAMERA📷 FERNSEHER📺 TELEFON☎️ HANDY📱 WECKER⏰ UHR⌚ SANDUHR⌛ ' +
  'KERZE🕯️ TASCHENLAMPE🔦 MAGNET🧲 LEITER🪜 STUHL🪑 BETT🛏️ BADEWANNE🛁 DUSCHE🚿 TÜR🚪 FENSTER🪟 BESEN🧹 SCHWAMM🧽 ' +
  'KORB🧺 EIMER🪣 SOCKE🧦 HOSE👖 KLEID👗 SCHUH👟 STIEFEL👢 HUT🎩 KRONE👑 RING💍 BRILLE👓 HANDSCHUH🧤 SCHAL🧣 ' +
  'RUCKSACK🎒 TASCHE👜 KOFFER🧳 MÜNZE🪙 DIAMANT💎 SCHILD🛡️ BOGEN🏹 BUMERANG🪃 KOMPASS🧭 KARTE🗺️ MIKROSKOP🔬 ' +
  'FERNROHR🔭 PFLASTER🩹 SPRITZE💉 THERMOMETER🌡️ LUPE🔍 FAHNE🚩 ZIELSCHEIBE🎯 JOJO🪀 SKATEBOARD🛹 SCHLITTSCHUH⛸️ ' +
  'SKI🎿 SCHLITTEN🛷 FALLSCHIRM🪂 MASKE🎭 VASE🏺 KLINGEL🛎️ MAUSEFALLE🪤 ZAHNBÜRSTE🪥 SEIFE🧼 BATTERIE🔋 STECKER🔌 ' +
  'KETTE⛓️ SCHRAUBE🔩 NADEL🪡 FADEN🧵 WOLLE🧶 PALETTE🎨 BILD🖼️ KALENDER📅 SPIEGEL🪞 BÜROKLAMMER📎 REISSNAGEL📌 ' +
  'ZAUBERSTAB🪄 BABY👶 ROBOTER🤖 GESPENST👻 KÜRBIS🎃 TANNENBAUM🎄 HERZ❤️ ZAHN🦷 OHR👂 NASE👃 AUGE👁️ MUND👄 ZUNGE👅 ' +
  'HAND✋ FUSS🦶 BEIN🦵 ARM💪 GEHIRN🧠 KNOCHEN🦴 DAUMEN👍 KÖNIG🤴 PRINZESSIN👸 ENGEL👼 FEE🧚 CLOWN🤡 ' +
  'NULL0️⃣ EINS1️⃣ ZWEI2️⃣ DREI3️⃣ VIER4️⃣ FÜNF5️⃣ SECHS6️⃣ SIEBEN7️⃣ ACHT8️⃣ NEUN9️⃣ ZEHN🔟 ' +
  'FRAGEZEICHEN❓ AUSRUFEZEICHEN❗ PFEIL➡️ HAKEN✔️ PLUS➕ MINUS➖ STOPP🛑 NOTE🎵 KREUZ❌'
).split(' ').map(function(e){
  var m = e.match(/^([A-ZÄÖÜ]+)(.+)$/);
  return { wort:m[1], emoji:m[2] };
});

function norm(t){ return String(t || '').normalize('NFC').toLocaleUpperCase('de-CH'); }
/* Text → Wörter aus Grossbuchstaben (ß wird SS, Umlaute bleiben) */
function woerter(t){ return norm(t).split(/[^A-ZÄÖÜ]+/).filter(Boolean); }

var STUFEN = {
  einfach:{ tausch:false, streich:false, kopf:false, zahlen:false },
  mittel:{ tausch:true, streich:true, kopf:false, zahlen:false },
  schwer:{ tausch:true, streich:true, kopf:true, zahlen:true }
};

/* Alle Möglichkeiten, ab Stelle i des Wortes W mit einem Bild oder einem Buchstaben weiterzumachen */
function kandidaten(W, i, st, rnd, meiden){
  var k = [], rest = W.length - i;
  function neu(c){ c.kosten += rnd() * 0.9 + (meiden[c.bild ? c.bild.wort : ''] || 0); k.push(c); }
  LISTE.forEach(function(b){
    var P = b.wort, m = P.length;
    // Heisst das Bild genau wie das Lösungswort, dann nur unverändert (und ungern): sonst entstehen Dinge wie «S + ’SONNE»
    if (P === W){ if (i === 0) neu({ bild:b, vorne:0, hinten:0, laenge:m, kosten:13 }); return; }
    // Kommas: vorne / hinten Buchstaben weglassen
    for (var v = 0; v <= Math.min(3, m - 2); v++){
      for (var h = 0; h <= Math.min(3, m - v - 2); h++){
        var teil = P.slice(v, m - h), L = teil.length;
        if (L > rest) continue;
        var weg = v + h, ziel = W.substr(i, L);
        // nichts weglassen und das ganze Wort treffen ist zu einfach
        var ganz = (i === 0 && L === W.length && !weg) ? 9 : 0;
        if (teil === ziel && (weg <= L)){
          neu({ bild:b, vorne:v, hinten:h, laenge:L, kosten:4 + 1.15 * weg + ganz });
        }
        if (weg > 2) continue;
        // ein Buchstabe wird ausgetauscht (A=E: jedes A)
        if (st.tausch && teil !== ziel && ziel.length === L){
          var x = null, y = null, ok = true;
          for (var q = 0; q < L && ok; q++){
            if (teil[q] !== ziel[q]){
              if (x === null){ x = teil[q]; y = ziel[q]; } else if (teil[q] !== x || ziel[q] !== y) ok = false;
            } else if (teil[q] === x) ok = false;
          }
          if (ok && x !== null && teil.indexOf(x) >= 0){
            // auch vor der ersten Abweichung darf x nicht unverändert vorkommen
            var alle = true; for (q = 0; q < L; q++) if (teil[q] === x && ziel[q] !== y) alle = false;
            if (alle) neu({ bild:b, vorne:v, hinten:h, tausch:[x, y], laenge:L, kosten:4 + 1.15 * weg + 2.6 });
          }
        }
        // ein Buchstabe wird gestrichen (alle Vorkommen)
        if (st.streich){
          var gesehen = {};
          for (var s = 0; s < L; s++){
            var ch = teil[s]; if (gesehen[ch]) continue; gesehen[ch] = true;
            var ohne = teil.split(ch).join(''), anz = L - ohne.length;
            if (anz > 2 || ohne.length < 2 || ohne.length > rest) continue;
            if (W.substr(i, ohne.length) === ohne) neu({ bild:b, vorne:v, hinten:h, streich:ch, laenge:ohne.length, kosten:4 + 1.15 * weg + 2.3 + 0.6 * (anz - 1) });
          }
        }
      }
    }
    // Bild auf dem Kopf: rückwärts lesen
    if (st.kopf && m <= rest && m >= 3){
      var rueck = P.split('').reverse().join('');
      if (rueck !== P && W.substr(i, m) === rueck) neu({ bild:b, kopf:true, laenge:m, kosten:4 + 2.6 });
    }
    // Zahlen: bestimmte Buchstaben in bestimmter Reihenfolge
    if (st.zahlen && m <= 7){
      for (var L2 = 2; L2 <= Math.min(m - 1, rest, 4); L2++){
        var z = W.substr(i, L2), pos = [], frei = P.split('');
        for (var t = 0; t < L2; t++){
          var p = frei.indexOf(z[t]); if (p < 0){ pos = null; break; }
          pos.push(p + 1); frei[p] = null;
        }
        if (!pos) continue;
        var zusammen = true; for (t = 1; t < pos.length; t++) if (pos[t] !== pos[t - 1] + 1) zusammen = false;
        if (zusammen) continue;   // das gingen auch Kommas
        var steigend = true; for (t = 1; t < pos.length; t++) if (pos[t] < pos[t - 1]) steigend = false;
        if (!steigend && L2 > 3) continue;   // lange Zahlenreihen kreuz und quer sind kaum zu lesen
        neu({ bild:b, zahlen:pos, laenge:L2, kosten:4 + 2.8 + 0.3 * m + (steigend ? 0 : 1.5) });
      }
    }
  });
  // einzelner Buchstabe als Notlösung
  neu({ buchstabe:W[i], laenge:1, kosten:6.5 });
  return k;
}

/* Beste Zerlegung eines Wortes (dynamische Programmierung von hinten nach vorn) */
function zerlegeWort(W, st, rnd, meiden){
  var n = W.length, best = new Array(n + 1), wahl = new Array(n + 1);
  best[n] = 0;
  for (var i = n - 1; i >= 0; i--){
    best[i] = Infinity;
    kandidaten(W, i, st, rnd, meiden).forEach(function(c){
      var j = i + c.laenge;
      if (j <= n && c.kosten + best[j] < best[i]){ best[i] = c.kosten + best[j]; wahl[i] = c; }
    });
  }
  var teile = [];
  for (i = 0; i < n; i += wahl[i].laenge) teile.push(wahl[i]);
  return teile;
}

/* Was ein Teil ergibt (zur Kontrolle und für die Lösung) */
function ergebnis(c){
  if (c.buchstabe) return c.buchstabe;
  var P = c.bild.wort;
  if (c.kopf) return P.split('').reverse().join('');
  if (c.zahlen) return c.zahlen.map(function(p){ return P[p - 1]; }).join('');
  var t = P.slice(c.vorne || 0, P.length - (c.hinten || 0));
  if (c.tausch) t = t.split(c.tausch[0]).join(c.tausch[1]);
  if (c.streich) t = t.split(c.streich).join('');
  return t;
}

/* Text → Rebus: für jedes Wort die Teile. Bilder werden möglichst nicht doppelt verwendet. */
function rebus(text, o){
  o = o || {};
  var st = STUFEN[o.stufe] || STUFEN.mittel, rnd = o.rnd || Math.random, meiden = {};
  (o.schonBenutzt || []).forEach(function(w){ meiden[w] = (meiden[w] || 0) + 2.5; });
  var ws = woerter(text);
  return ws.map(function(W){
    var teile = zerlegeWort(W, st, rnd, meiden);
    teile.forEach(function(c){ if (c.bild) meiden[c.bild.wort] = (meiden[c.bild.wort] || 0) + 4; });
    return { wort:W, teile:teile };
  });
}

return { LISTE:LISTE, STUFEN:STUFEN, rebus:rebus, ergebnis:ergebnis, woerter:woerter, norm:norm };
})();
/* KERN-ENDE */

/* ===== Vorlage: Oberfläche des Generators ===== */
var VORLAGE = `<div class="rb">
  <header class="rb-kopf">
    <p class="augenbraue">Rätselgenerator</p>
    <h1>Rebus</h1>
    <p>Wörter und Sätze als Bilderrätsel: Bilder, bei denen Buchstaben weggelassen, gestrichen oder ausgetauscht werden.</p>
  </header>
  <div class="rb-layout">
    <section class="rb-eingabe" aria-label="Eingaben">
      <div class="karte">
        <div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span>
          <div><h2>Lösungswörter</h2><p>Jedes Wort oder jeder kurze Satz wird ein eigener Rebus.</p></div>
        </div>
        <div class="zeile">
          <input type="text" id="rbNeu" maxlength="40" placeholder="z. B. Ferien oder Viel Glück" autocomplete="off" aria-label="Lösungswort oder Satz">
          <button type="button" class="btn" id="rbPlus">Hinzufügen</button>
        </div>
        <ol class="rb-liste" id="rbListe" aria-label="Lösungswörter"></ol>
        <p class="hinweis" id="rbInfo" aria-live="polite"></p>
      </div>

      <div class="karte">
        <div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span>
          <div><h2>Schwierigkeit</h2><p>Welche Zeichen in den Rätseln vorkommen.</p></div>
        </div>
        <div class="rb-stufen" role="radiogroup" aria-label="Schwierigkeit">
          <label class="rb-stufe"><input type="radio" name="rbStufe" value="einfach"><span><b>Einfach</b><small>Bilder, Kommas und einzelne Buchstaben</small></span></label>
          <label class="rb-stufe"><input type="radio" name="rbStufe" value="mittel"><span><b>Mittel</b><small>dazu Buchstaben austauschen und streichen</small></span></label>
          <label class="rb-stufe"><input type="radio" name="rbStufe" value="schwer"><span><b>Schwer</b><small>dazu Zahlen und Bilder auf dem Kopf</small></span></label>
        </div>
      </div>

      <div class="karte">
        <details class="optionen" id="rbOptionen">
          <summary>Einstellungen</summary>
          <label class="feld-label" for="rbTitel">Titel auf dem Blatt</label>
          <input type="text" id="rbTitel" maxlength="60" placeholder="Bilderrätsel" autocomplete="off">
          <label class="opt"><input type="checkbox" id="rbKaestchen"><span>Für jeden Buchstaben der Lösung ein Kästchen</span></label>
          <label class="opt"><input type="checkbox" id="rbLegende"><span>Zeichenerklärung auf dem Blatt</span></label>
          <label class="opt"><input type="checkbox" id="rbNamen"><span>Bildnamen als Hilfe klein unter die Bilder schreiben</span></label>
        </details>
      </div>
    </section>

    <section class="rb-ausgabe" aria-label="Ergebnis">
      <div id="rbMeldung" aria-live="polite"></div>
      <div class="rb-werkzeug" id="rbWerkzeug" hidden>
        <button type="button" class="btn klein" id="rbWuerfeln" title="Alle Rätsel mit anderen Bildern">Neu würfeln</button>
        <button type="button" class="btn klein" id="rbZeigeLoesung" aria-pressed="false">Lösung zeigen</button>
        <span class="abstand"></span>
        <label><input type="checkbox" id="rbMitLoesung"> mit Lösungsblatt</label>
        <button type="button" class="btn klein primary" id="rbDrucken">Drucken</button>
        <button type="button" class="btn klein primary" id="rbHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>
      </div>
      <article class="rb-blatt" id="rbBlatt"></article>
      <article class="rb-blatt rb-loesungsblatt" id="rbLoesung" aria-hidden="true"></article>
    </section>
  </div>
</div>`;

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="4" y="6" width="16" height="14" rx="2.5"/><circle cx="9.5" cy="11" r="1.6"/><path d="m5 18 4.5-4.5 3 3 2-2L20 18"/><path d="M5 2.5 4.2 4.6M8.4 2.5l-.8 2.1"/></svg>';

Labor.registriere({
  id:'rebus',
  titel:'Rebus',
  kurz:'Wörter als Bilderrätsel mit Kommas und Buchstabenzeichen',
  beschreibung:'Aus einem Wort oder Satz wird ein Bilderrätsel: Bilder, bei denen man Buchstaben weglässt, streicht oder austauscht. Mehrere Rätsel auf einem Blatt.',
  merkmale:['Drei Schwierigkeitsstufen', 'Mehrere Rätsel pro Blatt', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/rebus/rebus.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); };
  var esc = Labor.esc, aus = false;
  var TAB = 'rebus-eingaben', OPT = 'rebus-einstellungen', MAX = 12;
  var STANDARD = { stufe:'mittel', kaestchen:true, legende:true, namen:false, mitLoesung:true };

  /* ---------- Zustand: Einträge nur für diesen Tab, Einstellungen bleiben ---------- */
  var st = { titel:'', eintraege:[], opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e && Array.isArray(e.eintraege)){ st.eintraege = e.eintraege.map(String).slice(0, MAX); st.titel = String(e.titel || ''); } } catch(x){}
  var timer = 0;
  function speichernJetzt(){
    clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ titel:st.titel, eintraege:st.eintraege })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){}
  }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }

  // Fertige Rätsel je Eintrag (ein neuer Eintrag verändert die anderen nicht)
  var raetsel = {};
  function schluessel(t){ return Kern.woerter(t).join(' '); }
  function wuerfle(t, alle){
    var benutzt = [];
    st.eintraege.forEach(function(x){ var r = raetsel[schluessel(x)]; if (r && schluessel(x) !== schluessel(t)) r.forEach(function(w){ w.teile.forEach(function(c){ if (c.bild) benutzt.push(c.bild.wort); }); }); });
    raetsel[schluessel(t)] = Kern.rebus(t, { stufe:st.opt.stufe, schonBenutzt:alle ? [] : benutzt });
  }
  function sicherstellen(){ st.eintraege.forEach(function(t){ if (!raetsel[schluessel(t)]) wuerfle(t); }); }

  /* ---------- Einträge ---------- */
  var neu = $('#rbNeu');
  function hinzu(text){
    var teile = String(text).split(/[\n;]+/).map(function(t){ return t.trim().replace(/\s+/g, ' '); }).filter(Boolean), notiz = [];
    teile.forEach(function(t){
      var w = Kern.woerter(t);
      if (!w.length){ notiz.push('«' + esc(t) + '» enthält keine Buchstaben'); return; }
      if (w.join('').length > 30){ notiz.push('«' + esc(t) + '» ist zu lang (höchstens 30 Buchstaben)'); return; }
      if (st.eintraege.some(function(x){ return schluessel(x) === w.join(' '); })){ notiz.push('«' + esc(t) + '» ist schon in der Liste'); return; }
      if (st.eintraege.length >= MAX){ notiz.push('Höchstens ' + MAX + ' Rätsel pro Blatt'); return; }
      st.eintraege.push(t);
    });
    $('#rbInfo').innerHTML = notiz.join(' · ');
    speichern(); zeichneListe(); zeige();
  }
  $('#rbPlus').addEventListener('click', function(){ if (neu.value.trim()){ hinzu(neu.value); neu.value = ''; } neu.focus(); });
  neu.addEventListener('keydown', function(e){ if (e.key === 'Enter'){ e.preventDefault(); $('#rbPlus').click(); } });
  neu.addEventListener('paste', function(e){
    var t = (e.clipboardData || window.clipboardData).getData('text');
    if (!/[\n;]/.test(t)) return;
    e.preventDefault(); hinzu(t);
  });
  function zeichneListe(){
    var ol = $('#rbListe'); ol.innerHTML = '';
    st.eintraege.forEach(function(t, i){
      var li = document.createElement('li');
      li.innerHTML = '<span class="rb-liste-nr" aria-hidden="true">' + (i + 1) + '</span><span class="rb-liste-text"></span>' +
        '<button type="button" class="weg" aria-label="' + esc(t) + ' entfernen" title="Entfernen">×</button>';
      li.querySelector('.rb-liste-text').textContent = t;
      li.querySelector('.weg').addEventListener('click', function(){
        st.eintraege.splice(i, 1); $('#rbInfo').textContent = ''; speichern(); zeichneListe(); zeige();
      });
      ol.appendChild(li);
    });
  }

  /* ---------- Einstellungen ---------- */
  [].forEach.call(bereich.querySelectorAll('input[name="rbStufe"]'), function(r){
    r.checked = r.value === st.opt.stufe;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.stufe = r.value; raetsel = {}; speichern(); zeige(); });
  });
  var titelFeld = $('#rbTitel');
  titelFeld.value = st.titel;
  titelFeld.addEventListener('input', function(){ st.titel = titelFeld.value; speichern(); zeige(); });
  [['rbKaestchen', 'kaestchen'], ['rbLegende', 'legende'], ['rbNamen', 'namen'], ['rbMitLoesung', 'mitLoesung']].forEach(function(p){
    var el = $('#' + p[0]); el.checked = !!st.opt[p[1]];
    el.addEventListener('change', function(){ st.opt[p[1]] = el.checked; speichern(); if (p[1] !== 'mitLoesung') zeige(); });
  });

  /* ---------- Darstellung ---------- */
  function teilHtml(c, loesung){
    var oben = '', bild, vorne = '', hinten = '', name = '';
    if (c.buchstabe){
      bild = '<span class="rb-buchstabe">' + esc(c.buchstabe) + '</span>';
    } else {
      if (c.tausch) oben = '<span class="rb-tausch">' + esc(c.tausch[0]) + '=' + esc(c.tausch[1]) + '</span>';
      else if (c.streich) oben = '<span class="rb-streich">' + esc(c.streich) + '</span>';
      else if (c.zahlen) oben = '<span class="rb-zahlen">' + c.zahlen.join(' ') + '</span>';
      if (c.vorne) vorne = '<span class="rb-kommas">' + Array(c.vorne + 1).join('<span class="rb-komma">’</span>') + '</span>';
      if (c.hinten) hinten = '<span class="rb-kommas">' + Array(c.hinten + 1).join('<span class="rb-komma">’</span>') + '</span>';
      bild = '<span class="rb-bild' + (c.kopf ? ' rb-kopfueber' : '') + '">' + c.bild.emoji + '</span>';
      name = '<span class="rb-name' + (st.opt.namen ? ' rb-hilfe' : '') + '">' + esc(c.bild.wort) + '</span>';
    }
    return '<div class="rb-teil' + (c.buchstabe ? ' rb-nur-buchstabe' : '') + '">' +
      '<div class="rb-oben">' + oben + '</div>' +
      '<div class="rb-bildzeile">' + vorne + bild + hinten + '</div>' +
      name + '<span class="rb-ergebnis">' + esc(Kern.ergebnis(c)) + '</span></div>';
  }
  function kaestchen(woerter, fuellen){
    return '<div class="rb-kaestchen" aria-hidden="true">' + woerter.map(function(w){
      return '<span class="rb-kwort">' + Array.from(w.wort).map(function(ch){ return '<span class="rb-k">' + (fuellen ? esc(ch) : '') + '</span>'; }).join('') + '</span>';
    }).join('') + '</div>';
  }
  var LEGENDE = [
    ['vorne', '<span class="rb-kommas"><span class="rb-komma">’</span></span><span class="rb-bild">🐭</span>', 'Komma vor dem Bild: den ersten Buchstaben weglassen, bei zwei Kommas die ersten zwei. 🐭 MAUS wird zu AUS.'],
    ['hinten', '<span class="rb-bild">🦆</span><span class="rb-kommas"><span class="rb-komma">’</span><span class="rb-komma">’</span></span>', 'Komma nach dem Bild: den letzten Buchstaben weglassen, bei zwei Kommas die letzten zwei. 🦆 ENTE wird zu EN.'],
    ['tausch', '<span class="rb-tausch">O=Ä</span>', 'Buchstaben austauschen: im Wort jedes O durch Ä ersetzen.'],
    ['streich', '<span class="rb-streich">F</span>', 'Durchgestrichener Buchstabe: diesen Buchstaben aus dem Wort streichen.'],
    ['zahlen', '<span class="rb-zahlen">2 4 5</span>', 'Zahlen: nur diese Buchstaben in dieser Reihenfolge nehmen (1 = erster Buchstabe).'],
    ['kopf', '<span class="rb-bild rb-kopfueber">🚪</span>', 'Bild auf dem Kopf: das Wort rückwärts lesen.'],
    ['buchstabe', '<span class="rb-buchstabe">R</span>', 'Einzelne Buchstaben gehören einfach dazu.']
  ];
  function benutzteZeichen(liste){
    var z = {};
    liste.forEach(function(r){ r.forEach(function(w){ w.teile.forEach(function(c){
      if (c.buchstabe) z.buchstabe = 1; if (c.vorne) z.vorne = 1; if (c.hinten) z.hinten = 1;
      if (c.tausch) z.tausch = 1; if (c.streich) z.streich = 1; if (c.zahlen) z.zahlen = 1; if (c.kopf) z.kopf = 1;
    }); }); });
    return z;
  }
  function blattHtml(liste, loesung, beispiel){
    var titel = st.titel.trim() || 'Bilderrätsel', z = benutzteZeichen(liste.map(function(x){ return x.r; }));
    var html = '<h2 class="rb-titel">' + esc(loesung ? 'Lösung – ' + titel : titel) + '</h2>';
    if (!loesung) html += '<p class="rb-anleitung">' + (beispiel ? 'So sieht ein Rebus aus: ' : '') +
      'Welche Wörter verstecken sich in den Bildern? Die Bilder stehen für Wörter in der Einzahl, ohne Artikel.</p>';
    if (st.opt.legende && !loesung){
      var items = LEGENDE.filter(function(l){ return z[l[0]]; });
      if (items.length) html += '<div class="rb-legende">' + items.map(function(l){ return '<div class="rb-leg"><span class="rb-leg-zeichen" aria-hidden="true">' + l[1] + '</span><span>' + l[2] + '</span></div>'; }).join('') + '</div>';
    }
    html += '<ol class="rb-raetsel">';
    liste.forEach(function(x, i){
      html += '<li class="rb-eintrag" data-i="' + i + '"><span class="rb-nr">' + (liste.length > 1 ? (i + 1) + '.' : '') + '</span><div class="rb-inhalt">' +
        '<div class="rb-zeile">' + x.r.map(function(w){ return '<div class="rb-wort">' + w.teile.map(function(c){ return teilHtml(c, loesung); }).join('') + '</div>'; }).join('<span class="rb-wortgrenze" aria-hidden="true"></span>') + '</div>';
      if (loesung) html += '<p class="rb-loesungswort">' + esc(x.r.map(function(w){ return w.wort; }).join(' ')) + '</p>';
      else if (st.opt.kaestchen) html += kaestchen(x.r, false);
      else html += '<div class="rb-linie" aria-hidden="true"></div>';
      if (!loesung && !beispiel) html += '<div class="rb-pruefen nur-bildschirm"><input type="text" class="rb-eingabe-loesung" aria-label="Deine Lösung für Rätsel ' + (i + 1) + '" placeholder="Deine Lösung" autocomplete="off" spellcheck="false">' +
        '<span class="rb-status" aria-live="polite"></span><button type="button" class="btn ghost klein rb-anders" title="Nur dieses Rätsel mit anderen Bildern">Anders</button></div>';
      html += '</div></li>';
    });
    return html + '</ol>';
  }
  function meldung(art, html){ $('#rbMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  function zeige(){
    if (aus) return;
    var blatt = $('#rbBlatt'), loes = $('#rbLoesung');
    if (!st.eintraege.length){
      // Leerer Zustand: ein Beispiel zeigt, wie ein Rebus aussieht
      var bsp = [{ r:Kern.rebus('Rätsel', { stufe:'mittel', rnd:festerZufall(7) }) }];
      blatt.innerHTML = '<p class="rb-beispiel-marke">Beispiel</p>' + blattHtml(bsp, false, true) +
        '<p class="rb-beispiel-text">Lösung: <b>RÄTSEL</b> = ' + bsp[0].r[0].teile.map(erklaere).map(esc).join(' + ') + '. Füge links ein Wort hinzu, um dein eigenes Rätsel zu erstellen.</p>';
      blatt.classList.add('rb-beispiel'); blatt.classList.remove('zeige-loesung');
      loes.innerHTML = ''; $('#rbWerkzeug').hidden = true; meldung('', '');
      $('#rbZeigeLoesung').setAttribute('aria-pressed', 'false');
      return;
    }
    sicherstellen();
    var liste = st.eintraege.map(function(t){ return { t:t, r:raetsel[schluessel(t)] }; });
    blatt.classList.remove('rb-beispiel');
    blatt.innerHTML = blattHtml(liste, false, false);
    loes.innerHTML = blattHtml(liste, true, false);
    $('#rbWerkzeug').hidden = false;
    pruefenEinrichten(liste);
    // Hinweise
    var hinweise = [];
    liste.forEach(function(x){
      var teile = [].concat.apply([], x.r.map(function(w){ return w.teile; })), einzeln = teile.filter(function(c){ return c.buchstabe; }).length;
      if (x.r.length === 1 && teile.length === 1 && teile[0].bild) hinweise.push('«' + esc(x.t) + '» ist selbst ein Bild – dieses Rätsel ist sehr leicht.');
      else if (einzeln >= 3 && einzeln / teile.length > 0.4) hinweise.push('Für «' + esc(x.t) + '» gibt es wenige passende Bilder, einige Buchstaben stehen einzeln. «Anders» oder eine höhere Schwierigkeit kann helfen.');
    });
    meldung(hinweise.length ? 'warnung' : '', hinweise.length ? '<ul>' + hinweise.map(function(h){ return '<li>' + h + '</li>'; }).join('') + '</ul>' : '');
  }
  /* Ein Teil in Worten, z. B. «BROT ohne den ersten Buchstaben, O wird zu Ä → RÄT» */
  function erklaere(c){
    if (c.buchstabe) return c.buchstabe;
    var t = [];
    if (c.vorne) t.push(c.vorne === 1 ? 'ohne den ersten Buchstaben' : 'ohne die ersten ' + c.vorne);
    if (c.hinten) t.push(c.hinten === 1 ? 'ohne den letzten Buchstaben' : 'ohne die letzten ' + c.hinten);
    if (c.tausch) t.push(c.tausch[0] + ' wird zu ' + c.tausch[1]);
    if (c.streich) t.push('ohne ' + c.streich);
    if (c.zahlen) t.push('Buchstaben ' + c.zahlen.join(', '));
    if (c.kopf) t.push('rückwärts');
    return c.bild.wort + (t.length ? ' ' + t.join(', ') : '') + ' → ' + Kern.ergebnis(c);
  }
  function festerZufall(seed){ return function(){ seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  function pruefenEinrichten(liste){
    [].forEach.call(bereich.querySelectorAll('#rbBlatt .rb-eintrag'), function(li){
      var x = liste[+li.dataset.i], ziel = x.r.map(function(w){ return w.wort; }).join('');
      var inp = li.querySelector('.rb-eingabe-loesung'), stat = li.querySelector('.rb-status');
      inp.addEventListener('input', function(){
        var v = Kern.woerter(inp.value).join('');
        li.classList.toggle('rb-richtig', v === ziel);
        stat.textContent = v === ziel ? 'Richtig!' : (v.length >= ziel.length ? 'Noch nicht' : '');
      });
      li.querySelector('.rb-anders').addEventListener('click', function(){ wuerfle(x.t); zeige(); });
    });
  }

  /* ---------- Werkzeuge ---------- */
  $('#rbWuerfeln').addEventListener('click', function(){ raetsel = {}; zeige(); });
  $('#rbZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true';
    this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#rbBlatt').classList.toggle('zeige-loesung', an);
  });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  $('#rbDrucken').addEventListener('click', function(){ druckVorbereiten(); window.print(); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#rbDrucken').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#rbHerunterladen').hidden = false; });
  }
  function ohneBildschirmteile(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeige-loesung');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('.rb-richtig'), function(n){ n.classList.remove('rb-richtig'); });
    return k;
  }
  $('#rbHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !st.eintraege.length) return;
    var titel = st.titel.trim() || 'Bilderrätsel', inhalt = ohneBildschirmteile($('#rbBlatt')).outerHTML;
    if (st.opt.mitLoesung){ var l = ohneBildschirmteile($('#rbLoesung')); l.classList.add('neue-seite'); inhalt += l.outerHTML; }
    speicherOrt.save({ filename:'Rebus-' + (Labor.dateiname(titel) || 'Raetsel') + '.html', data:Labor.blattDatei('Rebus – ' + titel, inhalt, '.rb-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichneListe();
  zeige();

  return function stopp(){
    aus = true;
    if (timer) speichernJetzt();
    window.removeEventListener('beforeprint', druckVorbereiten);
    document.body.classList.remove('mit-loesung');
  };
}
})();
