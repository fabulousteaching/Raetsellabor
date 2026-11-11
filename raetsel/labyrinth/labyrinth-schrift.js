/* Rätsellabor – Labyrinth, Art «Weg schreibt den Satz» (wird von labyrinth.js eingebunden, vor diesem laden)
   Ein Labyrinth, dessen einziger Weg vom Start zum Ziel den Satz schreibt: Zeichnet man ihn nach, erscheinen die Buchstaben.
   Aufbau: Jeder Buchstabe ist eine Blockschrift-Figur (5 Blöcke hoch, 3–5 breit, nur waagrechte und senkrechte Striche).
   Jeder Block wird zu 2 × 2 Feldern; der Weg läuft einmal ganz um die Figur herum (hinauf auf der einen Seite eines Strichs,
   zurück auf der anderen) – so besucht er jedes Feld der Figur genau einmal. Ringe in der Figur (A, B, D, O …) werden an
   einer Stelle aufgetrennt, damit der Weg nicht im Kreis läuft (gezeichnet: ein schmaler Spalt). Unter jeder Zeile läuft
   der Weg auf einer Grundlinie von Buchstabe zu Buchstabe, am Zeilenende hinunter zur nächsten Zeile (die nächste Zeile
   läuft er rückwärts ab). Alle übrigen Felder werden als Irrwege angehängt («perfektes» Labyrinth: genau ein Weg). */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var O = 1, R = 2, U = 4, L = 8;   // offene Seiten eines Felds: oben, rechts, unten, links
  var RICHTUNG = [[O, -1, 0], [R, 0, 1], [U, 1, 0], [L, 0, -1]], GEGEN = { 1:4, 2:8, 4:1, 8:2 };
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* Blockschrift: 5 Zeilen, '#' = Block. Jede Figur hängt über waagrechte/senkrechte Nachbarn zusammen und hat unten
     mindestens einen Block (dort führt der Weg hinein und hinaus). Schräge Striche als Treppen (N, Z) oder eckig (K, V, X). */
  var SCHRIFT = {
    A:['###', '#.#', '###', '#.#', '#.#'], B:['###', '#.#', '##.', '#.#', '###'], C:['###', '#..', '#..', '#..', '###'],
    D:['###.', '#.##', '#..#', '#.##', '###.'], E:['###', '#..', '###', '#..', '###'], F:['###', '#..', '##.', '#..', '#..'],
    G:['####', '#...', '#.##', '#..#', '####'], H:['#.#', '#.#', '###', '#.#', '#.#'], I:['###', '.#.', '.#.', '.#.', '###'],
    J:['..#', '..#', '..#', '#.#', '###'], K:['#.##', '#.#.', '###.', '#.#.', '#.##'], L:['#..', '#..', '#..', '#..', '###'],
    M:['#####', '#.#.#', '#.#.#', '#.#.#', '#.#.#'], N:['#...#', '###.#', '#.###', '#...#', '#...#'], O:['###', '#.#', '#.#', '#.#', '###'],
    P:['###', '#.#', '###', '#..', '#..'], Q:['###.', '#.#.', '#.#.', '###.', '..##'], R:['###.', '#.#.', '###.', '#.##', '#..#'],
    S:['###', '#..', '###', '..#', '###'], T:['###', '.#.', '.#.', '.#.', '.#.'], U:['#.#', '#.#', '#.#', '#.#', '###'],
    V:['#.#', '#.#', '#.#', '###', '.#.'], W:['#.#.#', '#.#.#', '#.#.#', '#.#.#', '#####'], X:['#.#', '###', '.#.', '###', '#.#'],
    Y:['#.#', '#.#', '###', '.#.', '.#.'], Z:['###', '..#', '.##', '##.', '###'],
    0:['###', '#.#', '#.#', '#.#', '###'], 1:['.#.', '##.', '.#.', '.#.', '###'], 2:['###', '..#', '###', '#..', '###'],
    3:['###', '..#', '###', '..#', '###'], 4:['#.#', '#.#', '###', '..#', '..#'], 5:['###', '#..', '###', '..#', '###'],
    6:['###', '#..', '###', '#.#', '###'], 7:['###', '..#', '..#', '..#', '..#'], 8:['###', '#.#', '###', '#.#', '###'],
    9:['###', '#.#', '###', '..#', '###']
  };
  var HOEHE = 5, LUECKE = 1, WORTLUECKE = 3;   // in Blöcken: Buchstabenhöhe, Abstand zwischen Buchstaben und zwischen Wörtern
  var RAND = 3, OBEN = 2, ZEILE = 13;           // in Feldern: Rand links/rechts, oben; Höhe einer Textzeile (10 Buchstabe, 1 Lücke, 1 Grundlinie, 1 Abstand)

  /* Satz → Wörter aus Zeichen, die es in der Schrift gibt (Grossbuchstaben; Ä → AE, ß → SS; anderes fällt weg) */
  function woerter(text){
    var t = String(text || '').normalize('NFC').toLocaleUpperCase('de-CH').replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ẞ|ß/g, 'SS');
    return t.split(/\s+/).map(function(w){ return Array.from(w).filter(function(c){ return SCHRIFT[c]; }).join(''); }).filter(Boolean);
  }
  function breite(c){ return SCHRIFT[c][0].length; }
  function wortBreite(w){ return Array.from(w).reduce(function(s, c, i){ return s + breite(c) + (i ? LUECKE : 0); }, 0); }
  // Wörter in Zeilen von höchstens max Blöcken; ein zu langes Wort steht allein (→ breitere Zeile)
  function umbrechen(ws, max){
    var zeilen = [], z = [], b = 0;
    ws.forEach(function(w){
      var wb = wortBreite(w);
      if (z.length && b + WORTLUECKE + wb > max){ zeilen.push(z); z = []; b = 0; }
      b += (z.length ? WORTLUECKE : 0) + wb; z.push(w);
    });
    if (z.length) zeilen.push(z);
    return zeilen;
  }
  function zeilenBreite(z){ return z.reduce(function(s, w, i){ return s + wortBreite(w) + (i ? WORTLUECKE : 0); }, 0); }
  /* Umbruch, der die Felder am grössten macht (Platz: verfuegbar.b × verfuegbar.h Pixel) */
  function anordnen(ws, verfuegbar){
    var best = null, laengstes = Math.max.apply(null, ws.map(wortBreite));
    for (var max = laengstes; max <= Math.max(laengstes, 60); max++){
      var zeilen = umbrechen(ws, max), wb = Math.max.apply(null, zeilen.map(zeilenBreite));
      var W = 2 * wb + 2 * RAND, H = OBEN + zeilen.length * ZEILE, s = Math.min(verfuegbar.b / (W + 2), verfuegbar.h / (H + 1));
      if (!best || s > best.s + 1e-9) best = { zeilen:zeilen, W:W, H:H, s:s };
    }
    return best;
  }

  /* Weg um eine Figur: Blöcke [[r, c]] (r, c in Blöcken), ein zufälliger Spannbaum (Ringe werden aufgetrennt), dann der
     Umlauf auf den 2 × 2 Feldern je Block. Aufgetrennt wird er unten am Einstiegsblock (der linke untere Block):
     → Felder [[r, c]] (in Feldern, relativ zur Figur) vom linken unteren Feld des Einstiegsblocks bis zum rechten. */
  function umlauf(figur, rnd){
    var bloecke = [], id = {};
    figur.forEach(function(zeile, r){ Array.from(zeile).forEach(function(ch, c){ if (ch === '#'){ id[r + ',' + c] = bloecke.length; bloecke.push([r, c]); } }); });
    var unten = bloecke.filter(function(b){ return b[0] === HOEHE - 1; }).sort(function(a, b){ return a[1] - b[1]; })[0];
    // Spannbaum: zufällige Tiefensuche ab dem Einstiegsblock
    var im = {}, kanten = {}, stapel = [unten];
    im[unten + ''] = 1;
    while (stapel.length){
      var b = stapel[stapel.length - 1], nb = mischen([[-1, 0], [1, 0], [0, -1], [0, 1]], rnd).map(function(d){ return [b[0] + d[0], b[1] + d[1]]; })
        .filter(function(n){ return id[n[0] + ',' + n[1]] !== undefined && !im[n + '']; });
      if (!nb.length){ stapel.pop(); continue; }
      var n = nb[0]; im[n + ''] = 1; kanten[b + '|' + n] = kanten[n + '|' + b] = 1; stapel.push(n);
    }
    if (Object.keys(im).length !== bloecke.length) throw new Error('Figur hängt nicht zusammen');
    // Nachbarn je Feld: innerhalb eines Blocks im Kreis, an Baumkanten zum Nachbarblock hinüber
    var nach = {};
    function verb(a, b){ (nach[a] = nach[a] || []).push(b); (nach[b] = nach[b] || []).push(a); }
    function hat(a, b){ return !!kanten[a + '|' + b]; }
    bloecke.forEach(function(b){
      var r = 2 * b[0], c = 2 * b[1], TL = r + ',' + c, TR = r + ',' + (c + 1), BL = (r + 1) + ',' + c, BR = (r + 1) + ',' + (c + 1);
      var oben = [b[0] - 1, b[1]], rechts = [b[0], b[1] + 1], unter = [b[0] + 1, b[1]], links = [b[0], b[1] - 1];
      if (!hat(b, oben)) verb(TL, TR);
      if (!hat(b, unter) && !(b === unten)) verb(BL, BR);       // unten am Einstiegsblock: hier wird aufgetrennt
      if (!hat(b, links)) verb(TL, BL);
      if (!hat(b, rechts)) verb(TR, BR);
      else { verb(TR, r + ',' + (c + 2)); verb(BR, (r + 1) + ',' + (c + 2)); }
      if (hat(b, unter)){ verb(BL, (r + 2) + ',' + c); verb(BR, (r + 2) + ',' + (c + 1)); }
    });
    var start = (2 * unten[0] + 1) + ',' + (2 * unten[1]), ziel = (2 * unten[0] + 1) + ',' + (2 * unten[1] + 1);
    var weg = [start], vorher = null, jetzt = start;
    while (jetzt !== ziel){
      var w = nach[jetzt].filter(function(x){ return x !== vorher; });
      if (w.length !== 1) throw new Error('Umlauf nicht eindeutig');
      vorher = jetzt; jetzt = w[0]; weg.push(jetzt);
      if (weg.length > 4 * bloecke.length + 2) throw new Error('Umlauf zu lang');
    }
    if (weg.length !== 4 * bloecke.length) throw new Error('Umlauf deckt nicht alle Felder');
    return weg.map(function(k){ return k.split(',').map(Number); });
  }

  /* Labyrinth erzeugen. o: { seed, neu (Anteil «neuestes Feld» beim Wachsen: mehr = längere Irrwege), platz:{ b, h } }
     → { w, h, offen[r][c], weg:[[r, c]], start, ziel, zeilen:[[Wort]], satz, figuren:[{ r, c, b }] } oder { fehler } */
  function erzeugen(text, o){
    o = o || {};
    var ws = woerter(text);
    if (!ws.length) return { fehler:'leer' };
    var rnd = zufall(o.seed || 1), A = anordnen(ws, o.platz || { b:639, h:760 }), W = A.W, H = A.H, weg = [], figuren = [];
    var inhalt = W - 2 * RAND;
    A.zeilen.forEach(function(z, j){
      var T = OBEN + j * ZEILE, linie = T + 11, x = RAND + Math.floor((inhalt - 2 * zeilenBreite(z)) / 2), teile = [];
      // Buchstaben dieser Zeile: Umlauf, an die richtige Stelle geschoben
      z.forEach(function(wort, k){
        if (k) x += 2 * WORTLUECKE;
        Array.from(wort).forEach(function(ch, i){
          if (i) x += 2 * LUECKE;
          var u = umlauf(SCHRIFT[ch], rnd).map(function(q){ return [T + q[0], x + q[1]]; });
          teile.push(u); figuren.push({ r:T, c:x, b:2 * breite(ch), ch:ch });
          x += 2 * breite(ch);
        });
      });
      var vorwaerts = j % 2 === 0;   // gerade Zeilen von links nach rechts, ungerade zurück
      if (!vorwaerts) teile = teile.reverse().map(function(u){ return u.slice().reverse(); });
      // Einstieg: von links aussen (erste Zeile) oder vom Verbindungsgang am Rand herunter
      var spalte;
      if (j === 0){ spalte = 0; weg.push([linie, 0]); }
      else {
        spalte = vorwaerts ? 1 : W - 2;
        for (var r = OBEN + (j - 1) * ZEILE + 12; r <= linie; r++) weg.push([r, spalte]);
      }
      function geheZu(c){ var d = c > spalte ? 1 : -1; while (spalte !== c){ spalte += d; weg.push([linie, spalte]); } }
      teile.forEach(function(u){
        var a = u[0], e = u[u.length - 1];
        geheZu(a[1]); weg.push([linie - 1, a[1]]);
        u.forEach(function(q){ weg.push(q); });
        weg.push([linie - 1, e[1]]); weg.push([linie, e[1]]); spalte = e[1];
      });
      var letzte = j === A.zeilen.length - 1;
      geheZu(letzte ? (vorwaerts ? W - 1 : 0) : (vorwaerts ? W - 2 : 1));   // hinunter zur nächsten Zeile geht es dort weiter
    });
    // Prüfen: jedes Feld höchstens einmal, Schritte nur zu Nachbarn
    var besucht = new Uint8Array(W * H), offen = [], i;
    for (i = 0; i < H; i++){ offen.push(new Array(W).fill(0)); }
    function verbinde(a, b){
      var dy = b[0] - a[0], dx = b[1] - a[1], bit = dy === -1 ? O : dy === 1 ? U : dx === 1 ? R : L;
      if (Math.abs(dy) + Math.abs(dx) !== 1) throw new Error('Weg springt');
      offen[a[0]][a[1]] |= bit; offen[b[0]][b[1]] |= GEGEN[bit];
    }
    for (i = 0; i < weg.length; i++){
      var q = weg[i], p = q[0] * W + q[1];
      if (q[0] < 0 || q[1] < 0 || q[0] >= H || q[1] >= W) throw new Error('Weg ausserhalb');
      if (besucht[p]) throw new Error('Weg kreuzt sich');
      besucht[p] = 1; if (i) verbinde(weg[i - 1], q);
    }
    // übrige Felder als Irrwege anhängen («wachsender Baum», ausgehend von allen Feldern des Wegs). Zuerst zweigt an vielen
    // Feldern des Wegs eine Sackgasse ab – sonst wären Grundlinien und Buchstaben lange Gänge ohne Abzweigung, die auffallen.
    var aktiv = mischen(weg.map(function(q){ return q[0] * W + q[1]; }), rnd), neu = o.neu === undefined ? 0.6 : o.neu;
    aktiv.slice().forEach(function(pp){
      if (rnd() > 0.45) return;
      var pr = Math.floor(pp / W), pc = pp % W, frei = [];
      if (pr > 0 && !besucht[pp - W]) frei.push(pp - W); if (pr < H - 1 && !besucht[pp + W]) frei.push(pp + W);
      if (pc > 0 && !besucht[pp - 1]) frei.push(pp - 1); if (pc < W - 1 && !besucht[pp + 1]) frei.push(pp + 1);
      if (!frei.length) return;
      var nq = frei[Math.floor(rnd() * frei.length)];
      verbinde([pr, pc], [Math.floor(nq / W), nq % W]); besucht[nq] = 1; aktiv.push(nq);
    });
    while (aktiv.length){
      var k = rnd() < neu ? aktiv.length - 1 : Math.floor(rnd() * aktiv.length), pp = aktiv[k], pr = Math.floor(pp / W), pc = pp % W, frei = [];
      if (pr > 0 && !besucht[pp - W]) frei.push(pp - W); if (pr < H - 1 && !besucht[pp + W]) frei.push(pp + W);
      if (pc > 0 && !besucht[pp - 1]) frei.push(pp - 1); if (pc < W - 1 && !besucht[pp + 1]) frei.push(pp + 1);
      if (!frei.length){ aktiv.splice(k, 1); continue; }
      var nq = frei[Math.floor(rnd() * frei.length)];
      verbinde([pr, pc], [Math.floor(nq / W), nq % W]); besucht[nq] = 1; aktiv.push(nq);
    }
    return { w:W, h:H, offen:offen, weg:weg, start:weg[0], ziel:weg[weg.length - 1], zeilen:A.zeilen, satz:A.zeilen.map(function(z){ return z.join(' '); }).join(' '), figuren:figuren };
  }

  /* Der (einzige) Weg vom Start zum Ziel – zur Kontrolle */
  function loesung(lab){
    var w = lab.w, vor = new Int32Array(lab.h * w).fill(-1), s = lab.start[0] * w + lab.start[1], zi = lab.ziel[0] * w + lab.ziel[1], schlange = [s], kopf = 0;
    vor[s] = s;
    while (kopf < schlange.length){
      var p = schlange[kopf++], r = Math.floor(p / w), c = p % w;
      if (p === zi) break;
      RICHTUNG.forEach(function(d){ if (!(lab.offen[r][c] & d[0])) return; var q = (r + d[1]) * w + c + d[2]; if (vor[q] < 0){ vor[q] = p; schlange.push(q); } });
    }
    if (vor[zi] < 0) return [];
    var weg = [], q = zi;
    while (q !== s){ weg.push([Math.floor(q / w), q % w]); q = vor[q]; }
    weg.push(lab.start);
    return weg.reverse();
  }
  function offenZwischen(lab, a, b){
    var dy = b[0] - a[0], dx = b[1] - a[1];
    if (Math.abs(dy) + Math.abs(dx) !== 1) return false;
    var bit = dy === -1 ? O : dy === 1 ? U : dx === 1 ? R : L;
    return !!(lab.offen[a[0]][a[1]] & bit);
  }
  /* Wände als SVG-Pfad (Feldgrösse 10), gerade Stücke zusammengefasst; Öffnungen beim Start und beim Ziel (am linken oder rechten Rand) */
  function waende(lab){
    var S = 10, d = [], w = lab.w, h = lab.h, x, y, r, c, anfang, da;
    function tor(r, x){ return (lab.start[0] === r && ((lab.start[1] === 0 && x === 0) || (lab.start[1] === w - 1 && x === w))) || (lab.ziel[0] === r && ((lab.ziel[1] === 0 && x === 0) || (lab.ziel[1] === w - 1 && x === w))); }
    for (y = 0; y <= h; y++){
      anfang = -1;
      for (c = 0; c <= w; c++){
        da = c < w && (y === 0 || y === h || !(lab.offen[y - 1][c] & U));
        if (da && anfang < 0) anfang = c;
        if (!da && anfang >= 0){ d.push('M' + anfang * S + ' ' + y * S + 'H' + c * S); anfang = -1; }
      }
    }
    for (x = 0; x <= w; x++){
      anfang = -1;
      for (r = 0; r <= h; r++){
        da = r < h && (x === 0 || x === w ? !tor(r, x) : !(lab.offen[r][x - 1] & R));
        if (da && anfang < 0) anfang = r;
        if (!da && anfang >= 0){ d.push('M' + x * S + ' ' + anfang * S + 'V' + r * S); anfang = -1; }
      }
    }
    return d.join('');
  }
  return { SCHRIFT:SCHRIFT, woerter:woerter, umbrechen:umbrechen, anordnen:anordnen, umlauf:umlauf, erzeugen:erzeugen, loesung:loesung,
    offenZwischen:offenZwischen, waende:waende, zufall:zufall };
})();
/* KERN-ENDE */

/* ===== Vorlage ===== */
var STUFEN = { leicht:{ neu:0.3, name:'Leicht' }, mittel:{ neu:0.6, name:'Mittel' }, schwer:{ neu:0.85, name:'Schwer' } };
var PLATZ = { b:639, h:740 };   // Platz für das Labyrinth auf dem Blatt (Pixel; 703 Pixel = 186 mm)
function mm(px){ return px * 186 / 703; }
// artKarte: die Karte «Art des Labyrinths» (kommt aus labyrinth.js und steht bei allen Arten zuoberst)
function vorlage(artKarte){
  return '<div class="sl ls"><div class="sl-layout"><section class="sl-eingabe" aria-label="Eingaben">' + artKarte +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Satz</h2><p>Der richtige Weg schreibt ihn in Blockschrift – wer ihn nachzeichnet, kann ihn lesen.</p></div></div>' +
      '<label class="vh" for="lsSatz">Satz</label>' +
      '<textarea id="lsSatz" rows="2" maxlength="60"></textarea>' +
      '<p class="hinweis" id="lsInfo"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Irrwege</h2><p>Je schwerer, desto länger und verschlungener die Sackgassen.</p></div></div>' +
      '<div class="sl-stufen" role="radiogroup" aria-label="Irrwege">' +
        Object.keys(STUFEN).map(function(k){ return '<label><input type="radio" name="lsStufe" value="' + k + '"><span>' + STUFEN[k].name + '</span></label>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><details class="optionen"><summary>Einstellungen</summary>' +
      '<div class="opt-raster"><label for="lsTitel">Titel auf dem Blatt</label><input type="text" id="lsTitel" maxlength="60">' +
        '<label for="lsLinie">Linien</label><select id="lsLinie"><option value="0.7">dünn</option><option value="1">mittel</option><option value="1.4">dick</option></select></div>' +
    '</details></div>' +
    '<button type="button" class="btn primary gross" id="lsLos">Labyrinth erstellen</button>' +
  '</section>' +
  '<section class="sl-ausgabe" aria-label="Ergebnis">' +
    '<div id="lsMeldung" aria-live="polite"></div>' +
    '<div class="leer-zustand" id="lsLeer"><h2>Noch kein Labyrinth</h2><p>In drei Schritten zum Arbeitsblatt:</p><ol>' +
      '<li>Satz eingeben</li><li>Irrwege wählen</li><li>«Labyrinth erstellen» klicken</li></ol></div>' +
    '<div class="sl-werkzeug" id="lsWerkzeug" hidden>' +
      '<button type="button" class="btn klein" id="lsMischen" title="Gleicher Satz, neue Irrwege">Neu mischen</button>' +
      '<button type="button" class="btn klein" id="lsZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="lsWegWeg">Weg löschen</button>' +
      '<span class="abstand"></span>' +
      Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="lsMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="lsDrucken">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="lsHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<article class="sl-blatt" id="lsBlatt" hidden></article>' +
    '<article class="sl-blatt sl-loesungsblatt" id="lsLoesung" aria-hidden="true"></article>' +
  '</section></div></div>';
}

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, esc = Labor.esc, aus = false, NS = 'http://www.w3.org/2000/svg';
  var TAB = 'schrift-labyrinth-eingaben', OPT = 'schrift-labyrinth-einstellungen';
  var STANDARD = { stufe:'mittel', linie:'1', mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { satz:'', titel:'', seed:1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.satz = String(e.satz || ''); st.titel = String(e.titel || ''); st.seed = +e.seed || 1; } } catch(x){}
  if (!STUFEN[st.opt.stufe]) st.opt.stufe = 'mittel';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ satz:st.satz, titel:st.titel, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#lsMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; leer(); }
  function leer(){ $('#lsLeer').hidden = !!aktuell || !!$('#lsMeldung').innerHTML; }
  var aktuell = null, weg = [], erstellt = false;

  /* ---------- Eingaben ---------- */
  [].forEach.call(bereich.querySelectorAll('input[name="lsStufe"]'), function(r){
    r.checked = r.value === st.opt.stufe;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.stufe = r.value; speichern(); if (erstellt) erstellen(); });
  });
  var satzFeld = $('#lsSatz'); satzFeld.value = st.satz;
  function info(){
    var ws = Kern.woerter(st.satz), n = ws.join('').length;
    if (!n){ $('#lsInfo').textContent = 'Kurze Sätze werden grösser. Ä, Ö, Ü werden zu AE, OE, UE; Satzzeichen fallen weg.'; return; }
    var A = Kern.anordnen(ws, PLATZ), groesse = mm(A.s);
    $('#lsInfo').textContent = n + ' Buchstaben in ' + A.zeilen.length + (A.zeilen.length === 1 ? ' Zeile' : ' Zeilen') + ' (' + A.zeilen.map(function(z){ return z.join(' '); }).join(' / ') + '). ' +
      'Gedruckt ist ein Feld etwa ' + groesse.toFixed(1).replace('.', ',') + ' mm gross' + (groesse < 2.5 ? ' – sehr fein; ein kürzerer Satz wird grösser.' : '.');
  }
  satzFeld.addEventListener('input', function(){ st.satz = satzFeld.value; speichern(); info(); if (aktuell) $('#lsBlatt').classList.add('veraltet'); });
  satzFeld.addEventListener('keydown', function(ev){ if (ev.key === 'Enter' && !ev.shiftKey){ ev.preventDefault(); erstellen(); } });
  $('#lsTitel').value = st.titel;
  $('#lsTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); if (aktuell) zeichnen(); });
  $('#lsLinie').value = st.opt.linie; $('#lsLinie').addEventListener('change', function(){ st.opt.linie = this.value; speichern(); if (aktuell) zeichnen(); });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); if (aktuell) zeichnen(); });
  $('#lsMitLoesung').checked = st.opt.mitLoesung; $('#lsMitLoesung').addEventListener('change', function(){ st.opt.mitLoesung = this.checked; speichern(); });

  /* ---------- Erstellen ---------- */
  function erstellen(){
    erstellt = true;
    function fehler(html){ aktuell = null; $('#lsBlatt').hidden = true; $('#lsWerkzeug').hidden = true; meldung('fehler', html); }
    if (!Kern.woerter(st.satz).length){ fehler('<h3>Noch kein Satz</h3><p>Schreibe zuerst den Satz, den der Weg schreiben soll – Buchstaben oder Ziffern.</p>'); return; }
    var lab;
    try { lab = Kern.erzeugen(st.satz, { seed:st.seed, neu:STUFEN[st.opt.stufe].neu, platz:PLATZ }); }
    catch(x){ console.error(x); fehler('<h3>Das hat nicht geklappt</h3><p>Klicke noch einmal auf «Labyrinth erstellen».</p>'); st.seed = Math.floor(Math.random() * 1e9) + 1; return; }
    aktuell = { lab:lab };
    weg = [lab.start];
    $('#lsZeigeLoesung').setAttribute('aria-pressed', 'false');
    zeichnen();
    var groesse = mm(Math.min(PLATZ.b / (lab.w + 2), PLATZ.h / (lab.h + 1)));
    meldung('erfolg', '<p><b>Fertig!</b> Labyrinth mit ' + lab.w + ' × ' + lab.h + ' Feldern. Der richtige Weg ist ' + lab.weg.length + ' Felder lang und schreibt «' + esc(lab.satz) + '». ' +
      'Du kannst ihn hier am Bildschirm suchen: beim Pfeil links hineinziehen.</p>' +
      (groesse < 2.5 ? '<p>Achtung: Gedruckt sind die Felder nur etwa ' + groesse.toFixed(1).replace('.', ',') + ' mm gross. Ein kürzerer Satz macht sie grösser.</p>' : ''));
  }

  /* ---------- Zeichnen ---------- */
  function linie(zellen){ return zellen.map(function(q, i){ return (i ? 'L' : 'M') + (q[1] * 10 + 5) + ' ' + (q[0] * 10 + 5); }).join(''); }
  function labSvg(loesungsblatt){
    var lab = aktuell.lab, S = 10, rand = 12, lw = parseFloat(st.opt.linie) || 1;
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', (-rand) + ' ' + (-rand / 2) + ' ' + (lab.w * S + 2 * rand) + ' ' + (lab.h * S + rand));
    s.setAttribute('class', 'sl-svg ls-svg');
    var t = [], wS = lab.w * S;
    function aussen(q){ return q[1] === 0 ? -1 : 1; }   // liegt das Feld am linken (−1) oder rechten (+1) Rand?
    var ys = lab.start[0] * S + 5, yz = lab.ziel[0] * S + 5, xs = aussen(lab.start) < 0 ? 0 : wS, xz = aussen(lab.ziel) < 0 ? 0 : wS;
    // Lösung: die Felder des Wegs gefüllt (so stehen die Buchstaben deutlich da) und die Linie durch ihre Mitten
    t.push('<path class="ls-felder" d="' + lab.weg.map(function(q){ return 'M' + q[1] * S + ' ' + q[0] * S + 'h10v10h-10z'; }).join('') + '"/>');
    t.push('<path class="ls-loesung" d="M' + (xs + aussen(lab.start) * (rand - 2)) + ' ' + ys + linie(lab.weg).replace(/^M/, 'L') + 'L' + (xz + aussen(lab.ziel) * (rand - 2)) + ' ' + yz + '"/>');
    if (!loesungsblatt) t.push('<path class="sl-weg" d=""/>');
    t.push('<path class="sl-waende" d="' + Kern.waende(lab) + '" style="stroke-width:' + lw + '"/>');
    // Pfeile: beim Start hinein, beim Ziel hinaus
    var ps = aussen(lab.start) < 0 ? 'M' + (-rand + 1) + ' ' + ys + 'H-2.5M-5.5 ' + (ys - 2.6) + 'L-2.5 ' + ys + 'L-5.5 ' + (ys + 2.6)
      : 'M' + (wS + rand - 1) + ' ' + ys + 'H' + (wS + 2.5) + 'M' + (wS + 5.5) + ' ' + (ys - 2.6) + 'L' + (wS + 2.5) + ' ' + ys + 'L' + (wS + 5.5) + ' ' + (ys + 2.6);
    var pz = aussen(lab.ziel) > 0 ? 'M' + (wS + 2.5) + ' ' + yz + 'H' + (wS + rand - 1) + 'M' + (wS + rand - 4) + ' ' + (yz - 2.6) + 'L' + (wS + rand - 1) + ' ' + yz + 'L' + (wS + rand - 4) + ' ' + (yz + 2.6)
      : 'M-2.5 ' + yz + 'H' + (-rand + 1) + 'M' + (-rand + 4) + ' ' + (yz - 2.6) + 'L' + (-rand + 1) + ' ' + yz + 'L' + (-rand + 4) + ' ' + (yz + 2.6);
    t.push('<path class="sl-pfeil" d="' + ps + pz + '"/>');
    s.innerHTML = t.join('');
    return s;
  }
  function zeichnen(){
    var lab = aktuell.lab, titel = st.titel.trim() || 'Welcher Satz versteckt sich im Weg?', blatt = $('#lsBlatt'), loes = $('#lsLoesung'), o = st.opt;
    var linien = Math.min(3, Math.max(1, Math.ceil(lab.satz.length / 30))), l = '';
    for (var i = 1; i < linien; i++) l += '<span class="sl-linie voll"></span>';
    blatt.classList.remove('veraltet', 'zeige-loesung', 'geschafft');
    blatt.innerHTML = (o.titelAn ? '<h2>' + esc(titel) + '</h2>' : '') +
      (o.anleitungAn ? '<p class="sl-anleitung">Finde den Weg vom Pfeil hinein bis zum Pfeil hinaus, ohne eine Wand zu überqueren, und zeichne ihn mit einem Stift nach. Der Weg schreibt einen Satz. Schreibe ihn auf die Linie' + (linien > 1 ? 'n' : '') + '.</p>' : '') +
      '<div class="sl-feld"></div><p class="sl-fortschritt nur-bildschirm" id="lsFortschritt" aria-live="polite"></p>' +
      '<div class="sl-antwort"><span>Satz:</span><span class="sl-linie"></span>' + l + '</div>';
    var svg = labSvg(false);
    blatt.querySelector('.sl-feld').appendChild(svg);
    loes.innerHTML = '<h2>Lösung' + (o.titelAn ? ' – ' + esc(titel) : '') + '</h2><div class="sl-feld"></div><p class="sl-satz-loesung"><b>Der Weg schreibt:</b> ' + esc(lab.satz) +
      (Labor.esc(st.satz.trim()).toUpperCase() !== esc(lab.satz) ? ' <span class="ls-eingabe">(' + esc(st.satz.trim()) + ')</span>' : '') + '</p>';
    loes.querySelector('.sl-feld').appendChild(labSvg(true));
    blatt.hidden = false; $('#lsWerkzeug').hidden = false; leer();
    wegVerbinden(svg); wegZeichnen();
  }

  /* ---------- Am Bildschirm lösen: vom Eingang aus durch die Gänge ziehen (zurückziehen löscht) ---------- */
  function wegVerbinden(svg){
    var zieht = false;
    function feld(ev){
      var pt = svg.createSVGPoint(); pt.x = ev.clientX; pt.y = ev.clientY;
      var m = svg.getScreenCTM(); if (!m) return null;
      var q = pt.matrixTransform(m.inverse()), r = Math.floor(q.y / 10), c = Math.floor(q.x / 10), lab = aktuell.lab;
      return r >= 0 && c >= 0 && r < lab.h && c < lab.w ? [r, c] : null;
    }
    function schritt(f){
      if (!f) return;
      var ende = weg[weg.length - 1];
      if (f[0] === ende[0] && f[1] === ende[1]) return;
      var i = weg.findIndex(function(q){ return q[0] === f[0] && q[1] === f[1]; });
      if (i >= 0){ weg = weg.slice(0, i + 1); wegZeichnen(); return; }
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
    var pfad = bereich.querySelector('#lsBlatt .sl-weg'); if (!pfad) return;
    var lab = aktuell.lab, z = lab.ziel, letzte = weg[weg.length - 1], fertig = letzte[0] === z[0] && letzte[1] === z[1];
    var xs = lab.start[1] === 0 ? -10 : lab.w * 10 + 10, xz = z[1] === 0 ? -10 : lab.w * 10 + 10;
    pfad.setAttribute('d', 'M' + xs + ' ' + (lab.start[0] * 10 + 5) + linie(weg).replace(/^M/, 'L') + (fertig ? 'L' + xz + ' ' + (z[0] * 10 + 5) : ''));
    $('#lsBlatt').classList.toggle('geschafft', fertig);
    var p = $('#lsFortschritt'); if (!p) return;
    p.className = 'sl-fortschritt nur-bildschirm' + (fertig ? ' fertig' : '');
    p.textContent = fertig ? '🎉 Geschafft! Der Weg schreibt: «' + lab.satz + '»'
      : weg.length > 1 ? 'Weiter so – ' + (weg.length - 1) + ' Felder geschafft. Zurückziehen löscht den Weg wieder.' : 'Starte beim Pfeil links und ziehe durch die Gänge.';
  }

  /* ---------- Werkzeuge ---------- */
  $('#lsLos').addEventListener('click', erstellen);
  $('#lsMischen').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); erstellen(); });
  $('#lsZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); $('#lsBlatt').classList.toggle('zeige-loesung', an);
  });
  $('#lsWegWeg').addEventListener('click', function(){ if (!aktuell) return; weg = [aktuell.lab.start]; wegZeichnen(); });
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  Labor.pdfKnopf($('#lsDrucken'), function(){ return aktuell && { blaetter:[$('#lsBlatt'), st.opt.mitLoesung && $('#lsLoesung')], name:Labor.pdfName('Labyrinth-Satzweg', st.titel) }; }, function(t){ meldung('fehler', '<p>' + Labor.esc(t) + '</p>'); });
  var speicherOrt = null;
  if (Labor.imArtefakt()){ $('#lsDrucken').hidden = true; Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#lsHerunterladen').hidden = false; }); }
  function sauber(el){
    var k = el.cloneNode(true);
    k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeige-loesung', 'geschafft', 'veraltet');
    [].forEach.call(k.querySelectorAll('.nur-bildschirm, .sl-weg'), function(n){ n.remove(); });
    if (el.id === 'lsBlatt') [].forEach.call(k.querySelectorAll('.ls-felder, .ls-loesung'), function(n){ n.remove(); });
    [].forEach.call(k.querySelectorAll('[id]'), function(n){ n.removeAttribute('id'); });
    return k;
  }
  $('#lsHerunterladen').addEventListener('click', function(){
    if (!aktuell || !speicherOrt) return;
    var inhalt = sauber($('#lsBlatt')).outerHTML;
    if (st.opt.mitLoesung){ var l = sauber($('#lsLoesung')); l.classList.add('neue-seite'); inhalt += l.outerHTML; }
    speicherOrt.save({ filename:'Labyrinth-Satzweg.html', data:Labor.blattDatei('Labyrinth: Der Weg schreibt den Satz', inhalt, '.sl-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  info(); leer();
  try { if (st.satz.trim() && sessionStorage.getItem(TAB)) erstellen(); } catch(x){}

  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}

// Für den Generator «Labyrinth» (raetsel/labyrinth/labyrinth.js): Art «Weg schreibt den Satz»
window.LabyrinthSchrift = { vorlage:vorlage, starte:starte, Kern:Kern };
})();
