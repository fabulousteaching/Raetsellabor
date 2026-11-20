/* Rätsellabor – Generator «Schachrätsel»
   Schachfiguren ziehen über ein Brett (A–H, 1–8). Wer jeden Zug als Linie von Feldmitte zu Feldmitte einzeichnet, sieht
   am Schluss eine Ziffer oder einen Buchstaben. Jedes Zeichen ist eine Strichfigur auf einem Raster von 5 × 7 Feldern
   aus geraden und schrägen (45°) Linien – genau den Wegen, die Turm, Läufer, Dame, König und Bauer gehen können.
   Code mit 1–4 Zeichen (je ein Brett), Züge «von – nach» oder «Richtung und Felder». Lösungsblatt, PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('schachraetsel');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* Strichfiguren: Linienzüge aus Punkten (x 0–4 von links, y 0–6 von unten); jede Teilstrecke gerade oder genau schräg */
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
  var FIGUR = { K:{ name:'König', zeichen:'♔' }, D:{ name:'Dame', zeichen:'♕' }, T:{ name:'Turm', zeichen:'♖' }, L:{ name:'Läufer', zeichen:'♗' }, B:{ name:'Bauer', zeichen:'♙' } };
  function feld(x, y){ return 'ABCDEFGH'[x] + (y + 1); }
  // Welche Figuren können diesen Zug (Feld a → Feld b) machen?
  function figuren(a, b){
    var dx = b[0] - a[0], dy = b[1] - a[1], n = Math.max(Math.abs(dx), Math.abs(dy)), f = [];
    if (!n) return f;
    var gerade = !dx || !dy, schraeg = Math.abs(dx) === Math.abs(dy);
    if (gerade) f.push('T');
    if (schraeg) f.push('L');
    if (gerade || schraeg) f.push('D');
    if (n === 1) f.push('K');
    if (!dx && (dy === 1 || (dy === 2 && a[1] === 1))) f.push('B');   // weisser Bauer: ein Feld vor, von der 2. Reihe auch zwei
    return f;
  }
  function richtung(a, b){
    var dx = Math.sign(b[0] - a[0]), dy = Math.sign(b[1] - a[1]);
    if (!dx) return dy > 0 ? 'nach oben' : 'nach unten';
    if (!dy) return dx > 0 ? 'nach rechts' : 'nach links';
    return 'schräg nach ' + (dx > 0 ? 'rechts' : 'links') + ' ' + (dy > 0 ? 'oben' : 'unten');
  }
  /* Zeichen auf das Brett legen (zufällig verschoben) und in Züge zerlegen. alle: auch Dame, König, Bauer (sonst nur
     Turm und Läufer). → { zeichen, linien:[[[x,y], …]], zuege:[{ figur, von, nach, a, b, felder, richtung }] } oder null */
  function raetsel(c, rnd, alle){
    var g = Z[c]; if (!g) return null;
    var ox = Math.floor(rnd() * 4), oy = Math.floor(rnd() * 2), zuege = [];
    var linien = g.map(function(l){ return l.map(function(p){ return [p[0] + ox, p[1] + oy]; }); });
    linien.forEach(function(l){
      for (var i = 1; i < l.length; i++){
        var a = l[i - 1], b = l[i], moegl = figuren(a, b);
        if (!alle) moegl = moegl.filter(function(f){ return f === 'T' || f === 'L'; });
        // Turm und Läufer etwas häufiger, die anderen für Abwechslung
        var gew = moegl.map(function(f){ return f === 'T' || f === 'L' ? 3 : f === 'D' ? 1.4 : 1.6; }), s = gew.reduce(function(x, y){ return x + y; }, 0), x = rnd() * s, wahl = moegl[0];
        for (var k = 0; k < moegl.length; k++){ x -= gew[k]; if (x <= 0){ wahl = moegl[k]; break; } }
        zuege.push({ figur:wahl, von:feld(a[0], a[1]), nach:feld(b[0], b[1]), a:a, b:b, felder:Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])), richtung:richtung(a, b) });
      }
    });
    return { zeichen:c, linien:linien, zuege:zuege };
  }
  return { zufall:zufall, Z:Z, FIGUR:FIGUR, feld:feld, figuren:figuren, richtung:richtung, raetsel:raetsel };
})();
/* KERN-ENDE */

var ARTEN = [['vonnach', tx('Von – nach'), tx('♖ Turm von A3 nach A6')], ['richtung', tx('Richtung und Felder'), tx('♖ Turm auf A3: 3 Felder nach oben')]];
function esc(t){ return Labor.esc(t); }

var VORLAGE = '<div class="sr">' +
  tx('<header class="sr-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Schachrätsel</h1>') +
    tx('<p>Schachfiguren ziehen über das Brett. Wer jeden Zug als Linie einzeichnet, sieht am Schluss eine Ziffer oder einen Buchstaben.</p></header>') +
  tx('<div class="sr-layout"><section class="sr-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Was soll herauskommen?</h2><p>1 bis 4 Ziffern oder Buchstaben – je ein Schachbrett.</p></div></div>') +
      tx('<label class="feld-label" for="srCode">Ziffern oder Buchstaben</label>') +
      '<input type="text" id="srCode" class="sr-code" maxlength="4" autocomplete="off" spellcheck="false" inputmode="text">' +
      '<p class="hinweis" id="srCodeInfo"></p>' +
    '</div>' +
    tx('<div class="karte" id="srZugKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Züge</h2></div></div>') +
      tx('<p class="feld-label">So stehen die Züge auf dem Blatt</p>') +
      tx('<div class="sr-arten" role="radiogroup" aria-label="Darstellung der Züge">') + ARTEN.map(function(a){ return '<label><input type="radio" name="srArt" value="' + a[0] + '"><span><b>' + a[1] + '</b><small>' + a[2] + '</small></span></label>'; }).join('') + '</div>' +
      tx('<label class="opt"><input type="checkbox" id="srAlle"><span>Auch Dame, König und Bauer (sonst nur Turm und Läufer)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="srRegeln"><span>Zugregeln der Figuren auf dem Blatt erklären</span></label>') +
    '</div>' +
  '</section>' +
  tx('<section class="sr-ausgabe" aria-label="Ergebnis">') +
    '<div id="srMeldung" aria-live="polite"></div>' +
    '<div class="sr-werkzeug">' +
      tx('<button type="button" class="btn klein" id="srZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      tx('<button type="button" class="btn klein" id="srNeu" title="Andere Lage auf dem Brett und andere Figuren">Neu mischen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="srMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="srPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="srHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="sr-blaetter"><div class="sr-seiten" id="srSeiten"></div>' +
    '<div class="sr-rahmen sr-loesung-rahmen"><article class="sr-blatt sr-loesungsblatt" id="srLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<rect x="3" y="3" width="18" height="18" rx="1.5"/><path d="M3 9h18M3 15h18M9 3v18M15 3v18" stroke-width="1"/><path d="M6 18V6h12" stroke-width="2.4" stroke-linecap="round" opacity=".6"/></svg>';

Labor.registriere({
  id:'schachraetsel',
  titel:'Schachrätsel',
  kurz:'Figuren ziehen übers Brett – die Linien ergeben ein Zeichen',
  beschreibung:'Turm, Läufer, Dame, König und Bauer ziehen über das Schachbrett. Wer jeden Zug als Linie einzeichnet, sieht am Schluss eine Ziffer oder einen Buchstaben. Für einen Code mit bis zu 4 Zeichen. Mit Lösungsblatt.',
  merkmale:['Echte Schachzüge', 'Ziffern und Buchstaben', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/schachraetsel/schachraetsel.css',
  html:VORLAGE,
  start:starte
});

/* Brett als SVG: 8 × 8 Felder (hell/grau), Koordinaten A–H und 1–8; in der Lösung die Linien */
var FELD = 32, RAND = 22, LINIENFARBE = '#005A90';
function brettSvg(R, loesung){
  var B = 8 * FELD, W = B + RAND + 6, H = B + RAND + 6, s = '';
  s += '<svg class="sr-brett" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + tx('" role="img" aria-label="Schachbrett') + (loesung ? tx(' mit Lösung') : '') + '">';
  for (var y = 0; y < 8; y++) for (var x = 0; x < 8; x++){
    var px = RAND + x * FELD, py = 3 + (7 - y) * FELD;
    s += '<rect x="' + px + '" y="' + py + '" width="' + FELD + '" height="' + FELD + '" fill="' + ((x + y) % 2 ? '#FFFFFF' : '#DCD6CF') + '"/>';
  }
  s += '<rect x="' + RAND + '" y="3" width="' + B + '" height="' + B + '" fill="none" stroke="#1C1714" stroke-width="1.6"/>';
  s += '<g font-size="12" font-weight="700" fill="#554C45" text-anchor="middle" style="font-family:var(--blatt-schrift)">';
  for (var i = 0; i < 8; i++){
    s += '<text x="' + (RAND + i * FELD + FELD / 2) + '" y="' + (B + 3 + 15) + '">' + 'ABCDEFGH'[i] + '</text>';
    s += '<text x="' + (RAND / 2) + '" y="' + (3 + (7 - i) * FELD + FELD / 2 + 4) + '">' + (i + 1) + '</text>';
  }
  s += '</g>';
  if (loesung){
    var mitte = function(p){ return (RAND + p[0] * FELD + FELD / 2) + ',' + (3 + (7 - p[1]) * FELD + FELD / 2); };
    s += '<g fill="none" stroke="' + LINIENFARBE + '" stroke-width="5" stroke-linecap="round" stroke-linejoin="round">' +
      R.linien.map(function(l){ return '<polyline points="' + l.map(mitte).join(' ') + '"/>'; }).join('') + '</g>';
  }
  return s + '</svg>';
}

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'schachraetsel-eingaben', OPT = 'schachraetsel-einstellungen';
  // Keine Vorauswahl bei der Darstellung der Züge
  var STANDARD = { art:'', alle:true, regeln:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { code:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.code = String(e.code || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (!ARTEN.some(function(a){ return a[0] === st.opt.art; })) st.opt.art = '';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#srMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  $('#srCode').value = st.code;
  $('#srCode').addEventListener('input', function(){ st.code = this.value; speichern(); zeichnen(); });
  [].forEach.call(bereich.querySelectorAll('input[name="srArt"]'), function(r){
    r.checked = r.value === st.opt.art;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.art = r.value; speichern(); zeichnen(); } });
  });
  [['#srAlle', 'alle'], ['#srRegeln', 'regeln'], ['#srMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#srZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#srLoesung').classList.toggle('zeigen', an); $('#srLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  $('#srNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Zeichnen ---------- */
  var R = null;
  function zugText(z){
    var f = Kern.FIGUR[z.figur];
    return '<span class="sr-figur" aria-hidden="true">' + f.zeichen + '</span> <b>' + tx(f.name) + '</b> ' +
      (st.opt.art === 'richtung' ? tx(z.felder === 1 ? 'auf {f}: 1 Feld {r}' : 'auf {f}: {n} Felder {r}', { f:z.von, n:z.felder, r:tx(z.richtung) }) : tx('von {a} nach {b}', { a:z.von, b:z.nach }));
  }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, roh = st.code.normalize('NFC').toLocaleUpperCase('de-CH'), zeichen = Array.from(roh).filter(function(c){ return !/\s/.test(c); });
    var falsch = zeichen.filter(function(c){ return !Kern.Z[c]; });
    var gut = zeichen.filter(function(c){ return Kern.Z[c]; });
    $('#srCodeInfo').textContent = falsch.length ? tx('Nicht möglich: {z} – es gehen die Ziffern 0–9 und die Buchstaben A–Z (ohne Umlaute und Akzente).', { z:falsch.join(' ') }) : gut.length ? tx(gut.length === 1 ? '1 Zeichen – 1 Schachbrett' : '{n} Zeichen – {n} Schachbretter', { n:gut.length }) : '';
    $('#srZugKarte').hidden = !gut.length || !!falsch.length;
    var fehlt = !gut.length ? tx('Schreib links, was herauskommen soll: 1 bis 4 Ziffern oder Buchstaben, z. B. 7 oder A3.') : falsch.length ? tx('Bitte nur Ziffern 0–9 und Buchstaben A–Z verwenden.') : !o.art ? tx('Wähle links, wie die Züge auf dem Blatt stehen sollen.') : '';
    ['#srPdf', '#srHerunterladen', '#srZeigeLoesung', '#srNeu'].forEach(function(s){ $(s).disabled = !!fehlt; });
    if (fehlt){ R = null; $('#srSeiten').innerHTML = ''; $('#srLoesung').parentNode.hidden = true; meldung('info', '<p>' + fehlt + '</p>'); return; }
    meldung(''); $('#srLoesung').parentNode.hidden = false;
    var rnd = Kern.zufall(st.seed);
    R = gut.map(function(c){ return Kern.raetsel(c, rnd, o.alle); });
    var nZ = R.reduce(function(a, r){ return a + r.zuege.length; }, 0);
    var anleitung = tx('Die Figuren ziehen über das Schachbrett. Zeichne jeden Zug mit Lineal als Linie von Feldmitte zu Feldmitte') +
      (o.art === 'richtung' ? tx(' – zähle dazu die Felder ab') : '') + tx('. Am Schluss ') + (R.length === 1 ? tx('siehst du eine Ziffer oder einen Buchstaben.') : tx('siehst du auf jedem Brett eine Ziffer oder einen Buchstaben – zusammen ergeben sie den Code.'));
    var regeln = '<ul class="sr-regeln">' + [['T', tx('gerade, so weit sie will')], ['L', tx('schräg, so weit er will')], ['D', tx('gerade oder schräg, so weit sie will')], ['K', tx('ein Feld in jede Richtung')], ['B', tx('ein Feld nach oben (vom Startfeld in Reihe 2 auch zwei)')]]
      .filter(function(x){ return o.alle || x[0] === 'T' || x[0] === 'L'; })
      .map(function(x){ var f = Kern.FIGUR[x[0]]; return '<li><span class="sr-figur">' + f.zeichen + '</span> <b>' + tx(f.name) + ':</b> ' + x[1] + '</li>'; }).join('') + '</ul>';
    function block(r, i, loesung){
      return '<section class="sr-block"><div class="sr-brettplatz">' + brettSvg(r, loesung) + '</div><div class="sr-zuege">' +
        (R.length > 1 ? tx('<h3>Brett ') + (i + 1) + '</h3>' : '') +
        (loesung ? '<p class="sr-loesung-zeichen">' + esc(r.zeichen) + '</p>' : '<ol>' + r.zuege.map(function(z){ return '<li>' + zugText(z) + '</li>'; }).join('') + '</ol>' +
          '<p class="sr-antwort">' + (R.length > 1 ? tx('Zeichen') : tx('Das Zeichen')) + ': <span class="sr-linie"></span></p>') + '</div></section>';
    }
    // Seiten: alles zuerst auf ein Blatt, Höhen messen, dann so aufteilen, dass jede Seite auf A4 passt
    var kopf1 = (o.titelAn ? tx('<h2>Schachrätsel</h2>') : '') + (o.anleitungAn ? '<p class="sr-anleitung">' + esc(anleitung) + '</p>' + (o.regeln ? regeln : '') : '');
    var codeZeile = R.length > 1 ? tx('<p class="sr-antwort sr-code-antwort">Code: <span class="sr-linie sr-lang"></span></p>') : '';
    var bloecke = R.map(function(r, k){ return block(r, k, false); });
    function seitenHtml(seiten){
      return seiten.map(function(liste, si){
        var kopf = si === 0 ? kopf1 : '<p class="sr-seitenkopf">' + tx('Schachrätsel – Seite {i} von {n}', { i:si + 1, n:seiten.length }) + '</p>';
        return '<div class="sr-rahmen"><article class="sr-blatt sr-seite">' + kopf + liste.map(function(k){ return bloecke[k]; }).join('') +
          (si === seiten.length - 1 ? codeZeile : '') + '</article></div>';
      }).join('');
    }
    $('#srSeiten').innerHTML = seitenHtml([R.map(function(r, k){ return k; })]);
    $('#srSeiten').innerHTML = seitenHtml(aufteilen($('#srSeiten .sr-blatt')));
    $('#srLoesung').innerHTML = (o.titelAn ? tx('<h2>Schachrätsel – Lösung</h2>') : tx('<p class="sr-anleitung"><b>Lösung</b></p>')) +
      '<div class="sr-loesung-raster">' + R.map(function(r, k){ return block(r, k, true); }).join('') + '</div>' +
      (R.length > 1 ? tx('<p class="sr-loesung-code">Code: <b>') + esc(R.map(function(r){ return r.zeichen; }).join('')) + '</b></p>' : '');
    meldung('erfolg', '<p><b>' + tx('Fertig!') + '</b> ' + tx(R.length === 1 ? '1 Brett mit {z} Zügen.' : '{n} Bretter mit zusammen {z} Zügen.', { n:R.length, z:nZ }) + '</p>');
  }

  /* Bretter auf Seiten verteilen: Höhe einer A4-Seite (273 mm = 1032 px) mit Reserve. Ist das Blatt nicht sichtbar
     (Höhe 0), gilt: erste Seite 2 Bretter, danach je 3. */
  var SEITE = 990, SEITENKOPF = 34;
  function aufteilen(blatt){
    var b = [].slice.call(blatt.querySelectorAll('.sr-block')), n = b.length, seiten = [];
    if (!n || !b[0].offsetHeight){
      for (var i = 0; i < n; ){ var m = seiten.length ? 3 : 2; seiten.push(b.slice(i, i + m).map(function(x, k){ return i + k; })); i += m; }
      return seiten;
    }
    var cs = getComputedStyle(blatt), rand = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
    var code = blatt.querySelector('.sr-code-antwort'), codeH = code ? code.offsetHeight + 18 : 0;
    var h = b[0].getBoundingClientRect().top - blatt.getBoundingClientRect().top + parseFloat(cs.paddingBottom), akt = [];
    b.forEach(function(el, k){
      var eh = el.offsetHeight, letzte = k === n - 1;
      if (akt.length && h + eh + (letzte ? codeH : 0) > SEITE){ seiten.push(akt); akt = []; h = rand + SEITENKOPF; }
      akt.push(k); h += eh;
    });
    seiten.push(akt);
    return seiten;
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [].slice.call(bereich.querySelectorAll('#srSeiten .sr-blatt')).concat(st.opt.mitLoesung ? [$('#srLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function dateiname(){ return Labor.pdfName('Schachraetsel', ''); }
  Labor.pdfKnopf($('#srPdf'), function(){ return R && { blaetter:blaetter(), name:dateiname() }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#srPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#srHerunterladen').hidden = false; });
  }
  $('#srHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:dateiname().replace(/\.pdf$/, '.html'), data:Labor.blattDatei(tx('Schachrätsel'), inhalt, '.sr-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
