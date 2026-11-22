/* Rätsellabor – Generator «Falträtsel»
   Die Botschaft (Wort, Zahl, kurzer Satz) wird in Teile zu 1–3 Zeichen geteilt und so auf ein Faltblatt aus C × R Feldern
   verteilt – auf die Vorderseite oder auch auf die Rückseite, teils auf dem Kopf –, dass genau diese Teile oben liegen und
   aufrecht stehen, wenn man das Blatt nach der Faltanleitung faltet. Alle anderen Felder tragen Füllzeichen.
   Der Kern simuliert das Falten (Talfalte, Bergfalte, Umdrehen; immer durch alle Lagen entlang einer Rasterlinie) und
   probiert viele zufällige Faltfolgen aus; gewählt wird eine, bei der man die Botschaft auf dem flachen Blatt nicht einfach
   ablesen kann. Geprüft mit einer unabhängigen Rechnung (Felder als Punkte, an der Faltlinie gespiegelt) an 3000 Faltfolgen.
   Rückseite: «an der langen Kante wenden» gedruckt – so liegt jedes Feld genau hinter seiner Vorderseite. */
(function(){
'use strict';
var tx = Labor.uebersetzer('faltraetsel');

/* KERN-START */
var Kern = (function(){
  /* Zufall mit Startwert (gleiche Zahl → gleiches Rätsel) */
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function ganz(rnd, a, b){ return a + Math.floor(rnd() * (b - a + 1)); }

  /* ---------- Falten ----------
     Das Blatt ist ein Raster aus C × R Feldern (Spalte i, Reihe j). Gefaltet wird immer entlang einer ganzen Rasterlinie
     durch alle Lagen. Zustand: Päckchen W × H, an jeder Stelle ein Stapel (unten → oben) von Lagen { i, j, sx, sy }.
     sx/sy = ±1: wurde das Feld waagrecht/senkrecht gespiegelt? sx · sy = 1 → Vorderseite oben, sonst Rückseite.
     Schritt: { a:'v' (senkrechte Linie) | 'h' (waagrechte Linie) | 'w' (umdrehen wie eine Buchseite),
                k: Linie zwischen Feld k−1 und k, s:'plus' (rechter/unterer Teil wird gefaltet) | 'minus' (linker/oberer),
                t:'tal' (nach vorne, liegt danach oben) | 'berg' (nach hinten, liegt danach unten) } */
  function start(C, R){
    var st = [];
    for (var y = 0; y < R; y++){ st.push([]); for (var x = 0; x < C; x++) st[y].push([{ i:x, j:y, sx:1, sy:1 }]); }
    return { W:C, H:R, st:st };
  }
  function gedreht(l, senk){ return { i:l.i, j:l.j, sx:senk ? -l.sx : l.sx, sy:senk ? l.sy : -l.sy }; }
  function schritt(Z, op){
    var W = Z.W, H = Z.H, x, y, n = [];
    if (op.a === 'w'){
      for (y = 0; y < H; y++){ n.push([]); for (x = 0; x < W; x++) n[y].push(Z.st[y][W - 1 - x].slice().reverse().map(function(l){ return gedreht(l, true); })); }
      return { W:W, H:H, st:n };
    }
    var senk = op.a === 'v', L = senk ? W : H, Q = senk ? H : W, k = op.k, res = [], q, p;
    for (q = 0; q < Q; q++){
      var ziel = {};
      for (p = 0; p < L; p++){
        var stapel = senk ? Z.st[q][p] : Z.st[p][q], weg = op.s === 'plus' ? p >= k : p < k;
        if (weg){ var p2 = 2 * k - 1 - p; ziel[p2] = ziel[p2] || {}; ziel[p2].weg = stapel.slice().reverse().map(function(l){ return gedreht(l, senk); }); }
        else { ziel[p] = ziel[p] || {}; ziel[p].fest = stapel; }
      }
      res.push(ziel);
    }
    var keys = Object.keys(res[0]).map(Number), min = Math.min.apply(null, keys), L2 = Math.max.apply(null, keys) - min + 1;
    function stapelAn(q, p){
      var z = res[q][p + min];
      if (z.fest && z.weg) return op.t === 'tal' ? z.fest.concat(z.weg) : z.weg.concat(z.fest);
      return z.fest || z.weg;
    }
    if (senk){ for (y = 0; y < H; y++){ n.push([]); for (x = 0; x < L2; x++) n[y].push(stapelAn(y, x)); } return { W:L2, H:H, st:n }; }
    for (y = 0; y < L2; y++){ n.push([]); for (x = 0; x < W; x++) n[y].push(stapelAn(x, y)); }
    return { W:W, H:L2, st:n };
  }
  /* alle Zustände: [Anfang, nach Schritt 1, …] */
  function falten(C, R, ops){ var Z = start(C, R), l = [Z]; ops.forEach(function(op){ Z = schritt(Z, op); l.push(Z); }); return l; }
  function lagen(Z){ var m = 0; Z.st.forEach(function(r){ r.forEach(function(s){ if (s.length > m) m = s.length; }); }); return m; }
  /* Wie eine Lage von oben aussieht: Seite ('v'/'r') und Drehung des Inhalts (0 oder 180 Grad), so wie die Seite gedruckt ist.
     Die Rückseite ist «an der langen Kante gewendet» gedruckt: Dreht man das Blatt wie eine Buchseite um, steht sie aufrecht. */
  function ansicht(l){
    var vorne = l.sx * l.sy === 1;
    return { seite:vorne ? 'v' : 'r', dreh:vorne ? (l.sx === -1 ? 180 : 0) : (l.sx === 1 ? 180 : 0) };
  }
  /* Was oben sichtbar ist, in Lesereihenfolge (Reihe für Reihe von links nach rechts) */
  function sicht(Z){
    var l = [];
    for (var y = 0; y < Z.H; y++) for (var x = 0; x < Z.W; x++){
      var s = Z.st[y][x], t = s[s.length - 1], a = ansicht(t);
      l.push({ x:x, y:y, i:t.i, j:t.j, seite:a.seite, dreh:a.dreh, sx:t.sx, sy:t.sy });
    }
    return l;
  }
  /* Ort einer Seite auf dem gedruckten Blatt: Vorderseite wie das Raster, Rückseite seitenverkehrt (gewendet) */
  function ort(C, i, j, seite){ return seite === 'v' ? { px:i, py:j } : { px:C - 1 - i, py:j }; }

  /* ---------- Faltanleitung planen ----------
     Viele zufällige Faltfolgen ausprobieren und die beste nehmen: Am Schluss sind V Felder oben sichtbar (V passend zur
     Länge der Botschaft), bei «nur Vorderseite» lauter Vorderseiten, bei «beide» Vorder- und Rückseiten gemischt.
     Wichtig: Auf dem flachen Blatt soll man die Botschaft nicht einfach ablesen können – zwei aufeinanderfolgende Teile
     stehen nicht in Leserichtung nebeneinander (Strafpunkte), und die Teile liegen verstreut und verschieden gedreht. */
  var STUFEN = {
    einfach:{ schritte:[1, 2], C:[2, 4], R:[2, 4], lagen:4, wenden:false },
    mittel:{ schritte:[3, 3], C:[3, 5], R:[3, 5], lagen:6, wenden:false },
    schwer:{ schritte:[4, 5], C:[3, 6], R:[3, 6], lagen:8, wenden:true },
    profi:{ schritte:[6, 7], C:[4, 6], R:[4, 7], lagen:12, wenden:true }
  };
  var MAXTEIL = 3;   // höchstens so viele Zeichen in einem Feld
  function feldMm(C, R){ return Math.min(180 / C, 216 / R, 56); }
  function zufallsSchritt(Z, rnd, cfg, vorher, nr, anzahl){
    if (cfg.wenden && vorher && vorher.a !== 'w' && nr < anzahl - 1 && rnd() < 0.2) return { a:'w' };
    var achsen = [];
    if (Z.W >= 2) achsen.push('v');
    if (Z.H >= 2) achsen.push('h');
    if (!achsen.length) return null;
    var a = achsen[Math.floor(rnd() * achsen.length)], dim = a === 'v' ? Z.W : Z.H, m = ganz(rnd, 1, Math.floor(dim / 2)), s = rnd() < 0.5 ? 'plus' : 'minus';
    return { a:a, k:s === 'plus' ? dim - m : m, s:s, t:rnd() < 0.5 ? 'tal' : 'berg' };
  }
  function lesIndex(C, R, p, dreh){ return dreh === 0 ? p.py * C + p.px : (R - 1 - p.py) * C + (C - 1 - p.px); }
  function bewerten(C, R, ops, L, seiten, cfg, rnd){
    var Zs = falten(C, R, ops), Z = Zs[Zs.length - 1];
    for (var q = 1; q < Zs.length; q++) if (lagen(Zs[q]) > cfg.lagen) return null;
    var S = sicht(Z), V = S.length;
    if (V < 2 || V > L || Math.ceil(L / V) > MAXTEIL) return null;
    var nv = S.filter(function(s){ return s.seite === 'v'; }).length, nr = V - nv;
    if (seiten === 'vorne' && nr) return null;
    if (seiten === 'beide' && (!nv || !nr)) return null;
    var strafe = 0;
    for (var n = 0; n + 1 < V; n++){
      var a = S[n], b = S[n + 1];
      if (a.seite !== b.seite || a.dreh !== b.dreh) continue;
      var pa = ort(C, a.i, a.j, a.seite), pb = ort(C, b.i, b.j, b.seite), ia = lesIndex(C, R, pa, a.dreh), ib = lesIndex(C, R, pb, b.dreh);
      if (ib === ia + 1) strafe += 3;
      else if (pa.py === pb.py && ib > ia) strafe += 1;
    }
    var c = Math.ceil(L / V);
    strafe += c === 1 ? 0 : c === 2 ? 0.4 : 1.5;
    if (seiten === 'beide') strafe += Math.abs(nv - nr) / V;
    var mm = feldMm(C, R); if (mm < 30) strafe += (30 - mm) / 8;
    if (S.every(function(s){ return s.dreh === S[0].dreh; })) strafe += 0.6;   // alle gleich gedreht: zu leicht zu erkennen
    return { C:C, R:R, ops:ops, V:V, S:S, strafe:strafe + rnd() * 0.8 };
  }
  /* o: { L (Zeichen der Botschaft), seiten:'vorne'|'beide', stufe, seed } → bester Plan oder null */
  function planen(o){
    var cfg = STUFEN[o.stufe] || STUFEN.einfach, rnd = zufall(o.seed), best = null;
    for (var versuch = 0; versuch < 6000; versuch++){
      var C = ganz(rnd, cfg.C[0], cfg.C[1]), R = ganz(rnd, cfg.R[0], cfg.R[1]), anzahl = ganz(rnd, cfg.schritte[0], cfg.schritte[1]);
      var Z = start(C, R), ops = [], ok = true;
      for (var n = 0; n < anzahl; n++){
        var op = zufallsSchritt(Z, rnd, cfg, ops[n - 1], n, anzahl);
        if (!op){ ok = false; break; }
        ops.push(op); Z = schritt(Z, op);
      }
      if (!ok || ops[ops.length - 1].a === 'w') continue;
      var b = bewerten(C, R, ops, o.L, o.seiten, cfg, rnd);
      if (b && (!best || b.strafe < best.strafe)) best = b;
      if (best && best.strafe < 0.5 && versuch > 600) break;
    }
    return best;
  }
  /* Botschaft in V Teile (je 1–3 Zeichen), möglichst gleich lang */
  function teilen(zeichen, V){
    var l = [], L = zeichen.length, pos = 0;
    for (var n = 0; n < V; n++){ var bis = Math.round((n + 1) * L / V); l.push(zeichen.slice(pos, bis).join('')); pos = bis; }
    return l;
  }
  /* Alle Seiten beschriften: Teile der Botschaft dorthin, wo sie am Schluss oben liegen (so gedreht, dass sie dann aufrecht
     stehen), sonst Füllzeichen. → { v:[R][C], r:[R][C] } mit { text, dreh, teil (−1 = Füllzeichen) } */
  function belegen(plan, teile, o){
    var rnd = zufall((o.seed || 1) + 7), C = plan.C, R = plan.R, alle = o.zeichen, nurZiffern = alle.every(function(c){ return /[0-9]/.test(c); });
    var vorrat = nurZiffern ? '0123456789'.split('') : 'ABCDEFGHIKLMNOPRSTUVWZ'.split('').concat(alle.some(function(c){ return /[0-9]/.test(c); }) ? '0123456789'.split('') : []);
    var laengen = teile.map(function(t){ return t.length; });
    function fuell(){
      var n = laengen[Math.floor(rnd() * laengen.length)], t = '';
      for (var q = 0; q < n; q++) t += (o.ausBotschaft || rnd() < 0.35) ? alle[Math.floor(rnd() * alle.length)] : vorrat[Math.floor(rnd() * vorrat.length)];
      return { text:t, dreh:rnd() < 0.5 ? 0 : 180, teil:-1 };
    }
    var seiten = { v:[], r:[] };
    for (var j = 0; j < R; j++){ seiten.v.push([]); seiten.r.push([]); for (var i = 0; i < C; i++){ seiten.v[j].push(fuell()); seiten.r[j].push(o.seiten === 'beide' ? fuell() : null); } }
    plan.S.forEach(function(s, n){ seiten[s.seite][s.j][s.i] = { text:teile[n], dreh:s.dreh, teil:n }; });
    return seiten;
  }
  return { zufall:zufall, start:start, schritt:schritt, falten:falten, lagen:lagen, ansicht:ansicht, sicht:sicht, ort:ort, STUFEN:STUFEN, MAXTEIL:MAXTEIL, feldMm:feldMm, planen:planen, teilen:teilen, belegen:belegen };
})();
/* KERN-ENDE */

var MM = 703 / 186;   // Pixel je Millimeter (Blatt 703 Pixel = 186 mm im PDF)
var TINTE = '#1C2530', ROT = '#D32F2F', BLAU = '#0075BA', RUECKSEITE = '#E3F0FA', LEER = '#ECEEF1', MARKE = '#FFE9A8';
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
var BEISPIELE = { de:['SCHATZ', '4711', 'IM KELLER', 'GUT GEMACHT', 'ZAUBERWALD', '2580'], en:['TREASURE', '4711', 'IN THE ATTIC', 'WELL DONE', 'MAGIC FOREST', '2580'], fr:['TRÉSOR', '4711', 'À LA CAVE', 'BRAVO', 'FORÊT MAGIQUE', '2580'] };
var MAXZEICHEN = 24;
/* Zeichen der Botschaft: Buchstaben (auch Umlaute und Akzente) und Ziffern, gross; alles andere fällt weg */
function zeichenVon(text){
  return Array.from(String(text || '').toUpperCase().replace(/ß/g, 'SS')).filter(function(c){ return /[A-Z0-9ÄÖÜÀÂÇÉÈÊËÎÏÔÙÛŸ]/.test(c); });
}

/* ---------- Zeichnen ---------- */
// Text eines Feldes: Zeichen einzeln gesetzt (6 und 9 unterstrichen, damit man sie auch gedreht unterscheidet)
function feldText(text, cx, cy, groesse, dreh, farbe){
  var n = text.length, fs = groesse * (n <= 1 ? 0.56 : n === 2 ? 0.42 : 0.31), schritt = fs * 0.68, x0 = cx - n * schritt / 2, t = '';
  Array.from(text).forEach(function(c, k){
    var x = x0 + (k + 0.5) * schritt;
    t += '<text x="' + f1(x) + '" y="' + f1(cy) + '" text-anchor="middle" dominant-baseline="central">' + esc(c) + '</text>';
    if (c === '6' || c === '9') t += '<line x1="' + f1(x - fs * 0.24) + '" x2="' + f1(x + fs * 0.24) + '" y1="' + f1(cy + fs * 0.47) + '" y2="' + f1(cy + fs * 0.47) + '" stroke="' + (farbe || TINTE) + '" stroke-width="' + f1(Math.max(1, fs * 0.07)) + '" stroke-linecap="round"/>';
  });
  return '<g style="font-family:var(--blatt-buchstaben)" font-weight="700" font-size="' + f1(fs) + '" fill="' + (farbe || TINTE) + '"' + (dreh ? ' transform="rotate(180 ' + f1(cx) + ' ' + f1(cy) + ')"' : '') + '>' + t + '</g>';
}
function stern(x, y, r, farbe){
  var p = [];
  for (var q = 0; q < 10; q++){ var rr = q % 2 ? r * 0.45 : r, w = q * Math.PI / 5; p.push(f1(x + rr * Math.sin(w)) + ',' + f1(y - rr * Math.cos(w))); }
  return '<polygon points="' + p.join(' ') + '" fill="' + farbe + '"/>';
}
/* Faltblatt in Originalgrösse: eine Seite ('v' oder 'r'). Rückseite seitenverkehrt angeordnet (beim Wenden liegt sie richtig). */
function faltblattSvg(plan, beleg, seite, o){
  var C = plan.C, R = plan.R, s = Kern.feldMm(C, R) * MM, B = C * s, H = R * s, t = '', i, j;
  for (j = 0; j < R; j++) for (i = 0; i < C; i++){
    var f = beleg[seite][j][i], p = Kern.ort(C, i, j, seite), x = p.px * s, y = p.py * s;
    if (seite === 'r') t += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(s) + '" height="' + f1(s) + '" fill="' + RUECKSEITE + '"/>';
    if (o.marke && f && f.teil >= 0) t += '<rect x="' + f1(x + 1) + '" y="' + f1(y + 1) + '" width="' + f1(s - 2) + '" height="' + f1(s - 2) + '" fill="' + MARKE + '"/>';
    if (f) t += feldText(f.text, x + s / 2, y + s / 2, s, f.dreh);
    if (o.marke && f && f.teil >= 0) t += '<text x="' + f1(x + s - 4) + '" y="' + f1(y + 4) + '" text-anchor="end" dominant-baseline="hanging" font-size="' + f1(Math.max(9, s * 0.16)) + '" font-weight="700" fill="' + BLAU + '">' + (f.teil + 1) + '</text>';
  }
  if (o.stern && seite === 'v') t += stern(s * 0.13, s * 0.14, s * 0.075, BLAU);
  var g = '';
  for (i = 1; i < C; i++) g += 'M' + f1(i * s) + ' 0V' + f1(H);
  for (j = 1; j < R; j++) g += 'M0 ' + f1(j * s) + 'H' + f1(B);
  t += '<path d="' + g + '" fill="none" stroke="#8E99A6" stroke-width="' + (o.klein ? 0.8 : 1.1) + '" stroke-dasharray="' + (o.klein ? '3 2' : '6 4') + '"/>';
  t += '<rect x="0.8" y="0.8" width="' + f1(B - 1.6) + '" height="' + f1(H - 1.6) + '" fill="none" stroke="' + TINTE + '" stroke-width="1.6"/>';
  var f = o.massstab || 1;
  return '<svg class="ft-gitter" width="' + f1(B * f) + '" height="' + f1(H * f) + '" viewBox="0 0 ' + f1(B) + ' ' + f1(H) + '">' + t + '</svg>';
}
/* Ein Schritt der Faltanleitung als Bild: Päckchen von oben (weiss = Vorderseite, blau = Rückseite, grau = leere Rückseite),
   Faltlinie rot (Talfalte gestrichelt, Bergfalte Strich-Punkt), der gefaltete Teil gelb mit Pfeil.
   o: { beide, stern, nummern (Schluss: Lesereihenfolge), beleg (Lösung: Inhalt der Felder), plan } */
function schrittSvg(Z, op, d, o){
  var pad = 24, W = Z.W, H = Z.H, ox = pad, oy = pad, B = W * d + 2 * pad, Hh = H * d + 2 * pad, t = '', x, y;
  var S = Kern.sicht(Z);
  S.forEach(function(s, n){
    var cx = ox + s.x * d, cy = oy + s.y * d, f = o.beleg ? o.beleg[s.seite][s.j][s.i] : null;
    var fuell = f && f.teil >= 0 && o.markiert ? MARKE : s.seite === 'v' ? '#FFFFFF' : o.beide ? RUECKSEITE : LEER;
    t += '<rect x="' + f1(cx) + '" y="' + f1(cy) + '" width="' + f1(d) + '" height="' + f1(d) + '" fill="' + fuell + '" stroke="#7D8895" stroke-width="0.8"/>';
    if (f) t += feldText(f.text, cx + d / 2, cy + d / 2, d, (f.dreh + s.dreh) % 360 ? 180 : 0);
    if (o.nummern) t += '<text x="' + f1(cx + d / 2) + '" y="' + f1(cy + d / 2) + '" text-anchor="middle" dominant-baseline="central" font-size="' + f1(d * 0.42) + '" font-weight="700" fill="' + BLAU + '">' + (n + 1) + '</text>';
    if (o.stern && s.i === 0 && s.j === 0 && s.seite === 'v') t += stern(cx + (s.sx === 1 ? d * 0.17 : d * 0.83), cy + (s.sy === 1 ? d * 0.18 : d * 0.82), d * 0.1, BLAU);
  });
  t += '<rect x="' + f1(ox) + '" y="' + f1(oy) + '" width="' + f1(W * d) + '" height="' + f1(H * d) + '" fill="none" stroke="' + TINTE + '" stroke-width="1.4"/>';
  function pfeil(x1, y1, cxp, cyp, x2, y2, gestrichelt){
    var w = Math.atan2(y2 - cyp, x2 - cxp), a = 7;
    return '<path d="M' + f1(x1) + ' ' + f1(y1) + 'Q' + f1(cxp) + ' ' + f1(cyp) + ' ' + f1(x2) + ' ' + f1(y2) + '" fill="none" stroke="' + ROT + '" stroke-width="1.8"' + (gestrichelt ? ' stroke-dasharray="4 3"' : '') + '/>' +
      '<polygon points="' + f1(x2) + ',' + f1(y2) + ' ' + f1(x2 - a * Math.cos(w - 0.45)) + ',' + f1(y2 - a * Math.sin(w - 0.45)) + ' ' + f1(x2 - a * Math.cos(w + 0.45)) + ',' + f1(y2 - a * Math.sin(w + 0.45)) + '" fill="' + ROT + '"/>';
  }
  if (op && op.a === 'w'){
    // umdrehen: Bogen über dem Päckchen von rechts nach links
    t += pfeil(ox + W * d - 4, oy - 4, ox + W * d / 2, oy - pad * 1.6, ox + 4, oy - 4, false) + pfeil(ox + 4, oy + H * d + 4, ox + W * d / 2, oy + H * d + pad * 1.6, ox + W * d - 4, oy + H * d + 4, true);
  } else if (op){
    var senk = op.a === 'v', dim = senk ? W : H, m = op.s === 'plus' ? dim - op.k : op.k, a0 = op.s === 'plus' ? op.k : 0;
    // gefalteter Teil gelb
    if (senk) t += '<rect x="' + f1(ox + a0 * d) + '" y="' + f1(oy) + '" width="' + f1(m * d) + '" height="' + f1(H * d) + '" fill="rgba(255,193,7,.3)"/>';
    else t += '<rect x="' + f1(ox) + '" y="' + f1(oy + a0 * d) + '" width="' + f1(W * d) + '" height="' + f1(m * d) + '" fill="rgba(255,193,7,.3)"/>';
    var linie = op.t === 'tal' ? '7 4' : '9 3 2 3';
    if (senk){ x = ox + op.k * d; t += '<line x1="' + f1(x) + '" x2="' + f1(x) + '" y1="' + f1(oy - 10) + '" y2="' + f1(oy + H * d + 10) + '" stroke="' + ROT + '" stroke-width="2.2" stroke-dasharray="' + linie + '"/>'; }
    else { y = oy + op.k * d; t += '<line y1="' + f1(y) + '" y2="' + f1(y) + '" x1="' + f1(ox - 10) + '" x2="' + f1(ox + W * d + 10) + '" stroke="' + ROT + '" stroke-width="2.2" stroke-dasharray="' + linie + '"/>'; }
    // Pfeil am Rand: Talfalte oben bzw. rechts (durchgezogen), Bergfalte unten bzw. links (gestrichelt, «nach hinten»)
    var mitte = (a0 + m / 2) * d, ziel = 2 * op.k * d - mitte, bogen = Math.min(pad * 0.95, Math.abs(ziel - mitte) * 0.45 + 8), vorne = op.t === 'tal';
    if (senk){ var yr = vorne ? oy + 3 : oy + H * d - 3; t += pfeil(ox + mitte, yr, ox + op.k * d, vorne ? oy - bogen * 1.6 : oy + H * d + bogen * 1.6, ox + ziel, yr, !vorne); }
    else { var xr = vorne ? ox + W * d - 3 : ox + 3; t += pfeil(xr, oy + mitte, vorne ? ox + W * d + bogen * 1.6 : ox - bogen * 1.6, oy + op.k * d, xr, oy + ziel, !vorne); }
  }
  return '<svg class="ft-schritt-bild" width="' + f1(B) + '" height="' + f1(Hh) + '" viewBox="0 0 ' + f1(B) + ' ' + f1(Hh) + '">' + t + '</svg>';
}
/* Text eines Schritts */
function schrittText(Z, op){
  if (op.a === 'w') return tx('Drehe das Päckchen um – wie eine Buchseite.');
  var senk = op.a === 'v', dim = senk ? Z.W : Z.H, m = op.s === 'plus' ? dim - op.k : op.k, plus = op.s === 'plus', teil;
  if (2 * m === dim) teil = senk ? (plus ? tx('die rechte Hälfte') : tx('die linke Hälfte')) : (plus ? tx('die untere Hälfte') : tx('die obere Hälfte'));
  else if (m === 1) teil = senk ? (plus ? tx('die rechte Spalte') : tx('die linke Spalte')) : (plus ? tx('die unterste Reihe') : tx('die oberste Reihe'));
  else teil = senk ? (plus ? tx('die rechten {n} Spalten', { n:m }) : tx('die linken {n} Spalten', { n:m })) : (plus ? tx('die untersten {n} Reihen', { n:m }) : tx('die obersten {n} Reihen', { n:m }));
  return tx('Falte {teil} {richtung}.', { teil:teil, richtung:op.t === 'tal' ? tx('nach vorne') : tx('nach hinten') });
}
function legendeHtml(beide){
  function kasten(farbe){ return '<svg width="18" height="18" viewBox="0 0 18 18"><rect x="1" y="1" width="16" height="16" fill="' + farbe + '" stroke="#7D8895"/></svg>'; }
  function linie(muster){ return '<svg width="34" height="10" viewBox="0 0 34 10"><line x1="1" x2="33" y1="5" y2="5" stroke="' + ROT + '" stroke-width="2.2" stroke-dasharray="' + muster + '"/></svg>'; }
  return '<div class="ft-legende">' +
    '<span>' + linie('7 4') + tx('<b>Talfalte:</b> nach vorne falten (der Teil liegt danach oben)') + '</span>' +
    '<span>' + linie('9 3 2 3') + tx('<b>Bergfalte:</b> nach hinten falten (der Teil liegt danach unten)') + '</span>' +
    '<span>' + kasten('#fff') + tx('Vorderseite') + '</span>' +
    '<span>' + kasten(beide ? RUECKSEITE : LEER) + (beide ? tx('Rückseite') : tx('Rückseite (leer)')) + '</span></div>';
}

var VORLAGE = '<div class="ft">' +
  tx('<header class="ft-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Falträtsel</h1>') +
    tx('<p>Die Botschaft ist auf dem Blatt verteilt – auf der Vorderseite, auf Wunsch auch auf der Rückseite, teils auf dem Kopf. Erst wer das Blatt nach der Anleitung faltet, kann sie lesen.</p></header>') +
  tx('<div class="ft-layout"><section class="ft-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Botschaft</h2><p>Ein Wort, eine Zahl oder ein kurzer Satz.</p></div></div>') +
      tx('<label class="feld-label" for="ftText">Botschaft</label>') +
      '<div class="ft-zeile"><input type="text" id="ftText" maxlength="40" autocomplete="off" spellcheck="false">' +
        tx('<button type="button" class="btn klein" id="ftBeispiel" title="Ein Beispiel einsetzen">Beispiel</button></div>') +
      tx('<p class="hinweis">2 bis 24 Buchstaben oder Ziffern. Leerzeichen und Satzzeichen fallen weg.</p>') +
      '<div id="ftInfo" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte" id="ftSeitenKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Seiten</h2><p>Wo die Zeichen auf dem Blatt stehen.</p></div></div>') +
      tx('<div class="ft-wahl" role="radiogroup" aria-label="Seiten">') +
        tx('<label><input type="radio" name="ftSeiten" value="vorne"><span><b>Nur Vorderseite</b><small>einseitig drucken</small></span></label>') +
        tx('<label><input type="radio" name="ftSeiten" value="beide"><span><b>Vorder- und Rückseite</b><small>beidseitig drucken, an der langen Kante wenden</small></span></label></div>') +
    '</div>' +
    tx('<div class="karte" id="ftStufeKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Faltanleitung</h2><p>Wie schwierig das Falten ist.</p></div></div>') +
      tx('<div class="ft-wahl" role="radiogroup" aria-label="Schwierigkeit">') +
        tx('<label><input type="radio" name="ftStufe" value="einfach"><span><b>Einfach</b><small>1–2 Faltungen</small></span></label>') +
        tx('<label><input type="radio" name="ftStufe" value="mittel"><span><b>Mittel</b><small>3 Faltungen, vorne und hinten</small></span></label>') +
        tx('<label><input type="radio" name="ftStufe" value="schwer"><span><b>Schwer</b><small>4–5 Faltungen, auch umdrehen</small></span></label>') +
        tx('<label><input type="radio" name="ftStufe" value="profi"><span><b>Profi</b><small>6–7 Faltungen</small></span></label></div>') +
    '</div>' +
    tx('<div class="karte" id="ftEinstKarte" hidden><details class="optionen"><summary>Einstellungen</summary>') +
      tx('<label class="opt"><input type="checkbox" id="ftAusBotschaft"><span>Füllzeichen vor allem aus der Botschaft (schwieriger zu erraten)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="ftStern"><span>Stern ★ oben links als Startmarke</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="ftNummern"><span>Lesereihenfolge am Schluss der Anleitung zeigen</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="ftKaestchen"><span>Kästchen für die Botschaft auf der Anleitung</span></label>') +
    '</details></div>' +
  '</section>' +
  tx('<section class="ft-ausgabe" aria-label="Ergebnis">') +
    '<div id="ftMeldung" aria-live="polite"></div>' +
    '<div class="ft-werkzeug" id="ftWerkzeug" hidden>' +
      tx('<button type="button" class="btn klein" id="ftNeu" title="Eine andere Faltung mit derselben Botschaft">Andere Faltung</button>') +
      tx('<button type="button" class="btn klein" id="ftZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="ftMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="ftPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="ftHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<p class="ft-druckhinweis nur-bildschirm" id="ftDruck" hidden></p>' +
    '<div class="ft-rahmen" hidden><p class="ft-seitenname nur-bildschirm" id="ftNameVorne"></p><article class="ft-blatt ft-faltblatt" id="ftVorne"></article></div>' +
    '<div class="ft-rahmen" hidden><p class="ft-seitenname nur-bildschirm" id="ftNameHinten"></p><article class="ft-blatt ft-faltblatt" id="ftHinten"></article></div>' +
    '<div class="ft-rahmen" hidden><p class="ft-seitenname nur-bildschirm" id="ftNameAnleitung"></p><article class="ft-blatt" id="ftAnleitung"></article></div>' +
    '<article class="ft-blatt ft-leer" id="ftLeer" hidden></article>' +
    '<div class="ft-rahmen"><article class="ft-blatt ft-loesungsblatt" id="ftLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 5h9v14H3z"/><path d="M12 5l9 3v14l-9-3z" fill="currentColor" fill-opacity=".18"/><path d="M12 5v14" stroke-dasharray="2 2"/></svg>';

Labor.registriere({
  id:'faltraetsel',
  titel:'Falträtsel',
  kurz:'Blatt richtig falten – erst dann erscheint die Botschaft',
  beschreibung:'Die Botschaft wird auf Vorder- und Rückseite eines Blatts verteilt, teils auf dem Kopf, zwischen lauter Füllzeichen. Eine Faltanleitung mit Bildern zeigt Schritt für Schritt, wie man faltet – von einfach bis Profi. Erst dann liegen die richtigen Felder oben. Mit Lösungsblatt.',
  merkmale:['Eigene Botschaft', 'Vier Schwierigkeitsstufen', 'Mit Faltanleitung und Lösung'],
  symbol:SYMBOL,
  css:'raetsel/faltraetsel/faltraetsel.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'faltraetsel-eingaben', OPT = 'faltraetsel-einstellungen';
  var STANDARD = { seiten:'', stufe:'', ausBotschaft:false, stern:true, nummern:true, kaestchen:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { text:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) }, zeigeLoesung = false;
  try { var o0 = JSON.parse(localStorage.getItem(OPT)); if (o0) Object.assign(st.opt, o0); } catch(x){}
  try { var e0 = JSON.parse(sessionStorage.getItem(TAB)); if (e0){ st.text = String(e0.text || ''); st.seed = +e0.seed || st.seed; } } catch(x){}
  if (['vorne', 'beide'].indexOf(st.opt.seiten) < 0) st.opt.seiten = '';
  if (!Kern.STUFEN[st.opt.stufe]) st.opt.stufe = '';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#ftMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  $('#ftText').value = st.text;
  $('#ftText').addEventListener('input', function(){ st.text = this.value; speichern(); baldZeichnen(); });
  var bsp = BEISPIELE[Labor.sprache] || BEISPIELE.de, bspNr = Math.floor(Math.random() * bsp.length);
  $('#ftBeispiel').addEventListener('click', function(){
    bspNr = (bspNr + 1) % bsp.length; if (bsp[bspNr] === st.text) bspNr = (bspNr + 1) % bsp.length;
    st.text = bsp[bspNr]; $('#ftText').value = st.text; speichern(); zeichnen(); $('#ftText').focus();
  });
  function radios(name, k){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === st.opt[k];
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = r.value; speichern(); zeichnen(); });
    });
  }
  radios('ftSeiten', 'seiten'); radios('ftStufe', 'stufe');
  [['#ftAusBotschaft', 'ausBotschaft'], ['#ftStern', 'stern'], ['#ftNummern', 'nummern'], ['#ftKaestchen', 'kaestchen'], ['#ftMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#ftNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#ftZeigeLoesung').addEventListener('click', function(){ zeigeLoesung = !zeigeLoesung; loesungZeigen(); if (zeigeLoesung) $('#ftLoesung').scrollIntoView({ behavior:'smooth', block:'start' }); });
  function loesungZeigen(){
    $('#ftZeigeLoesung').setAttribute('aria-pressed', zeigeLoesung ? 'true' : 'false');
    $('#ftZeigeLoesung').textContent = zeigeLoesung ? tx('Lösung verbergen') : tx('Lösung zeigen');
    $('#ftLoesung').classList.toggle('offen', zeigeLoesung);
  }

  /* ---------- Blätter ---------- */
  var P = null, BL = null, Z = [], teile = [], zust = [];
  function rahmen(id){ return $(id).parentNode; }
  function alleZu(){ ['#ftVorne', '#ftHinten', '#ftAnleitung'].forEach(function(id){ rahmen(id).hidden = true; }); $('#ftWerkzeug').hidden = true; $('#ftDruck').hidden = true; $('#ftLoesung').innerHTML = ''; }
  function zeichnen(){
    if (aus) return;
    Z = zeichenVon(st.text);
    var info = '', zuViele = Z.length > MAXZEICHEN;
    if (zuViele) Z = Z.slice(0, MAXZEICHEN);
    if (Z.length) info = tx('<p class="ft-info ok">Botschaft: <b>{b}</b> · {n} Zeichen</p>', { b:esc(Z.join('')), n:Z.length });
    if (zuViele) info += tx('<p class="ft-info warnung">Höchstens 24 Zeichen – es werden die ersten 24 verwendet.</p>');
    if (Z.length === 1) info += tx('<p class="ft-info warnung">Mindestens 2 Zeichen.</p>');
    $('#ftInfo').innerHTML = info;
    var bereit = Z.length >= 2;
    $('#ftSeitenKarte').hidden = !bereit;
    $('#ftStufeKarte').hidden = !bereit || !st.opt.seiten;
    $('#ftEinstKarte').hidden = !bereit || !st.opt.seiten || !st.opt.stufe;
    if (!bereit){ alleZu(); P = null; meldung('info', tx('<p>Gib links die Botschaft ein – zum Beispiel ein Lösungswort oder einen Zahlencode.</p>')); return; }
    if (!st.opt.seiten){ alleZu(); P = null; meldung('info', tx('<p>Wähle, ob die Zeichen nur auf der Vorderseite oder auf beiden Seiten stehen.</p>')); return; }
    if (!st.opt.stufe){ alleZu(); P = null; meldung('info', tx('<p>Wähle, wie schwierig die Faltanleitung sein soll.</p>')); return; }
    var beide = st.opt.seiten === 'beide';
    P = Kern.planen({ L:Z.length, seiten:st.opt.seiten, stufe:st.opt.stufe, seed:st.seed });
    if (!P){ alleZu(); meldung('warnung', tx('<p>Für diese Botschaft finde ich keine passende Faltung. Versuche «Andere Faltung», eine andere Schwierigkeit oder eine kürzere Botschaft.</p>')); return; }
    teile = Kern.teilen(Z, P.V);
    BL = Kern.belegen(P, teile, { zeichen:Z, seiten:st.opt.seiten, ausBotschaft:st.opt.ausBotschaft, seed:st.seed });
    zust = Kern.falten(P.C, P.R, P.ops);
    meldung(P.strafe > 3 ? 'warnung' : '', P.strafe > 3 ? tx('<p>Bei dieser Länge und Schwierigkeit stehen einige Teile der Botschaft auch auf dem flachen Blatt nebeneinander. Mit einer schwierigeren Faltung oder «Andere Faltung» wird es besser.</p>') : '');
    $('#ftWerkzeug').hidden = false;
    var o = st.opt, mm = Math.round(Kern.feldMm(P.C, P.R));
    $('#ftDruck').hidden = false;
    $('#ftDruck').innerHTML = (beide ? tx('<b>Drucken:</b> Seite 1 und 2 beidseitig in Originalgrösse (100 %), an der langen Kante wenden – dann liegen Vorder- und Rückseite genau übereinander.') : tx('<b>Drucken:</b> in Originalgrösse (100 %).')) +
      ' ' + tx('Faltblatt: {c} × {r} Felder zu {mm} mm.', { c:P.C, r:P.R, mm:mm });
    // Seite 1: Vorderseite – Raster oben (auf beiden Seiten gleich weit oben, damit sie beim Wenden übereinanderliegen), Text darunter
    $('#ftNameVorne').textContent = beide ? tx('Seite 1 · Faltblatt, Vorderseite') : tx('Seite 1 · Faltblatt');
    $('#ftVorne').innerHTML = faltblattSvg(P, BL, 'v', { stern:o.stern }) +
      (o.titelAn ? tx('<h2>Falträtsel</h2>') : '') +
      (o.anleitungAn ? '<p class="ft-anleitung">' + tx('Schneide das Faltblatt entlang der dicken Linie aus. Falte es genau nach der Faltanleitung – dann erscheint die Botschaft.') + '</p>' : '');
    rahmen('#ftVorne').hidden = false;
    rahmen('#ftHinten').hidden = !beide;
    $('#ftNameHinten').textContent = tx('Seite 2 · Faltblatt, Rückseite');
    $('#ftHinten').innerHTML = beide ? faltblattSvg(P, BL, 'r', {}) + tx('<p class="ft-notiz">Rückseite des Faltblatts</p>') : '';
    $('#ftNameAnleitung').textContent = tx('Seite {n} · Faltanleitung', { n:beide ? 3 : 2 });
    $('#ftAnleitung').innerHTML = anleitungHtml(beide);
    rahmen('#ftAnleitung').hidden = false;
    $('#ftLeer').innerHTML = tx('<p class="ft-notiz">Diese Seite bleibt leer (Rückseite der Faltanleitung).</p>');
    $('#ftLeer').classList.toggle('aktiv', beide);
    $('#ftLoesung').innerHTML = loesungHtml(beide);
    loesungZeigen();
  }
  /* Grösse der Anleitungsbilder: alle Schritte gleich, das grösste Päckchen passt in ein Feld von etwa 150 × 130 Pixeln */
  function bildFeld(){
    var g = 0;
    zust.forEach(function(Zs){ g = Math.max(g, Zs.W, Zs.H * 1.15); });
    return Math.max(12, Math.min(36, 160 / g));
  }
  function anleitungHtml(beide){
    var o = st.opt, d = bildFeld(), h = '';
    if (o.titelAn) h += tx('<h2>Faltanleitung</h2>');
    if (o.anleitungAn) h += '<p class="ft-anleitung">' + (o.stern ? tx('Lege das Faltblatt mit der Vorderseite nach oben vor dich, der Stern ★ oben links. ') : tx('Lege das Faltblatt mit der Vorderseite nach oben vor dich. ')) +
      tx('Falte Schritt für Schritt immer durch alle Lagen und streiche jede Falte gut glatt. Die gelbe Fläche wird gefaltet.') + '</p>';
    h += legendeHtml(beide) + '<ol class="ft-schritte">';
    P.ops.forEach(function(op, n){
      h += '<li><div class="ft-schritt-kopf"><span class="ft-nr">' + (n + 1) + '</span><span>' + esc(schrittText(zust[n], op)) + '</span></div>' + schrittSvg(zust[n], op, d, { beide:beide, stern:o.stern }) + '</li>';
    });
    var ende = zust[zust.length - 1];
    h += '<li class="ft-schluss"><div class="ft-schritt-kopf"><span class="ft-nr">✓</span><span>' + (o.nummern ? tx('Fertig! Lies die Felder in dieser Reihenfolge.') : tx('Fertig! Lies die Felder Reihe für Reihe von links nach rechts.')) + '</span></div>' +
      schrittSvg(ende, null, d, { beide:beide, stern:o.stern, nummern:o.nummern }) + '</li></ol>';
    if (o.kaestchen){
      var k = '', pos = 0;
      teile.forEach(function(t, n){ k += '<span class="ft-gruppe">' + Array.from(t).map(function(){ return '<span class="ft-kaestchen"></span>'; }).join('') + '</span>'; pos += t.length; });
      h += '<div class="ft-antwort"><span>' + tx('Botschaft:') + '</span><span class="ft-kaestchen-reihe">' + k + '</span></div>';
    }
    return h;
  }
  function loesungHtml(beide){
    var o = st.opt, d = Math.max(12, Math.min(22, bildFeld() * 0.75)), h = '';
    h += o.titelAn ? tx('<h2>Falträtsel – Lösung</h2>') : tx('<p class="ft-anleitung"><b>Lösung</b></p>');
    h += '<p class="ft-loesungswort">' + tx('Botschaft:') + ' <b>' + esc(Z.join('')) + '</b> <span class="ft-teile">(' + teile.map(esc).join(' · ') + ')</span></p>';
    // Faltblatt verkleinert, die Felder der Botschaft gelb mit Nummer
    var platz = beide ? 300 : 420, s = Kern.feldMm(P.C, P.R) * MM, f = Math.min(1, platz / (P.C * s), 300 / (P.R * s));
    h += '<div class="ft-loesung-blaetter"><figure>' + faltblattSvg(P, BL, 'v', { stern:o.stern, marke:true, massstab:f, klein:true }) + '<figcaption>' + tx('Vorderseite') + '</figcaption></figure>' +
      (beide ? '<figure>' + faltblattSvg(P, BL, 'r', { marke:true, massstab:f, klein:true }) + '<figcaption>' + tx('Rückseite (so, wie sie gedruckt ist)') + '</figcaption></figure>' : '') + '</div>';
    h += tx('<p class="ft-anleitung">So sieht das Päckchen nach jedem Schritt von oben aus:</p>') + '<ol class="ft-schritte klein">';
    P.ops.forEach(function(op, n){ h += '<li><div class="ft-schritt-kopf"><span class="ft-nr">' + (n + 1) + '</span></div>' + schrittSvg(zust[n + 1], null, d, { beide:beide, stern:o.stern, beleg:BL, markiert:n + 1 === P.ops.length }) + '</li>'; });
    return h + '</ol>';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){
    var beide = st.opt.seiten === 'beide', l = [$('#ftVorne'), beide && $('#ftHinten'), $('#ftAnleitung')];
    if (st.opt.mitLoesung){ if (beide) l.push($('#ftLeer')); l.push($('#ftLoesung')); }
    return l;
  }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#ftPdf'), function(){ return P && { blaetter:blaetter(), name:Labor.pdfName('Faltraetsel', Z.join('')) }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#ftPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#ftHerunterladen').hidden = false; });
  }
  $('#ftHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P) return;
    var name = Labor.pdfName('Faltraetsel', Z.join('')).replace(/\.pdf$/, '.html');
    var inhalt = blaetter().filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Falträtsel'), inhalt, '.ft-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
