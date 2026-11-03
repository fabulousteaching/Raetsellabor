/* Rätsellabor – Puzzle-Spiel (gemeinsam für den Generator «Puzzle» und die Puzzle-Seite P/<ID>/, die der QR-Code öffnet)

   PuzzleSpiel.starte(behaelter, o)          o: { bild (Bild oder Canvas), teile, vorlage, status(info), fertig(sekunden) }
                                             → { neu(), vorlage(an), stopp(), raster(), lage() }
   PuzzleSpiel.raster(n, breite, hoehe)      → { spalten, zeilen }: möglichst genau n Teile mit fast quadratischen Zellen

   Die Teile haben klassische Puzzle-Nasen (Bézier-Kurven). Gemischt liegen alle Teile neben dem Brett, nie darauf.
   Man zieht sie mit Maus oder Finger aufs Brett; liegt ein Teil nahe genug an seinem Platz, rastet es ein.
   Alles wird in ein Canvas gezeichnet (auch 150 Teile bleiben flüssig). */
(function(){
'use strict';

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
  // Brett so gross wie möglich, aber mit genug Platz daneben für alle losen Teile
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
    for (var a = 0.62; a >= 0.36; a -= 0.02){ masse(a); if (plaetze(0.85, streifen()).length >= teile.length) break; }
    if (Math.abs(altW - ZW) > 0.01 || Math.abs(altH - ZH) > 0.01 || !teile[0].bmp) teile.forEach(teilbild);
    if (!gemischt){ mischen(); gemischt = true; }
    else {   // nach einer Grössenänderung: lose Teile im Bild halten; was dabei aufs Brett gerückt würde, wieder daneben legen
      var s = streifen();
      teile.forEach(function(t){ if (halten(t) && aufBrett(t)) wegLegen(t, s); });
    }
    zeichne();
  }
  /* Freie Streifen rund ums Brett: Bereiche für die linke obere Ecke eines Teils, in denen es samt Nasen ganz neben dem
     Brett liegt ([x von, x bis, y von, y bis]) */
  function streifen(){
    var b = brettPx(), r = M * 0.4, abst = M * 1.3, x0 = r, x1 = CW - ZW - r, y0 = r, y1 = CH - ZH - r, s = [];
    function dazu(ax, bx, ay, by){ if (bx >= ax && by >= ay) s.push([ax, bx, ay, by]); }
    dazu(x0, b.x - abst - ZW, y0, y1);           // links
    dazu(b.x + b.w + abst, x1, y0, y1);          // rechts
    dazu(x0, x1, y0, b.y - abst - ZH);           // oben
    dazu(x0, x1, b.y + b.h + abst, y1);          // unten
    return s;
  }
  function imStreifen(s, px, py){ return s.some(function(q){ return px >= q[0] - 0.5 && px <= q[1] + 0.5 && py >= q[2] - 0.5 && py <= q[3] + 0.5; }); }
  // Plätze in den Streifen in einem Gitter (Abstand f Teile), damit sich die losen Teile möglichst nicht überdecken
  function plaetze(f, s){
    var sw = (ZW + M * 0.9) * f, sh = (ZH + M * 0.9) * f, r = M * 0.4, liste = [];
    var nx = Math.floor((CW - 2 * r - ZW) / sw) + 1, ny = Math.floor((CH - 2 * r - ZH) / sh) + 1;
    var ox = (CW - ((nx - 1) * sw + ZW)) / 2, oy = (CH - ((ny - 1) * sh + ZH)) / 2;
    for (var j = 0; j < ny; j++) for (var i = 0; i < nx; i++){ var px = ox + i * sw, py = oy + j * sh; if (imStreifen(s, px, py)) liste.push([px, py]); }
    return liste;
  }
  function irgendwo(s){   // zufällige Stelle in den Streifen (nach Fläche gewichtet)
    if (!s.length) return [M * 0.4 + Math.random() * Math.max(1, CW - ZW - M), M * 0.4 + Math.random() * Math.max(1, CH - ZH - M)];
    var fl = s.map(function(q){ return (q[1] - q[0] + 1) * (q[3] - q[2] + 1); }), z = Math.random() * fl.reduce(function(a, b){ return a + b; }, 0), k = 0;
    while (k < s.length - 1 && z > fl[k]){ z -= fl[k]; k++; }
    return [s[k][0] + Math.random() * (s[k][1] - s[k][0]), s[k][2] + Math.random() * (s[k][3] - s[k][2])];
  }
  function setze(t, px, py){ t.x = (px - BX) / ZW; t.y = (py - BY) / ZH; }
  function wegLegen(t, s){ var p = irgendwo(s); setze(t, p[0], p[1]); }
  function aufBrett(t){
    var b = brettPx(), px = BX + t.x * ZW, py = BY + t.y * ZH;
    return px + ZW + M > b.x && px - M < b.x + b.w && py + ZH + M > b.y && py - M < b.y + b.h;
  }
  // Teil im sichtbaren Bereich halten; true, wenn es dafür verschoben wurde
  function halten(t){
    if (t.fest) return false;
    var px = BX + t.x * ZW, py = BY + t.y * ZH, qx = Math.min(Math.max(px, M * 0.3), CW - ZW - M * 0.3), qy = Math.min(Math.max(py, M * 0.3), CH - ZH - M * 0.3);
    if (qx === px && qy === py) return false;
    setze(t, qx, qy); return true;
  }
  // alle Teile neben das Brett legen: zuerst auf freie Plätze, wenn sie nicht reichen, übereinander – aber nie aufs Brett
  function mischen(){
    var s = streifen(), liste = [];
    for (var f = 1.12; f >= 0.7; f -= 0.06){ liste = plaetze(f, s); if (liste.length >= teile.length) break; }
    for (var i = liste.length - 1; i > 0; i--){ var j = Math.floor(Math.random() * (i + 1)), tt = liste[i]; liste[i] = liste[j]; liste[j] = tt; }
    for (var k = teile.length - 1; k > 0; k--){ var m = Math.floor(Math.random() * (k + 1)), t2 = teile[k]; teile[k] = teile[m]; teile[m] = t2; }
    teile.forEach(function(t, n){
      t.fest = false;
      var p = n < liste.length ? liste[n] : irgendwo(s), w = M * 0.18;
      setze(t, p[0] + (Math.random() - 0.5) * w, p[1] + (Math.random() - 0.5) * w);
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
    lage:function(){ return teile.map(function(t){ return { r:t.r, c:t.c, fest:t.fest, x:BX + t.x * ZW, y:BY + t.y * ZH, zx:BX + t.c * ZW, zy:BY + t.r * ZH, zw:ZW, zh:ZH, m:M }; }); }
  };
}

window.PuzzleSpiel = { starte:starte, raster:raster };
})();
