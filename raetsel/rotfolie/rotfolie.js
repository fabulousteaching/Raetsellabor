/* Rätsellabor – Generator «Rotfolienrätsel»
   Ein Satz ist in Hellblau (oder Grün) gedruckt und mit roten, pinken und orangen Kritzeln, Flecken und falschen Buchstaben
   überdeckt. Legt man eine rote Folie darauf, verschwindet alles Rote (es ist durch die Folie so hell wie das Papier),
   und der Satz erscheint dunkel. Physik dahinter: Die rote Folie lässt nur rotes Licht durch – wie hell eine Farbe durch
   die Folie wirkt, hängt nur von ihrem Rotanteil ab. Hellblau und Grün haben keinen Rotanteil (→ schwarz), die Tarnfarben
   fast den vollen (→ weiss). Die Fläche wird in ein Canvas gezeichnet; die Tarnung liegt «multipliziert» darüber wie
   Druckfarbe, so bleibt der Satz auch dort dunkel, wo Kritzel ihn kreuzen. Die Ansicht durch die Folie (am Bildschirm
   und im Lösungsblatt) wird Pixel für Pixel aus dem Rotanteil berechnet. Arbeitsblatt, Lösungsblatt, PDF. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* Farben. Geheimschrift mit (fast) keinem Rotanteil – durch die Folie schwarz: «bunt» mischt mehrere kühle Farben
     (jeder Buchstabe eine), so heben sich die Buchstaben ohne Folie weniger ab. Tarnfarben mit Rotanteil ≥ 228 von 255
     (durch die Folie fast weiss): kräftige (ROT) für Kritzel und verstreute falsche Buchstaben, hellere (WARM) für die
     falschen Buchstaben direkt über dem Satz – multipliziert über Blau ergeben sie Blau- und Grüntöne statt Schwarz, so
     verraten die Überschneidungen nichts. Helle Flecken (HELL) füllen den Hintergrund. Blasse «bläuliche» Buchstaben
     (BLASS, Rotanteil ≥ 168: durch die Folie grau, viel heller als der Satz) und dünne kühle Kritzel (durch die Folie dünne dunkle Striche, die
     den dicken Satz nicht stören) sorgen dafür, dass Blau ohne Folie überall vorkommt. */
  var GEHEIM = { bunt:{ name:'Bunt', farben:['#29B6F6', '#00BCD4', '#3CC47C', '#26C6A0', '#4FA8F0'] },
    hellblau:{ name:'Hellblau', farben:['#00AEEF'] }, gruen:{ name:'Grün', farben:['#00A651'] } };
  var KUEHL = ['#29B6F6', '#00BCD4', '#3CC47C', '#26C6A0'];
  var ROT = ['#ED1C24', '#EC008C', '#F15A29', '#E4007C', '#F7941D', '#EF4136'];
  var WARM = ['#F9B5D0', '#FFD27F', '#FFE36E', '#F7A8A0', '#FBB4E0', '#FFC08A'];
  var HELL = ['#FFD3E2', '#FFE1BE', '#FFF0A0', '#FFC6D3', '#FFD8F2', '#FFDCC8'];
  var BLASS = ['#A8E4FF', '#B0F0D8', '#B8D8FF', '#B4ECF4'];
  var HELL_KUEHL = ['#CDEFFF', '#CFF5E6', '#D5E5FF'];   // blasse kühle Flecken (Rotanteil ≥ 205)
  // Dichte: Fläche je Element (kleiner = dichter); Buchstaben: je Buchstabenfläche (gr²)
  /* salat: Zeilen links und rechts mit falschen Buchstaben auffüllen (1), dazu Zeilen darüber und darunter (2) – so steht
     der Satz nicht als einziger Text in der Mitte. Davon blass (kühl, unter dem Satz) der Anteil salatBlass. */
  var STAERKE = { leicht:{ flecken:5000, flKuehl:0, kritzel:650, kuehl:0, punkte:1300, falschJe:0, falschDazu:7, blass:0, salat:0, salatBlass:0 },
    mittel:{ flecken:3000, flKuehl:0.25, kritzel:380, kuehl:2400, punkte:950, falschJe:1, falschDazu:5, blass:5, salat:1, salatBlass:0.3 },
    stark:{ flecken:2200, flKuehl:0.35, kritzel:240, kuehl:1100, punkte:700, falschJe:2, falschDazu:4, blass:3, salat:2, salatBlass:0.4 } };
  // so hell erscheint eine Farbe durch die rote Folie (0 = schwarz, 1 = weiss)
  function rotAnteil(hex){ return parseInt(String(hex).slice(1, 3), 16) / 255; }
  function text(t){ return String(t || '').replace(/\s+/g, ' ').trim(); }
  /* Zeilen umbrechen: Wörter mit Breiten → Zeilen [[wort, …], …]; null, wenn ein Wort allein breiter ist als max */
  function umbrechen(woerter, breite, leer, max){
    var zeilen = [], z = [], b = 0;
    for (var i = 0; i < woerter.length; i++){
      var w = breite(woerter[i]);
      if (w > max) return null;
      if (z.length && b + leer + w > max){ zeilen.push(z); z = []; b = 0; }
      b += (z.length ? leer : 0) + w; z.push(woerter[i]);
    }
    if (z.length) zeilen.push(z);
    return zeilen;
  }
  /* Schrift so gross wie möglich: messen(wort) gibt die Breite bei 100 px. Zuerst höchstens 4 Zeilen, sonst bis 6.
     → { gr, zeilen } oder null (zu lang) */
  function setzen(satz, messen, breite, o){
    o = o || {};
    var woerter = text(satz).split(' ').filter(Boolean), max = o.max || 76, min = o.min || 26, leer = messen(' ');
    if (!woerter.length) return null;
    for (var grenze = 4; grenze <= 6; grenze += 2)
      for (var gr = max; gr >= min; gr -= 2){
        var z = umbrechen(woerter, function(w){ return messen(w) * gr / 100; }, leer * gr / 100, breite);
        if (z && z.length <= grenze) return { gr:gr, zeilen:z };
      }
    return null;
  }
  /* Tarnung planen (nur Daten): Fläche b × h, buchst [{ c, x, y, gr }] (Mitte der Buchstaben des Satzes), Schriftgrösse gr,
     zeilen [{ y, x0, x1 }] (Lage der Zeilen des Satzes) und abstand (Zeilenabstand).
     Kritzel: kurze Bögen; falsche Buchstaben: je einer leicht versetzt über jedem Buchstaben des Satzes und weitere
     verstreut; Flecken im Hintergrund; bei «stark» blasse Buchstaben, die der Geheimschrift ähneln. */
  function tarnung(o){
    var rnd = zufall(o.seed), b = o.b, h = o.h, gr = o.gr, s = STAERKE[o.staerke] || STAERKE.mittel, A = b * h, t = { flecken:[], blass:[], falsch:[], kritzel:[], kuehl:[], punkte:[] };
    var ABC = o.gross ? 'ABCDEFGHIJKLMNOPRSTUVWZ' : 'abcdefghijklmnoprstuvwz';
    function aus(l){ return l[Math.floor(rnd() * l.length)]; }
    function zahl(n){ return Math.round(n); }
    function anderer(c){ var x; do { x = ABC.charAt(Math.floor(rnd() * ABC.length)); } while (x.toLowerCase() === String(c).toLowerCase()); return x; }
    var i, n;
    for (i = 0, n = zahl(A / s.flecken); i < n; i++) t.flecken.push({ x:rnd() * b, y:rnd() * h, r:16 + rnd() * 44, farbe:aus(rnd() < s.flKuehl ? HELL_KUEHL : HELL) });
    for (i = 0, n = zahl(A / (gr * gr) / (s.blass || Infinity)); i < n; i++)
      t.blass.push({ c:anderer(''), x:rnd() * b, y:rnd() * h, gr:gr * (0.85 + rnd() * 0.3), dreh:(rnd() - 0.5) * 0.5, farbe:aus(BLASS) });
    if (s.falschJe) o.buchst.forEach(function(q){
      if (!/[A-Za-zÄÖÜäöü]/.test(q.c)) return;
      for (var j = 0; j < s.falschJe; j++) t.falsch.push({ c:anderer(q.c), x:q.x + (rnd() - 0.5) * gr * 0.45, y:q.y + (rnd() - 0.5) * gr * 0.3, gr:gr * (0.85 + rnd() * 0.3), dreh:(rnd() - 0.5) * 0.6, farbe:aus(WARM) });
    });
    // Buchstabensalat in den Zeilen des Satzes (links und rechts davon) und – bei «stark» – in Zeilen darüber und darunter
    if (s.salat && o.zeilen){
      var reihen = o.zeilen.map(function(z){ return { y:z.y, frei:[[4, z.x0 - gr * 0.25], [z.x1 + gr * 0.25, b - 4]] }; });
      if (s.salat > 1){ var oben = o.zeilen[0].y - o.abstand, unten = o.zeilen[o.zeilen.length - 1].y + o.abstand;
        [oben, unten].forEach(function(y){ if (y > gr * 0.35 && y < h - gr * 0.35) reihen.push({ y:y, frei:[[4, b - 4]] }); }); }
      reihen.forEach(function(r){ r.frei.forEach(function(f){
        for (var x = f[0] + gr * 0.3 + rnd() * gr * 0.3; x < f[1] - gr * 0.25; x += gr * (0.55 + rnd() * 0.25)){
          var q = { c:anderer(''), x:x, y:r.y + (rnd() - 0.5) * gr * 0.12, gr:gr * (0.9 + rnd() * 0.2), dreh:(rnd() - 0.5) * 0.25 };
          if (rnd() < s.salatBlass){ q.farbe = aus(BLASS); t.blass.push(q); } else { q.farbe = aus(rnd() < 0.5 ? ROT : WARM); t.falsch.push(q); }
        }
      }); });
    }
    for (i = 0, n = zahl(A / (gr * gr) / s.falschDazu); i < n; i++)
      t.falsch.push({ c:anderer(''), x:rnd() * b, y:rnd() * h, gr:gr * (0.7 + rnd() * 0.5), dreh:(rnd() - 0.5) * 0.8, farbe:aus(ROT) });
    for (i = 0, n = zahl(A / s.kritzel); i < n; i++){
      var x = rnd() * b, y = rnd() * h, l = 14 + rnd() * 30, w = rnd() * Math.PI * 2, k = (rnd() - 0.5) * l * 0.9;
      var x1 = x + Math.cos(w) * l, y1 = y + Math.sin(w) * l, mx = (x + x1) / 2 - Math.sin(w) * k, my = (y + y1) / 2 + Math.cos(w) * k;
      t.kritzel.push({ p:[x, y, mx, my, x1, y1], breite:1.6 + rnd() * 2.6, farbe:aus(ROT) });
    }
    for (i = 0, n = zahl(s.kuehl ? A / s.kuehl : 0); i < n; i++){
      var kx = rnd() * b, ky = rnd() * h, kl = 18 + rnd() * 34, kw = rnd() * Math.PI * 2, kk = (rnd() - 0.5) * kl;
      var kx1 = kx + Math.cos(kw) * kl, ky1 = ky + Math.sin(kw) * kl;
      t.kuehl.push({ p:[kx, ky, (kx + kx1) / 2 - Math.sin(kw) * kk, (ky + ky1) / 2 + Math.cos(kw) * kk, kx1, ky1], breite:1 + rnd() * 1.1, farbe:aus(KUEHL) });
    }
    for (i = 0, n = zahl(A / s.punkte); i < n; i++) t.punkte.push({ x:rnd() * b, y:rnd() * h, r:1.2 + rnd() * 2.8, farbe:aus(ROT) });
    mischen(t.falsch, rnd);
    return t;
  }
  return { zufall:zufall, mischen:mischen, GEHEIM:GEHEIM, KUEHL:KUEHL, ROT:ROT, WARM:WARM, HELL:HELL, BLASS:BLASS, HELL_KUEHL:HELL_KUEHL, STAERKE:STAERKE, rotAnteil:rotAnteil, text:text,
    umbrechen:umbrechen, setzen:setzen, tarnung:tarnung };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', B = 639;   // Zeichenfläche: 703 Pixel Blatt minus Rand
var MASSSTAB = 3;                  // Canvas-Pixel je Bildschirm-Pixel (≈ 290 dpi im PDF)
function esc(t){ return Labor.esc(t); }

var SAETZE = ['Du bist ein super Detektiv', 'Der Schatz liegt unter dem Baum', 'Heute gibt es keine Hausaufgaben', 'Schau unter dein Pult',
  'Das Passwort heisst Regenbogen', 'Wir treffen uns beim Brunnen', 'Klatsche dreimal in die Hände', 'Morgen backen wir einen Kuchen',
  'Rote Folien verraten Geheimnisse', 'Der nächste Hinweis ist im Bücherregal', 'Die Pause dauert heute länger', 'Spione arbeiten im Geheimen',
  'Der Code für das Schloss ist 427', 'Im Wald wohnt ein freundlicher Fuchs', 'Lies das Buch auf Seite 12'];

/* ---------- Zeichnen ins Canvas ---------- */
var messer = document.createElement('canvas').getContext('2d');
function schrift(gr){ return '700 ' + gr + 'px ' + Labor.blattSchrift('buchstaben'); }
function sperrung(gr){ return gr * 0.05; }   // etwas Abstand zwischen den Buchstaben – durch die Folie besser lesbar
// Breite eines Worts bei 100 px (mit Sperrung)
function messen(w){ messer.font = schrift(100); return w === ' ' ? messer.measureText(' ').width * 1.2 : messer.measureText(w).width + sperrung(100) * Math.max(0, w.length - 1); }
/* Satz setzen: Lage jedes Buchstabens (Mitte) – Zeilen mittig, Block senkrecht mittig. → { b, h, gr, buchst:[{ c, x, y, gr }] } */
function plan(satz){
  var rand = 22, S = Kern.setzen(satz, messen, B - 2 * rand, { max:60, min:26 });
  if (!S) return null;
  // Höhe: die Zeilen des Satzes und je eine Zeile darüber und darunter (dort steht bei «stark» Buchstabensalat)
  var gr = S.gr, zh = gr * 1.42, h = Math.round(Math.max(190, (S.zeilen.length + 2) * zh + 16)), y0 = (h - S.zeilen.length * zh) / 2 + zh / 2, buchst = [], zeilen = [];
  var leer = messen(' ') * gr / 100, sp = sperrung(gr);
  S.zeilen.forEach(function(z, j){
    var breite = z.reduce(function(s, w, k){ return s + messen(w) * gr / 100 + (k ? leer : 0); }, 0), x = (B - breite) / 2, y = y0 + j * zh;
    zeilen.push({ y:y, x0:x, x1:x + breite });
    messer.font = schrift(gr);   // nach messen() – das stellt auf 100 px
    z.forEach(function(w, k){
      if (k) x += leer;
      Array.from(w).forEach(function(c){ var cb = messer.measureText(c).width; buchst.push({ c:c, x:x + cb / 2, y:y, gr:gr }); x += cb + sp; });
      x -= sp;
    });
  });
  return { b:B, h:h, gr:gr, zeilen:zeilen, abstand:zh, buchst:buchst };
}
function buchstabe(ctx, q, farbe){
  ctx.save(); ctx.translate(q.x, q.y); if (q.dreh) ctx.rotate(q.dreh);
  ctx.font = schrift(q.gr); ctx.fillStyle = farbe; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(q.c, 0, 0); ctx.restore();
}
// Die Fläche zeichnen: Flecken, blasse Ablenker, Satz; darüber (multipliziert wie Druckfarbe) falsche Buchstaben, Kritzel, Punkte
function malen(P, T, geheim){
  var cv = document.createElement('canvas'), S = MASSSTAB;
  cv.width = Math.round(P.b * S); cv.height = Math.round(P.h * S);
  var ctx = cv.getContext('2d');
  ctx.scale(S, S);
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, P.b, P.h);
  T.flecken.forEach(function(f){ ctx.fillStyle = f.farbe; ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2); ctx.fill(); });
  T.blass.forEach(function(q){ buchstabe(ctx, q, q.farbe); });
  P.buchst.forEach(function(q, i){ buchstabe(ctx, q, geheim[i % geheim.length]); });
  ctx.globalCompositeOperation = 'multiply';
  T.falsch.forEach(function(q){ buchstabe(ctx, q, q.farbe); });
  ctx.lineCap = 'round';
  T.kritzel.forEach(function(k){ ctx.strokeStyle = k.farbe; ctx.lineWidth = k.breite; ctx.beginPath(); ctx.moveTo(k.p[0], k.p[1]); ctx.quadraticCurveTo(k.p[2], k.p[3], k.p[4], k.p[5]); ctx.stroke(); });
  T.punkte.forEach(function(p){ ctx.fillStyle = p.farbe; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); });
  T.kuehl.forEach(function(k){ ctx.strokeStyle = k.farbe; ctx.lineWidth = k.breite; ctx.beginPath(); ctx.moveTo(k.p[0], k.p[1]); ctx.quadraticCurveTo(k.p[2], k.p[3], k.p[4], k.p[5]); ctx.stroke(); });
  ctx.globalCompositeOperation = 'source-over';
  return cv;
}
/* Durch die rote Folie: Nur der Rotanteil zählt. art 'rot' – so sieht es am Bildschirm durch die Folie aus (rot/schwarz);
   art 'grau' – fürs Lösungsblatt in Graustufen (druckt ohne Farbe). */
function durchFolie(cv, art){
  var k = document.createElement('canvas'); k.width = cv.width; k.height = cv.height;
  var ctx = k.getContext('2d'), d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height), p = d.data;
  for (var i = 0; i < p.length; i += 4){
    var r = p[i];
    if (art === 'rot'){ p[i] = 40 + r * 0.8; p[i + 1] = r * 0.1; p[i + 2] = r * 0.14; }
    else { p[i] = p[i + 1] = p[i + 2] = r; }
  }
  ctx.putImageData(d, 0, 0);
  return k;
}

var VORLAGE = '<div class="rf">' +
  '<header class="rf-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Rotfolienrätsel</h1>' +
    '<p>Ein Satz versteckt sich unter roten Kritzeln und falschen Buchstaben. Mit einer roten Folie darüber verschwindet das Rote – und der Satz erscheint.</p></header>' +
  '<div class="rf-layout"><section class="rf-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Geheimer Satz</h2><p>Er erscheint unter der roten Folie.</p></div></div>' +
      '<label class="feld-label" for="rfSatz">Satz</label>' +
      '<div class="rf-zeile"><textarea id="rfSatz" rows="2" maxlength="90" autocomplete="off" spellcheck="false"></textarea>' +
        '<button type="button" class="btn klein" id="rfZufall" title="Einen anderen Satz vorschlagen">Andere</button></div>' +
      '<p class="hinweis">Bis 90 Zeichen. Je kürzer der Satz, desto grösser die Buchstaben.</p>' +
      '<label class="opt"><input type="checkbox" id="rfGross"><span>Nur Grossbuchstaben</span></label>' +
      '<div class="rf-zaehler" id="rfZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Tarnung</h2></div></div>' +
      '<p class="feld-label">Stärke</p><div class="rf-chips" role="radiogroup" aria-label="Stärke der Tarnung">' +
        [['leicht', 'leicht'], ['mittel', 'mittel'], ['stark', 'stark']].map(function(x){ return '<label><input type="radio" name="rfStaerke" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join('') + '</div>' +
      '<p class="hinweis">Leicht: wenige Kritzel. Mittel: über jedem Buchstaben ein falscher, dazu blaue Kritzel. Stark: noch dichter, mit mehr blassen Buchstaben, die der Geheimschrift ähneln.</p>' +
      '<p class="feld-label">Farbe des Satzes</p><div class="rf-chips" role="radiogroup" aria-label="Farbe des geheimen Satzes">' +
        Object.keys(Kern.GEHEIM).map(function(k){ return '<label><input type="radio" name="rfFarbe" value="' + k + '"><span><i style="background:' + (Kern.GEHEIM[k].farben.length > 1 ? 'conic-gradient(' + Kern.GEHEIM[k].farben.join(',') + ')' : Kern.GEHEIM[k].farben[0]) + '"></i>' + esc(Kern.GEHEIM[k].name) + '</span></label>'; }).join('') + '</div>' +
      '<p class="hinweis">Alle werden durch die Folie dunkel; «Bunt» (jeder Buchstabe eine andere kühle Farbe) ist ohne Folie am schwersten zu lesen. Drucker mischen Farben unterschiedlich – am besten zuerst ein Blatt testen.</p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>' +
      '<label class="opt"><input type="checkbox" id="rfLinien"><span>Linien für die Antwort</span></label>' +
      '<p class="hinweis">Zum Lösen braucht es eine rote Folie (z. B. rote Klarsichthülle oder Bastelfolie) – in Farbe drucken.</p>' +
    '</div>' +
  '</section>' +
  '<section class="rf-ausgabe" aria-label="Ergebnis">' +
    '<div id="rfMeldung" aria-live="polite"></div>' +
    '<div class="rf-werkzeug">' +
      '<button type="button" class="btn klein" id="rfFolieKnopf" aria-pressed="false" title="Eine rote Folie über das Bild legen und verschieben">Rote Folie</button>' +
      '<button type="button" class="btn klein" id="rfZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="rfNeu" title="Die Tarnung neu verteilen">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="rfMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="rfPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="rfHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<p class="rf-folie-info" id="rfFolieInfo" hidden>Schiebe die rote Folie mit der Maus, dem Finger oder den Pfeiltasten über das Bild.</p>' +
    '<div class="rf-rahmen"><article class="rf-blatt" id="rfBlatt"></article></div>' +
    '<div class="rf-rahmen"><article class="rf-blatt rf-loesungsblatt" id="rfLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="5" width="13" height="14" rx="2"/><rect x="9" y="3" width="12" height="16" rx="2" fill="currentColor" fill-opacity=".18"/><path d="M6 10h5M6 14h3"/></svg>';

Labor.registriere({
  id:'rotfolie',
  titel:'Rotfolienrätsel',
  kurz:'Ein Satz unter roter Tarnung – die rote Folie macht ihn sichtbar',
  beschreibung:'Ein eigener Satz versteckt sich unter roten Kritzeln und falschen Buchstaben. Legt man eine rote Folie darauf, verschwindet das Rote und der Satz erscheint. Mit Folie zum Ausprobieren am Bildschirm und Lösungsblatt.',
  merkmale:['Eigener Satz', 'Drei Tarnstufen', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/rotfolie/rotfolie.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'rotfolie-eingaben', OPT = 'rotfolie-einstellungen';
  var STANDARD = { staerke:'stark', farbe:'bunt', gross:false, linien:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { satz:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.satz = String(e.satz || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (!Kern.STAERKE[st.opt.staerke]) st.opt.staerke = 'stark';
  if (!Kern.GEHEIM[st.opt.farbe]) st.opt.farbe = 'bunt';
  if (!Kern.text(st.satz)) st.satz = SAETZE[Math.floor(Math.random() * SAETZE.length)];
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ satz:st.satz, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#rfMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 300); }

  /* ---------- Eingaben ---------- */
  $('#rfSatz').value = st.satz;
  $('#rfSatz').addEventListener('input', function(){ st.satz = this.value; speichern(); baldZeichnen(); });
  $('#rfZufall').addEventListener('click', function(){
    var jetzt = Kern.text(st.satz), l = SAETZE.filter(function(t){ return t !== jetzt; });
    st.satz = l[Math.floor(Math.random() * l.length)]; $('#rfSatz').value = st.satz; speichern(); zeichnen();
  });
  function radios(name, k){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === st.opt[k];
      r.addEventListener('change', function(){ if (r.checked){ st.opt[k] = r.value; speichern(); zeichnen(); } });
    });
  }
  radios('rfStaerke', 'staerke'); radios('rfFarbe', 'farbe');
  [['#rfGross', 'gross'], ['#rfLinien', 'linien'], ['#rfMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#rfNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#rfZeigeLoesung').addEventListener('click', function(){ var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); zeichnen(); });

  /* ---------- Rote Folie am Bildschirm: liegt über dem Bild und lässt sich waagrecht verschieben ---------- */
  var folieX = 0, folieAn = false;
  $('#rfFolieKnopf').addEventListener('click', function(){
    folieAn = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', folieAn ? 'true' : 'false');
    $('#rfFolieInfo').hidden = !folieAn; folieZeigen();
    var f = $('#rfBlatt .rf-folie'); if (folieAn && f) f.focus({ preventScroll:true });
  });
  function folieBreite(){ return Math.round(B * 0.42); }
  function folieSetzen(x){
    var f = $('#rfBlatt .rf-folie'); if (!f) return;
    folieX = Math.max(-folieBreite() * 0.5, Math.min(B - folieBreite() * 0.5, x));
    f.style.left = folieX + 'px'; f.firstChild.style.left = -folieX + 'px';
  }
  function folieZeigen(){ var f = $('#rfBlatt .rf-folie'); if (!f) return; f.hidden = !folieAn; folieSetzen(folieX); }
  bereich.addEventListener('pointerdown', function(ev){
    var f = ev.target.closest('.rf-folie'); if (!f) return;
    ev.preventDefault(); f.setPointerCapture(ev.pointerId); f.classList.add('zieht');
    var start = ev.clientX, x0 = folieX;
    function zug(e){ folieSetzen(x0 + e.clientX - start); }
    function los(){ f.classList.remove('zieht'); f.removeEventListener('pointermove', zug); f.removeEventListener('pointerup', los); f.removeEventListener('pointercancel', los); }
    f.addEventListener('pointermove', zug); f.addEventListener('pointerup', los); f.addEventListener('pointercancel', los);
  });
  bereich.addEventListener('keydown', function(ev){
    if (!ev.target.classList || !ev.target.classList.contains('rf-folie')) return;
    var d = { ArrowLeft:-20, ArrowRight:20, Home:-B, End:B }[ev.key];
    if (d === undefined) return;
    ev.preventDefault(); folieSetzen(folieX + d);
  });

  /* ---------- Rätsel ---------- */
  var P = null, bilder = null, schluessel = '';
  function satzJetzt(){ var t = Kern.text(st.satz); return st.opt.gross ? t.toUpperCase().replace(/ß/g, 'SS') : t; }
  function anleitung(){
    return 'Hier versteckt sich ein geheimer Satz. Lege eine rote Folie auf das Bild – das Rote verschwindet, und der Satz erscheint.' + (st.opt.linien ? ' Schreibe ihn auf die Linien.' : ' Wie heisst er?');
  }
  // Antwortlinien: so viele, wie der Satz in Kinderhandschrift braucht (etwa 24 Zeichen pro Linie, mindestens 2)
  function linienHtml(satz, loesung){
    messer.font = '500 22px ' + Labor.blattSchrift('text');
    var z = Kern.umbrechen(satz.split(' '), function(w){ return messer.measureText(w).width; }, messer.measureText(' ').width, B - 40) || [satz.split(' ')];
    var n = Math.max(2, Math.ceil(satz.length / 24), z.length), h = '';
    for (var i = 0; i < n; i++) h += '<div class="rf-linie">' + (loesung && z[i] ? esc(z[i].join(' ')) : '') + '</div>';
    return '<div class="rf-linien">' + h + '</div>';
  }
  function bildHtml(src, mitFolie, alt){
    return '<div class="rf-bild" style="width:' + B + 'px;height:' + P.h + 'px"><img src="' + src + '" width="' + B + '" height="' + P.h + '" alt="' + esc(alt) + '">' +
      (mitFolie ? '<div class="rf-folie nur-bildschirm" tabindex="0" role="slider" aria-label="Rote Folie verschieben" aria-valuemin="0" aria-valuemax="100" hidden style="width:' + folieBreite() + 'px">' +
        '<img src="' + bilder.rot + '" width="' + B + '" height="' + P.h + '" alt=""></div>' : '') + '</div>';
  }
  function blattHtml(satz, loesung){
    var o = st.opt;
    return (o.titelAn ? '<h2>Rotfolienrätsel</h2>' : '') + (o.anleitungAn ? '<p class="rf-anleitung">' + esc(anleitung()) + '</p>' : '') +
      bildHtml(bilder.normal, true, 'Bild mit verstecktem Satz') + (o.linien ? linienHtml(satz, loesung) : '');
  }
  function loesungHtml(satz){
    var o = st.opt;
    return (o.titelAn ? '<h2>Rotfolienrätsel – Lösung</h2>' : '<p class="rf-anleitung"><b>Lösung</b></p>') +
      '<p class="rf-anleitung">So sieht das Bild durch die rote Folie aus:</p>' + bildHtml(bilder.grau, false, 'Das Bild durch die rote Folie: ' + satz) +
      '<p class="rf-satz-loesung">Der Satz: <b>' + esc(satz) + '</b></p>';
  }
  function zeichnen(){
    if (aus) return;
    var satz = satzJetzt(), h = '';
    var leer = !satz;
    ['#rfZeigeLoesung', '#rfNeu', '#rfPdf', '#rfHerunterladen', '#rfFolieKnopf'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ P = null; $('#rfZaehler').innerHTML = ''; $('#rfBlatt').parentNode.hidden = true; $('#rfLoesung').parentNode.hidden = true; meldung('info', '<p>Gib links den Satz ein, der unter der Tarnung stehen soll.</p>'); return; }
    // Schrift laden, bevor gemessen und gezeichnet wird
    var f = schrift(40);
    if (document.fonts && document.fonts.check && !document.fonts.check(f)){ document.fonts.load(f).then(function(){ if (!aus && document.fonts.check(f)) zeichnen(); }, function(){}); }
    P = plan(satz);
    if (!P){ $('#rfZaehler').innerHTML = ''; $('#rfBlatt').parentNode.hidden = true; $('#rfLoesung').parentNode.hidden = true; ['#rfZeigeLoesung', '#rfNeu', '#rfPdf', '#rfHerunterladen', '#rfFolieKnopf'].forEach(function(s){ $(s).disabled = true; }); meldung('warnung', '<p>Ein Wort ist zu lang für eine Zeile – kürze es oder trenne es mit einem Leerzeichen.</p>'); return; }
    meldung('', ''); $('#rfBlatt').parentNode.hidden = false; $('#rfLoesung').parentNode.hidden = false;
    $('#rfZaehler').innerHTML = '<p class="rf-zaehler-haupt ok"><b>' + satz.length + '</b> Zeichen · ' + P.zeilen.length + (P.zeilen.length === 1 ? ' Zeile' : ' Zeilen') + ', Schrift ' + P.gr + ' px</p>' + h;
    var k = [satz, P.gr, st.opt.staerke, st.opt.farbe, st.seed, Labor.blattSchrift('buchstaben')].join('|');
    if (k !== schluessel || !bilder){
      var T = Kern.tarnung({ seed:st.seed, b:P.b, h:P.h, gr:P.gr, buchst:P.buchst, zeilen:P.zeilen, abstand:P.abstand, staerke:st.opt.staerke, gross:st.opt.gross || satz === satz.toUpperCase() });
      var cv = malen(P, T, Kern.mischen(Kern.GEHEIM[st.opt.farbe].farben.slice(), Kern.zufall(st.seed + 3)));
      bilder = { normal:cv.toDataURL('image/png'), rot:durchFolie(cv, 'rot').toDataURL('image/png'), grau:durchFolie(cv, 'grau').toDataURL('image/png') };
      schluessel = k;
    }
    var zeige = $('#rfZeigeLoesung').getAttribute('aria-pressed') === 'true';
    $('#rfBlatt').innerHTML = blattHtml(satz, zeige);
    $('#rfLoesung').innerHTML = loesungHtml(satz);
    folieZeigen();
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ if (!aus){ schluessel = ''; zeichnen(); } });

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function ohneLoesung(){ var k = $('#rfZeigeLoesung'); if (k.getAttribute('aria-pressed') === 'true'){ k.setAttribute('aria-pressed', 'false'); zeichnen(); } }
  Labor.pdfKnopf($('#rfPdf'), function(){ ohneLoesung(); return P && { blaetter:[$('#rfBlatt'), st.opt.mitLoesung && $('#rfLoesung')], name:Labor.pdfName('Rotfolienraetsel', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#rfPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#rfHerunterladen').hidden = false; });
  }
  $('#rfHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P) return;
    ohneLoesung();
    var name = Labor.pdfName('Rotfolienraetsel', '').replace(/\.pdf$/, '.html');
    var inhalt = [$('#rfBlatt'), st.opt.mitLoesung && $('#rfLoesung')].filter(Boolean).map(function(b, i){
      var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite');
      [].forEach.call(k.querySelectorAll('.nur-bildschirm'), function(x){ x.remove(); });
      return k.outerHTML;
    }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Rotfolienrätsel', inhalt, '.rf-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
