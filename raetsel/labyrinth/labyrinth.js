/* Rätsellabor – Generator «Labyrinth» mit zwei Arten:
   – «Mit Start und Ziel»: ein Labyrinth als Rechteck, Kreis, Herz oder Stern, Start links, Ziel rechts
     (mit einem Paar wie Maus → Käse). Darin ein «perfektes» Labyrinth (genau ein Weg zwischen zwei Feldern).
   – «Mit Lösungssatz»: in jedem Feld ein Buchstabe, auf dem richtigen Weg steht der Satz (labyrinth-satz.js).
   Beide am Bildschirm lösbar (Weg ziehen), Druck mit Lösungsblatt. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var O = 1, R = 2, U = 4, L = 8;   // offene Seiten eines Felds: oben, rechts, unten, links
  var RICHTUNG = [[O, -1, 0], [R, 0, 1], [U, 1, 0], [L, 0, -1]], GEGEN = { 1:4, 2:8, 4:1, 8:2 };
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;   // kleine Startwerte gut durchmischen
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
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
  /* Zufällige Form: ein Umriss um die Mitte, dessen Radius mit ein paar Wellen schwankt (immer zusammenhängend) */
  function zufallsRadius(rnd){
    var wellen = [], n = 3 + Math.floor(rnd() * 3), max = 0, t;
    for (var i = 0; i < n; i++) wellen.push({ f:2 + i + (rnd() < 0.35 ? 1 : 0), a:(0.12 + rnd() * 0.22) / (1 + i * 0.45), p:rnd() * Math.PI * 2 });
    function roh(t){ var r = 0.8; wellen.forEach(function(q){ r += q.a * Math.cos(q.f * t + q.p); }); return Math.max(0.32, r); }
    for (t = 0; t < Math.PI * 2; t += 0.02) max = Math.max(max, roh(t));
    return function(t){ return roh(t) / max * 0.98; };
  }
  function figur(art, h, w, seed){
    var m = leer(h, w), radius = art === 'zufall' ? zufallsRadius(zufall((seed || 1) * 7919 + 17)) : null;
    for (var r = 0; r < h; r++) for (var c = 0; c < w; c++){
      var x = (c + 0.5) / w * 2 - 1, y = (r + 0.5) / h * 2 - 1;   // −1 … 1, y nach unten
      if (art === 'kreis') m[r][c] = x * x + y * y <= 1;
      else if (art === 'herz'){ var X = x * 1.18, Y = -y * 1.18 + 0.18; m[r][c] = Math.pow(X * X + Y * Y - 1, 3) - X * X * Y * Y * Y <= 0; }
      else if (art === 'stern') m[r][c] = imVieleck(x * 1.02, y * 1.02, STERN);
      else if (art === 'zufall') m[r][c] = Math.sqrt(x * x + y * y) <= radius(Math.atan2(y, x));
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
    var lab = { h:h, w:w, maske:m, offen:offen, start:sz.start, ziel:sz.ziel };
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
  /* Wände als SVG-Pfad (Feldgrösse 10): innere Wände einmal, Aussenrand ganz; Öffnungen bei Start (links) und Ziel (rechts) */
  function waende(lab){
    var S = 10, d = [], m = lab.maske;
    function drin(r, c){ return r >= 0 && c >= 0 && r < lab.h && c < lab.w && m[r][c]; }
    for (var r = 0; r < lab.h; r++) for (var c = 0; c < lab.w; c++){
      if (!m[r][c]) continue;
      var x = c * S, y = r * S, o = lab.offen[r][c];
      if (!drin(r - 1, c)) d.push('M' + x + ' ' + y + 'h' + S);                                 // oben (Aussenrand)
      if (!drin(r, c - 1) && !(r === lab.start[0] && c === lab.start[1])) d.push('M' + x + ' ' + y + 'v' + S);   // links (Aussenrand)
      if (!(o & R) && !(r === lab.ziel[0] && c === lab.ziel[1] && !drin(r, c + 1))) d.push('M' + (x + S) + ' ' + y + 'v' + S);  // rechts
      if (!(o & U)) d.push('M' + x + ' ' + (y + S) + 'h' + S);                                    // unten
    }
    return d.join('');
  }
  return { erzeugen:erzeugen, loesung:loesung, verbinden:verbinden, teile:teile, figur:figur, startZiel:startZiel, waende:waende, offenZwischen:offenZwischen, zufall:zufall };
})();
/* KERN-ENDE */

/* ===== Vorlage ===== */
var PAARE = [   // Kürzel, Start, Ziel, «Hilf … », «… zum …»
  ['pfeile', '▶', '🏁', '', 'zum Ziel'],
  ['maus', '🐭', '🧀', 'der Maus', 'zum Käse'], ['hase', '🐰', '🥕', 'dem Hasen', 'zum Rüebli'], ['biene', '🐝', '🌻', 'der Biene', 'zur Blume'],
  ['rakete', '🚀', '🪐', 'der Rakete', 'zum Planeten'], ['hund', '🐶', '🦴', 'dem Hund', 'zum Knochen'], ['pirat', '🦜', '💰', 'dem Papagei', 'zum Schatz']
];
var STUFEN = { leicht:{ figur:10, neu:0.55, name:'Leicht' }, mittel:{ figur:16, neu:0.7, name:'Mittel' }, schwer:{ figur:24, neu:0.8, name:'Schwer' }, sehrschwer:{ figur:34, neu:0.85, name:'Sehr schwer' } };
var FORMEN = { rechteck:'Rechteck', kreis:'Kreis', herz:'Herz', stern:'Stern', zufall:'Zufall' };
var KOPF = '<div class="lb">' +
  '<header class="lb-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Labyrinth</h1>' +
    '<p>Ein Labyrinth als Rechteck, Kreis, Herz, Stern oder in einer zufälligen Form – mit einem versteckten Lösungssatz (in jedem Feld ein Buchstabe, nur auf dem richtigen Weg ergeben sie deinen Satz) – oder ein Labyrinth, dessen richtiger Weg deinen Satz schreibt.</p></header>' +
  '<div class="lb-art-ort"></div></div>';
// Karte 1 (bei allen Arten gleich): welche Art von Labyrinth?
function artKarte(art){
  function wahl(wert, titel, text){ return '<label><input type="radio" name="lbArt" value="' + wert + '"' + (art === wert ? ' checked' : '') + '><span><b>' + titel + '</b><small>' + text + '</small></span></label>'; }
  return '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Art des Labyrinths</h2></div></div>' +
    '<div class="lb-art" role="radiogroup" aria-label="Art des Labyrinths">' +
      wahl('figur', 'Mit Start und Ziel', 'Rechteck, Kreis, Herz, Stern oder eine zufällige Form') +
      wahl('satz', 'Mit Lösungssatz', 'In jedem Feld ein Buchstabe – der richtige Weg ergibt deinen Satz') +
      wahl('schrift', 'Weg schreibt den Satz', 'Zeichnet man den richtigen Weg nach, erscheint dein Satz in Blockschrift') +
    '</div></div>';
}
function figurVorlage(karte){
  return '<div class="lb-layout"><section class="lb-eingabe" aria-label="Eingaben">' + karte +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Form</h2><p>«Zufall» erfindet bei jedem Erstellen und Mischen eine neue Form.</p></div></div>' +
      '<div class="lb-wahl" role="radiogroup" aria-label="Form">' +
        Object.keys(FORMEN).map(function(f){ return '<label><input type="radio" name="lbForm" value="' + f + '"><span>' + FORMEN[f] + '</span></label>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Schwierigkeit</h2><p>Je schwerer, desto schmaler die Gänge und desto mehr Abzweigungen.</p></div></div>' +
      '<div class="lb-stufen" role="radiogroup" aria-label="Schwierigkeit">' +
        Object.keys(STUFEN).map(function(k){ return '<label class="lb-stufe"><input type="radio" name="lbStufe" value="' + k + '"><span>' + STUFEN[k].name + '</span></label>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">4</span><div><h2>Start und Ziel</h2><p>Wer sucht den Weg wohin?</p></div></div>' +
      '<div class="lb-paare" role="radiogroup" aria-label="Start und Ziel">' +
        PAARE.map(function(p){ return '<label><input type="radio" name="lbPaar" value="' + p[0] + '"><span>' + p[1] + ' → ' + p[2] + '</span></label>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
      '<div class="opt-raster"><label for="lbTitel">Titel auf dem Blatt</label><input type="text" id="lbTitel" maxlength="60">' +
        '<label for="lbLinie">Linien</label><select id="lbLinie"><option value="0.9">dünn</option><option value="1.4">mittel</option><option value="2">dick</option></select>' +
        '<label for="lbFarbe">Farbe der Wände</label><input type="color" id="lbFarbe"></div>' +
      '<label class="opt"><input type="checkbox" id="lbToenen"><span>Form leicht einfärben</span></label>' +
    '</details></div>' +
    '<button type="button" class="btn primary gross" id="lbLos">Labyrinth erstellen</button>' +
  '</section>' +
  '<section class="lb-ausgabe" aria-label="Ergebnis">' +
    '<div id="lbMeldung" aria-live="polite"></div>' +
    '<div class="leer-zustand" id="lbLeer"><h2>Noch kein Labyrinth</h2><p>In drei Schritten zum Arbeitsblatt:</p><ol>' +
      '<li>Eine Form wählen</li><li>Schwierigkeit und Start/Ziel wählen</li><li>«Labyrinth erstellen» klicken</li></ol></div>' +
    '<div class="lb-werkzeug" id="lbWerkzeug" hidden>' +
      '<button type="button" class="btn klein" id="lbMischen" title="Gleiche Form, neues Labyrinth">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="lbZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="lbWegWeg">Weg löschen</button>' +
      '<span class="abstand"></span>' +
      Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="lbMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="lbDrucken">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="lbHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<article class="lb-blatt" id="lbBlatt" hidden></article>' +
    '<article class="lb-blatt lb-loesungsblatt" id="lbLoesung" aria-hidden="true"></article>' +
  '</section></div>';
}

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M3 3h18v18H3zM7 3v10M7 17v4M11 7h6M11 7v10h4M17 11v10M3 17h4"/></svg>';

Labor.registriere({
  id:'labyrinth',
  titel:'Labyrinth',
  kurz:'Labyrinthe mit Start und Ziel, mit Lösungssatz oder mit einem Weg, der den Satz schreibt',
  beschreibung:'Ein Labyrinth als Rechteck, Kreis, Herz, Stern oder in einer zufälligen Form – mit einem versteckten Lösungssatz (in jedem Feld ein Buchstabe, nur auf dem richtigen Weg ergeben sie deinen Satz) – oder eines, dessen richtiger Weg deinen Satz in Blockschrift schreibt.',
  merkmale:['Figuren und Zufallsformen', 'Mit Lösungssatz', 'Weg schreibt den Satz', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/labyrinth/labyrinth.css',
  html:KOPF,
  start:starte
});

/* ===== Art wählen: die passende Oberfläche einsetzen ===== */
function starte(bereich){
  var OPT = 'labyrinth-einstellungen', ort = bereich.querySelector('.lb-art-ort'), art = 'figur', stopp = null;
  var ARTEN = { satz:window.LabyrinthSatz, schrift:window.LabyrinthSchrift };   // weitere Arten (eigene Dateien); sonst «figur»
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o && ARTEN[o.art]) art = o.art; } catch(x){}
  function zeige(neu){
    if (stopp){ try { stopp(); } catch(e){ console.error(e); } stopp = null; }
    art = neu;
    try { var o = JSON.parse(localStorage.getItem(OPT)) || {}; o.art = art; localStorage.setItem(OPT, JSON.stringify(o)); } catch(x){}
    var karte = artKarte(art);
    ort.innerHTML = ARTEN[art] ? ARTEN[art].vorlage(karte) : figurVorlage(karte);
    [].forEach.call(ort.querySelectorAll('input[name="lbArt"]'), function(r){
      r.addEventListener('change', function(){ if (r.checked && r.value !== art){ zeige(r.value); var f = ort.querySelector('input[name="lbArt"]:checked'); if (f) f.focus(); } });
    });
    try { stopp = ARTEN[art] ? ARTEN[art].starte(ort) : starteFigur(ort); } catch(e){ console.error(e); }
  }
  zeige(art);
  return function(){ if (stopp) stopp(); };
}

/* ===== Bedienung «Mit Start und Ziel» ===== */
function starteFigur(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false, NS = 'http://www.w3.org/2000/svg';
  var TAB = 'labyrinth-eingaben', OPT = 'labyrinth-einstellungen';
  var STANDARD = { form:'rechteck', stufe:'mittel', paar:'pfeile', linie:'1.4', farbe:'#1C1714', toenen:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { titel:'', seed:1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  if (!FORMEN[st.opt.form]) st.opt.form = 'rechteck';   // die frühere Wortform gibt es nicht mehr
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.titel = String(e.titel || ''); st.seed = +e.seed || 1; } } catch(x){}
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ titel:st.titel, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#lbMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; leer(); }
  function leer(){ $('#lbLeer').hidden = !!aktuell || !!$('#lbMeldung').innerHTML; }
  var aktuell = null, weg = [], erstellt = false;

  /* ---------- Eingaben ---------- */
  function radios(name, schluessel, nachher){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === st.opt[schluessel];
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[schluessel] = r.value; speichern(); if (nachher) nachher(); if (erstellt) erstellen(); });
    });
  }
  radios('lbForm', 'form'); radios('lbStufe', 'stufe'); radios('lbPaar', 'paar');
  $('#lbTitel').value = st.titel;
  $('#lbTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); if (aktuell) zeichnen(); });
  $('#lbLinie').value = st.opt.linie; $('#lbLinie').addEventListener('change', function(){ st.opt.linie = this.value; speichern(); if (aktuell) zeichnen(); });
  $('#lbFarbe').value = st.opt.farbe; $('#lbFarbe').addEventListener('input', function(){ st.opt.farbe = this.value; speichern(); if (aktuell) zeichnen(); });
  $('#lbToenen').checked = st.opt.toenen; $('#lbToenen').addEventListener('change', function(){ st.opt.toenen = this.checked; speichern(); if (aktuell) zeichnen(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); if (aktuell) zeichnen(); });
  $('#lbMitLoesung').checked = st.opt.mitLoesung; $('#lbMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });

  /* ---------- Erstellen ---------- */
  function erstellen(){
    erstellt = true;
    var stufe = STUFEN[st.opt.stufe] || STUFEN.mittel;
    (function(){
      var g = st.opt.form === 'stern' ? Math.round(stufe.figur * 1.45) : stufe.figur;   // der Stern füllt seine Fläche nur zum Teil
      var breit = { rechteck:1.4, herz:1.1, zufall:1.2 }[st.opt.form] || 1;
      var m = Kern.figur(st.opt.form, g, Math.round(g * breit), st.seed);
      Kern.verbinden(m, 3);
      var lab = Kern.erzeugen(m, { seed:st.seed, neu:stufe.neu });
      if (!lab){ meldung('fehler', '<h3>Das hat nicht geklappt</h3><p>Klicke noch einmal auf «Neu mischen».</p>'); return; }
      aktuell = { lab:lab, loesung:Kern.loesung(lab), paar:PAARE.filter(function(p){ return p[0] === st.opt.paar; })[0] || PAARE[0] };
      weg = [lab.start];
      $('#lbZeigeLoesung').setAttribute('aria-pressed', 'false');
      zeichnen();
      var n = 0; lab.maske.forEach(function(z){ z.forEach(function(v){ if (v) n++; }); });
      meldung('erfolg', '<p><b>Fertig!</b> Labyrinth mit ' + n + ' Feldern, der Weg ist ' + aktuell.loesung.length + ' Felder lang. Du kannst ihn hier am Bildschirm suchen: vom ' + aktuell.paar[1] + ' aus ziehen.</p>');
    })();
  }

  /* ---------- Zeichnen ---------- */
  function labSvg(mitWeg){
    var lab = aktuell.lab, S = 10, gross = Math.max(11, Math.min(42, Math.max(lab.h, lab.w * 0.5) * S * 0.11)), p = aktuell.paar;
    var lw = parseFloat(st.opt.linie) || 1.4, a = lab.start, z = lab.ziel;
    // Start- und Zielbild neben die Öffnung setzen – mit Abstand zu allen Wänden auf ihrer Höhe
    var halb = gross * 0.62, abstand = Math.max(2.5, S * 0.3) + lw / 2;
    function stelle(zelle, links){
      var yc = zelle[0] * S + S / 2, r0 = Math.max(0, Math.floor((yc - halb - abstand) / S)), r1 = Math.min(lab.h - 1, Math.floor((yc + halb + abstand) / S)), grenze = links ? Infinity : -Infinity;
      for (var r = r0; r <= r1; r++){
        var zeile = lab.maske[r];
        if (links){ for (var c = 0; c < lab.w; c++) if (zeile[c]){ grenze = Math.min(grenze, c * S); break; } }
        else { for (var c2 = lab.w - 1; c2 >= 0; c2--) if (zeile[c2]){ grenze = Math.max(grenze, (c2 + 1) * S); break; } }
      }
      return { x:links ? grenze - abstand - halb : grenze + abstand + halb, y:yc };
    }
    var sa = stelle(a, true), sz = stelle(z, false), pad = 2 + lw;
    var x0 = Math.min(-pad, sa.x - halb - pad), x1 = Math.max(lab.w * S + pad, sz.x + halb + pad);
    var y0 = Math.min(-pad, sa.y - halb - pad, sz.y - halb - pad), y1 = Math.max(lab.h * S + pad, sa.y + halb + pad, sz.y + halb + pad);
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', z2(x0) + ' ' + z2(y0) + ' ' + z2(x1 - x0) + ' ' + z2(y1 - y0));
    s.setAttribute('class', 'lb-svg');
    s.style.setProperty('--seite', lab.w / lab.h);
    var h2 = [];
    if (st.opt.toenen){
      var t = [];
      lab.maske.forEach(function(zl, r){ zl.forEach(function(v, c){ if (v) t.push('M' + c * S + ' ' + r * S + 'h' + S + 'v' + S + 'h-' + S + 'z'); }); });
      h2.push('<path class="lb-ton" d="' + t.join('') + '"/>');
    }
    h2.push('<path class="lb-loesung" d="' + linie(aktuell.loesung) + '" style="stroke-width:' + Math.max(2.4, S * 0.38) + '"/>');
    if (!mitWeg) h2.push('<path class="lb-weg" d="" style="stroke-width:' + Math.max(2.4, S * 0.38) + '"/>');
    h2.push('<path class="lb-waende" d="' + Kern.waende(lab) + '" style="stroke:' + esc(st.opt.farbe) + ';stroke-width:' + lw + '"/>');
    h2.push('<text class="lb-figur" x="' + z2(sa.x) + '" y="' + z2(sa.y) + '" style="font-size:' + z2(gross) + 'px">' + p[1] + '</text>');
    h2.push('<text class="lb-figur" x="' + z2(sz.x) + '" y="' + z2(sz.y) + '" style="font-size:' + z2(gross) + 'px">' + p[2] + '</text>');
    s.innerHTML = h2.join('');
    return s;
  }
  function z2(x){ return String(Math.round(x * 10) / 10); }
  function linie(zellen){ return zellen.map(function(q, i){ return (i ? 'L' : 'M') + (q[1] * 10 + 5) + ' ' + (q[0] * 10 + 5); }).join(''); }
  function zeichnen(){
    var titel = st.titel.trim() || 'Finde den Weg!', p = aktuell.paar, blatt = $('#lbBlatt'), loes = $('#lbLoesung'), o = st.opt;
    blatt.classList.remove('veraltet', 'zeige-loesung', 'geschafft');
    var auftrag = p[3] ? 'Hilf ' + p[3] + ' ' + p[1] + ' ' + p[4] + ' ' + p[2] + '!' : 'Finde den Weg vom Start ' + p[1] + ' zum Ziel ' + p[2] + '!';
    blatt.innerHTML = (o.titelAn ? '<h2>' + esc(titel) + '</h2>' : '') +
      (o.anleitungAn ? '<p class="lb-anleitung">' + auftrag + ' Zeichne den Weg durch das Labyrinth, ohne eine Wand zu überqueren.</p>' : '') +
      '<div class="lb-feld"></div><p class="lb-fortschritt nur-bildschirm" id="lbFortschritt" aria-live="polite"></p>';
    var svg = labSvg(false);
    blatt.querySelector('.lb-feld').appendChild(svg);
    loes.innerHTML = '<h2>Lösung' + (o.titelAn ? ' – ' + esc(titel) : '') + '</h2><div class="lb-feld"></div>';
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
      p.textContent = fertig ? '🎉 Geschafft! ' + (aktuell.paar[3] ? aktuell.paar[1] + ' hat ' + aktuell.paar[2] + ' gefunden.' : 'Du hast das Ziel gefunden.') : weg.length > 1 ? 'Weiter so! Zurückziehen löscht den Weg wieder.' : 'Starte bei ' + aktuell.paar[1] + ' und ziehe durch die Gänge.'; }
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
  Labor.pdfKnopf($('#lbDrucken'), function(){ return aktuell && { blaetter:[$('#lbBlatt'), st.opt.mitLoesung && $('#lbLoesung')], name:Labor.pdfName('Labyrinth', st.titel) }; }, function(t){ meldung('fehler', '<p>' + Labor.esc(t) + '</p>'); });
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

  leer();
  try { if (sessionStorage.getItem(TAB)) erstellen(); } catch(x){}

  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
