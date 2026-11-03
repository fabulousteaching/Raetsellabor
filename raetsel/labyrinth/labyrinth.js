/* Rätsellabor – Generator «Labyrinth»
   Ein Labyrinth in der Form eines eigenen Wortes (oder einer Figur: Rechteck, Kreis, Herz, Stern).
   Der Text wird auf eine Zeichenfläche geschrieben und in Felder zerlegt; getrennte Buchstaben verbinden kurze Brücken,
   damit ein einziges Labyrinth entsteht. Darin entsteht ein «perfektes» Labyrinth (genau ein Weg zwischen zwei Feldern).
   Start links, Ziel rechts (mit einem Paar wie Maus → Käse). Am Bildschirm lösbar (Weg ziehen), Druck mit Lösungsblatt. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var O = 1, R = 2, U = 4, L = 8;   // offene Seiten eines Felds: oben, rechts, unten, links
  var RICHTUNG = [[O, -1, 0], [R, 0, 1], [U, 1, 0], [L, 0, -1]], GEGEN = { 1:4, 2:8, 4:1, 8:2 };
  function zufall(seed){ var s = seed >>> 0 || 1; return function(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }; }
  function leer(h, w){ var m = []; for (var r = 0; r < h; r++){ var z = []; for (var c = 0; c < w; c++) z.push(false); m.push(z); } return m; }

  /* Figuren als Maske (true = gehört zum Labyrinth) */
  var STERN = [];
  for (var k = 0; k < 10; k++){ var wk = -Math.PI / 2 + k * Math.PI / 5, rk = k % 2 ? 0.52 : 1; STERN.push([rk * Math.cos(wk), rk * Math.sin(wk) + 0.09]); }
  function imVieleck(x, y, ecken){
    var drin = false;
    for (var i = 0, j = ecken.length - 1; i < ecken.length; j = i++){
      var a = ecken[i], b = ecken[j];
      if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) drin = !drin;
    }
    return drin;
  }
  function figur(art, h, w){
    var m = leer(h, w);
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++){
      var x = (c + 0.5) / w * 2 - 1, y = (r + 0.5) / h * 2 - 1;   // −1 … 1, y nach unten
      if (art === 'kreis') m[r][c] = x * x + y * y <= 1;
      else if (art === 'herz'){ var X = x * 1.18, Y = -y * 1.18 + 0.18; m[r][c] = Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y <= 0; }
      else if (art === 'stern') m[r][c] = imVieleck(x * 1.02, y * 1.02, STERN);
      else m[r][c] = true;
    }
    return m;
  }

  /* Zusammenhängende Teile (4er-Nachbarschaft) */
  function teile(m){
    var h = m.length, w = m[0].length, nr = leer(h, w).map(function(z){ return z.map(function(){ return -1; }); }), liste = [];
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++){
      if (!m[r][c] || nr[r][c] >= 0) continue;
      var id = liste.length, zellen = [], stapel = [[r, c]]; nr[r][c] = id;
      while (stapel.length){
        var p = stapel.pop(); zellen.push(p);
        RICHTUNG.forEach(function(d){ var y = p[0] + d[1], x = p[1] + d[2]; if (y >= 0 && x >= 0 && y < h && x < w && m[y][x] && nr[y][x] < 0){ nr[y][x] = id; stapel.push([y, x]); } });
      }
      liste.push(zellen);
    }
    return { nr:nr, liste:liste };
  }
  /* Getrennte Teile mit kurzen Brücken verbinden; winzige Splitter (z. B. halbe i-Punkte) entfernen */
  function verbinden(m, minGroesse){
    var h = m.length, w = m[0].length;
    var t = teile(m);
    t.liste.forEach(function(z){ if (z.length < (minGroesse || 3)) z.forEach(function(p){ m[p[0]][p[1]] = false; }); });
    for (var runde = 0; runde < 200; runde++){
      t = teile(m);
      if (t.liste.length <= 1) return m;
      // vom grössten Teil aus in alle Richtungen suchen, bis ein anderer Teil erreicht ist
      var gross = 0; t.liste.forEach(function(z, i){ if (z.length > t.liste[gross].length) gross = i; });
      var vor = leer(h, w).map(function(z){ return z.map(function(){ return null; }); }), schlange = t.liste[gross].slice(), kopf = 0, ziel = null;
      schlange.forEach(function(p){ vor[p[0]][p[1]] = p; });
      while (kopf < schlange.length && !ziel){
        var p = schlange[kopf++];
        for (var i = 0; i < 4 && !ziel; i++){
          var y = p[0] + RICHTUNG[i][1], x = p[1] + RICHTUNG[i][2];
          if (y < 0 || x < 0 || y >= h || x >= w || vor[y][x]) continue;
          vor[y][x] = p;
          if (m[y][x] && t.nr[y][x] !== gross) ziel = [y, x]; else schlange.push([y, x]);
        }
      }
      if (!ziel) return m;
      for (var q = vor[ziel[0]][ziel[1]]; q && !(m[q[0]][q[1]] && t.nr[q[0]][q[1]] === gross); q = vor[q[0]][q[1]]) m[q[0]][q[1]] = true;   // Brücke
    }
    return m;
  }
  /* Start (links) und Ziel (rechts): Randfelder der Maske, möglichst auf mittlerer Höhe */
  function startZiel(m){
    var h = m.length, w = m[0].length, start = null, ziel = null;
    function wert(r, c, links){ return (links ? c : w - 1 - c) * h * 4 + Math.abs(r - (h - 1) / 2); }
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++){
      if (!m[r][c]) continue;
      if (c === 0 || !m[r][c - 1]){ if (!start || wert(r, c, true) < wert(start[0], start[1], true)) start = [r, c]; }
      if (c === w - 1 || !m[r][c + 1]){ if (!ziel || wert(r, c, false) < wert(ziel[0], ziel[1], false)) ziel = [r, c]; }
    }
    return { start:start, ziel:ziel };
  }
  /* Labyrinth erzeugen («wachsender Baum»): neu = Anteil, mit dem am neuesten Feld weitergebaut wird
     (hoch = lange, verschlungene Gänge; tief = viele kurze Sackgassen) */
  function erzeugen(m, o){
    var h = m.length, w = m[0].length, offen = leer(h, w).map(function(z){ return z.map(function(){ return 0; }); }), besucht = leer(h, w);
    var rnd = zufall(o.seed || 1), neu = o.neu === undefined ? 0.75 : o.neu, sz = startZiel(m);
    if (!sz.start) return null;
    var aktiv = [sz.start]; besucht[sz.start[0]][sz.start[1]] = true;
    while (aktiv.length){
      var i = rnd() < neu ? aktiv.length - 1 : Math.floor(rnd() * aktiv.length), p = aktiv[i], frei = [];
      RICHTUNG.forEach(function(d){ var y = p[0] + d[1], x = p[1] + d[2]; if (y >= 0 && x >= 0 && y < h && x < w && m[y][x] && !besucht[y][x]) frei.push([d[0], y, x]); });
      if (!frei.length){ aktiv.splice(i, 1); continue; }
      var n = frei[Math.floor(rnd() * frei.length)];
      offen[p[0]][p[1]] |= n[0]; offen[n[1]][n[2]] |= GEGEN[n[0]]; besucht[n[1]][n[2]] = true; aktiv.push([n[1], n[2]]);
    }
    var lab = { h:h, w:w, maske:m, offen:offen, start:sz.start, ziel:sz.ziel, startSeite:L, zielSeite:R };
    weitestesPaar(lab);
    return lab;
  }
  /* Unter den Randfeldern links und rechts das Paar mit dem längsten Weg wählen (sonst sind Kreis und Stern zu einfach) */
  function weitestesPaar(lab){
    var m = lab.maske, h = lab.h, w = lab.w, links = [], rechts = [], minC = w, maxC = 0;
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) if (m[r][c]){ if (c < minC) minC = c; if (c > maxC) maxC = c; }
    var spanne = Math.max(1, Math.round((maxC - minC) * 0.12));
    for (var r2 = 0; r2 < h; r2++) for (var c2 = 0; c2 < w; c2++){
      if (!m[r2][c2]) continue;
      if (c2 <= minC + spanne && (c2 === 0 || !m[r2][c2 - 1])) links.push([r2, c2]);
      if (c2 >= maxC - spanne && (c2 === w - 1 || !m[r2][c2 + 1])) rechts.push([r2, c2]);
    }
    function auswahl(l){ if (l.length <= 10) return l; var a = []; for (var i = 0; i < 10; i++) a.push(l[Math.floor(i * (l.length - 1) / 9)]); return a; }
    var bester = -1;
    auswahl(links).forEach(function(a){
      var dist = abstaende(lab, a);
      rechts.forEach(function(b){ var d = dist[b[0] * w + b[1]]; if (d > bester){ bester = d; lab.start = a; lab.ziel = b; } });
    });
  }
  function abstaende(lab, a){
    var w = lab.w, dist = new Int32Array(lab.h * w).fill(-1), schlange = [a], kopf = 0;
    dist[a[0] * w + a[1]] = 0;
    while (kopf < schlange.length){
      var p = schlange[kopf++], d = dist[p[0] * w + p[1]];
      for (var i = 0; i < 4; i++){
        if (!(lab.offen[p[0]][p[1]] & RICHTUNG[i][0])) continue;
        var y = p[0] + RICHTUNG[i][1], x = p[1] + RICHTUNG[i][2];
        if (dist[y * w + x] < 0){ dist[y * w + x] = d + 1; schlange.push([y, x]); }
      }
    }
    return dist;
  }
  /* Der (einzige) Weg vom Start zum Ziel */
  function loesung(lab){
    var h = lab.h, w = lab.w, vor = leer(h, w).map(function(z){ return z.map(function(){ return null; }); }), schlange = [lab.start], kopf = 0;
    vor[lab.start[0]][lab.start[1]] = lab.start;
    while (kopf < schlange.length){
      var p = schlange[kopf++];
      if (p[0] === lab.ziel[0] && p[1] === lab.ziel[1]) break;
      RICHTUNG.forEach(function(d){ if (!(lab.offen[p[0]][p[1]] & d[0])) return; var y = p[0] + d[1], x = p[1] + d[2]; if (!vor[y][x]){ vor[y][x] = p; schlange.push([y, x]); } });
    }
    var weg = [], q = lab.ziel;
    if (!vor[q[0]][q[1]]) return [];
    while (q[0] !== lab.start[0] || q[1] !== lab.start[1]){ weg.push(q); q = vor[q[0]][q[1]]; }
    weg.push(lab.start);
    return weg.reverse();
  }
  function offenZwischen(lab, a, b){
    var dy = b[0] - a[0], dx = b[1] - a[1];
    if (Math.abs(dy) + Math.abs(dx) !== 1) return false;
    var bit = dy === -1 ? O : dy === 1 ? U : dx === 1 ? R : L;
    return !!(lab.offen[a[0]][a[1]] & bit);
  }
  /* Wände als SVG-Pfad (Feldgrösse 10): innere Wände einmal, Aussenrand ganz; Öffnungen bei Start und Ziel */
  function waende(lab){
    var S = 10, d = [], m = lab.maske;
    function drin(r, c){ return r >= 0 && c >= 0 && r < lab.h && c < lab.w && m[r][c]; }
    function tuer(r, c, seite){ return (r === lab.start[0] && c === lab.start[1] && lab.startSeite === seite) || (r === lab.ziel[0] && c === lab.ziel[1] && lab.zielSeite === seite); }
    for (var r = 0; r < lab.h; r++) for (var c = 0; c < lab.w; c++){
      if (!m[r][c]) continue;
      var x = c * S, y = r * S, o = lab.offen[r][c];
      if (!drin(r - 1, c) && !tuer(r, c, O)) d.push('M' + x + ' ' + y + 'h' + S);                // oben (Aussenrand)
      if (!drin(r, c - 1) && !tuer(r, c, L)) d.push('M' + x + ' ' + y + 'v' + S);                // links (Aussenrand)
      if (!(o & R) && (drin(r, c + 1) || !tuer(r, c, R))) d.push('M' + (x + S) + ' ' + y + 'v' + S);   // rechts
      if (!(o & U) && (drin(r + 1, c) || !tuer(r, c, U))) d.push('M' + x + ' ' + (y + S) + 'h' + S);   // unten
    }
    return d.join('');
  }
  /* ---------- Lösungssatz: Buchstabe für Buchstabe auf dem richtigen Weg ---------- */
  // Zeichen des Satzes: Grossbuchstaben und Ziffern, ß → SS; Wörter auf Wunsch mit «•» getrennt
  function satzZeichen(text, trenner){
    var a = [];
    String(text || '').toLocaleUpperCase('de-CH').replace(/ß/g, 'SS').split(/\s+/).forEach(function(wort){
      var b = Array.from(wort.replace(/[^\p{L}\p{N}]/gu, ''));
      if (!b.length) return;
      if (trenner && a.length) a.push('•');
      a.push.apply(a, b);
    });
    return a;
  }
  function aussenSeiten(lab, r, c){   // Reihenfolge = Vorliebe für das Ziel: rechts, unten, oben, links
    var m = lab.maske, s = [];
    function drin(y, x){ return y >= 0 && x >= 0 && y < lab.h && x < lab.w && m[y][x]; }
    if (!drin(r, c + 1)) s.push(R); if (!drin(r + 1, c)) s.push(U); if (!drin(r - 1, c)) s.push(O); if (!drin(r, c - 1)) s.push(L);
    return s;
  }
  /* Labyrinth, dessen Weg vom Start (links) zum Ziel (am Aussenrand) genau «laenge» Felder hat.
     → { lab } oder { fehler:'zuLang', laengster } (der Satz passt nicht hinein) */
  function mitSatz(m, o, laenge){
    var laengster = 0;
    for (var v = 0; v < 80; v++){
      var lab = erzeugen(m, { seed:(o.seed || 1) + v * 7919, neu:o.neu });
      if (!lab) return { fehler:'leer', laengster:0 };
      var h = lab.h, w = lab.w, links = [], minC = w, maxC = 0;
      for (var r = 0; r < h; r++) for (var c = 0; c < w; c++) if (m[r][c]){ if (c < minC) minC = c; if (c > maxC) maxC = c; }
      var spanne = Math.max(1, Math.round((maxC - minC) * 0.12));
      for (var r2 = 0; r2 < h; r2++) for (var c2 = 0; c2 < w; c2++) if (m[r2][c2] && c2 <= minC + spanne && (c2 === 0 || !m[r2][c2 - 1])) links.push([r2, c2]);
      if (links.length > 12){ var a2 = []; for (var i = 0; i < 12; i++) a2.push(links[Math.floor(i * (links.length - 1) / 11)]); links = a2; }
      for (var k = 0; k < links.length; k++){
        var st = links[k], dist = abstaende(lab, st), bester = null, bestWert = -1;
        for (var j = 0; j < dist.length; j++){
          if (dist[j] + 1 > laengster) laengster = dist[j] + 1;
          if (dist[j] !== laenge - 1) continue;
          var zr = Math.floor(j / w), zc = j % w, seiten = aussenSeiten(lab, zr, zc);
          if (!seiten.length || (zr === st[0] && zc === st[1])) continue;
          var wert = (seiten[0] === R ? 3000 : seiten[0] === U || seiten[0] === O ? 1000 : 0) + zc * 10;   // lieber rechts, weit weg vom Start
          if (wert > bestWert){ bestWert = wert; bester = [zr, zc, seiten[0]]; }
        }
        if (bester){ lab.start = st; lab.startSeite = L; lab.ziel = [bester[0], bester[1]]; lab.zielSeite = bester[2]; return { lab:lab }; }
      }
    }
    return { fehler:laengster < laenge ? 'zuLang' : 'keinZiel', laengster:laengster };
  }
  // Buchstaben für alle Felder: der Satz auf dem Weg, sonst zufällig (Häufigkeit deutscher Texte, gemischt mit den Buchstaben des Satzes)
  var HAEUFIG = 'EEEEEEENNNNNIIIIISSSSRRRRAAAATTTTDDDHHHUUULLLCCGGMMOOBBWFKZPVÜÄÖ';
  function buchstaben(lab, weg, zeichen, seed){
    var rnd = zufall(seed || 1), eigene = zeichen.filter(function(z){ return z !== '•'; }), punkte = zeichen.length - eigene.length;
    var quelle = Array.from(HAEUFIG).concat(eigene, eigene), g = [];
    for (var r = 0; r < lab.h; r++){ var z = []; for (var c = 0; c < lab.w; c++) z.push(''); g.push(z); }
    for (var r2 = 0; r2 < lab.h; r2++) for (var c2 = 0; c2 < lab.w; c2++) if (lab.maske[r2][c2])
      g[r2][c2] = punkte && rnd() < 0.7 * punkte / zeichen.length ? '•' : quelle[Math.floor(rnd() * quelle.length)];   // Punkte auch in falschen Wegen, sonst verraten sie den Weg
    weg.forEach(function(p, i){ g[p[0]][p[1]] = zeichen[i]; });
    return g;
  }
  return { erzeugen:erzeugen, loesung:loesung, verbinden:verbinden, teile:teile, figur:figur, startZiel:startZiel, waende:waende, offenZwischen:offenZwischen, zufall:zufall,
    O:O, R:R, U:U, L:L, satzZeichen:satzZeichen, mitSatz:mitSatz, buchstaben:buchstaben };
})();
/* KERN-ENDE */

/* ===== Vorlage ===== */
var PAARE = [   // Kürzel, Start, Ziel, «Hilf … », «… zum …»
  ['maus', '🐭', '🧀', 'der Maus', 'zum Käse'], ['hase', '🐰', '🥕', 'dem Hasen', 'zum Rüebli'], ['biene', '🐝', '🌻', 'der Biene', 'zur Blume'],
  ['rakete', '🚀', '🪐', 'der Rakete', 'zum Planeten'], ['hund', '🐶', '🦴', 'dem Hund', 'zum Knochen'], ['pirat', '🦜', '💰', 'dem Papagei', 'zum Schatz'],
  ['pfeile', '▶', '🏁', '', 'zum Ziel']
];
var STUFEN = { leicht:{ text:10, figur:10, neu:0.55, name:'Leicht' }, mittel:{ text:15, figur:16, neu:0.7, name:'Mittel' }, schwer:{ text:22, figur:24, neu:0.8, name:'Schwer' }, sehrschwer:{ text:30, figur:34, neu:0.85, name:'Sehr schwer' } };
var VORLAGE = '<div class="lb">' +
  '<header class="lb-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Labyrinth</h1>' +
    '<p>Ein Labyrinth in der Form deines eigenen Wortes – oder als Herz, Stern, Kreis oder Rechteck.</p></header>' +
  '<div class="lb-layout"><section class="lb-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Form</h2><p>Ein Wort oder eine Figur.</p></div></div>' +
      '<div class="lb-wahl" role="radiogroup" aria-label="Form">' +
        '<label><input type="radio" name="lbForm" value="text"><span>Wort</span></label>' +
        ['rechteck', 'kreis', 'herz', 'stern'].map(function(f){ return '<label><input type="radio" name="lbForm" value="' + f + '"><span>' + { rechteck:'Rechteck', kreis:'Kreis', herz:'Herz', stern:'Stern' }[f] + '</span></label>'; }).join('') + '</div>' +
      '<div data-form="text"><label class="vh" for="lbText">Wort oder kurzer Text</label>' +
        '<textarea id="lbText" rows="2" maxlength="40" placeholder="z. B. FERIEN oder Lea&#10;(zweite Zeile möglich)"></textarea>' +
        '<p class="hinweis">Am besten ein bis zwei kurze Wörter. Grossbuchstaben ergeben breitere Gänge.</p></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Schwierigkeit</h2><p>Je schwerer, desto schmaler die Gänge und desto mehr Abzweigungen.</p></div></div>' +
      '<div class="lb-stufen" role="radiogroup" aria-label="Schwierigkeit">' +
        Object.keys(STUFEN).map(function(k){ return '<label class="lb-stufe"><input type="radio" name="lbStufe" value="' + k + '"><span>' + STUFEN[k].name + '</span></label>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Start und Ziel</h2><p>Wer sucht den Weg wohin?</p></div></div>' +
      '<div class="lb-paare" role="radiogroup" aria-label="Start und Ziel">' +
        PAARE.map(function(p){ return '<label><input type="radio" name="lbPaar" value="' + p[0] + '"><span>' + p[1] + ' → ' + p[2] + '</span></label>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">4</span><div><h2>Lösungssatz <small>(freiwillig)</small></h2>' +
        '<p>Der Satz steht Buchstabe für Buchstabe auf dem richtigen Weg vom Start zum Ziel. In den falschen Wegen stehen zufällige Buchstaben.</p></div></div>' +
      '<label class="vh" for="lbSatz">Lösungssatz</label>' +
      '<textarea id="lbSatz" rows="2" maxlength="120" placeholder="z. B. Die nächste Lösung findest du im Kühlschrank."></textarea>' +
      '<label class="opt"><input type="checkbox" id="lbTrenner"><span>Wörter mit • trennen (leichter zu lesen)</span></label>' +
      '<p class="hinweis" id="lbSatzInfo" aria-live="polite"></p></div>' +
    '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
      '<div class="opt-raster"><label for="lbTitel">Titel auf dem Blatt</label><input type="text" id="lbTitel" maxlength="60" placeholder="Finde den Weg!">' +
        '<label for="lbLinie">Linien</label><select id="lbLinie"><option value="0.9">dünn</option><option value="1.4">mittel</option><option value="2">dick</option></select>' +
        '<label for="lbFarbe">Farbe der Wände</label><input type="color" id="lbFarbe"></div>' +
      '<label class="opt"><input type="checkbox" id="lbToenen"><span>Form leicht einfärben (macht das Wort besser sichtbar)</span></label>' +
    '</details></div>' +
    '<button type="button" class="btn primary gross" id="lbLos">Labyrinth erstellen</button>' +
  '</section>' +
  '<section class="lb-ausgabe" aria-label="Ergebnis">' +
    '<div id="lbMeldung" aria-live="polite"></div>' +
    '<div class="leer-zustand" id="lbLeer"><h2>Noch kein Labyrinth</h2><p>In drei Schritten zum Arbeitsblatt:</p><ol>' +
      '<li>Ein Wort eingeben oder eine Figur wählen</li><li>Schwierigkeit und Start/Ziel wählen</li><li>«Labyrinth erstellen» klicken</li></ol></div>' +
    '<div class="lb-werkzeug" id="lbWerkzeug" hidden>' +
      '<button type="button" class="btn klein" id="lbMischen" title="Gleiche Form, neues Labyrinth">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="lbZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="lbWegWeg">Weg löschen</button>' +
      '<span class="abstand"></span>' +
      '<label><input type="checkbox" id="lbMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="lbDrucken">Drucken</button>' +
      '<button type="button" class="btn klein primary" id="lbHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<article class="lb-blatt" id="lbBlatt" hidden></article>' +
    '<article class="lb-blatt lb-loesungsblatt" id="lbLoesung" aria-hidden="true"></article>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 3h18v18H3zM7 3v10M7 17v4M11 7h6M11 7v10h4M17 11v10M3 17h4"/></svg>';

Labor.registriere({
  id:'labyrinth',
  titel:'Labyrinth',
  kurz:'Labyrinthe in Form von Wörtern und Figuren',
  beschreibung:'Ein Labyrinth in der Form eines eigenen Wortes – oder als Herz, Stern, Kreis oder Rechteck. Auf Wunsch steht auf dem richtigen Weg ein Lösungssatz. Vier Schwierigkeitsstufen, am Bildschirm lösbar und mit Lösungsblatt.',
  merkmale:['Eigenes Wort als Form', 'Lösungssatz auf dem Weg', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/labyrinth/labyrinth.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false, NS = 'http://www.w3.org/2000/svg';
  var TAB = 'labyrinth-eingaben', OPT = 'labyrinth-einstellungen';
  var STANDARD = { form:'text', stufe:'mittel', paar:'maus', linie:'1.4', farbe:'#1C1714', toenen:true, mitLoesung:true, trenner:false };
  var st = { text:'', satz:'', titel:'', seed:1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.text = String(e.text || ''); st.satz = String(e.satz || ''); st.titel = String(e.titel || ''); st.seed = +e.seed || 1; } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, satz:st.satz, titel:st.titel, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#lbMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; leer(); }
  function leer(){ $('#lbLeer').hidden = !!aktuell || !!$('#lbMeldung').innerHTML; }
  var aktuell = null, weg = [], erstellt = false, lauf = 0;

  /* ---------- Eingaben ---------- */
  function radios(name, schluessel, nachher){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === st.opt[schluessel];
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[schluessel] = r.value; speichern(); if (nachher) nachher(); if (erstellt) erstellen(); });
    });
  }
  function formZeigen(){ $('[data-form="text"]').hidden = st.opt.form !== 'text'; }
  radios('lbForm', 'form', formZeigen); radios('lbStufe', 'stufe'); radios('lbPaar', 'paar');
  var textFeld = $('#lbText'); textFeld.value = st.text;
  textFeld.addEventListener('input', function(){ st.text = textFeld.value; speichern(); if (aktuell) $('#lbBlatt').classList.add('veraltet'); });
  $('#lbTitel').value = st.titel;
  $('#lbTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); if (aktuell) zeichnen(); });
  $('#lbLinie').value = st.opt.linie; $('#lbLinie').addEventListener('change', function(){ st.opt.linie = this.value; speichern(); if (aktuell) zeichnen(); });
  $('#lbFarbe').value = st.opt.farbe; $('#lbFarbe').addEventListener('input', function(){ st.opt.farbe = this.value; speichern(); if (aktuell) zeichnen(); });
  $('#lbToenen').checked = st.opt.toenen; $('#lbToenen').addEventListener('change', function(){ st.opt.toenen = this.checked; speichern(); if (aktuell) zeichnen(); });
  var satzFeld = $('#lbSatz'); satzFeld.value = st.satz;
  function satzInfo(){
    var n = Kern.satzZeichen(st.satz, st.opt.trenner).length;
    $('#lbSatzInfo').textContent = !st.satz.trim() ? 'Leer lassen für ein Labyrinth ohne Buchstaben.' : n < 3 ? 'Der Satz braucht mindestens 3 Buchstaben.' :
      n + ' Zeichen – der richtige Weg wird genau so lang.' + (n > 60 ? ' Bei langen Sätzen hilft eine schwerere Stufe oder eine grössere Form.' : '');
  }
  satzFeld.addEventListener('input', function(){ st.satz = satzFeld.value; speichern(); satzInfo(); if (aktuell) $('#lbBlatt').classList.add('veraltet'); });
  $('#lbTrenner').checked = st.opt.trenner;
  $('#lbTrenner').addEventListener('change', function(){ st.opt.trenner = this.checked; speichern(); satzInfo(); if (erstellt) erstellen(); });
  satzInfo();
  $('#lbMitLoesung').checked = st.opt.mitLoesung; $('#lbMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });

  /* ---------- Text in Felder zerlegen: auf eine Zeichenfläche schreiben und je Feld den Anteil Schrift messen ---------- */
  function textMaske(text, zeilenHoehe){
    var zeilen = text.split(/\n/).map(function(z){ return z.trim(); }).filter(Boolean).slice(0, 2);
    var px = 120, cv = document.createElement('canvas'), g = cv.getContext('2d'), schrift = '600 ' + px + 'px Fredoka, "Arial Rounded MT Bold", Arial, sans-serif';
    g.font = schrift;
    var breite = Math.max.apply(null, zeilen.map(function(z){ return g.measureText(z).width; })), hoch = px * 1.02;
    cv.width = Math.ceil(breite + px); cv.height = Math.ceil(hoch * zeilen.length + px * 0.5);
    g.font = schrift; g.fillStyle = '#000'; g.strokeStyle = '#000'; g.lineJoin = 'round'; g.lineWidth = px * 0.09; g.textBaseline = 'middle'; g.textAlign = 'center';
    zeilen.forEach(function(z, i){ var y = px * 0.25 + hoch * (i + 0.5); g.fillText(z, cv.width / 2, y); g.strokeText(z, cv.width / 2, y); });   // Kontur macht dünne Striche dicker
    var d = g.getImageData(0, 0, cv.width, cv.height).data, x0 = cv.width, y0 = cv.height, x1 = 0, y1 = 0;
    for (var y = 0; y < cv.height; y++) for (var x = 0; x < cv.width; x++) if (d[(y * cv.width + x) * 4 + 3] > 128){ if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0) return null;
    var zellen = zeilenHoehe * zeilen.length, groesse = (y1 - y0 + 1) / zellen, w = Math.ceil((x1 - x0 + 1) / groesse), m = [];
    for (var r = 0; r < zellen; r++){
      var reihe = [];
      for (var c = 0; c < w; c++){
        var treffer = 0;
        for (var a = 0; a < 5; a++) for (var b = 0; b < 5; b++){
          var sx = Math.floor(x0 + (c + (b + 0.5) / 5) * groesse), sy = Math.floor(y0 + (r + (a + 0.5) / 5) * groesse);
          if (sx < cv.width && sy < cv.height && d[(sy * cv.width + sx) * 4 + 3] > 128) treffer++;
        }
        reihe.push(treffer >= 11);
      }
      m.push(reihe);
    }
    return m;
  }

  /* ---------- Erstellen ---------- */
  function erstellen(){
    erstellt = true;
    var token = ++lauf, stufe = STUFEN[st.opt.stufe] || STUFEN.mittel;
    var bereit = st.opt.form === 'text' && document.fonts && document.fonts.load ? document.fonts.load('600 120px Fredoka').catch(function(){}) : Promise.resolve();
    if (st.opt.form === 'text' && !st.text.trim()){ aktuell = null; $('#lbBlatt').hidden = true; $('#lbWerkzeug').hidden = true; meldung('fehler', '<h3>Noch kein Wort</h3><p>Gib ein Wort ein oder wähle eine Figur.</p>'); return; }
    bereit.then(function(){
      if (token !== lauf || aus) return;
      var m;
      if (st.opt.form === 'text'){
        m = textMaske(st.text, stufe.text);
        if (!m){ meldung('fehler', '<h3>Kein Text erkannt</h3><p>Gib ein Wort mit Buchstaben oder Zahlen ein.</p>'); return; }
        if (m[0].length > 140){ meldung('fehler', '<h3>Das Wort ist zu lang</h3><p>Nimm ein kürzeres Wort, verteile es auf zwei Zeilen oder wähle eine leichtere Stufe.</p>'); return; }
      } else {
        var g = st.opt.form === 'stern' ? Math.round(stufe.figur * 1.45) : stufe.figur;   // der Stern füllt seine Fläche nur zum Teil
        m = Kern.figur(st.opt.form, g, st.opt.form === 'rechteck' ? Math.round(g * 1.4) : st.opt.form === 'herz' ? Math.round(g * 1.1) : g);
      }
      Kern.verbinden(m, 3);
      var zeichen = st.satz.trim() ? Kern.satzZeichen(st.satz, st.opt.trenner) : null, lab;
      function stopp(h){ aktuell = null; $('#lbBlatt').hidden = true; $('#lbWerkzeug').hidden = true; meldung('fehler', h); }
      if (zeichen && zeichen.length < 3){ stopp('<h3>Der Lösungssatz ist zu kurz</h3><p>Er braucht mindestens 3 Buchstaben – oder lass das Feld leer.</p>'); return; }
      if (zeichen){
        var r = Kern.mitSatz(m, { seed:st.seed, neu:stufe.neu }, zeichen.length);
        if (r.fehler){
          stopp(r.fehler === 'zuLang'
            ? '<h3>Der Satz passt nicht hinein</h3><p>Der Lösungssatz hat ' + zeichen.length + ' Zeichen, in diesem Labyrinth ist der längste Weg aber nur ' + r.laengster + ' Felder lang.</p><ul><li>Wähle eine schwerere Stufe (mehr Felder),</li><li>eine grössere Form oder ein längeres Wort,</li><li>oder kürze den Satz.</li></ul>'
            : '<h3>Das hat nicht geklappt</h3><p>Für diese Länge liess sich kein passender Weg finden. Versuch «Neu mischen», eine andere Stufe oder eine andere Form.</p>');
          return;
        }
        lab = r.lab;
      } else lab = Kern.erzeugen(m, { seed:st.seed, neu:stufe.neu });
      if (!lab){ meldung('fehler', '<h3>Das hat nicht geklappt</h3><p>Versuch ein anderes Wort.</p>'); return; }
      aktuell = { lab:lab, loesung:Kern.loesung(lab), paar:PAARE.filter(function(p){ return p[0] === st.opt.paar; })[0] || PAARE[0], zeichen:zeichen, satz:st.satz.trim() };
      if (zeichen) aktuell.buchstaben = Kern.buchstaben(lab, aktuell.loesung, zeichen, st.seed * 31 + 7);
      weg = [lab.start];
      $('#lbZeigeLoesung').setAttribute('aria-pressed', 'false');
      zeichnen();
      var n = 0; lab.maske.forEach(function(z){ z.forEach(function(v){ if (v) n++; }); });
      var feldMm = 186 / (lab.w + 4);   // so breit wird ein Feld etwa auf A4
      meldung(zeichen && feldMm < 4.5 ? 'warnung' : 'erfolg', '<p><b>Fertig!</b> Labyrinth mit ' + n + ' Feldern, der Weg ist ' + aktuell.loesung.length + ' Felder lang' +
        (zeichen ? ' – genau so lang wie der Lösungssatz' : '') + '. Du kannst ihn hier am Bildschirm suchen: vom ' + aktuell.paar[1] + ' aus ziehen.</p>' +
        (zeichen && feldMm < 4.5 ? '<p>Achtung: Gedruckt werden die Buchstaben sehr klein (etwa ' + feldMm.toFixed(1) + ' mm pro Feld). Wähle eine leichtere Stufe oder ein kürzeres Wort.</p>' : ''));
    });
  }

  /* ---------- Zeichnen ---------- */
  function labSvg(mitWeg){
    var lab = aktuell.lab, S = 10, gross = Math.max(11, Math.min(42, Math.max(lab.h, lab.w * 0.5) * S * 0.11)), rand = Math.round(gross * 1.25),
      w = lab.w * S + 2 * rand, h = lab.h * S + 2 * rand, p = aktuell.paar;
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', (-rand) + ' ' + (-rand) + ' ' + w + ' ' + h);
    s.setAttribute('class', aktuell.buchstaben ? 'lb-svg mit-satz' : 'lb-svg');
    s.style.setProperty('--seite', lab.w / lab.h);
    var h2 = [];
    if (st.opt.toenen){
      var t = [];
      lab.maske.forEach(function(z, r){ z.forEach(function(v, c){ if (v) t.push('M' + c * S + ' ' + r * S + 'h' + S + 'v' + S + 'h-' + S + 'z'); }); });
      h2.push('<path class="lb-ton" d="' + t.join('') + '"/>');
    }
    var lw = parseFloat(st.opt.linie) || 1.4, a = lab.start, z = lab.ziel;
    h2.push('<path class="lb-loesung" d="' + linie(aktuell.loesung) + '" style="stroke-width:' + Math.max(2.4, S * 0.38) + '"/>');
    if (!mitWeg) h2.push('<path class="lb-weg" d="" style="stroke-width:' + Math.max(2.4, S * 0.38) + '"/>');
    h2.push('<path class="lb-waende" d="' + Kern.waende(lab) + '" style="stroke:' + esc(st.opt.farbe) + ';stroke-width:' + lw + '"/>');
    if (aktuell.buchstaben){
      var b = [];
      aktuell.buchstaben.forEach(function(zeile, r){ zeile.forEach(function(ch, c){ if (ch) b.push('<text x="' + (c * S + S / 2) + '" y="' + (r * S + S / 2 + 0.4) + '">' + esc(ch) + '</text>'); }); });
      h2.push('<g class="lb-buchstaben">' + b.join('') + '</g>');
    }
    function draussen(zelle, seite){   // Mitte ausserhalb der Öffnung
      var d = gross * 0.62, x = zelle[1] * S + S / 2, y = zelle[0] * S + S / 2;
      if (seite === Kern.L) x = zelle[1] * S - d; else if (seite === Kern.R) x = (zelle[1] + 1) * S + d; else if (seite === Kern.O) y = zelle[0] * S - d; else y = (zelle[0] + 1) * S + d;
      return 'x="' + z2(x) + '" y="' + z2(y) + '"';
    }
    h2.push('<text class="lb-figur" ' + draussen(a, lab.startSeite) + ' style="font-size:' + z2(gross) + 'px">' + p[1] + '</text>');
    h2.push('<text class="lb-figur" ' + draussen(z, lab.zielSeite) + ' style="font-size:' + z2(gross) + 'px">' + p[2] + '</text>');
    s.innerHTML = h2.join('');
    return s;
  }
  function z2(x){ return String(Math.round(x * 10) / 10); }
  function linie(zellen){ return zellen.map(function(q, i){ return (i ? 'L' : 'M') + (q[1] * 10 + 5) + ' ' + (q[0] * 10 + 5); }).join(''); }
  function zeichnen(){
    var titel = st.titel.trim() || 'Finde den Weg!', p = aktuell.paar, blatt = $('#lbBlatt'), loes = $('#lbLoesung');
    blatt.classList.remove('veraltet', 'zeige-loesung', 'geschafft');
    var auftrag = p[3] ? 'Hilf ' + p[3] + ' ' + p[1] + ' ' + p[4] + ' ' + p[2] + '!' : 'Finde den Weg vom Start ' + p[1] + ' zum Ziel ' + p[2] + '!';
    var mitSatz = !!aktuell.buchstaben;
    blatt.innerHTML = '<h2>' + esc(titel) + '</h2><p class="lb-anleitung">' + auftrag + ' Zeichne den Weg durch das Labyrinth, ohne eine Wand zu überqueren.' +
        (mitSatz ? ' Auf dem richtigen Weg liegen Buchstaben – sie ergeben einen Satz. Schreibe ihn auf die Linie.' : '') + '</p>' +
      '<div class="lb-feld"></div>' +
      (mitSatz ? '<div class="lb-antwort"><span>Lösungssatz:</span><span class="lb-linie"></span>' + (aktuell.zeichen.length > 28 ? '<span></span><span class="lb-linie"></span>' : '') + '</div>' : '') +
      '<p class="lb-fortschritt nur-bildschirm" id="lbFortschritt" aria-live="polite"></p>';
    var svg = labSvg(false);
    blatt.querySelector('.lb-feld').appendChild(svg);
    loes.innerHTML = '<h2>Lösung – ' + esc(titel) + '</h2><div class="lb-feld"></div>' + (mitSatz ? '<p class="lb-satz-loesung"><b>Lösungssatz:</b> ' + esc(aktuell.satz) + '</p>' : '');
    loes.querySelector('.lb-feld').appendChild(labSvg(true));
    blatt.hidden = false; $('#lbWerkzeug').hidden = false; leer();
    wegVerbinden(svg); wegZeichnen();
  }

  /* ---------- Am Bildschirm lösen: vom Start aus durch die Gänge ziehen (zurückziehen löscht) ---------- */
  function wegVerbinden(svg){
    var zieht = false;
    function feld(ev){
      var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      var m = svg.getScreenCTM(); if (!m) return null;
      var q = pt.matrixTransform(m.inverse()), r = Math.floor(q.y / 10), c = Math.floor(q.x / 10), lab = aktuell.lab;
      return r >= 0 && c >= 0 && r < lab.h && c < lab.w && lab.maske[r][c] ? [r, c] : null;
    }
    function schritt(f){
      if (!f) return;
      var ende = weg[weg.length - 1];
      if (f[0] === ende[0] && f[1] === ende[1]) return;
      if (weg.length > 1 && f[0] === weg[weg.length - 2][0] && f[1] === weg[weg.length - 2][1]){ weg.pop(); wegZeichnen(); return; }
      var i = weg.findIndex(function(q){ return q[0] === f[0] && q[1] === f[1]; });
      if (i >= 0){ weg = weg.slice(0, i + 1); wegZeichnen(); return; }    // auf den eigenen Weg zurück: dort weitermachen
      if (Kern.offenZwischen(aktuell.lab, ende, f)){ weg.push(f); wegZeichnen(); }
    }
    svg.addEventListener('pointerdown', function(ev){
      var f = feld(ev); if (!f) return;
      var i = weg.findIndex(function(q){ return q[0] === f[0] && q[1] === f[1]; });
      if (i < 0 && !Kern.offenZwischen(aktuell.lab, weg[weg.length - 1], f)) return;
      ev.preventDefault(); zieht = true; try { svg.setPointerCapture(ev.pointerId); } catch(x){}
      schritt(f);
    });
    svg.addEventListener('pointermove', function(ev){ if (zieht) schritt(feld(ev)); });
    function ende(){ zieht = false; }
    svg.addEventListener('pointerup', ende); svg.addEventListener('pointercancel', ende);
  }
  function wegZeichnen(){
    var pfad = bereich.querySelector('#lbBlatt .lb-weg'); if (!pfad) return;
    pfad.setAttribute('d', weg.length > 1 ? linie(weg) : '');
    var z = aktuell.lab.ziel, fertig = weg[weg.length - 1][0] === z[0] && weg[weg.length - 1][1] === z[1], p = $('#lbFortschritt');
    $('#lbBlatt').classList.toggle('geschafft', fertig);
    if (p){ p.className = 'lb-fortschritt nur-bildschirm' + (fertig ? ' fertig' : '');
      p.textContent = fertig ? '🎉 Geschafft! ' + (aktuell.paar[3] ? aktuell.paar[1] + ' hat ' + aktuell.paar[2] + ' gefunden.' : 'Du hast das Ziel gefunden.') + (aktuell.buchstaben ? ' Der Satz lautet: «' + aktuell.satz + '»' : '') : weg.length > 1 ? 'Weiter so! Zurückziehen löscht den Weg wieder.' : 'Starte bei ' + aktuell.paar[1] + ' und ziehe durch die Gänge.'; }
  }

  /* ---------- Werkzeuge ---------- */
  $('#lbLos').addEventListener('click', erstellen);
  $('#lbMischen').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erstellen(); });
  $('#lbZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#lbBlatt').classList.toggle('zeige-loesung', an);
  });
  $('#lbWegWeg').addEventListener('click', function(){ if (!aktuell) return; weg = [aktuell.lab.start]; wegZeichnen(); });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  $('#lbDrucken').addEventListener('click', function(){ druckVorbereiten(); window.print(); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){ $('#lbDrucken').hidden = true; Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#lbHerunterladen').hidden = false; }); }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung', 'geschafft', 'veraltet');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm, .lb-weg'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('[id]'), function(n){ n.removeAttribute('id'); });
    return k;
  }
  $('#lbHerunterladen').addEventListener('click', function(){
    if (!aktuell || !speicherOrt) return;
    var inhalt = sauber($('#lbBlatt')).outerHTML;
    if (st.opt.mitLoesung){ var l = sauber($('#lbLoesung')); l.classList.add('neue-seite'); inhalt += l.outerHTML; }
    speicherOrt.save({ filename:'Labyrinth.html', data:Labor.blattDatei('Labyrinth', inhalt, '.lb-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  formZeigen(); leer();
  try { if ((st.opt.form !== 'text' || st.text.trim()) && sessionStorage.getItem(TAB)) erstellen(); } catch(x){}

  return function stopp(){ aus = true; lauf++; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
