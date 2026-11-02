/* Rätsellabor · Rebus
   Wörter und Sätze werden zu Bilderrätseln: Bilder (Emojis) mit klassischen Rebus-Zeichen.
   Teile: Kern (Zerlegung in Bilder und Zeichen), Vorlage (Oberfläche),
   Bedienung (wird bei jedem Öffnen gestartet und beim Verlassen mit stopp() aufgeräumt). */
(function(){
'use strict';

/* KERN-START */
/* ===== Kern des Rebus =====
   Jedes Wort wird von links nach rechts in Teile zerlegt, meist genau ein Bild pro Wort. Ein Bild (Emoji mit deutschem Namen)
   wird mit Regeln zum gesuchten Teil, die man der Reihe nach anwendet:
     ko=i  = «ko» durch «i» ersetzen (auch mehrere Buchstaben)     −k = den Buchstaben k weglassen     +r = r am Ende anhängen
   Beispiel «Ich arbeite gerne»: 👨‍🍳 KOCH ko=i → ICH, 🐜 AMEISE m=rb s=t → ARBEITE, 🍐 BIRNE bi=ge → GERNE.
   Gesucht wird die Zerlegung mit den kleinsten «Kosten» (wenige Bilder, wenige Regeln); ein wenig Zufall sorgt für Abwechslung. */
var Kern = (function(){
'use strict';

/* Bilder: Name (Einzahl, ohne Artikel) und Emoji. Nur gut erkennbare, verbreitete Emojis. */
var LISTE = (
  'KOCH👨‍🍳 PILOT👨‍✈️ MALER👨‍🎨 BAUER👨‍🌾 ASTRONAUT👨‍🚀 LEHRER👨‍🏫 ARZT👨‍⚕️ ' +
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

/* Stufen: wie viele Regeln ein Bild haben darf und wie viele Buchstaben eine Regel umfassen darf */
var STUFEN = {
  einfach:{ regeln:1, tausch:2, weg:2, dazu:2 },
  mittel:{ regeln:2, tausch:2, weg:2, dazu:2 },
  schwer:{ regeln:3, tausch:3, weg:2, dazu:3 }
};

function haeufigkeit(s){ var h = {}; for (var k = 0; k < s.length; k++) h[s[k]] = (h[s[k]] || 0) + 1; return h; }
LISTE.forEach(function(b){ b.h = haeufigkeit(b.wort); });
function gemeinsam(h1, s){ var h = haeufigkeit(s), n = 0; for (var k in h) n += Math.min(h[k], h1[k] || 0); return n; }

/* Regeln der Reihe nach anwenden, so wie sie ein Kind löst. Jede Tausch- und Minus-Regel muss eindeutig sein. */
function anwenden(P, regeln){
  var w = P;
  for (var k = 0; k < regeln.length; k++){
    var r = regeln[k];
    if (r.art === 'dazu'){ w += r.zu; continue; }
    var p = w.indexOf(r.von);
    if (p < 0 || w.indexOf(r.von, p + 1) >= 0) return null;
    w = w.slice(0, p) + (r.art === 'tausch' ? r.zu : '') + w.slice(p + r.von.length);
  }
  return w;
}

/* Wie wird aus dem Bildwort P der Teil S? Gesucht sind wenige zusammenhängende Änderungen:
   tauschen (x=y), weglassen (−x) und am Ende anhängen (+y). Liefert { regeln, kosten } oder null. */
function verwandle(P, S, st){
  var m = P.length, L = S.length, B = L + 1, N = (m + 1) * B, INF = 1e9;
  var kost = [new Float64Array(N).fill(INF), new Float64Array(N).fill(INF)];
  var zurueck = [new Int32Array(N).fill(-1), new Int32Array(N).fill(-1)];   // vorheriger Zustand: s * N + Index
  kost[0][0] = 0;
  function setze(s, i, j, c, vorher){ var x = i * B + j; if (c < kost[s][x]){ kost[s][x] = c; zurueck[s][x] = vorher; } }
  for (var i = 0; i <= m; i++) for (var j = 0; j <= L; j++){
    for (var s = 0; s < 2; s++){
      var x = i * B + j, c = kost[s][x];
      if (c >= INF) continue;
      if (i < m && j < L && P[i] === S[j]) setze(0, i + 1, j + 1, c, s * N + x);
      if (s === 1) continue;   // zwei Änderungen direkt hintereinander wären eine
      for (var a = 0; a <= Math.max(st.tausch, st.weg) && i + a <= m; a++){
        for (var b = 0; b <= Math.max(st.tausch, st.dazu) && j + b <= L; b++){
          if (!a && !b) continue;
          var kosten;
          if (a && b){ if (a > st.tausch || b > st.tausch) continue; kosten = 1.7 + 0.45 * (a + b); }
          else if (a){ if (a > st.weg) continue; kosten = 1.5 + 0.45 * a; }
          else { if (b > st.dazu || i !== m || j + b !== L) continue; kosten = 1.5 + 0.45 * b; }   // Plus nur am Ende
          setze(1, i + a, j + b, c + kosten, s * N + x);
        }
      }
    }
  }
  var ende = m * B + L, sEnde = kost[0][ende] <= kost[1][ende] ? 0 : 1;
  if (kost[sEnde][ende] >= INF) return null;
  // Weg zurückverfolgen: Folge von Übereinstimmungen (je ein Buchstabe) und Änderungen
  var schritte = [], z = sEnde * N + ende;
  while (z !== 0){
    var sz = Math.floor(z / N), xz = z % N, v = zurueck[sz][xz];
    if (v < 0) return null;
    var xv = v % N, iv = Math.floor(xv / B), jv = xv % B, iz = Math.floor(xz / B), jz = xz % B;
    schritte.unshift({ gleich:sz === 0, p:P.slice(iv, iz), s:S.slice(jv, jz) });
    z = v;
  }
  var gleich = schritte.filter(function(t){ return t.gleich; }).length;
  if (gleich < 2 || gleich < 0.45 * L || gleich < 0.35 * m) return null;
  // Regeln bauen. Kommt die Stelle im Bildwort mehrmals vor, wird sie um gleiche Nachbarbuchstaben erweitert.
  var regeln = [], kosten = 0, pos = 0, frei = 0;   // frei: ab hier darf eine Regel nach links greifen
  for (var k = 0; k < schritte.length; k++){
    var t = schritte[k];
    if (t.gleich){ pos += 1; continue; }
    var von = t.p, zu = t.s, start = pos, ende2 = pos + von.length, versuche = 0;
    while (von && P.indexOf(von) !== P.lastIndexOf(von) && versuche < 3){
      var nach = schritte[k + 1];
      if (nach && nach.gleich){ von += nach.p; zu += nach.s; schritte.splice(k + 1, 1); ende2 += 1; }
      else if (start > frei){ von = P[start - 1] + von; zu = P[start - 1] + zu; start -= 1; }
      else break;
      kosten += 0.6; versuche++;
    }
    if (von && P.indexOf(von) !== P.lastIndexOf(von)) return null;
    pos = ende2; frei = ende2;
    var r = !von ? { art:'dazu', zu:zu } : !zu ? { art:'weg', von:von } : { art:'tausch', von:von, zu:zu };
    kosten += (r.art === 'tausch' ? 1.7 : 1.5) + 0.45 * (von.length + zu.length);
    regeln.push(r);
  }
  if (regeln.length > st.regeln) return null;
  if (anwenden(P, regeln) !== S) return null;
  return { regeln:regeln, kosten:kosten };
}

/* Alle Möglichkeiten, ab Stelle i des Wortes W mit einem Bild oder Buchstaben weiterzumachen */
function kandidaten(W, i, st, rnd, meiden, einzelwort){
  var k = [], rest = W.length - i;
  function neu(c){ c.kosten += rnd() * 0.9 + (c.bild ? (meiden[c.bild.wort] || 0) : 0); k.push(c); }
  LISTE.forEach(function(b){
    var P = b.wort, m = P.length;
    for (var L = 2; L <= rest; L++){
      if (Math.abs(m - L) > 3) continue;
      var S = W.substr(i, L);
      if (P === S){
        // genau das Lösungswort als einziges Bild wäre zu leicht
        neu({ bild:b, regeln:[], laenge:L, kosten:(einzelwort && i === 0 && L === W.length) ? 13 : 4 });
        continue;
      }
      if (gemeinsam(b.h, S) < Math.max(2, Math.ceil(0.45 * L))) continue;
      var v = verwandle(P, S, st);
      if (v) neu({ bild:b, regeln:v.regeln, laenge:L, kosten:4 + v.kosten });
    }
  });
  neu({ buchstabe:W[i], laenge:1, kosten:6.5 });
  if (i === 0 && W.length === 2) neu({ buchstabe:W, laenge:2, kosten:7 });   // kurze Wörter wie «IN» als Buchstaben
  return k;
}

/* Beste Zerlegung eines Wortes (dynamische Programmierung von hinten nach vorn) */
function zerlegeWort(W, st, rnd, meiden, einzelwort){
  var n = W.length, best = new Array(n + 1), wahl = new Array(n + 1);
  best[n] = 0;
  for (var i = n - 1; i >= 0; i--){
    best[i] = Infinity;
    kandidaten(W, i, st, rnd, meiden, einzelwort).forEach(function(c){
      var j = i + c.laenge;
      if (j <= n && c.kosten + best[j] < best[i]){ best[i] = c.kosten + best[j]; wahl[i] = c; }
    });
  }
  var teile = [];
  for (i = 0; i < n; i += wahl[i].laenge) teile.push(wahl[i]);
  return teile;
}

/* Was ein Teil ergibt */
function ergebnis(c){ return c.buchstabe ? c.buchstabe : anwenden(c.bild.wort, c.regeln); }

/* Text → Rebus: für jedes Wort die Teile. Bilder werden möglichst nicht doppelt verwendet. */
function rebus(text, o){
  o = o || {};
  var st = STUFEN[o.stufe] || STUFEN.mittel, rnd = o.rnd || Math.random, meiden = {};
  (o.schonBenutzt || []).forEach(function(w){ meiden[w] = (meiden[w] || 0) + 2.5; });
  var ws = woerter(text);
  return ws.map(function(W){
    var teile = zerlegeWort(W, st, rnd, meiden, ws.length === 1);
    teile.forEach(function(c){ if (c.bild) meiden[c.bild.wort] = (meiden[c.bild.wort] || 0) + 4; });
    return { wort:W, teile:teile };
  });
}

return { LISTE:LISTE, STUFEN:STUFEN, rebus:rebus, ergebnis:ergebnis, anwenden:anwenden, woerter:woerter, norm:norm };
})();
/* KERN-ENDE */

/* ===== Vorlage: Oberfläche des Generators ===== */
var VORLAGE = `<div class="rb">
  <header class="rb-kopf">
    <p class="augenbraue">Rätselgenerator</p>
    <h1>Rebus</h1>
    <p>Wörter und ganze Sätze als Bilderrätsel: Zu jedem Bild gehören Regeln wie «ko=i», «−m» oder «+e».</p>
  </header>
  <div class="rb-layout">
    <section class="rb-eingabe" aria-label="Eingaben">
      <div class="karte">
        <div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span>
          <div><h2>Wörter und Sätze</h2><p>Jedes Wort oder jeder Satz wird ein eigener Rebus, meist mit einem Bild pro Wort.</p></div>
        </div>
        <div class="zeile">
          <input type="text" id="rbNeu" maxlength="90" placeholder="z. B. Ich arbeite gerne" autocomplete="off" aria-label="Wort oder Satz">
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
          <label class="rb-stufe"><input type="radio" name="rbStufe" value="einfach"><span><b>Einfach</b><small>höchstens eine Regel pro Bild</small></span></label>
          <label class="rb-stufe"><input type="radio" name="rbStufe" value="mittel"><span><b>Mittel</b><small>bis zu zwei Regeln pro Bild</small></span></label>
          <label class="rb-stufe"><input type="radio" name="rbStufe" value="schwer"><span><b>Schwer</b><small>bis zu drei Regeln, auch längere Buchstabengruppen</small></span></label>
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
  kurz:'Wörter und Sätze als Bilderrätsel',
  beschreibung:'Aus Wörtern und ganzen Sätzen werden Bilderrätsel: Zu jedem Bild gehören Regeln wie «ko=i», «−m» oder «+e». Mehrere Rätsel auf einem Blatt.',
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
      if (w.join('').length > 60){ notiz.push('«' + esc(t) + '» ist zu lang (höchstens 60 Buchstaben)'); return; }
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
  function klein(t){ return String(t).toLocaleLowerCase('de-CH'); }
  function regelText(r){ return r.art === 'tausch' ? klein(r.von) + '=' + klein(r.zu) : r.art === 'weg' ? '−' + klein(r.von) : '+' + klein(r.zu); }
  /* Ein Teil: Bildkärtchen mit den Regeln darunter; in der Lösung zusätzlich Bildname und Ergebnis */
  function teilHtml(c){
    if (c.buchstabe) return '<div class="rb-teil rb-nur-buchstabe"><div class="rb-karte"><span class="rb-buchstabe">' + esc(c.buchstabe) + '</span></div>' +
      '<span class="rb-ergebnis">' + esc(c.buchstabe) + '</span></div>';
    return '<div class="rb-teil"><div class="rb-karte"><span class="rb-bild">' + c.bild.emoji + '</span>' +
      (c.regeln.length ? '<span class="rb-regeln">' + c.regeln.map(function(r){ return '<span class="rb-regel">' + esc(regelText(r)) + '</span>'; }).join('') + '</span>' : '') +
      '</div><span class="rb-name' + (st.opt.namen ? ' rb-hilfe' : '') + '">' + esc(c.bild.wort) + '</span>' +
      '<span class="rb-ergebnis">' + esc(Kern.ergebnis(c)) + '</span></div>';
  }
  function kaestchen(woerter, fuellen){
    return '<div class="rb-kaestchen" aria-hidden="true">' + woerter.map(function(w){
      return '<span class="rb-kwort">' + Array.from(w.wort).map(function(ch){ return '<span class="rb-k">' + (fuellen ? esc(ch) : '') + '</span>'; }).join('') + '</span>';
    }).join('') + '</div>';
  }
  var LEGENDE = [
    ['tausch', '<span class="rb-regel">ko=i</span>', 'Tauschen: im Bildwort «ko» durch «i» ersetzen. 👨‍🍳 KOCH wird zu ICH.'],
    ['weg', '<span class="rb-regel">−m</span>', 'Minus: diesen Buchstaben weglassen. 🐭 MAUS wird zu AUS.'],
    ['dazu', '<span class="rb-regel">+e</span>', 'Plus: diesen Buchstaben am Ende anhängen. 🐟 FISCH wird zu FISCHE.'],
    ['buchstabe', '<span class="rb-buchstabe">R</span>', 'Einzelne Buchstaben gehören einfach dazu.']
  ];
  function benutzteZeichen(liste){
    var z = {};
    liste.forEach(function(r){ r.forEach(function(w){ w.teile.forEach(function(c){
      if (c.buchstabe) z.buchstabe = 1; else c.regeln.forEach(function(g){ z[g.art] = 1; });
    }); }); });
    return z;
  }
  function blattHtml(liste, loesung, beispiel){
    var titel = st.titel.trim() || 'Bilderrätsel', z = benutzteZeichen(liste.map(function(x){ return x.r; }));
    var html = '<h2 class="rb-titel">' + esc(loesung ? 'Lösung – ' + titel : titel) + '</h2>';
    if (!loesung) html += '<p class="rb-anleitung">' + (beispiel ? 'So sieht ein Rebus aus: ' : '') +
      'Welche Wörter verstecken sich in den Bildern? Die Bilder stehen für Wörter in der Einzahl, ohne Artikel. Die Regeln unter einem Bild wendet man der Reihe nach an.</p>';
    if (st.opt.legende && !loesung){
      var items = LEGENDE.filter(function(l){ return z[l[0]]; });
      if (items.length) html += '<div class="rb-legende">' + items.map(function(l){ return '<div class="rb-leg"><span class="rb-leg-zeichen" aria-hidden="true">' + l[1] + '</span><span>' + l[2] + '</span></div>'; }).join('') + '</div>';
    }
    html += '<ol class="rb-raetsel">';
    liste.forEach(function(x, i){
      html += '<li class="rb-eintrag" data-i="' + i + '"><span class="rb-nr">' + (liste.length > 1 ? (i + 1) + '.' : '') + '</span><div class="rb-inhalt">' +
        '<div class="rb-zeile">' + x.r.map(function(w){ return '<div class="rb-wort">' + w.teile.map(teilHtml).join('') + '</div>'; }).join('<span class="rb-wortgrenze" aria-hidden="true"></span>') + '</div>';
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
      var bsp = [{ r:Kern.rebus('Ich arbeite gerne', { stufe:'mittel', rnd:festerZufall(11) }) }];
      blatt.innerHTML = '<p class="rb-beispiel-marke">Beispiel</p>' + blattHtml(bsp, false, true) +
        '<p class="rb-beispiel-text">Lösung: <b>ICH ARBEITE GERNE</b> – ' + bsp[0].r.map(function(w){ return w.teile.map(erklaere).map(esc).join(' + '); }).join(' · ') +
        '. Gib links ein Wort oder einen Satz ein, um dein eigenes Rätsel zu erstellen.</p>';
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
  /* Ein Teil in Worten, z. B. «KOCH, ko=i → ICH» */
  function erklaere(c){
    if (c.buchstabe) return c.buchstabe;
    return c.bild.wort + (c.regeln.length ? ', ' + c.regeln.map(regelText).join(', ') : '') + ' → ' + Kern.ergebnis(c);
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
