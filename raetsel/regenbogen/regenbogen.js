/* Rätsellabor – Generator «Regenbogenrätsel»
   Unter einem Regenbogen liegen Gruppen gleicher Formen (Sterne, Kreise, Dreiecke …) in den Farben des Regenbogens. Wer in
   jeder Gruppe die Formen in der Reihenfolge der Regenbogenfarben verbindet (von aussen nach innen), zeichnet eine Ziffer.
   Die Ziffern wählt man selbst. Jede Ziffer ist ein Linienzug durch ihre Eckpunkte; der Regenbogen hat mindestens so viele
   Farben, wie die Ziffer mit den meisten Punkten braucht – wählt man mehr Farben, bekommen alle Ziffern zusätzliche Punkte
   auf ihren Linien, sodass jede Gruppe alle Farben braucht. Arbeitsblatt, Lösungsblatt, PDF. */
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
  /* Ziffern als Linienzug im Feld 0…2 (waagrecht) × 0…4 (senkrecht, nach unten). Jeder Punkt kommt genau einmal vor;
     die Linien dürfen sich kreuzen (8). Bei 0, 6 und 9 bleibt der Kreis an einer Stelle einen Spalt offen. */
  var ZIFFERN = {
    0:[[0.7, 0], [0, 1], [0, 3], [1, 4], [2, 3], [2, 1], [1.3, 0]],
    1:[[0, 1.1], [1.2, 0], [1.2, 4]],
    2:[[0, 1], [1, 0], [2, 1], [1, 2.4], [0, 4], [2, 4]],
    3:[[0, 0], [2, 0], [0.8, 1.7], [2, 2.7], [1.3, 4], [0, 4]],
    4:[[1.4, 4], [1.4, 0], [0, 2.7], [2, 2.7]],
    5:[[2, 0], [0.2, 0], [0, 1.9], [1.7, 1.9], [2, 3.1], [1.2, 4], [0, 3.7]],
    6:[[0, 3], [1, 4], [2, 3], [1, 2], [0, 2.4], [0.4, 0]],
    7:[[0, 0], [2, 0], [0.8, 4]],
    8:[[0.85, 0], [0, 1], [2, 3], [1, 4], [0, 3], [2, 1], [1.45, 0.15]],
    9:[[2, 1], [1, 0], [0, 1], [1, 2], [2, 1.6], [1.6, 4]]
  };
  var MAX_FARBEN = 10;
  // Farben je Anzahl (von aussen nach innen); immer gut zu unterscheiden, wie ein Regenbogen
  var FARBE = { rosa:'#F06292', rot:'#E53935', orange:'#F57C00', gelb:'#FDD835', hellgruen:'#8BC34A', gruen:'#2E9E5B', tuerkis:'#1FB5AD',
    hellblau:'#64B5F6', blau:'#3F51B5', dunkelblau:'#283593', violett:'#7B3FA0' };
  var FARBNAME = { rosa:'rosa', rot:'rot', orange:'orange', gelb:'gelb', hellgruen:'hellgrün', gruen:'grün', tuerkis:'türkis', hellblau:'hellblau',
    blau:'blau', dunkelblau:'dunkelblau', violett:'violett' };
  var REIHEN = {
    3:['rot', 'gelb', 'blau'],
    4:['rot', 'gelb', 'gruen', 'blau'],
    5:['rot', 'orange', 'gelb', 'gruen', 'blau'],
    6:['rot', 'orange', 'gelb', 'gruen', 'hellblau', 'violett'],
    7:['rot', 'orange', 'gelb', 'gruen', 'hellblau', 'blau', 'violett'],
    8:['rot', 'orange', 'gelb', 'hellgruen', 'gruen', 'hellblau', 'blau', 'violett'],
    9:['rot', 'orange', 'gelb', 'hellgruen', 'gruen', 'tuerkis', 'hellblau', 'blau', 'violett'],
    10:['rosa', 'rot', 'orange', 'gelb', 'hellgruen', 'gruen', 'tuerkis', 'hellblau', 'blau', 'violett']
  };
  var FORMEN = ['stern', 'kreis', 'dreieck', 'quadrat', 'herz', 'raute', 'sechseck', 'blume'];
  // Eingabe → Ziffern (alles andere fällt weg), höchstens 6
  function ziffern(text){ return String(text || '').replace(/[^0-9]/g, '').split('').slice(0, 6); }
  // so viele Farben braucht es mindestens (die Ziffer mit den meisten Punkten)
  function mindestens(z){ return Math.max(3, Math.max.apply(null, z.map(function(c){ return ZIFFERN[c].length; }).concat([3]))); }
  /* Linienzug auf n Punkte bringen: Die zusätzlichen Punkte werden nach der Länge der Strecken verteilt und liegen
     gleichmässig darauf (die Eckpunkte bleiben – die Form bleibt gleich). Kommt ein neuer Punkt einem anderen zu nahe
     (z. B. wo sich zwei Linien kreuzen wie bei der 8), rutscht er auf seiner Strecke ein Stück weiter. */
  function auffuellen(punkte, n){
    var extra = n - punkte.length, laengen = [], summe = 0, i, j;
    if (extra <= 0) return punkte.map(function(q){ return q.slice(); });
    for (i = 0; i + 1 < punkte.length; i++){ var l = Math.hypot(punkte[i + 1][0] - punkte[i][0], punkte[i + 1][1] - punkte[i][1]); laengen.push(l); summe += l; }
    var anz = laengen.map(function(l){ return Math.floor(extra * l / summe); }), rest = extra - anz.reduce(function(a, b){ return a + b; }, 0);
    laengen.map(function(l, k){ return [extra * l / summe - anz[k], k]; }).sort(function(a, b){ return b[0] - a[0]; }).slice(0, rest).forEach(function(x){ anz[x[1]]++; });
    var aus = [], neu = [];
    for (i = 0; i < laengen.length; i++){
      aus.push(punkte[i].slice());
      for (j = 1; j <= anz[i]; j++){ neu.push({ k:i, t:j / (anz[i] + 1), platz:aus.length }); aus.push(null); }
    }
    aus.push(punkte[punkte.length - 1].slice());
    function lage(k, t){ var a = punkte[k], b = punkte[k + 1]; return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
    neu.forEach(function(x){ aus[x.platz] = lage(x.k, x.t); });
    // Abstand zu den anderen Punkten und zu fremden Strecken (nicht der eigenen) – eine Linie soll nicht durch eine Form gehen
    function zuStrecke(p, a, b){ var dx = b[0] - a[0], dy = b[1] - a[1], t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy || 1))); return Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy); }
    function naechster(idx, p, k0){
      var m = Infinity;
      aus.forEach(function(q, k){ if (k !== idx && q) m = Math.min(m, Math.hypot(q[0] - p[0], q[1] - p[1])); });
      for (var k = 0; k + 1 < punkte.length; k++) if (k !== k0) m = Math.min(m, zuStrecke(p, punkte[k], punkte[k + 1]) * 1.4);
      return m;
    }
    neu.forEach(function(x){
      var p = aus[x.platz], best = p, weit = naechster(x.platz, p, x.k), schritt = 0.5 / (anz[x.k] + 1);
      if (weit >= 0.45) return;
      [-0.6, 0.6, -0.35, 0.35, -0.85, 0.85].forEach(function(d){
        var t = x.t + d * schritt;
        if (t <= 0.08 || t >= 0.92) return;
        var q = lage(x.k, t), w = naechster(x.platz, q, x.k);
        if (w > weit){ weit = w; best = q; }
      });
      aus[x.platz] = best;
    });
    return aus;
  }
  /* Plan: o: { ziffern:[…], farben (Anzahl), seed } → { farben:[Name …], gruppen:[{ ziffer, form, punkte:[[x, y, farbe] …] }] }
     Punkte im Feld 0…2 × 0…4, leicht verwackelt (±0.07), damit es nicht zu ordentlich aussieht; Reihenfolge = Farbreihenfolge. */
  function planen(o){
    var rnd = zufall(o.seed), n = Math.max(mindestens(o.ziffern), Math.min(MAX_FARBEN, o.farben || 0)), farben = REIHEN[n];
    var formen = mischen(FORMEN.slice(), rnd);
    return { farben:farben, gruppen:o.ziffern.map(function(c, i){
      var p = auffuellen(ZIFFERN[c], n);
      return { ziffer:c, form:formen[i % formen.length], punkte:p.map(function(q, k){ return [q[0] + (rnd() - 0.5) * 0.14, q[1] + (rnd() - 0.5) * 0.14, farben[k]]; }) };
    }) };
  }
  return { zufall:zufall, mischen:mischen, ZIFFERN:ZIFFERN, MAX_FARBEN:MAX_FARBEN, FARBE:FARBE, FARBNAME:FARBNAME, REIHEN:REIHEN, FORMEN:FORMEN,
    ziffern:ziffern, mindestens:mindestens, auffuellen:auffuellen, planen:planen };
})();
/* KERN-ENDE */

var TINTE = '#1C1714';
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }

/* ---------- Zeichnen ---------- */
// Form um (x, y) mit «Radius» r
function formSvg(form, x, y, r, farbe){
  var a = ' fill="' + farbe + '" stroke="rgba(0,0,0,.18)" stroke-width="1"', p = [], i;
  function eck(k, rr, dreh){ var l = []; for (var j = 0; j < k; j++){ var w = (dreh + j * 360 / k) * Math.PI / 180; l.push(f1(x + rr * Math.sin(w)) + ',' + f1(y - rr * Math.cos(w))); } return l.join(' '); }
  switch (form){
    case 'kreis': return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.86) + '"' + a + '/>';
    case 'quadrat': return '<rect x="' + f1(x - r * 0.78) + '" y="' + f1(y - r * 0.78) + '" width="' + f1(r * 1.56) + '" height="' + f1(r * 1.56) + '" rx="' + f1(r * 0.12) + '"' + a + '/>';
    case 'dreieck': return '<polygon points="' + eck(3, r * 1.12, 0) + '" stroke-linejoin="round"' + a + '/>';
    case 'raute': return '<polygon points="' + eck(4, r * 1.02, 0) + '"' + a + '/>';
    case 'sechseck': return '<polygon points="' + eck(6, r * 0.95, 30) + '"' + a + '/>';
    case 'stern':
      for (i = 0; i < 10; i++){ var rr = i % 2 ? r * 0.45 : r * 1.05, w = i * 36 * Math.PI / 180; p.push(f1(x + rr * Math.sin(w)) + ',' + f1(y + r * 0.08 - rr * Math.cos(w))); }
      return '<polygon points="' + p.join(' ') + '"' + a + ' stroke-linejoin="round"/>';
    case 'herz':
      var s = r / 10;
      return '<path d="M' + f1(x) + ' ' + f1(y + 9 * s) + 'C' + f1(x - 4 * s) + ' ' + f1(y + 5 * s) + ' ' + f1(x - 11 * s) + ' ' + f1(y + 1 * s) + ' ' + f1(x - 11 * s) + ' ' + f1(y - 4 * s) +
        'C' + f1(x - 11 * s) + ' ' + f1(y - 9 * s) + ' ' + f1(x - 4 * s) + ' ' + f1(y - 11 * s) + ' ' + f1(x) + ' ' + f1(y - 5.5 * s) +
        'C' + f1(x + 4 * s) + ' ' + f1(y - 11 * s) + ' ' + f1(x + 11 * s) + ' ' + f1(y - 9 * s) + ' ' + f1(x + 11 * s) + ' ' + f1(y - 4 * s) +
        'C' + f1(x + 11 * s) + ' ' + f1(y + 1 * s) + ' ' + f1(x + 4 * s) + ' ' + f1(y + 5 * s) + ' ' + f1(x) + ' ' + f1(y + 9 * s) + 'Z"' + a + '/>';
    case 'blume':
      var t = '';
      for (i = 0; i < 5; i++){ var w2 = i * 72 * Math.PI / 180; t += '<circle cx="' + f1(x + r * 0.5 * Math.sin(w2)) + '" cy="' + f1(y - r * 0.5 * Math.cos(w2)) + '" r="' + f1(r * 0.46) + '"' + a + '/>'; }
      return t + '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.3) + '" fill="#fff" fill-opacity=".85"/>';
  }
  return '';
}
// Regenbogen mit n Bändern (aussen die erste Farbe) und Wolken an den Enden
function regenbogenSvg(farben, breite){
  var n = farben.length, R = breite / 2 - 30, band = Math.min(16, (R * 0.55) / n), h = R + 34, cx = breite / 2, cy = R + 14, t = '';
  farben.forEach(function(f, i){
    var r = R - i * band - band / 2;
    t += '<path d="M' + f1(cx - r) + ' ' + f1(cy) + 'A' + f1(r) + ' ' + f1(r) + ' 0 0 1 ' + f1(cx + r) + ' ' + f1(cy) + '" fill="none" stroke="' + Kern.FARBE[f] + '" stroke-width="' + f1(band + 0.6) + '"/>';
  });
  function wolke(x, y, s){
    return '<g fill="#fff" stroke="#C9C2BC" stroke-width="1.4">' + [[-26, 6, 15], [-8, -6, 19], [14, -2, 17], [30, 8, 13]].map(function(k){ return '<circle cx="' + f1(x + k[0] * s) + '" cy="' + f1(y + k[1] * s) + '" r="' + f1(k[2] * s) + '"/>'; }).join('') +
      '<rect x="' + f1(x - 40 * s) + '" y="' + f1(y + 4 * s) + '" width="' + f1(84 * s) + '" height="' + f1(17 * s) + '" rx="' + f1(8 * s) + '"/></g>' +
      '<g fill="#fff">' + [[-26, 6, 13.6], [-8, -6, 17.6], [14, -2, 15.6], [30, 8, 11.6]].map(function(k){ return '<circle cx="' + f1(x + k[0] * s) + '" cy="' + f1(y + k[1] * s) + '" r="' + f1(k[2] * s) + '"/>'; }).join('') +
      '<rect x="' + f1(x - 38.6 * s) + '" y="' + f1(y + 5.4 * s) + '" width="' + f1(81.2 * s) + '" height="' + f1(14.2 * s) + '" rx="' + f1(7 * s) + '"/></g>';
  }
  var s = Math.max(0.8, Math.min(1.3, n * band / 70));
  return '<svg class="rb-bogen" width="' + breite + '" height="' + f1(h) + '" viewBox="0 0 ' + breite + ' ' + f1(h) + '" role="img" aria-label="Regenbogen mit ' + n + ' Farben">' + t +
    wolke(cx - R + n * band / 2, cy, s) + wolke(cx + R - n * band / 2, cy, s) + '</svg>';
}
/* Gruppen: jede Ziffer in einem Feld (w × h), die Formen an ihren Punkten; Lösung: schwarze Linien in Farbreihenfolge */
function gruppenSvg(P, breite, loesung){
  var g = P.gruppen.length, proZeile = g <= 3 ? g : Math.ceil(g / 2), zeilen = Math.ceil(g / proZeile);
  var w = Math.min(190, (breite - 20) / proZeile), h = w * 1.5, r = Math.max(11, Math.min(17, w * 0.085));
  var hoehe = zeilen * (h + 16), t = '';
  // Liegen Punkte eng beieinander (viele Farben), werden alle Formen etwas kleiner – gleich gross in allen Gruppen
  var eng = Infinity, sx0 = (w - 4 * r) / 2, sy0 = (h - 4 * r) / 4;
  P.gruppen.forEach(function(gr){ gr.punkte.forEach(function(a, i){ gr.punkte.forEach(function(b, j){ if (j > i) eng = Math.min(eng, Math.hypot((a[0] - b[0]) * sx0, (a[1] - b[1]) * sy0)); }); }); });
  r = Math.max(7, Math.min(r, eng / 2.3));
  P.gruppen.forEach(function(gr, i){
    var zeile = Math.floor(i / proZeile), inZeile = Math.min(proZeile, g - zeile * proZeile), spalte = i - zeile * proZeile;
    var x0 = (breite - inZeile * w) / 2 + spalte * w, y0 = zeile * (h + 16) + 8, sx = (w - 4 * r) / 2, sy = (h - 4 * r) / 4;
    var pkt = gr.punkte.map(function(q){ return [x0 + 2 * r + q[0] * sx, y0 + 2 * r + q[1] * sy, q[2]]; });
    if (loesung) t += '<polyline points="' + pkt.map(function(q){ return f1(q[0]) + ',' + f1(q[1]); }).join(' ') + '" fill="none" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.42) + '" stroke-linecap="round" stroke-linejoin="round"/>';
    pkt.forEach(function(q){ t += formSvg(gr.form, q[0], q[1], r, Kern.FARBE[q[2]]); });
  });
  return '<svg class="rb-gruppen" width="' + breite + '" height="' + f1(hoehe) + '" viewBox="0 0 ' + breite + ' ' + f1(hoehe) + '" role="img" aria-label="Formen zum Verbinden">' + t + '</svg>';
}

var VORLAGE = '<div class="rb">' +
  '<header class="rb-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Regenbogenrätsel</h1>' +
    '<p>Verbinde in jeder Gruppe die Formen in der Reihenfolge der Regenbogenfarben – dann erscheint eine Zahl.</p></header>' +
  '<div class="rb-layout"><section class="rb-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Zahl</h2><p>Welche Ziffern sollen erscheinen?</p></div></div>' +
      '<label class="feld-label" for="rbZiffern">Ziffern</label>' +
      '<div class="rb-zeile"><input type="text" id="rbZiffern" inputmode="numeric" maxlength="12" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn klein" id="rbZufall" title="Andere zufällige Ziffern">Andere</button></div>' +
      '<p class="hinweis">1 bis 6 Ziffern, z. B. «243». Jede Ziffer bekommt ihre eigene Form.</p>' +
      '<div class="rb-zaehler" id="rbZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Regenbogen</h2></div></div>' +
      '<p class="feld-label">Anzahl Farben</p><div class="rb-chips" id="rbFarben" role="radiogroup" aria-label="Anzahl Farben im Regenbogen"></div>' +
      '<p class="hinweis" id="rbFarbenInfo"></p>' +
      '<div class="rb-farbfolge" id="rbFolge"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>' +
      '<label class="opt"><input type="checkbox" id="rbAntwort"><span>Linie für die Antwort</span></label>' +
    '</div>' +
  '</section>' +
  '<section class="rb-ausgabe" aria-label="Ergebnis">' +
    '<div id="rbMeldung" aria-live="polite"></div>' +
    '<div class="rb-werkzeug">' +
      '<button type="button" class="btn klein" id="rbZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="rbNeu" title="Formen und Lage neu mischen">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="rbMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="rbPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="rbHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="rb-rahmen"><article class="rb-blatt" id="rbBlatt"></article></div>' +
    '<div class="rb-rahmen"><article class="rb-blatt rb-loesungsblatt" id="rbLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<path d="M3 17a9 9 0 0 1 18 0"/><path d="M6.5 17a5.5 5.5 0 0 1 11 0"/><path d="M10 17a2 2 0 0 1 4 0"/></svg>';

Labor.registriere({
  id:'regenbogen',
  titel:'Regenbogenrätsel',
  kurz:'Formen in Regenbogen-Reihenfolge verbinden – Zahlen erscheinen',
  beschreibung:'Unter einem Regenbogen liegen Sterne, Kreise, Dreiecke und mehr in seinen Farben. Wer sie in der Reihenfolge der Regenbogenfarben verbindet, zeichnet Zahlen. Ziffern und Anzahl Farben frei wählbar, mit Lösungsblatt.',
  merkmale:['Eigene Ziffern', '3 bis 10 Farben', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/regenbogen/regenbogen.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'regenbogen-eingaben', OPT = 'regenbogen-einstellungen';
  var STANDARD = { farben:0, antwort:true, mitLoesung:true, titelAn:true, anleitungAn:true };   // farben 0: so wenige wie nötig
  var st = { ziffern:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.ziffern = String(e.ziffern || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (!Kern.ziffern(st.ziffern).length) st.ziffern = '243';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ ziffern:st.ziffern, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#rbMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  $('#rbZiffern').value = st.ziffern;
  $('#rbZiffern').addEventListener('input', function(){ st.ziffern = this.value; speichern(); baldZeichnen(); });
  $('#rbZufall').addEventListener('click', function(){
    var r = Kern.zufall(Date.now()), n = 2 + Math.floor(r() * 3), z = '';
    for (var i = 0; i < n; i++) z += Math.floor(r() * 10);
    st.ziffern = z; $('#rbZiffern').value = z; speichern(); zeichnen();
  });
  // Anzahl Farben: von «so wenige wie nötig» bis 10; zu kleine sind gesperrt
  $('#rbFarben').addEventListener('change', function(ev){ var r = ev.target.closest('input'); if (!r) return; st.opt.farben = +r.value; speichern(); zeichnen(); });
  function farbenZeigen(min){
    var l = [];
    for (var n = 3; n <= Kern.MAX_FARBEN; n++) l.push(n);
    var gewaehlt = Math.max(min, st.opt.farben || min);
    $('#rbFarben').innerHTML = l.map(function(n){
      return '<label' + (n < min ? ' class="gesperrt" title="Diese Ziffern brauchen mindestens ' + min + ' Farben"' : '') + '><input type="radio" name="rbFarben" value="' + n + '"' + (n === gewaehlt ? ' checked' : '') + (n < min ? ' disabled' : '') + '><span>' + n + '</span></label>';
    }).join('');
    $('#rbFarbenInfo').textContent = 'Diese Ziffern brauchen mindestens ' + min + ' Farben. Mit mehr Farben bekommt jede Ziffer zusätzliche Punkte auf ihren Linien – das wird schwieriger.';
    return gewaehlt;
  }
  [['#rbAntwort', 'antwort'], ['#rbMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#rbNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#rbZeigeLoesung').addEventListener('click', function(){ var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); zeichnen(); });

  /* ---------- Rätsel ---------- */
  var P = null, B = 639;   // Zeichenfläche: 703 Pixel Blatt minus Rand
  function titel(){ return 'Regenbogenrätsel'; }
  function anleitung(z){
    return 'Verbinde in jeder Gruppe die Formen der Reihe nach in den Farben des Regenbogens: zuerst ' + Kern.FARBNAME[P.farben[0]] + ' (ganz aussen), dann ' +
      Kern.FARBNAME[P.farben[1]] + ' und so weiter bis ' + Kern.FARBNAME[P.farben[P.farben.length - 1]] + ' (ganz innen). ' + (z.length === 1 ? 'Welche Zahl entsteht?' : 'Welche Zahl entsteht? Lies die Ziffern von links nach rechts.');
  }
  function blattHtml(z, loesung, kopf){
    var o = st.opt;
    return (o.titelAn ? '<h2>' + esc(titel()) + (kopf ? ' – Lösung' : '') + '</h2>' : (kopf ? '<p class="rb-anleitung"><b>Lösung</b></p>' : '')) +
      (o.anleitungAn && !kopf ? '<p class="rb-anleitung">' + esc(anleitung(z)) + '</p>' : '') +
      '<div class="rb-bild">' + regenbogenSvg(P.farben, Math.min(B, 470)) + gruppenSvg(P, B, loesung) + '</div>' +
      (o.antwort || kopf ? '<p class="rb-antwort">Zahl: <span class="rb-linie">' + (loesung ? esc(z.join('')) : '') + '</span></p>' : '');
  }
  function zeichnen(){
    if (aus) return;
    var roh = String(st.ziffern || ''), z = Kern.ziffern(roh), h = '';
    if (/[^0-9\s]/.test(roh)) h += '<p class="warnung">Nur Ziffern 0 bis 9 – andere Zeichen fallen weg.</p>';
    if (roh.replace(/[^0-9]/g, '').length > 6) h += '<p class="warnung">Höchstens 6 Ziffern – es werden die ersten 6 verwendet.</p>';
    $('#rbZaehler').innerHTML = z.length ? '<p class="rb-zaehler-haupt ok">Zahl: <b>' + esc(z.join('')) + '</b></p>' + h : h;
    var leer = !z.length;
    ['#rbZeigeLoesung', '#rbNeu', '#rbPdf', '#rbHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ P = null; $('#rbBlatt').parentNode.hidden = true; meldung('info', '<p>Gib links die Ziffern ein, die erscheinen sollen.</p>'); return; }
    meldung('', ''); $('#rbBlatt').parentNode.hidden = false;
    var min = Kern.mindestens(z), n = farbenZeigen(min);
    P = Kern.planen({ ziffern:z, farben:n, seed:st.seed });
    $('#rbFolge').innerHTML = P.farben.map(function(f, i){ return '<span><i style="background:' + Kern.FARBE[f] + '"></i>' + (i + 1) + '. ' + esc(Kern.FARBNAME[f]) + '</span>'; }).join('');
    var zeige = $('#rbZeigeLoesung').getAttribute('aria-pressed') === 'true';
    $('#rbBlatt').innerHTML = blattHtml(z, zeige, false);
    $('#rbLoesung').innerHTML = blattHtml(z, true, true);
  }

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function ohneLoesung(){ var k = $('#rbZeigeLoesung'); if (k.getAttribute('aria-pressed') === 'true'){ k.setAttribute('aria-pressed', 'false'); zeichnen(); } }
  Labor.pdfKnopf($('#rbPdf'), function(){ ohneLoesung(); return P && { blaetter:[$('#rbBlatt'), st.opt.mitLoesung && $('#rbLoesung')], name:Labor.pdfName('Regenbogenraetsel', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#rbPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#rbHerunterladen').hidden = false; });
  }
  $('#rbHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P) return;
    ohneLoesung();
    var name = Labor.pdfName('Regenbogenraetsel', '').replace(/\.pdf$/, '.html');
    var inhalt = [$('#rbBlatt'), st.opt.mitLoesung && $('#rbLoesung')].filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Regenbogenrätsel', inhalt, '.rb-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
