/* Rätsellabor – Puzzle-Spiel (gemeinsam für den Generator «Puzzle» und die Puzzle-Seite P/<ID>/, die der QR-Code öffnet)

   PuzzleSpiel.SZENEN                       fertige Bilder: bunte Szenen aus Emojis (keine fremden Bildrechte)
   PuzzleSpiel.szene(kuerzel, breite, hoehe) → Canvas mit der Szene
   PuzzleSpiel.starte(behaelter, o)          o: { bild (Bild oder Canvas), teile, vorlage, status(info), fertig(sekunden) }
                                             → { neu(), vorlage(an), stopp(), raster(), lage() }
   PuzzleSpiel.raster(n, breite, hoehe)      → { spalten, zeilen }: möglichst genau n Teile mit fast quadratischen Zellen

   Die Teile haben klassische Puzzle-Nasen (Bézier-Kurven). Man zieht sie mit Maus oder Finger aufs Brett; liegt ein
   Teil nahe genug an seinem Platz, rastet es ein. Alles wird in ein Canvas gezeichnet (auch 150 Teile bleiben flüssig). */
(function(){
'use strict';

function zufall(seed){
  var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
  function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
  for (var i = 0; i < 8; i++) n();
  return n;
}
function streuwert(t){ var h = 2166136261; for (var i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
var EMOJI = '"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';

/* ---------- Fertige Bilder ----------
   art: land (Himmel, Hügel, Boden) · wasser · nacht · strand · flach (Tischdecke voller Dinge)
   oben/unten/alle: Emojis für Himmel, Boden oder überall; gross: grosse Dinge am Horizont */
var SZENEN = [
  { k:'bauernhof', name:'Bauernhof', art:'land', himmel:['#74c3ef', '#d6f0ff'], boden:['#8fd572', '#4f9b43'], horizont:0.5, sonne:'#ffd54a', wolken:3,
    gross:['🏡', '🌳', '🌳'], unten:['🐄', '🐖', '🐑', '🐓', '🐴', '🚜', '🌻', '🐐', '🦆', '🐇', '🌷', '🐈', '🐕'], oben:['🐦', '🦋'] },
  { k:'meer', name:'Unter Wasser', art:'wasser', wasser:['#4fc3f7', '#014f8a'], sand:'#f1d39a',
    alle:['🐠', '🐟', '🐡', '🐙', '🐢', '🐬', '🦑', '🐳', '🦈', '🦐'], unten:['🦀', '🐚', '🦞', '🐌'] },
  { k:'weltall', name:'Weltall', art:'nacht', himmel:['#0a0f30', '#311b63'],
    alle:['🚀', '🪐', '🌙', '👽', '🛸', '🌍', '☄️', '🛰️', '⭐', '🌟', '🌞', '🔭'] },
  { k:'dschungel', name:'Dschungel', art:'land', himmel:['#a5e8a0', '#effce0'], boden:['#4fae55', '#1f6a2b'], horizont:0.42,
    gross:['🌴', '🌴', '🌳'], unten:['🐒', '🐍', '🐯', '🦎', '🐸', '🌿', '🍌', '🐘', '🦍', '🐊', '🍄'], oben:['🦜', '🦋', '🦜'] },
  { k:'winter', name:'Winter', art:'land', himmel:['#a3d4ef', '#f0f9ff'], boden:['#ffffff', '#d6e4f0'], horizont:0.52, schnee:true, wolken:2,
    gross:['🏔️', '🎄', '🎄'], unten:['⛄', '🦌', '🐧', '🛷', '⛸️', '🎿', '🧤', '🏠', '🦊', '🐿️'], oben:['❄️', '🌨️'] },
  { k:'stadt', name:'Stadt', art:'land', himmel:['#86cdf8', '#e3f5ff'], boden:['#a7a7a7', '#6b6b6b'], horizont:0.56, strasse:true, wolken:2,
    gross:['🏢', '🏫', '🏠', '🏥', '🏪', '🏦'], unten:['🚗', '🚌', '🚲', '🚒', '🚓', '🚕', '🛴', '🚦', '🚑', '🚚'], oben:['🎈', '✈️', '🐦'] },
  { k:'savanne', name:'Savanne', art:'land', himmel:['#ffcf7f', '#fff4e1'], boden:['#e6b75e', '#b9822b'], horizont:0.52, sonne:'#ff9a3c',
    gross:['🌳', '⛰️'], unten:['🦁', '🦒', '🐘', '🦓', '🦏', '🐆', '🦛', '🐃', '🐪', '🦩'], oben:['🦅'] },
  { k:'strand', name:'Strand', art:'strand', himmel:['#7fd2fa', '#e3f6ff'], meer:['#22b0ef', '#0274b5'], sand:['#ffe39a', '#f8c64c'], horizont:0.36, sonne:'#ffd54a', wolken:2,
    imMeer:['⛵', '🐬', '🚤', '🐳'], unten:['⛱️', '🦀', '🐚', '🏐', '🍦', '🏰', '🩱', '🕶️', '🍉', '🪣'], oben:['🐦', '☁️'] },
  { k:'markt', name:'Obst und Gemüse', art:'flach', grund:['#fff6dc', '#ffdca0'],
    alle:['🍎', '🍌', '🍇', '🍓', '🍐', '🍉', '🍋', '🍍', '🥕', '🥦', '🌽', '🍅', '🥒', '🍆', '🥝', '🍒', '🍑', '🥔'] },
  { k:'suesses', name:'Süssigkeiten', art:'flach', grund:['#fde6ef', '#f7b6cf'],
    alle:['🍭', '🍬', '🍫', '🍩', '🍪', '🧁', '🍰', '🍦', '🎂', '🍮', '🍯', '🍡', '🥨', '🍿'] }
];
function farbverlauf(g, x0, y0, x1, y1, a, b){ var v = g.createLinearGradient(x0, y0, x1, y1); v.addColorStop(0, a); v.addColorStop(1, b); return v; }
function mische(a, b, t){   // zwei Farben (#rrggbb) mischen
  var x = parseInt(a.slice(1), 16), y = parseInt(b.slice(1), 16), r = function(s){ return Math.round(((x >> s) & 255) * (1 - t) + ((y >> s) & 255) * t); };
  return 'rgb(' + r(16) + ',' + r(8) + ',' + r(0) + ')';
}
function szene(k, B, H){
  var s = SZENEN.filter(function(x){ return x.k === k; })[0] || SZENEN[0];
  var cv = document.createElement('canvas'); cv.width = B; cv.height = H;
  var g = cv.getContext('2d'), rnd = zufall(streuwert(s.k)), u = Math.min(B / 1200, H / 900), hor = H * (s.horizont || 0.5);
  function wolke(x, y, f){ g.fillStyle = 'rgba(255,255,255,.92)'; [[0, 0, 1], [-0.9, 0.25, 0.75], [0.9, 0.25, 0.8], [0.35, -0.35, 0.8], [-0.4, -0.25, 0.7]].forEach(function(c){ g.beginPath(); g.arc(x + c[0] * 46 * f, y + c[1] * 46 * f, 44 * c[2] * f, 0, 7); g.fill(); }); }
  function huegel(y0, amp, farbe, phase, wellen){
    g.fillStyle = farbe; g.beginPath(); g.moveTo(0, H);
    for (var x = 0; x <= B; x += 8) g.lineTo(x, y0 + Math.sin(x / B * Math.PI * wellen + phase) * amp + Math.sin(x / B * Math.PI * wellen * 2.3 + phase * 2) * amp * 0.35);
    g.lineTo(B, H); g.closePath(); g.fill();
  }
  // Hintergrund
  if (s.art === 'land' || s.art === 'strand'){
    g.fillStyle = farbverlauf(g, 0, 0, 0, hor, s.himmel[0], s.himmel[1]); g.fillRect(0, 0, B, hor + 4);
    if (s.sonne){ var sx = B * (0.12 + rnd() * 0.15), sy = hor * 0.3, sr = 70 * u, glanz = g.createRadialGradient(sx, sy, sr * 0.6, sx, sy, sr * 2.4);
      glanz.addColorStop(0, s.sonne); glanz.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = glanz; g.fillRect(0, 0, B, hor);
      g.fillStyle = s.sonne; g.beginPath(); g.arc(sx, sy, sr, 0, 7); g.fill(); }
    for (var w = 0; w < (s.wolken || 0); w++) wolke(B * (0.35 + w * 0.22 + rnd() * 0.1), hor * (0.18 + rnd() * 0.25), u * (0.8 + rnd() * 0.5));
    if (s.art === 'strand'){
      g.fillStyle = farbverlauf(g, 0, hor, 0, hor + H * 0.2, s.meer[0], s.meer[1]); g.fillRect(0, hor, B, H * 0.2 + 2);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3 * u;
      for (var wl = 0; wl < 7; wl++){ var wy = hor + H * 0.03 + wl * H * 0.025; g.beginPath(); for (var wx = 0; wx <= B; wx += 10) g.lineTo(wx, wy + Math.sin(wx / 40 + wl) * 3 * u); g.stroke(); }
      huegel(hor + H * 0.2, 12 * u, farbverlauf(g, 0, hor + H * 0.2, 0, H, s.sand[0], s.sand[1]), 1, 2);
    } else {
      huegel(hor - 30 * u, 26 * u, mische(s.boden[0], s.himmel[1], 0.35), rnd() * 6, 3);
      huegel(hor, 18 * u, farbverlauf(g, 0, hor, 0, H, s.boden[0], s.boden[1]), rnd() * 6, 2);
      if (s.strasse){ var sy0 = H * 0.78; g.fillStyle = '#4a4a4a'; g.fillRect(0, sy0, B, H * 0.12); g.fillStyle = '#fff'; for (var sx2 = 20 * u; sx2 < B; sx2 += 90 * u) g.fillRect(sx2, sy0 + H * 0.058, 46 * u, 6 * u); }
      if (s.schnee){ g.fillStyle = 'rgba(255,255,255,.9)'; for (var f = 0; f < 140; f++){ g.beginPath(); g.arc(rnd() * B, rnd() * hor, (1.5 + rnd() * 3) * u, 0, 7); g.fill(); } }
    }
  } else if (s.art === 'wasser'){
    g.fillStyle = farbverlauf(g, 0, 0, 0, H, s.wasser[0], s.wasser[1]); g.fillRect(0, 0, B, H);
    g.fillStyle = 'rgba(255,255,255,.08)';
    for (var l = 0; l < 6; l++){ var lx = rnd() * B; g.beginPath(); g.moveTo(lx, 0); g.lineTo(lx + 80 * u, 0); g.lineTo(lx + 260 * u, H); g.lineTo(lx + 120 * u, H); g.closePath(); g.fill(); }
    huegel(H * 0.86, 14 * u, s.sand, rnd() * 6, 3);
    g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2 * u;
    for (var bl = 0; bl < 40; bl++){ g.beginPath(); g.arc(rnd() * B, rnd() * H * 0.85, (3 + rnd() * 9) * u, 0, 7); g.stroke(); }
  } else if (s.art === 'nacht'){
    g.fillStyle = farbverlauf(g, 0, 0, B, H, s.himmel[0], s.himmel[1]); g.fillRect(0, 0, B, H);
    for (var st = 0; st < 220; st++){ g.fillStyle = 'rgba(255,255,255,' + (0.3 + rnd() * 0.7) + ')'; g.beginPath(); g.arc(rnd() * B, rnd() * H, (0.6 + rnd() * 1.8) * u, 0, 7); g.fill(); }
  } else {
    var rg = g.createRadialGradient(B / 2, H / 2, 0, B / 2, H / 2, Math.max(B, H) * 0.7); rg.addColorStop(0, s.grund[0]); rg.addColorStop(1, s.grund[1]); g.fillStyle = rg; g.fillRect(0, 0, B, H);
    g.fillStyle = 'rgba(255,255,255,.35)';
    for (var py = 0; py < H; py += 60 * u) for (var px = (py / (60 * u)) % 2 ? 30 * u : 0; px < B; px += 60 * u){ g.beginPath(); g.arc(px, py, 6 * u, 0, 7); g.fill(); }
  }
  // Emojis verteilen: jedes mindestens einmal, wenig Überlappung, hinten (oben) zuerst gezeichnet
  var dinge = [];
  function bereich(zone, gr){
    if (zone === 'gross') return [gr * 0.5, B - gr * 0.5, hor - gr * 0.42, hor - gr * 0.3];
    if (zone === 'oben') return [gr * 0.6, B - gr * 0.6, gr * 0.7, hor - gr * 0.9];
    if (zone === 'imMeer') return [gr * 0.6, B - gr * 0.6, hor + gr * 0.2, hor + H * 0.17 - gr * 0.3];
    if (zone === 'unten') return s.art === 'wasser' ? [gr * 0.6, B - gr * 0.6, H * 0.86, H - gr * 0.55] : [gr * 0.55, B - gr * 0.55, (s.art === 'strand' ? hor + H * 0.24 : hor + gr * 0.25), H - gr * 0.55];
    return [gr * 0.55, B - gr * 0.55, gr * 0.55, H - gr * 0.55];
  }
  function platziere(e, zone, gr){
    var b = bereich(zone, gr);
    if (b[3] < b[2]) b[3] = b[2];
    for (var t = 0; t < 160; t++){
      var x = b[0] + rnd() * (b[1] - b[0]), y = b[2] + rnd() * (b[3] - b[2]), frei = true;
      for (var i = 0; i < dinge.length && frei; i++){ var d = dinge[i]; if (Math.hypot(d.x - x, d.y - y) < (d.gr + gr) * (t < 100 ? 0.5 : 0.36)) frei = false; }
      if (frei){ dinge.push({ e:e, x:x, y:y, gr:gr }); return; }
    }
  }
  (s.gross || []).forEach(function(e){ platziere(e, 'gross', (190 + rnd() * 60) * u); });
  (s.imMeer || []).forEach(function(e){ platziere(e, 'imMeer', (70 + rnd() * 30) * u); });
  (s.oben || []).forEach(function(e){ platziere(e, 'oben', (70 + rnd() * 40) * u); });
  var unten = s.unten || [], alle = s.alle || [], liste = alle.concat(unten), ziel = s.art === 'flach' ? 34 : 24;
  liste.forEach(function(e){ platziere(e, unten.indexOf(e) >= 0 ? 'unten' : 'alle', (s.art === 'flach' ? 120 : 100) * u + rnd() * 70 * u); });
  for (var z = 0; dinge.length < ziel && z < 60; z++){ var e2 = liste[Math.floor(rnd() * liste.length)]; platziere(e2, unten.indexOf(e2) >= 0 ? 'unten' : 'alle', (s.art === 'flach' ? 110 : 85) * u + rnd() * 60 * u); }
  dinge.sort(function(a, b){ return a.y - b.y; });
  g.textAlign = 'center'; g.textBaseline = 'middle';
  dinge.forEach(function(d){ g.font = Math.round(d.gr) + 'px ' + EMOJI; g.fillText(d.e, d.x, d.y); });
  return cv;
}

/* ---------- Puzzle-Teile ----------
   Kante von A nach B mit Nase: Punkte (u längs, v quer) einer klassischen Nase, gemessen in k (kürzere Seite der Zelle);
   die Nase sitzt in der Mitte der Kante. out = +1 Nase nach aussen, −1 Mulde nach innen, 0 gerade (Rand).
   Aussen ist links von der Laufrichtung (Umlauf im Uhrzeigersinn). */
var NASE = [[0.20, 0, 0.42, 0.04, 0.38, 0.12], [0.32, 0.24, 0.40, 0.30, 0.50, 0.30], [0.60, 0.30, 0.68, 0.24, 0.62, 0.12], [0.58, 0.04, 0.80, 0, 1, 0]];
function kante(p, ax, ay, bx, by, out, k){
  if (!out){ p.lineTo(bx, by); return; }
  var dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy), ex = dx / L, ey = dy / L, nx = ey, ny = -ex;   // ex/ey längs, nx/ny nach aussen
  function pt(u, v){ var s = u <= 0 ? 0 : u >= 1 ? L : L / 2 + (u - 0.5) * k; return [ax + ex * s + nx * v * k * out, ay + ey * s + ny * v * k * out]; }
  NASE.forEach(function(c){ var a = pt(c[0], c[1]), b = pt(c[2], c[3]), e = pt(c[4], c[5]); p.bezierCurveTo(a[0], a[1], b[0], b[1], e[0], e[1]); });
}
/* Spalten × Zeilen für n Teile: möglichst genau n Teile, die Zellen möglichst quadratisch (leicht rechteckig ist erlaubt) */
function raster(n, IW, IH){
  var best = null;
  for (var z = 2; z <= n; z++) for (var s = Math.max(2, Math.floor(n / z) - 1); s <= Math.ceil(n / z) + 1; s++){
    var q = Math.abs(Math.log((IW / s) / (IH / z))), p = Math.abs(s * z - n) / n * 80 + q * 8 + Math.max(0, q - 0.29) * 24;
    if (!best || p < best.p) best = { spalten:s, zeilen:z, p:p };
  }
  return best;
}

function starte(behaelter, o){
  o = o || {};
  var bild = o.bild, IW = bild.naturalWidth || bild.width, IH = bild.naturalHeight || bild.height;
  var cv = document.createElement('canvas'); cv.className = 'pz-flaeche'; cv.setAttribute('role', 'img'); cv.setAttribute('aria-label', 'Puzzle');
  cv.style.cssText = 'display:block;width:100%;height:100%;touch-action:none;user-select:none;-webkit-user-select:none';
  behaelter.appendChild(cv);
  var g = cv.getContext('2d'), test = document.createElement('canvas').getContext('2d');
  var ra = raster(Math.max(4, o.teile || 24), IW, IH), spalten = ra.spalten, zeilen = ra.zeilen;
  var waag = [], senk = [], teile = [], vorlage = !!o.vorlage, aus = false;
  for (var r = 0; r <= zeilen; r++){ waag.push([]); for (var c = 0; c < spalten; c++) waag[r].push(r === 0 || r === zeilen ? 0 : (Math.random() < 0.5 ? 1 : -1)); }
  for (var r2 = 0; r2 < zeilen; r2++){ senk.push([]); for (var c2 = 0; c2 <= spalten; c2++) senk[r2].push(c2 === 0 || c2 === spalten ? 0 : (Math.random() < 0.5 ? 1 : -1)); }
  for (var r3 = 0; r3 < zeilen; r3++) for (var c3 = 0; c3 < spalten; c3++) teile.push({ r:r3, c:c3, x:0, y:0, fest:false });
  // ZW × ZH: Zelle in Pixeln, M: Rand fürs Teilbild (Nasen), BX/BY: Brett links oben. Lage der Teile (x, y) in Zellen.
  var CW = 0, CH = 0, ZW = 0, ZH = 0, K = 0, M = 0, BX = 0, BY = 0, dpr = 1, gemischt = false, start = 0, ende = 0, ziehen = null, uhr = 0, neuZeichnen = false;

  // Umriss eines Teils als Path2D, Ursprung links oben im Teilbild
  function umriss(t){
    var p = new Path2D(), x0 = M, y0 = M, x1 = M + ZW, y1 = M + ZH;
    p.moveTo(x0, y0);
    kante(p, x0, y0, x1, y0, -waag[t.r][t.c], K);          // oben: Nase nach oben, wenn die Kante «nach oben» zeigt
    kante(p, x1, y0, x1, y1, senk[t.r][t.c + 1], K);       // rechts
    kante(p, x1, y1, x0, y1, waag[t.r + 1][t.c], K);       // unten
    kante(p, x0, y1, x0, y0, -senk[t.r][t.c], K);          // links
    p.closePath();
    return p;
  }
  function teilbild(t){
    var k = document.createElement('canvas'); k.width = Math.ceil((ZW + 2 * M) * dpr); k.height = Math.ceil((ZH + 2 * M) * dpr);
    var x = k.getContext('2d'); x.scale(dpr, dpr);
    t.pfad = umriss(t);
    x.save(); x.clip(t.pfad);
    x.drawImage(bild, M - t.c * ZW, M - t.r * ZH, spalten * ZW, zeilen * ZH);
    x.restore();
    x.lineWidth = 1.2; x.strokeStyle = 'rgba(0,0,0,.45)'; x.stroke(t.pfad);
    x.save(); x.translate(-0.8, -0.8); x.lineWidth = 1; x.strokeStyle = 'rgba(255,255,255,.55)'; x.stroke(t.pfad); x.restore();
    t.bmp = k;
  }
  function brettPx(){ return { x:BX, y:BY, w:spalten * ZW, h:zeilen * ZH }; }
  // Brett so gross wie möglich, aber mit genug Platz daneben für die losen Teile
  function masse(anteil){
    var quer = CW >= CH * 1.05, maxB = quer ? CW * anteil : CW * 0.94, maxH = quer ? CH * 0.86 : CH * (anteil - 0.05);
    var f = Math.min(maxB / IW, maxH / IH);
    ZW = Math.max(6, IW * f / spalten); ZH = Math.max(6, IH * f / zeilen); K = Math.min(ZW, ZH); M = Math.ceil(K * 0.32);
    BX = (CW - spalten * ZW) / 2; BY = quer ? (CH - zeilen * ZH) / 2 : Math.max(M, CH * 0.03);
  }
  function anordnen(){
    var rect = behaelter.getBoundingClientRect(), altW = ZW, altH = ZH;
    dpr = Math.min(2, window.devicePixelRatio || 1);
    CW = Math.max(200, rect.width); CH = Math.max(200, rect.height); cv.width = Math.round(CW * dpr); cv.height = Math.round(CH * dpr);
    for (var a = 0.62; a > 0.43; a -= 0.03){ masse(a); if (plaetze(0.9).length >= teile.length) break; }
    if (a <= 0.43) masse(0.6);
    if (Math.abs(altW - ZW) > 0.01 || Math.abs(altH - ZH) > 0.01 || !teile[0].bmp) teile.forEach(teilbild);
    if (!gemischt){ mischen(); gemischt = true; }
    teile.forEach(halten);
    zeichne();
  }
  // Plätze neben dem Brett in einem Gitter (Abstand f Zellen), damit sich die losen Teile möglichst nicht überdecken
  function plaetze(f){
    var b = brettPx(), sw = (ZW + M * 0.9) * f, sh = (ZH + M * 0.9) * f, rand = M * 0.35, liste = [];
    var nx = Math.floor((CW - 2 * rand - ZW - M) / sw) + 1, ny = Math.floor((CH - 2 * rand - ZH - M) / sh) + 1;
    var ox = (CW - ((nx - 1) * sw + ZW)) / 2, oy = (CH - ((ny - 1) * sh + ZH)) / 2;
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++){
      var px = ox + i * sw, py = oy + j * sh;
      if (px + ZW + M * 0.5 > b.x && px - M * 0.5 < b.x + b.w && py + ZH + M * 0.5 > b.y && py - M * 0.5 < b.y + b.h) continue;   // auf dem Brett
      liste.push([px, py]);
    }
    return liste;
  }
  // Teil im sichtbaren Bereich halten
  function halten(t){
    if (t.fest) return;
    var px = BX + t.x * ZW, py = BY + t.y * ZH;
    px = Math.min(Math.max(px, M * 0.3), CW - ZW - M * 0.3); py = Math.min(Math.max(py, M * 0.3), CH - ZH - M * 0.3);
    t.x = (px - BX) / ZW; t.y = (py - BY) / ZH;
  }
  function mischen(){
    var liste = [];
    for (var f = 1.12; f >= 0.7; f -= 0.06){ liste = plaetze(f); if (liste.length >= teile.length) break; }
    for (var i = liste.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), tt = liste[i]; liste[i] = liste[j]; liste[j] = tt; }
    for (var k = teile.length - 1; k > 0; k--){ var m = Math.floor(Math.random() * (k + 1)), t2 = teile[k]; teile[k] = teile[m]; teile[m] = t2; }
    teile.forEach(function(t, n){
      t.fest = false;
      var pl = liste.length ? liste[n % liste.length] : [M + Math.random() * (CW - ZW - 2 * M), M + Math.random() * (CH - ZH - 2 * M)];
      var px = pl[0] + (Math.random() - 0.5) * M * 0.5 + (n >= liste.length ? (Math.random() - 0.5) * ZW * 0.6 : 0);
      var py = pl[1] + (Math.random() - 0.5) * M * 0.5 + (n >= liste.length ? (Math.random() - 0.5) * ZH * 0.6 : 0);
      t.x = (px - BX) / ZW; t.y = (py - BY) / ZH;
      halten(t);
    });
    start = 0; ende = 0; meldeStatus();
  }
  function zeichne(){
    if (aus) return;
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    g.clearRect(0, 0, CW, CH);
    var b = brettPx();
    g.save(); g.shadowColor = 'rgba(45,28,12,.18)'; g.shadowBlur = 14; g.fillStyle = '#fff'; g.fillRect(b.x, b.y, b.w, b.h); g.restore();
    if (vorlage){ g.save(); g.globalAlpha = 0.28; g.drawImage(bild, b.x, b.y, b.w, b.h); g.restore(); }
    g.strokeStyle = 'rgba(45,28,12,.35)'; g.lineWidth = 1; g.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    var SW = ZW + 2 * M, SH = ZH + 2 * M;
    teile.forEach(function(t){ if (t.fest) g.drawImage(t.bmp, BX + t.c * ZW - M, BY + t.r * ZH - M, SW, SH); });
    teile.forEach(function(t){
      if (t.fest) return;
      if (ziehen && ziehen.t === t){ g.save(); g.shadowColor = 'rgba(0,0,0,.35)'; g.shadowBlur = 16; g.shadowOffsetY = 6; }
      g.drawImage(t.bmp, BX + t.x * ZW - M, BY + t.y * ZH - M, SW, SH);
      if (ziehen && ziehen.t === t) g.restore();
    });
    if (ende){ g.save(); g.globalAlpha = 0.9; g.drawImage(bild, b.x, b.y, b.w, b.h); g.restore(); }
  }
  function bald(){ if (!neuZeichnen){ neuZeichnen = true; requestAnimationFrame(function(){ neuZeichnen = false; zeichne(); }); } }
  function anzahlFest(){ return teile.filter(function(t){ return t.fest; }).length; }
  function sekunden(){ return start ? Math.round(((ende || Date.now()) - start) / 1000) : 0; }
  function meldeStatus(){ if (o.status) o.status({ fest:anzahlFest(), alle:teile.length, sekunden:sekunden(), fertig:!!ende }); }

  function punkt(ev){ var rc = cv.getBoundingClientRect(); return { x:ev.clientX - rc.left, y:ev.clientY - rc.top }; }
  function treffer(p){
    for (var i = teile.length - 1; i >= 0; i--){
      var t = teile[i]; if (t.fest) continue;
      var lx = p.x - (BX + t.x * ZW - M), ly = p.y - (BY + t.y * ZH - M);
      if (lx < 0 || ly < 0 || lx > ZW + 2 * M || ly > ZH + 2 * M) continue;
      if (test.isPointInPath(t.pfad, lx, ly)) return i;
    }
    return -1;
  }
  cv.addEventListener('pointerdown', function(ev){
    if (ende || ziehen) return;
    var p = punkt(ev), i = treffer(p);
    if (i < 0) return;
    ev.preventDefault();
    var t = teile.splice(i, 1)[0]; teile.push(t);   // nach oben
    ziehen = { t:t, dx:p.x - (BX + t.x * ZW), dy:p.y - (BY + t.y * ZH), id:ev.pointerId };
    try { cv.setPointerCapture(ev.pointerId); } catch(e){}
    if (!start){ start = Date.now(); uhr = setInterval(meldeStatus, 1000); }
    bald();
  });
  cv.addEventListener('pointermove', function(ev){
    if (!ziehen || ev.pointerId !== ziehen.id) return;
    var p = punkt(ev), t = ziehen.t;
    t.x = (p.x - ziehen.dx - BX) / ZW; t.y = (p.y - ziehen.dy - BY) / ZH;
    bald();
  });
  function loslassen(ev){
    if (!ziehen || (ev && ev.pointerId !== ziehen.id)) return;
    var t = ziehen.t; ziehen = null;
    if (Math.abs(t.x - t.c) < 0.3 && Math.abs(t.y - t.r) < 0.3){   // nahe genug: einrasten
      t.fest = true; t.x = t.c; t.y = t.r;
      teile.splice(teile.indexOf(t), 1); teile.unshift(t);
      if (anzahlFest() === teile.length){ ende = Date.now(); clearInterval(uhr); if (o.fertig) o.fertig(sekunden()); }
    } else halten(t);
    meldeStatus(); bald();
  }
  cv.addEventListener('pointerup', loslassen); cv.addEventListener('pointercancel', loslassen);

  var beobachter = window.ResizeObserver ? new ResizeObserver(function(){ anordnen(); }) : null;
  if (beobachter) beobachter.observe(behaelter); else window.addEventListener('resize', anordnen);
  anordnen();
  return {
    neu:function(){ clearInterval(uhr); ende = 0; ziehen = null; mischen(); zeichne(); },
    vorlage:function(an){ vorlage = !!an; zeichne(); },
    stopp:function(){ aus = true; clearInterval(uhr); if (beobachter) beobachter.disconnect(); else window.removeEventListener('resize', anordnen); cv.remove(); },
    raster:function(){ return { spalten:spalten, zeilen:zeilen }; },
    // Lage aller Teile in Pixeln (in Zeichenreihenfolge, das oberste zuletzt) – für Tests und Fehlersuche
    lage:function(){ return teile.map(function(t){ return { r:t.r, c:t.c, fest:t.fest, x:BX + t.x * ZW, y:BY + t.y * ZH, zx:BX + t.c * ZW, zy:BY + t.r * ZH, zw:ZW, zh:ZH }; }); }
  };
}

window.PuzzleSpiel = { SZENEN:SZENEN, szene:szene, starte:starte, raster:raster };
})();
