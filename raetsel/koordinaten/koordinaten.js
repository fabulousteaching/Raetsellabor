/* Rätsellabor – Generator «Koordinaten-Rätsel»
   Punkte ins Koordinatensystem eintragen und verbinden. Zwei Arten (keine Vorauswahl):
   – «Zeichen zeichnen»: 1–4 Ziffern oder Buchstaben als Strichfiguren (wie im Schachrätsel: Linienzüge auf 5 × 7 Punkten);
     das Blatt nennt die Punkte Linie für Linie, zwischen den Linien wird der Stift abgesetzt. Auf Wunsch alle Linien gemischt.
   – «Für ein Richtungsschloss»: Punkte A, B, C …, jede Strecke 1–3 Einheiten lang, waagrecht oder senkrecht; ihre Richtungen
     sind der Code. Aus vielen Versuchen wird ein Weg gewählt, der sich nicht selbst überdeckt (ausser bei einer Umkehr).
   Koordinatensystem nur mit positiven Zahlen (1. Quadrant) oder mit allen vier Quadranten. Punkte als (x|y). */
(function(){
'use strict';
var tx = Labor.uebersetzer('koordinaten');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function ganz(rnd, a, b){ return a + Math.floor(rnd() * (b - a + 1)); }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* Strichfiguren (wie im Schachrätsel): Linienzüge aus Punkten, x 0–4 von links, y 0–6 von unten */
  var Z = {
    '0':[[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[0, 1], [4, 5]]],
    '1':[[[0, 4], [2, 6], [2, 0]], [[0, 0], [4, 0]]],
    '2':[[[0, 6], [4, 6], [4, 3], [0, 3], [0, 0], [4, 0]]],
    '3':[[[0, 6], [4, 6], [4, 0], [0, 0]], [[1, 3], [4, 3]]],
    '4':[[[3, 0], [3, 6], [0, 3], [4, 3]]],
    '5':[[[4, 6], [0, 6], [0, 3], [4, 3], [4, 0], [0, 0]]],
    '6':[[[4, 6], [0, 6], [0, 0], [4, 0], [4, 3], [0, 3]]],
    '7':[[[0, 6], [4, 6], [1, 3], [1, 0]]],
    '8':[[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[0, 3], [4, 3]]],
    '9':[[[4, 3], [0, 3], [0, 6], [4, 6], [4, 0], [0, 0]]],
    A:[[[0, 0], [0, 4], [2, 6], [4, 4], [4, 0]], [[0, 2], [4, 2]]],
    B:[[[0, 0], [0, 6], [3, 6], [4, 5], [4, 4], [3, 3], [0, 3]], [[3, 3], [4, 2], [4, 1], [3, 0], [0, 0]]],
    C:[[[4, 6], [0, 6], [0, 0], [4, 0]]],
    D:[[[0, 0], [0, 6], [2, 6], [4, 4], [4, 2], [2, 0], [0, 0]]],
    E:[[[4, 6], [0, 6], [0, 0], [4, 0]], [[0, 3], [3, 3]]],
    F:[[[4, 6], [0, 6], [0, 0]], [[0, 3], [3, 3]]],
    G:[[[4, 6], [0, 6], [0, 0], [4, 0], [4, 3], [2, 3]]],
    H:[[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
    I:[[[1, 6], [3, 6]], [[2, 6], [2, 0]], [[1, 0], [3, 0]]],
    J:[[[2, 6], [4, 6], [4, 0], [0, 0], [0, 2]]],
    K:[[[0, 0], [0, 6]], [[4, 6], [1, 3], [4, 0]], [[0, 3], [1, 3]]],
    L:[[[0, 6], [0, 0], [4, 0]]],
    M:[[[0, 0], [0, 6], [2, 4], [4, 6], [4, 0]]],
    N:[[[0, 0], [0, 6], [4, 2]], [[4, 0], [4, 6]]],
    O:[[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]]],
    P:[[[0, 0], [0, 6], [4, 6], [4, 3], [0, 3]]],
    Q:[[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[2, 2], [4, 0]]],
    R:[[[0, 0], [0, 6], [4, 6], [4, 3], [0, 3]], [[1, 3], [4, 0]]],
    S:[[[4, 5], [3, 6], [1, 6], [0, 5], [0, 4], [1, 3], [3, 3], [4, 2], [4, 1], [3, 0], [1, 0], [0, 1]]],
    T:[[[0, 6], [4, 6]], [[2, 6], [2, 0]]],
    U:[[[0, 6], [0, 0], [4, 0], [4, 6]]],
    V:[[[0, 6], [0, 2], [2, 0], [4, 2], [4, 6]]],
    W:[[[0, 6], [0, 0], [2, 2], [4, 0], [4, 6]]],
    X:[[[0, 0], [0, 1], [4, 5], [4, 6]], [[0, 6], [0, 5], [4, 1], [4, 0]]],
    Y:[[[0, 6], [2, 4], [4, 6]], [[2, 4], [2, 0]]],
    Z:[[[0, 6], [4, 6], [0, 2], [0, 0], [4, 0]]]
  };
  var SCHRITT = 6;   // Abstand der Zeichen (4 breit + 2 frei)
  /* Rahmen des Koordinatensystems um alle Punkte (eine Einheit Rand; im 1. Quadranten ab 0) */
  function rahmen(punkte, quad){
    var xs = punkte.map(function(p){ return p[0]; }), ys = punkte.map(function(p){ return p[1]; });
    var b = { x0:Math.min.apply(null, xs) - 1, x1:Math.max.apply(null, xs) + 1, y0:Math.min.apply(null, ys) - 1, y1:Math.max.apply(null, ys) + 1 };
    if (quad === 1){ b.x0 = 0; b.y0 = 0; }
    else { b.x0 = Math.min(b.x0, -1); b.y0 = Math.min(b.y0, -1); b.x1 = Math.max(b.x1, 1); b.y1 = Math.max(b.y1, 1); }
    return b;
  }
  /* Zeichen zeichnen: o { quad:1|4, gemischt, seed } → { gruppen:[{ zeichen, linien:[[ [x, y] … ] …] }], alle:[{ zeichen, linie }] (gemischte Liste), rahmen } */
  function zeichenPlan(zeichen, o){
    var rnd = zufall(o.seed), dx, dy, xs = [];
    zeichen.forEach(function(c, k){ (Z[c] || []).forEach(function(l){ l.forEach(function(q){ xs.push(q[0] + k * SCHRITT); }); }); });
    var minx = Math.min.apply(null, xs), maxx = Math.max.apply(null, xs);
    if (o.quad === 4){
      // um den Ursprung herum (mit etwas Zufall), aber immer auf beiden Seiten beider Achsen
      dx = -Math.round((minx + maxx) / 2) + ganz(rnd, -1, 1); if (minx + dx >= 0 || maxx + dx <= 0) dx = -Math.round((minx + maxx) / 2);
      dy = -3 + ganz(rnd, -1, 1);
    } else { dx = -minx + ganz(rnd, 1, 2); dy = ganz(rnd, 1, 2); }
    var gruppen = zeichen.map(function(c, k){
      var linien = (Z[c] || []).map(function(l){ return l.map(function(q){ return [q[0] + k * SCHRITT + dx, q[1] + dy]; }); });
      if (o.gemischt) linien = mischen(linien.map(function(l){ return rnd() < 0.5 ? l.slice().reverse() : l; }), rnd);
      return { zeichen:c, linien:linien };
    });
    var alle = [];
    gruppen.forEach(function(g){ g.linien.forEach(function(l){ alle.push({ zeichen:g.zeichen, linie:l }); }); });
    if (o.gemischt) mischen(alle, rnd);
    var punkte = [].concat.apply([], alle.map(function(a){ return a.linie; }));
    return { gruppen:gruppen, alle:alle, rahmen:rahmen(punkte, o.quad) };
  }
  /* Richtungsschloss: Richtungen (U, D, L, R) → Punkte A, B, C …; jede Strecke 1–3 Einheiten lang. Aus vielen Versuchen der
     Weg, der sich am wenigsten überdeckt (Umkehr wie → ← überdeckt sich immer ein Stück) und nicht zu gross wird. */
  var R = { U:[0, 1], D:[0, -1], L:[-1, 0], R:[1, 0] };
  function strafe(p){
    var s = 0, i, j, gesehen = {};
    p.forEach(function(q){ var k = q[0] + ',' + q[1]; if (gesehen[k]) s += 2; gesehen[k] = 1; });
    for (i = 0; i + 1 < p.length; i++) for (j = 0; j + 2 < i + 1; j++){
      var a = [p[i], p[i + 1]], b = [p[j], p[j + 1]];
      var waagA = a[0][1] === a[1][1], waagB = b[0][1] === b[1][1];
      if (waagA === waagB){
        var gleich = waagA ? a[0][1] === b[0][1] : a[0][0] === b[0][0], k = waagA ? 0 : 1;
        if (gleich){ var lo = Math.max(Math.min(a[0][k], a[1][k]), Math.min(b[0][k], b[1][k])), hi = Math.min(Math.max(a[0][k], a[1][k]), Math.max(b[0][k], b[1][k])); if (hi > lo) s += 3; }
      } else {
        var h = waagA ? a : b, v = waagA ? b : a, x = v[0][0], y = h[0][1];
        if (x > Math.min(h[0][0], h[1][0]) && x < Math.max(h[0][0], h[1][0]) && y > Math.min(v[0][1], v[1][1]) && y < Math.max(v[0][1], v[1][1])) s += 0.4;
      }
    }
    return s;
  }
  function richtungPlan(code, o){
    var rnd = zufall(o.seed), best = null;
    for (var t = 0; t < 400; t++){
      var p = [[0, 0]];
      code.forEach(function(r){ var l = ganz(rnd, 1, 3), q = p[p.length - 1]; p.push([q[0] + R[r][0] * l, q[1] + R[r][1] * l]); });
      var xs = p.map(function(q){ return q[0]; }), ys = p.map(function(q){ return q[1]; }), w = Math.max.apply(null, xs) - Math.min.apply(null, xs), h = Math.max.apply(null, ys) - Math.min.apply(null, ys);
      var s = strafe(p) + Math.max(0, w - 14) + Math.max(0, h - 10) + rnd() * 0.3;
      if (!best || s < best.s) best = { s:s, p:p, w:w, h:h };
    }
    var minx = Math.min.apply(null, best.p.map(function(q){ return q[0]; })), miny = Math.min.apply(null, best.p.map(function(q){ return q[1]; })), dx, dy;
    if (o.quad === 4){ dx = -minx - Math.round(best.w / 2) + ganz(rnd, -1, 1); dy = -miny - Math.round(best.h / 2) + ganz(rnd, -1, 1); }
    else { dx = -minx + ganz(rnd, 1, 2); dy = -miny + ganz(rnd, 1, 2); }
    var punkte = best.p.map(function(q){ return [q[0] + dx, q[1] + dy]; });
    return { punkte:punkte, rahmen:rahmen(punkte, o.quad) };
  }
  /* Richtung einer Strecke (für die Prüfung) */
  function richtung(a, b){ return b[0] > a[0] ? 'R' : b[0] < a[0] ? 'L' : b[1] > a[1] ? 'U' : 'D'; }
  return { zufall:zufall, Z:Z, SCHRITT:SCHRITT, zeichenPlan:zeichenPlan, richtungPlan:richtungPlan, richtung:richtung, strafe:strafe };
})();
/* KERN-ENDE */

function esc(t){ return Labor.esc(t); }
var MAXZ = 4, MAXR = 12;
var PFEIL = { U:'↑', D:'↓', L:'←', R:'→' };
var WOERTER = { de:['MAUS', 'HUND', 'ZOO', 'OPA', 'SONNE', 'TIGER'], en:['ZOO', 'DOG', 'SUN', 'FISH', 'TIGER'], fr:['ZOO', 'CHAT', 'LOUP', 'MER', 'TIGRE'] };
function zeichenVon(text){
  return Array.from(String(text || '').toUpperCase().replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ß/g, 'SS').normalize('NFD').replace(/[̀-ͯ]/g, ''))
    .filter(function(c){ return /[A-Z0-9]/.test(c); });
}
/* Punkt als (x|y) – in Englisch (x, y), in Französisch (x ; y); Minus als echtes Minuszeichen */
function zahl(n){ return n < 0 ? '−' + (-n) : String(n); }
function punkt(p){ var t = Labor.sprache === 'en' ? ', ' : Labor.sprache === 'fr' ? ' ; ' : '|'; return '(' + zahl(p[0]) + t + zahl(p[1]) + ')'; }
var BUCHSTABEN = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/* Koordinatensystem als SVG: Gitter je Einheit, Achsen mit Pfeil, Zahlen an den Achsen. inhalt(X, Y) zeichnet hinein. */
function systemSvg(b, u, inhalt){
  var links = 30, unten = 28, oben = 22, rechts = 24, W = (b.x1 - b.x0) * u, H = (b.y1 - b.y0) * u, t = '', x, y;
  function X(v){ return links + (v - b.x0) * u; }
  function Y(v){ return oben + (b.y1 - v) * u; }
  var g = '';
  for (x = b.x0; x <= b.x1; x++) g += 'M' + X(x) + ' ' + Y(b.y0) + 'V' + Y(b.y1);
  for (y = b.y0; y <= b.y1; y++) g += 'M' + X(b.x0) + ' ' + Y(y) + 'H' + X(b.x1);
  t += '<path d="' + g + '" stroke="#C9D3DE" stroke-width="0.9" fill="none"/>';
  // Achsen (durch den Ursprung), mit Pfeil am Ende
  var ax = Y(0), ay = X(0), ende = 14;
  t += '<path d="M' + X(b.x0) + ' ' + ax + 'H' + (X(b.x1) + ende) + 'M' + ay + ' ' + Y(b.y0) + 'V' + (Y(b.y1) - ende) + '" stroke="#1C2530" stroke-width="1.8" fill="none"/>';
  t += '<polygon points="' + (X(b.x1) + ende + 2) + ',' + ax + ' ' + (X(b.x1) + ende - 7) + ',' + (ax - 4.5) + ' ' + (X(b.x1) + ende - 7) + ',' + (ax + 4.5) + '" fill="#1C2530"/>';
  t += '<polygon points="' + ay + ',' + (Y(b.y1) - ende - 2) + ' ' + (ay - 4.5) + ',' + (Y(b.y1) - ende + 7) + ' ' + (ay + 4.5) + ',' + (Y(b.y1) - ende + 7) + '" fill="#1C2530"/>';
  var fs = Math.max(9, Math.min(12, u * 0.42)), z = '<g style="font-family:var(--blatt-schrift)" font-size="' + fs + '" fill="#3A4452">';
  for (x = b.x0; x <= b.x1; x++) if (x) z += '<text x="' + X(x) + '" y="' + (ax + fs + 3) + '" text-anchor="middle">' + zahl(x) + '</text>';
  for (y = b.y0; y <= b.y1; y++) if (y) z += '<text x="' + (ay - 5) + '" y="' + (Y(y) + fs * 0.35) + '" text-anchor="end">' + zahl(y) + '</text>';
  z += '<text x="' + (ay - 5) + '" y="' + (ax + fs + 3) + '" text-anchor="end">0</text>';
  z += '<text x="' + (X(b.x1) + ende) + '" y="' + (ax - 8) + '" text-anchor="middle" font-weight="700" font-style="italic" font-size="' + (fs + 2) + '">x</text>';
  z += '<text x="' + (ay + 10) + '" y="' + (Y(b.y1) - ende + 2) + '" font-weight="700" font-style="italic" font-size="' + (fs + 2) + '">y</text></g>';
  t += z + (inhalt ? inhalt(X, Y) : '');
  var B = links + W + rechts, Hh = oben + H + unten;
  return '<svg class="ko-system" width="' + B + '" height="' + Hh + '" viewBox="0 0 ' + B + ' ' + Hh + '">' + t + '</svg>';
}
function einheit(b){ return Math.max(16, Math.min(44, 600 / (b.x1 - b.x0 + 1.6), 470 / (b.y1 - b.y0 + 1.6))); }
function pfeilSpitze(x1, y1, x2, y2, farbe){
  var w = Math.atan2(y2 - y1, x2 - x1), mx = (x1 + x2) / 2, my = (y1 + y2) / 2, a = 8;
  return '<polygon points="' + (mx + a * Math.cos(w)).toFixed(1) + ',' + (my + a * Math.sin(w)).toFixed(1) + ' ' + (mx - a * Math.cos(w - 0.5)).toFixed(1) + ',' + (my - a * Math.sin(w - 0.5)).toFixed(1) + ' ' +
    (mx - a * Math.cos(w + 0.5)).toFixed(1) + ',' + (my - a * Math.sin(w + 0.5)).toFixed(1) + '" fill="' + farbe + '"/>';
}

/* ---------- Kärtchen zum Ausschneiden ----------
   Grössen (mm): klein 42 × 36 (4 nebeneinander), mittel 56 × 48 (3), gross 84 × 68 (2) – die Zeichenfläche ist 169 mm breit. */
var MM = 703 / 186;
var KARTEN = { klein:{ w:42, h:36, sp:4 }, mittel:{ w:56, h:48, sp:3 }, gross:{ w:84, h:68, sp:2 } };
var DUNKEL = '#26415C', HELL = '#DCEBF7';
var RICHTUNGEN = { de:['N', 'O', 'S', 'W'], en:['N', 'E', 'S', 'W'], fr:['N', 'E', 'S', 'O'] };
function kartenText(x, y, fs, text, farbe, gewicht){ return '<text x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" font-size="' + fs.toFixed(1) + '" font-weight="' + (gewicht || 700) + '" fill="' + (farbe || '#1C2530') + '" text-anchor="middle" dominant-baseline="central">' + esc(text) + '</text>'; }
/* Kompass: Ring mit Strichen, Windrose (vier lange, vier kurze Zacken, je halb dunkel, halb hell), N O S W; in der Mitte ein
   Schild mit der Koordinate. Oben links die Marke (Linie und Nummer bzw. Buchstabe). */
function kompassKarte(x, y, w, h, marke, text){
  var hh = marke.hilfe ? h * 0.86 : h, cx = x + w / 2, cy = y + hh / 2 + h * 0.03, R = Math.min(w, hh) * 0.43, t = '', i;
  t += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + R.toFixed(1) + '" fill="#F7FAFD" stroke="' + DUNKEL + '" stroke-width="' + Math.max(1, R * 0.035).toFixed(1) + '"/>';
  t += '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (R * 0.86).toFixed(1) + '" fill="none" stroke="' + DUNKEL + '" stroke-width="' + Math.max(0.6, R * 0.015).toFixed(1) + '"/>';
  var striche = '';
  for (i = 0; i < 72; i++){ var w0 = i * 5 * Math.PI / 180, l = i % 9 === 0 ? 0.1 : i % 3 === 0 ? 0.07 : 0.04;
    striche += 'M' + (cx + Math.sin(w0) * R * 0.86).toFixed(1) + ' ' + (cy - Math.cos(w0) * R * 0.86).toFixed(1) + 'L' + (cx + Math.sin(w0) * R * (0.86 + l)).toFixed(1) + ' ' + (cy - Math.cos(w0) * R * (0.86 + l)).toFixed(1); }
  t += '<path d="' + striche + '" stroke="' + DUNKEL + '" stroke-width="' + Math.max(0.5, R * 0.012).toFixed(1) + '"/>';
  function zacke(winkel, lang, breit){
    var a = winkel * Math.PI / 180, sx = Math.sin(a), sy = -Math.cos(a), qx = Math.cos(a), qy = Math.sin(a);
    var spitze = [cx + sx * lang, cy + sy * lang], links = [cx - qx * breit, cy - qy * breit], rechts = [cx + qx * breit, cy + qy * breit];
    function pkt(q){ return q[0].toFixed(1) + ',' + q[1].toFixed(1); }
    return '<polygon points="' + pkt(spitze) + ' ' + pkt(links) + ' ' + cx.toFixed(1) + ',' + cy.toFixed(1) + '" fill="' + DUNKEL + '"/>' +
      '<polygon points="' + pkt(spitze) + ' ' + pkt(rechts) + ' ' + cx.toFixed(1) + ',' + cy.toFixed(1) + '" fill="' + HELL + '" stroke="' + DUNKEL + '" stroke-width="0.6"/>';
  }
  for (i = 0; i < 4; i++) t += zacke(45 + i * 90, R * 0.5, R * 0.09);
  for (i = 0; i < 4; i++) t += zacke(i * 90, R * 0.66, R * 0.12);
  var N = RICHTUNGEN[Labor.sprache] || RICHTUNGEN.de, rb = R * 0.76, fsr = R * 0.15;
  [[0, -1], [1, 0], [0, 1], [-1, 0]].forEach(function(d, k){
    t += '<circle cx="' + (cx + d[0] * rb).toFixed(1) + '" cy="' + (cy + d[1] * rb).toFixed(1) + '" r="' + (fsr * 0.72).toFixed(1) + '" fill="#F7FAFD"/>' + kartenText(cx + d[0] * rb, cy + d[1] * rb, fsr, N[k], DUNKEL);
  });
  // Schild mit der Koordinate
  var n = Array.from(text).length, fs = Math.min(h * 0.15, R * 1.22 / (n * 0.58 + 0.8)), sw = n * fs * 0.58 + fs * 0.8, sh = fs * 1.55;   // Schild innerhalb von W und O
  t += '<rect x="' + (cx - sw / 2).toFixed(1) + '" y="' + (cy - sh / 2).toFixed(1) + '" width="' + sw.toFixed(1) + '" height="' + sh.toFixed(1) + '" rx="' + (sh * 0.3).toFixed(1) + '" fill="#FFFFFF" stroke="' + DUNKEL + '" stroke-width="' + Math.max(1, R * 0.03).toFixed(1) + '"/>';
  t += kartenText(cx, cy, fs, text);
  t += markeSvg(x, y, w, h, marke);
  return t;
}
function schlichtKarte(x, y, w, h, marke, text){
  var fs = Math.min(h * 0.24, w * 0.86 / (Array.from(text).length * 0.56)), dy = marke.hilfe ? -h * 0.03 : h * 0.05;
  return kartenText(x + w / 2, y + h / 2 + dy, fs, text) + markeSvg(x, y, w, h, marke);
}
/* Jede Linie hat eine eigene Farbe und ein eigenes Zeichen (auch schwarz-weiss gedruckt zu unterscheiden) */
var LINIEN = [['#D32F2F', 'kreis'], ['#1565C0', 'quadrat'], ['#2E7D32', 'dreieck'], ['#EF6C00', 'raute'], ['#6A1B9A', 'stern'], ['#00838F', 'sechseck'],
  ['#C2185B', 'herz'], ['#5D4037', 'kreuz'], ['#E0A800', 'ring'], ['#455A64', 'fuenfeck'], ['#558B2F', 'dreieckUnten'], ['#3949AB', 'quadratHohl']];
function linie(n){ return LINIEN[n % LINIEN.length]; }
function formSvg(form, cx, cy, r, farbe){
  var a = ' fill="' + farbe + '"', p = [], i;
  function eck(k, rr, dreh){ var l = []; for (var j = 0; j < k; j++){ var w = (dreh + j * 360 / k) * Math.PI / 180; l.push((cx + rr * Math.sin(w)).toFixed(1) + ',' + (cy - rr * Math.cos(w)).toFixed(1)); } return l.join(' '); }
  switch (form){
    case 'kreis': return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (r * 0.9).toFixed(1) + '"' + a + '/>';
    case 'ring': return '<circle cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" r="' + (r * 0.72).toFixed(1) + '" fill="none" stroke="' + farbe + '" stroke-width="' + (r * 0.36).toFixed(1) + '"/>';
    case 'quadrat': return '<rect x="' + (cx - r * 0.8).toFixed(1) + '" y="' + (cy - r * 0.8).toFixed(1) + '" width="' + (r * 1.6).toFixed(1) + '" height="' + (r * 1.6).toFixed(1) + '"' + a + '/>';
    case 'quadratHohl': return '<rect x="' + (cx - r * 0.65).toFixed(1) + '" y="' + (cy - r * 0.65).toFixed(1) + '" width="' + (r * 1.3).toFixed(1) + '" height="' + (r * 1.3).toFixed(1) + '" fill="none" stroke="' + farbe + '" stroke-width="' + (r * 0.32).toFixed(1) + '"/>';
    case 'dreieck': return '<polygon points="' + eck(3, r * 1.08, 0) + '"' + a + '/>';
    case 'dreieckUnten': return '<polygon points="' + eck(3, r * 1.08, 180) + '"' + a + '/>';
    case 'raute': return '<polygon points="' + eck(4, r * 1.05, 0) + '"' + a + '/>';
    case 'fuenfeck': return '<polygon points="' + eck(5, r * 0.98, 0) + '"' + a + '/>';
    case 'sechseck': return '<polygon points="' + eck(6, r * 0.95, 30) + '"' + a + '/>';
    case 'stern': for (i = 0; i < 10; i++){ var rr = i % 2 ? r * 0.46 : r * 1.08, w = i * 36 * Math.PI / 180; p.push((cx + rr * Math.sin(w)).toFixed(1) + ',' + (cy + r * 0.08 - rr * Math.cos(w)).toFixed(1)); } return '<polygon points="' + p.join(' ') + '"' + a + '/>';
    case 'kreuz': var d = r * 0.34; return '<path d="M' + (cx - d).toFixed(1) + ' ' + (cy - r).toFixed(1) + 'h' + (2 * d).toFixed(1) + 'v' + (r - d).toFixed(1) + 'h' + (r - d).toFixed(1) + 'v' + (2 * d).toFixed(1) + 'h' + (d - r).toFixed(1) + 'v' + (r - d).toFixed(1) + 'h' + (-2 * d).toFixed(1) + 'v' + (d - r).toFixed(1) + 'h' + (d - r).toFixed(1) + 'v' + (-2 * d).toFixed(1) + 'h' + (r - d).toFixed(1) + 'z"' + a + '/>';
    case 'herz': var q = r / 10; return '<path d="M' + cx.toFixed(1) + ' ' + (cy + 9 * q).toFixed(1) + 'C' + (cx - 4 * q).toFixed(1) + ' ' + (cy + 5 * q).toFixed(1) + ' ' + (cx - 11 * q).toFixed(1) + ' ' + (cy + q).toFixed(1) + ' ' + (cx - 11 * q).toFixed(1) + ' ' + (cy - 4 * q).toFixed(1) +
      'C' + (cx - 11 * q).toFixed(1) + ' ' + (cy - 9 * q).toFixed(1) + ' ' + (cx - 4 * q).toFixed(1) + ' ' + (cy - 11 * q).toFixed(1) + ' ' + cx.toFixed(1) + ' ' + (cy - 5.5 * q).toFixed(1) + 'C' + (cx + 4 * q).toFixed(1) + ' ' + (cy - 11 * q).toFixed(1) + ' ' + (cx + 11 * q).toFixed(1) + ' ' + (cy - 9 * q).toFixed(1) + ' ' + (cx + 11 * q).toFixed(1) + ' ' + (cy - 4 * q).toFixed(1) +
      'C' + (cx + 11 * q).toFixed(1) + ' ' + (cy + q).toFixed(1) + ' ' + (cx + 4 * q).toFixed(1) + ' ' + (cy + 5 * q).toFixed(1) + ' ' + cx.toFixed(1) + ' ' + (cy + 9 * q).toFixed(1) + 'Z"' + a + '/>';
  }
  return '';
}
/* Zeichen einer Linie als kleines Bild im Text (Liste auf dem Blatt) */
function formHtml(n, gr){ var l = linie(n), g = gr || 16; return '<svg class="ko-form" width="' + g + '" height="' + g + '" viewBox="0 0 20 20" aria-hidden="true">' + formSvg(l[1], 10, 10, 8.4, l[0]) + '</svg>'; }
/* Marke oben links: Zeichen der Linie mit Nummer (Zeichen zeichnen) bzw. Buchstabe (Richtungsschloss);
   mit Verbinde-Hilfe unten der Hinweis «Start · weiter zu …», «weiter zu …» oder «Ende». */
function markeSvg(x, y, w, h, m){
  var fs = Math.max(9, Math.min(15, h * 0.11)), t = '';
  if (m.b){
    t += '<circle cx="' + (x + fs * 1.4).toFixed(1) + '" cy="' + (y + fs * 1.4).toFixed(1) + '" r="' + (fs * 0.95).toFixed(1) + '" fill="' + DUNKEL + '"/>' + kartenText(x + fs * 1.4, y + fs * 1.42, fs * 1.1, m.b, '#FFFFFF');
  } else {
    var l = linie(m.linie);
    t += formSvg(l[1], x + fs * 1.3, y + fs * 1.35, fs * 0.82, l[0]);
    t += '<text x="' + (x + fs * 2.4).toFixed(1) + '" y="' + (y + fs * 1.38).toFixed(1) + '" font-size="' + (fs * 1.25).toFixed(1) + '" font-weight="700" fill="' + l[0] + '" dominant-baseline="central">' + m.nr + '</text>';
  }
  if (!m.hilfe) return t;
  // Hinweis unten: Text, dann (bei «weiter zu») Zeichen der Linie und Nummer bzw. Buchstabe
  var hs = Math.max(8, Math.min(12.5, h * 0.085)), yh = y + h - hs * 0.95, teile = [];
  if (m.start) teile.push({ text:tx('Start') + ' · ', farbe:'#2E7D32' });
  if (m.weiter){ teile.push({ text:tx('weiter zu') + ' ' }); if (!m.b) teile.push({ form:true }); teile.push({ text:String(m.weiter), fett:true }); }
  else teile.push({ text:m.b ? tx('Ende') : tx('Ende – Stift absetzen'), farbe:'#C62828' });
  var breite = teile.reduce(function(s, q){ return s + (q.form ? hs * 1.2 : Array.from(q.text).length * hs * 0.55); }, 0), xx = x + (w - breite) / 2;
  teile.forEach(function(q){
    if (q.form){ var l2 = linie(m.linie); t += formSvg(l2[1], xx + hs * 0.55, yh, hs * 0.5, l2[0]); xx += hs * 1.2; return; }
    t += '<text x="' + xx.toFixed(1) + '" y="' + yh.toFixed(1) + '" font-size="' + hs.toFixed(1) + '" font-weight="' + (q.fett ? 700 : 600) + '" fill="' + (q.farbe || '#3A4452') + '" dominant-baseline="central">' + esc(q.text) + '</text>';
    xx += Array.from(q.text).length * hs * 0.55;
  });
  return t;
}

var VORLAGE = '<div class="ko">' +
  tx('<header class="ko-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Koordinaten-Rätsel</h1>') +
    tx('<p>Punkte ins Koordinatensystem eintragen und verbinden: Entweder erscheinen Ziffern und Buchstaben – oder die Strecken zeigen die Richtungen für ein Richtungsschloss.</p></header>') +
  tx('<div class="ko-layout"><section class="ko-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Wofür?</h2></div></div>') +
      tx('<div class="ko-wahl" role="radiogroup" aria-label="Art des Koordinaten-Rätsels">') +
        tx('<label><input type="radio" name="koArt" value="zeichen"><span><b>Zeichen zeichnen</b><small>Punkte verbinden – Ziffern oder Buchstaben erscheinen. Für ein Zahlen- oder Buchstabenschloss.</small></span></label>') +
        tx('<label><input type="radio" name="koArt" value="richtung"><span><b>Für ein Richtungsschloss</b><small>Jede Strecke zeigt nach oben, unten, links oder rechts – das ist der Code.</small></span></label></div>') +
    '</div>' +
    tx('<div class="karte" id="koZeichenKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Code</h2><p>Diese Zeichen erscheinen im Koordinatensystem.</p></div></div>') +
      tx('<label class="feld-label" for="koCode">Code</label>') +
      '<div class="ko-zeile"><input type="text" id="koCode" maxlength="12" autocomplete="off" spellcheck="false">' +
        tx('<button type="button" class="btn klein" id="koBeispiel" title="Einen Code vorschlagen">Beispiel</button></div>') +
      tx('<p class="hinweis">1 bis 4 Ziffern oder Buchstaben (A–Z).</p>') +
      '<div id="koZeichenInfo" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte" id="koRichtungKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Richtungscode</h2><p>So, wie man das Richtungsschloss öffnet – bis 12 Richtungen.</p></div></div>') +
      tx('<div class="ko-steuer"><div class="ko-kreuz" role="group" aria-label="Richtung anhängen">') +
        [['U', tx('oben')], ['L', tx('links')], ['R', tx('rechts')], ['D', tx('unten')]].map(function(x){ return '<button type="button" class="ko-pfeil ko-' + x[0] + '" data-r="' + x[0] + '" aria-label="' + x[1] + '">' + PFEIL[x[0]] + '</button>'; }).join('') +
      '</div><div class="ko-codefeld"><div class="ko-codeliste" id="koRichtungen" aria-live="polite"></div>' +
        tx('<div class="ko-codeknoepfe"><button type="button" class="btn klein" id="koZurueck">⌫ Letzte löschen</button><button type="button" class="btn klein" id="koLeeren">Alle löschen</button></div></div></div>') +
      tx('<p class="hinweis">Tipp: Mit den Pfeiltasten der Tastatur geht es auch, wenn ein Pfeilknopf ausgewählt ist.</p>') +
    '</div>' +
    tx('<div class="karte" id="koQuadKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Koordinatensystem</h2></div></div>') +
      tx('<div class="ko-wahl" role="radiogroup" aria-label="Koordinatensystem">') +
        tx('<label><input type="radio" name="koQuad" value="1"><span><b>Nur positive Zahlen</b><small>ein Viertel (1. Quadrant) – einfacher</small></span></label>') +
        tx('<label><input type="radio" name="koQuad" value="4"><span><b>Auch negative Zahlen</b><small>alle vier Quadranten – schwieriger</small></span></label></div>') +
    '</div>' +
    tx('<div class="karte" id="koKartenKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">4</span><div><h2>Verbinden und Ausschneiden</h2></div></div>') +
      tx('<label class="opt"><input type="checkbox" id="koHilfe"><span>Verbinde-Hilfe zeigen: jede Linie mit eigener Farbe und eigenem Zeichen, Pfeile, «Start», «weiter zu …» und «Ende»</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="koKarten"><span>Koordinaten auf Kärtchen zum Ausschneiden (eigene Seite) – statt der Liste auf dem Blatt</span></label>') +
      '<div id="koKartenMehr" hidden>' +
        tx('<p class="feld-label ko-abstand">Grösse der Kärtchen</p><div class="ko-chips" role="radiogroup" aria-label="Grösse der Kärtchen">') +
          [['klein', tx('klein · 42 × 36 mm')], ['mittel', tx('mittel · 56 × 48 mm')], ['gross', tx('gross · 84 × 68 mm')]].map(function(a){ return '<label><input type="radio" name="koKartenGroesse" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
        tx('<p class="feld-label ko-abstand">Aussehen</p><div class="ko-chips" role="radiogroup" aria-label="Aussehen der Kärtchen">') +
          [['kompass', tx('🧭 Kompass')], ['schlicht', tx('schlicht')]].map(function(a){ return '<label><input type="radio" name="koKartenDesign" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
        tx('<label class="opt"><input type="checkbox" id="koKartenGemischt"><span>Kärtchen gemischt (die Nummern bzw. Buchstaben zeigen die Reihenfolge)</span></label>') +
      '</div>' +
    '</div>' +
    tx('<div class="karte" id="koEinstKarte" hidden><details class="optionen"><summary>Einstellungen</summary>') +
      tx('<label class="opt" id="koGemischtZeile"><input type="checkbox" id="koGemischt"><span>Linien aller Zeichen in einer Liste gemischt (schwieriger)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="koKaestchen"><span>Kästchen für den Code auf dem Blatt</span></label>') +
    '</details></div>' +
  '</section>' +
  tx('<section class="ko-ausgabe" aria-label="Ergebnis">') +
    '<div id="koMeldung" aria-live="polite"></div>' +
    '<div class="ko-werkzeug" id="koWerkzeug" hidden>' +
      tx('<button type="button" class="btn klein" id="koNeu" title="Andere Lage im Koordinatensystem">Neu mischen</button>') +
      tx('<button type="button" class="btn klein" id="koZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="koMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="koPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="koHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="ko-rahmen" hidden><article class="ko-blatt" id="koBlatt"></article></div>' +
    '<div id="koKartenSeiten"></div>' +
    '<div class="ko-rahmen"><article class="ko-blatt ko-loesungsblatt" id="koLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 3v17h17"/><path d="M8 16V9h5v4h-5" stroke-width="2.2" opacity=".6"/><circle cx="8" cy="16" r="1.2" fill="currentColor"/></svg>';

Labor.registriere({
  id:'koordinaten',
  titel:'Koordinaten-Rätsel',
  kurz:'Punkte verbinden – Zeichen oder ein Code fürs Richtungsschloss erscheinen',
  beschreibung:'Punkte ins Koordinatensystem eintragen und der Reihe nach verbinden. Zwei Arten: Ziffern und Buchstaben zeichnen (für ein Zahlen- oder Buchstabenschloss) oder Strecken, deren Richtungen den Code für ein Richtungsschloss ergeben. Nur positive Zahlen oder alle vier Quadranten. Mit Lösungsblatt.',
  merkmale:['Zeichen oder Richtungscode', 'Positive oder auch negative Zahlen', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/koordinaten/koordinaten.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'koordinaten-eingaben', OPT = 'koordinaten-einstellungen';
  var STANDARD = { art:'', quad:0, gemischt:false, kaestchen:true, hilfe:true, karten:false, kartenGroesse:'mittel', kartenDesign:'kompass', kartenGemischt:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { code:'', richtungen:[], seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) }, zeigeLoesung = false;
  try { var o0 = JSON.parse(localStorage.getItem(OPT)); if (o0) Object.assign(st.opt, o0); } catch(x){}
  try { var e0 = JSON.parse(sessionStorage.getItem(TAB)); if (e0){ st.code = String(e0.code || ''); st.richtungen = (e0.richtungen || []).filter(function(r){ return PFEIL[r]; }).slice(0, MAXR); st.seed = +e0.seed || st.seed; } } catch(x){}
  if (['zeichen', 'richtung'].indexOf(st.opt.art) < 0) st.opt.art = '';
  if ([1, 4].indexOf(st.opt.quad) < 0) st.opt.quad = 0;
  if (!KARTEN[st.opt.kartenGroesse]) st.opt.kartenGroesse = 'mittel';
  if (['kompass', 'schlicht'].indexOf(st.opt.kartenDesign) < 0) st.opt.kartenDesign = 'kompass';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, richtungen:st.richtungen, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#koMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  $('#koCode').value = st.code;
  $('#koCode').addEventListener('input', function(){ st.code = this.value; speichern(); baldZeichnen(); });
  var bspZahl = true;
  $('#koBeispiel').addEventListener('click', function(){
    var r = Kern.zufall(Date.now()), z = '', w = (WOERTER[Labor.sprache] || WOERTER.de).filter(function(x){ return x.length <= MAXZ && x !== st.code; });
    if (bspZahl || !w.length) for (var i = 0; i < 3; i++) z += Math.floor(r() * 10); else z = w[Math.floor(r() * w.length)];
    bspZahl = !bspZahl; st.code = z; $('#koCode').value = z; speichern(); zeichnen(); $('#koCode').focus();
  });
  function radios(name, k, zahl){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = zahl ? +r.value : r.value; speichern(); zeichnen(); });
    });
  }
  radios('koArt', 'art'); radios('koQuad', 'quad', true);
  radios('koKartenGroesse', 'kartenGroesse'); radios('koKartenDesign', 'kartenDesign');
  [['#koGemischt', 'gemischt'], ['#koKaestchen', 'kaestchen'], ['#koHilfe', 'hilfe'], ['#koKarten', 'karten'], ['#koKartenGemischt', 'kartenGemischt'], ['#koMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  function richtungDazu(r){ if (st.richtungen.length >= MAXR) return; st.richtungen.push(r); speichern(); zeichnen(); }
  [].forEach.call(bereich.querySelectorAll('.ko-pfeil'), function(b){ b.addEventListener('click', function(){ richtungDazu(b.getAttribute('data-r')); }); });
  $('.ko-kreuz').addEventListener('keydown', function(ev){
    var r = { ArrowUp:'U', ArrowDown:'D', ArrowLeft:'L', ArrowRight:'R' }[ev.key];
    if (!r) return; ev.preventDefault(); richtungDazu(r);
    var b = $('.ko-pfeil[data-r="' + r + '"]'); if (b) b.focus();
  });
  $('#koZurueck').addEventListener('click', function(){ st.richtungen.pop(); speichern(); zeichnen(); });
  $('#koLeeren').addEventListener('click', function(){ st.richtungen = []; speichern(); zeichnen(); });
  $('#koNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#koZeigeLoesung').addEventListener('click', function(){ zeigeLoesung = !zeigeLoesung; loesungZeigen(); if (zeigeLoesung) $('#koLoesung').scrollIntoView({ behavior:'smooth', block:'start' }); });
  function loesungZeigen(){
    $('#koZeigeLoesung').setAttribute('aria-pressed', zeigeLoesung ? 'true' : 'false');
    $('#koZeigeLoesung').textContent = zeigeLoesung ? tx('Lösung verbergen') : tx('Lösung zeigen');
    $('#koLoesung').classList.toggle('offen', zeigeLoesung);
  }

  /* ---------- Blatt ---------- */
  var P = null, Z = [];
  function alleZu(){ $('#koBlatt').parentNode.hidden = true; $('#koWerkzeug').hidden = true; $('#koLoesung').innerHTML = ''; $('#koKartenSeiten').innerHTML = ''; }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, zeichenArt = o.art === 'zeichen';
    $('#koZeichenKarte').hidden = !zeichenArt;
    $('#koRichtungKarte').hidden = o.art !== 'richtung';
    $('#koRichtungen').innerHTML = st.richtungen.length ? st.richtungen.map(function(r, i){ return '<span class="ko-codepfeil"><small>' + (i + 1) + '</small>' + PFEIL[r] + '</span>'; }).join('') : tx('<span class="ko-leer">Noch keine Richtung – tippe auf die Pfeile.</span>');
    $('#koZurueck').disabled = $('#koLeeren').disabled = !st.richtungen.length;
    [].forEach.call(bereich.querySelectorAll('.ko-pfeil'), function(b){ b.disabled = st.richtungen.length >= MAXR; });
    Z = zeichenVon(st.code);
    var info = '';
    if (zeichenArt && Z.length > MAXZ){ info = tx('<p class="ko-info warnung">Höchstens 4 Zeichen – es werden die ersten 4 verwendet.</p>'); Z = Z.slice(0, MAXZ); }
    if (zeichenArt && Z.length) info = tx('<p class="ko-info ok">Code: <b>{c}</b></p>', { c:esc(Z.join('')) }) + info;
    $('#koZeichenInfo').innerHTML = info;
    var eingabe = zeichenArt ? Z.length > 0 : o.art === 'richtung' && st.richtungen.length > 0;
    $('#koQuadKarte').hidden = !eingabe;
    $('#koEinstKarte').hidden = $('#koKartenKarte').hidden = !eingabe || !o.quad;
    $('#koKartenMehr').hidden = !o.karten;
    $('#koGemischtZeile').hidden = !zeichenArt;
    if (!o.art){ alleZu(); P = null; meldung('info', tx('<p>Wähle links, wofür das Rätsel ist: Zeichen zeichnen oder ein Richtungsschloss.</p>')); return; }
    if (!eingabe){ alleZu(); P = null; meldung('info', zeichenArt ? tx('<p>Gib den Code ein – Ziffern oder Buchstaben.</p>') : tx('<p>Gib mit den Pfeilen den Code des Richtungsschlosses ein.</p>')); return; }
    if (!o.quad){ alleZu(); P = null; meldung('info', tx('<p>Wähle, ob das Koordinatensystem nur positive oder auch negative Zahlen hat.</p>')); return; }
    P = zeichenArt ? Kern.zeichenPlan(Z, { quad:o.quad, gemischt:o.gemischt, seed:st.seed }) : Kern.richtungPlan(st.richtungen, { quad:o.quad, seed:st.seed });
    meldung('', '');
    $('#koWerkzeug').hidden = false;
    $('#koBlatt').parentNode.hidden = false;
    $('#koBlatt').innerHTML = zeichenArt ? zeichenBlatt(false) : richtungBlatt(false);
    $('#koLoesung').innerHTML = zeichenArt ? zeichenBlatt(true) : richtungBlatt(true);
    $('#koKartenSeiten').innerHTML = o.karten ? kartenSeiten() : '';
    loesungZeigen();
  }
  function kopf(loesung, titelTeil){
    var o = st.opt, h = '';
    if (o.titelAn) h += '<h2>' + (loesung ? tx('Koordinaten-Rätsel – Lösung') : titelTeil) + '</h2>';
    else if (loesung) h += tx('<p class="ko-anleitung"><b>Lösung</b></p>');
    return h;
  }
  function zeichenBlatt(loesung){
    var o = st.opt, u = einheit(P.rahmen), h = kopf(loesung, tx('Koordinaten-Rätsel'));
    if (o.anleitungAn && !loesung) h += '<p class="ko-anleitung">' + tx('Trage die Punkte ins Koordinatensystem ein: zuerst nach rechts (x), dann nach oben (y).') + ' ' +
      (o.karten ? '' : o.hilfe ? tx('Jede Zeile unten ist eine Linie: Beginne bei «Start» und verbinde die Punkte der Reihe nach (→) mit geraden Strichen. Bei «Ende» setzt du den Stift ab und beginnst die nächste Linie.') :
        tx('Verbinde die Punkte einer Linie der Reihe nach mit geraden Strichen; bei einer neuen Linie setzt du den Stift ab.')) + ' ' +
      (o.gemischt ? tx('Die Linien sind gemischt. Lies die Zeichen am Schluss von links nach rechts.') : tx('Welche Zeichen erscheinen?')) + '</p>';
    h += systemSvg(P.rahmen, u, loesung ? function(X, Y){
      // jede Linie in ihrer Farbe, am Anfang ihr Zeichen
      return P.alle.map(function(a, n){ var f = o.hilfe ? linie(n)[0] : '#1565C0'; return '<polyline points="' + a.linie.map(function(p){ return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '" fill="none" stroke="' + f + '" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>' +
        a.linie.map(function(p){ return '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="3" fill="' + f + '"/>'; }).join(''); }).join('') +
        (o.hilfe ? P.alle.map(function(a, n){ var p = a.linie[0], l = linie(n); return '<g>' + '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="9" fill="#fff" stroke="' + l[0] + '" stroke-width="1.4"/>' + formSvg(l[1], X(p[0]), Y(p[1]), 5.6, l[0]) + '</g>'; }).join('') : '');
    } : null);
    if (!loesung && o.karten){
      h += '<p class="ko-kartenhinweis">' + (o.hilfe ? tx('✂ Die Koordinaten stehen auf Kärtchen. Kärtchen mit der gleichen Farbe und dem gleichen Zeichen gehören zu einer Linie. Lege sie nach den Nummern (1, 2, 3 …) – jedes Kärtchen sagt dir, wie es weitergeht. Bei «Ende» setzt du den Stift ab.') :
        tx('✂ Die Koordinaten stehen auf Kärtchen. Kärtchen mit dem gleichen Zeichen gehören zu einer Linie; die Nummer zeigt die Reihenfolge.')) + '</p>';
      if (o.kaestchen) h += '<div class="ko-antwort"><span>' + tx('Code:') + '</span>' + Z.map(function(){ return '<span class="ko-kaestchen"></span>'; }).join('') + '</div>';
    } else if (!loesung){
      var listen = o.gemischt ? [{ titel:null, linien:P.alle.map(function(a){ return a.linie; }) }] : P.gruppen.map(function(g, k){ return { titel:tx('Zeichen {n}', { n:k + 1 }), linien:g.linien }; }), nr = 0;
      h += '<div class="ko-listen' + (o.gemischt ? ' gemischt' : '') + '">' + listen.map(function(l){
        return '<div class="ko-liste">' + (l.titel ? '<h3>' + l.titel + '</h3>' : '') + '<ol>' + l.linien.map(function(li){
          nr++;
          if (!o.hilfe) return '<li><span class="ko-linie-nr">' + tx('Linie {n}', { n:nr }) + '</span> ' + li.map(punkt).join(' – ') + '</li>';
          // mit Hilfe: Zeichen der Linie, «Start», Pfeile, «Ende»
          var f = linie(nr - 1)[0];
          return '<li class="ko-hilfe" style="--linie:' + f + '">' + formHtml(nr - 1) + ' <span class="ko-start">' + tx('Start') + '</span> ' +
            li.map(function(p){ return '<span class="ko-p">' + punkt(p) + '</span>'; }).join(' <span class="ko-pfeil-t">→</span> ') + ' <span class="ko-ende">' + tx('Ende') + '</span></li>';
        }).join('') + '</ol></div>';
      }).join('') + '</div>';
      if (o.kaestchen) h += '<div class="ko-antwort"><span>' + tx('Code:') + '</span>' + Z.map(function(){ return '<span class="ko-kaestchen"></span>'; }).join('') + '</div>';
    } else h += '<p class="ko-loesungscode">' + tx('Code:') + ' <b>' + esc(Z.join('')) + '</b></p>';
    return h;
  }
  function richtungBlatt(loesung){
    var o = st.opt, u = einheit(P.rahmen), pk = P.punkte, h = kopf(loesung, tx('Koordinaten-Rätsel – Richtungsschloss'));
    if (o.anleitungAn && !loesung) h += '<p class="ko-anleitung">' + tx('Trage die Punkte ins Koordinatensystem ein: zuerst nach rechts (x), dann nach oben (y). Verbinde sie der Reihe nach: A mit B, B mit C … Jede Strecke zeigt nach oben, unten, links oder rechts. Zeichne für jede Strecke den Pfeil ins Kästchen – das ist der Code für das Richtungsschloss.') + '</p>';
    h += systemSvg(P.rahmen, u, loesung ? function(X, Y){
      var t = '<polyline points="' + pk.map(function(p){ return X(p[0]) + ',' + Y(p[1]); }).join(' ') + '" fill="none" stroke="#1565C0" stroke-width="3" stroke-linejoin="round"/>';
      for (var i = 0; i + 1 < pk.length; i++) t += pfeilSpitze(X(pk[i][0]), Y(pk[i][1]), X(pk[i + 1][0]), Y(pk[i + 1][1]), '#D32F2F');
      pk.forEach(function(p, i){ t += '<circle cx="' + X(p[0]) + '" cy="' + Y(p[1]) + '" r="3.6" fill="#1565C0"/><text x="' + (X(p[0]) + 5) + '" y="' + (Y(p[1]) - 6) + '" font-size="12" font-weight="700" fill="#0D47A1" style="font-family:var(--blatt-schrift)">' + BUCHSTABEN[i] + '</text>'; });
      return t;
    } : null);
    if (o.karten && !loesung) h += '<p class="ko-kartenhinweis">' + (o.hilfe ? tx('✂ Die Punkte stehen auf Kärtchen. Beginne beim Kärtchen «Start» (A) – jedes Kärtchen sagt dir, mit welchem Punkt es weitergeht.') : tx('✂ Die Punkte stehen auf Kärtchen. Schneide sie aus und lege sie nach dem Alphabet: A, B, C …')) + '</p>';
    else if (o.hilfe) h += '<div class="ko-punkte ko-hilfe"><span class="ko-start">' + tx('Start') + '</span>' + pk.map(function(p, i){ return '<span><b>' + BUCHSTABEN[i] + '</b> ' + punkt(p) + '</span>'; }).join('<span class="ko-pfeil-t">→</span>') + '<span class="ko-ende">' + tx('Ende') + '</span></div>';
    else h += '<div class="ko-punkte">' + pk.map(function(p, i){ return '<span><b>' + BUCHSTABEN[i] + '</b> ' + punkt(p) + '</span>'; }).join('') + '</div>';
    h += '<div class="ko-strecken">' + st.richtungen.map(function(r, i){
      return '<span class="ko-strecke"><small>' + BUCHSTABEN[i] + ' → ' + BUCHSTABEN[i + 1] + '</small><span class="ko-kaestchen">' + (loesung ? PFEIL[r] : '') + '</span></span>';
    }).join('') + '</div>';
    if (loesung) h += '<p class="ko-loesungscode">' + tx('Code fürs Richtungsschloss:') + ' <b>' + st.richtungen.map(function(r){ return PFEIL[r]; }).join(' ') + '</b></p>';
    return h;
  }

  /* Kärtchen-Seiten: eine Karte je Punkt (Zeichen: «Linie 2 · 3», Richtungsschloss: «A»), auf Wunsch gemischt */
  function kartenSeiten(){
    var o = st.opt, K = KARTEN[o.kartenGroesse], W = K.w * MM, H = K.h * MM, karten = [];
    if (o.art === 'zeichen') P.alle.forEach(function(a, n){ a.linie.forEach(function(p, k){
      karten.push({ marke:{ linie:n, nr:k + 1, start:k === 0, weiter:k + 1 < a.linie.length ? k + 2 : 0, hilfe:o.hilfe }, p:p }); }); });
    else P.punkte.forEach(function(p, i){ karten.push({ marke:{ b:BUCHSTABEN[i], start:i === 0, weiter:i + 1 < P.punkte.length ? BUCHSTABEN[i + 1] : '', hilfe:o.hilfe }, p:p }); });
    if (o.kartenGemischt){ var rnd = Kern.zufall(st.seed + 5); for (var i = karten.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), x = karten[i]; karten[i] = karten[j]; karten[j] = x; } }
    var proSeite = K.sp * Math.floor(255 / K.h), seiten = Math.ceil(karten.length / proSeite), B = 639, html = '';
    for (var s = 0; s < seiten; s++){
      var teil = karten.slice(s * proSeite, (s + 1) * proSeite), zeilen = Math.ceil(teil.length / K.sp), x0 = (B - K.sp * W) / 2, t = '';
      teil.forEach(function(k, q){
        var x = x0 + (q % K.sp) * W, y = 1 + Math.floor(q / K.sp) * H;
        t += '<rect x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + W.toFixed(1) + '" height="' + H.toFixed(1) + '" fill="none" stroke="#A39A93" stroke-width="0.9" stroke-dasharray="5 4"/>';
        t += o.kartenDesign === 'kompass' ? kompassKarte(x, y, W, H, k.marke, punkt(k.p)) : schlichtKarte(x, y, W, H, k.marke, punkt(k.p));
      });
      html += '<div class="ko-rahmen"><article class="ko-blatt ko-kartenblatt">' +
        '<p class="ko-seitenkopf">' + tx('✂ Koordinaten zum Ausschneiden') + (seiten > 1 ? ' – ' + tx('Seite {i} von {n}', { i:s + 1, n:seiten }) : '') + '</p>' +
        '<svg class="ko-karten" width="' + B + '" height="' + (zeilen * H + 2).toFixed(1) + '" viewBox="0 0 ' + B + ' ' + (zeilen * H + 2).toFixed(1) + '" style="font-family:var(--blatt-schrift)">' + t + '</svg></article></div>';
    }
    return html;
  }
  function alleBlaetter(){
    return [$('#koBlatt')].concat([].slice.call(bereich.querySelectorAll('#koKartenSeiten .ko-kartenblatt')), [st.opt.mitLoesung && $('#koLoesung')]);
  }

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehlerMeldung(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function name(){ return Labor.pdfName('Koordinaten', st.opt.art === 'zeichen' ? Z.join('') : tx('Richtungsschloss')); }
  Labor.pdfKnopf($('#koPdf'), function(){ return P && { blaetter:alleBlaetter(), name:name() }; }, fehlerMeldung);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#koPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#koHerunterladen').hidden = false; });
  }
  $('#koHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P) return;
    var inhalt = alleBlaetter().filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name().replace(/\.pdf$/, '.html'), data:Labor.blattDatei(tx('Koordinaten-Rätsel'), inhalt, '.ko-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
