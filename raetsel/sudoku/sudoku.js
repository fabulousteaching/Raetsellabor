/* Rätsellabor – Generator «Sudoku»
   4 × 4 (Kästen 2 × 2), 6 × 6 (Kästen 2 × 3) und 9 × 9 (Kästen 3 × 3), mit Zahlen oder Emojis. Der Kern füllt zuerst ein ganzes
   Gitter zufällig, wählt für jedes Zeichen des Codes ein Feld mit dem passenden Symbol (möglichst in verschiedenen Kästen,
   Zeilen und Spalten) und nimmt dann so lange Zahlen weg, wie das Sudoku genau eine Lösung hat – bei «leicht» und «mittel»
   ausserdem nur, solange es ohne Raten lösbar bleibt (einzige Möglichkeit im Feld, einziger Platz in Zeile, Spalte, Kasten).
   Die Code-Felder bleiben leer und sind mit kleinen Nummern und/oder Farben markiert. Passt der Code nicht direkt zu den
   Symbolen (Buchstaben, Ziffern über N, Emojis), übersetzt eine Legende Symbol → Zeichen. */
(function(){
'use strict';
var tx = Labor.uebersetzer('sudoku');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  /* Kästen: 4 × 4 → 2 × 2, 6 × 6 → 2 Reihen × 3 Spalten, 9 × 9 → 3 × 3 */
  function kasten(N){ return N === 4 ? { h:2, b:2 } : N === 6 ? { h:2, b:3 } : { h:3, b:3 }; }
  /* Einheiten (Zeilen, Spalten, Kästen) als Listen von Feldnummern; Nachbarn je Feld */
  var cache = {};
  function geometrie(N){
    if (cache[N]) return cache[N];
    var K = kasten(N), einheiten = [], r, c, i;
    for (r = 0; r < N; r++){ var z = []; for (c = 0; c < N; c++) z.push(r * N + c); einheiten.push(z); }
    for (c = 0; c < N; c++){ var s = []; for (r = 0; r < N; r++) s.push(r * N + c); einheiten.push(s); }
    for (var kr = 0; kr < N; kr += K.h) for (var kc = 0; kc < N; kc += K.b){ var k = []; for (r = kr; r < kr + K.h; r++) for (c = kc; c < kc + K.b; c++) k.push(r * N + c); einheiten.push(k); }
    var nachbarn = [];
    for (i = 0; i < N * N; i++){
      var m = {};
      einheiten.forEach(function(e){ if (e.indexOf(i) >= 0) e.forEach(function(j){ if (j !== i) m[j] = 1; }); });
      nachbarn.push(Object.keys(m).map(Number));
    }
    var kastenVon = [];
    for (i = 0; i < N * N; i++) kastenVon.push(Math.floor(Math.floor(i / N) / K.h) * (N / K.b) + Math.floor((i % N) / K.b));
    return (cache[N] = { N:N, K:K, einheiten:einheiten, nachbarn:nachbarn, kastenVon:kastenVon });
  }
  function moeglich(g, G, i){
    var voll = (1 << (G.N + 1)) - 2, belegt = 0;
    G.nachbarn[i].forEach(function(j){ if (g[j]) belegt |= 1 << g[j]; });
    return voll & ~belegt;
  }
  function bits(m){ var l = []; for (var v = 1; m >> v; v++) if (m & (1 << v)) l.push(v); return l; }
  /* Lösungen zählen (bis grenze) – Rückverfolgung, immer zuerst das Feld mit den wenigsten Möglichkeiten */
  function zaehlen(g0, N, grenze){
    var G = geometrie(N), g = g0.slice(), anzahl = 0;
    function weiter(){
      var best = -1, bm = 0, bn = 99;
      for (var i = 0; i < g.length; i++) if (!g[i]){
        var m = moeglich(g, G, i), n = 0; for (var t = m; t; t &= t - 1) n++;
        if (!n) return;
        if (n < bn){ bn = n; best = i; bm = m; if (n === 1) break; }
      }
      if (best < 0){ anzahl++; return; }
      var l = bits(bm);
      for (var q = 0; q < l.length && anzahl < grenze; q++){ g[best] = l[q]; weiter(); }
      g[best] = 0;
    }
    weiter();
    return anzahl;
  }
  /* Volles Gitter zufällig füllen */
  function voll(N, rnd){
    var G = geometrie(N), g = new Array(N * N).fill(0);
    function weiter(i){
      if (i === g.length) return true;
      var l = mischen(bits(moeglich(g, G, i)), rnd);
      for (var q = 0; q < l.length; q++){ g[i] = l[q]; if (weiter(i + 1)) return true; }
      g[i] = 0; return false;
    }
    weiter(0);
    return g;
  }
  /* Ohne Raten lösbar? Nur «einzige Möglichkeit im Feld» und «einziger Platz in Zeile, Spalte oder Kasten» */
  function ohneRaten(g0, N){
    var G = geometrie(N), g = g0.slice(), geaendert = true;
    while (geaendert){
      geaendert = false;
      for (var i = 0; i < g.length; i++) if (!g[i]){
        var m = moeglich(g, G, i);
        if (!m) return false;
        if (!(m & (m - 1))){ g[i] = bits(m)[0]; geaendert = true; }
      }
      G.einheiten.forEach(function(e){
        for (var v = 1; v <= N; v++){
          var platz = -1, n = 0, da = false;
          e.forEach(function(j){ if (g[j] === v) da = true; else if (!g[j] && (moeglich(g, G, j) & (1 << v))){ n++; platz = j; } });
          if (!da && n === 1){ g[platz] = v; geaendert = true; }
        }
      });
    }
    return g.every(function(v){ return v; });
  }
  /* Wie viele Zahlen vorgegeben bleiben (Richtwert, eher mehr, wenn sonst Raten nötig wäre) */
  var VORGABEN = { 4:{ leicht:10, mittel:8, schwer:6 }, 6:{ leicht:22, mittel:17, schwer:13 }, 9:{ leicht:40, mittel:32, schwer:26 } };
  var NUR_LOGIK = { leicht:true, mittel:true, schwer:false };
  /* o: { N, code:[Symbol 1..N je Stelle], stufe, seed } → { loesung, raetsel, markiert:[Feld je Stelle] } oder null */
  function erzeugen(o){
    var N = o.N, G = geometrie(N), rnd = zufall(o.seed), ziel = (VORGABEN[N] || VORGABEN[4])[o.stufe] || VORGABEN[N].mittel, logik = NUR_LOGIK[o.stufe] !== false;
    for (var versuch = 0; versuch < 40; versuch++){
      var los = voll(N, rnd), markiert = [], ok = true;
      var strafe = function(i){ var s = 0; markiert.forEach(function(j){ if (G.kastenVon[i] === G.kastenVon[j]) s += 2; if (Math.floor(i / N) === Math.floor(j / N)) s += 1; if (i % N === j % N) s += 1; }); return s; };
      // Code-Felder: Feld mit dem gesuchten Symbol, möglichst in verschiedenen Kästen, Zeilen und Spalten
      o.code.forEach(function(v){
        if (!ok) return;
        var kand = [];
        for (var i = 0; i < los.length; i++) if (los[i] === v && markiert.indexOf(i) < 0) kand.push(i);
        if (!kand.length){ ok = false; return; }
        mischen(kand, rnd);
        kand.sort(function(a, b){ return strafe(a) - strafe(b); });
        markiert.push(kand[0]);
      });
      if (!ok) return null;   // Symbol kommt zu oft im Code vor
      var g = los.slice();
      markiert.forEach(function(i){ g[i] = 0; });
      if (zaehlen(g, N, 2) !== 1 || (logik && !ohneRaten(g, N))) continue;
      var reihe = mischen(g.map(function(v, i){ return i; }).filter(function(i){ return g[i]; }), rnd), anzahl = reihe.length;
      for (var q = 0; q < reihe.length && anzahl > ziel; q++){
        var i2 = reihe[q], alt = g[i2];
        g[i2] = 0;
        if (zaehlen(g, N, 2) !== 1 || (logik && !ohneRaten(g, N))) g[i2] = alt; else anzahl--;
      }
      return { loesung:los, raetsel:g, markiert:markiert, vorgaben:anzahl };
    }
    return null;
  }
  return { zufall:zufall, mischen:mischen, kasten:kasten, geometrie:geometrie, zaehlen:zaehlen, voll:voll, ohneRaten:ohneRaten, VORGABEN:VORGABEN, erzeugen:erzeugen };
})();
/* KERN-ENDE */

function esc(t){ return Labor.esc(t); }
var GROESSEN = { 4:{ zelle:84, max:6 }, 6:{ zelle:66, max:8 }, 9:{ zelle:52, max:10 } };
var THEMEN = [   // verbreitete Emojis, gut zu unterscheiden, ohne Varianten-Zeichen (sicher im PDF)
  ['fruechte', tx('Früchte'), ['🍎', '🍌', '🍒', '🍇', '🍓', '🍐', '🍉', '🍋', '🍍']],
  ['tiere', tx('Tiere'), ['🐶', '🐱', '🐭', '🐰', '🦊', '🐻', '🐼', '🐸', '🐷']],
  ['meer', tx('Meer'), ['🐠', '🐙', '🦀', '🐬', '🐳', '🦈', '🐚', '🐢', '🌊']],
  ['suesses', tx('Süsses'), ['🍭', '🍬', '🍫', '🍩', '🍪', '🧁', '🍰', '🍦', '🍯']],
  ['natur', tx('Natur'), ['🌻', '🌳', '🍄', '🌵', '🌸', '🍀', '🌈', '🌾', '🍁']],
  ['sport', tx('Sport'), ['⚽', '🏀', '🎾', '🏈', '⛳', '⚾', '🏓', '🥊', '🛹']],
  ['fahrzeuge', tx('Fahrzeuge'), ['🚗', '🚌', '🚲', '🚂', '🚀', '🚁', '🚜', '⛵', '🛵']]
];
// Farben für die Code-Felder: kräftiger Rand, heller Grund (man kann noch gut hineinschreiben)
var FARBEN = [['#E53935', '#FDE3E2'], ['#1E88E5', '#E1EFFC'], ['#F9A825', '#FFF3CD'], ['#43A047', '#E3F4E4'], ['#8E24AA', '#F3E2F7'], ['#FB8C00', '#FFEBD6'],
  ['#00ACC1', '#DDF5F8'], ['#EC407A', '#FDE4EC'], ['#6D4C41', '#EFE7E3'], ['#546E7A', '#E7EDF0']];
var WOERTER = { de:['OMA', 'UHU', 'ZOO', 'MAUS', 'HAUS', 'BAUM', 'TIGER', 'SONNE', 'SCHATZ', 'ZAUBER'], en:['ZOO', 'MOM', 'DOG', 'BIRD', 'HOME', 'TIGER', 'MAGIC', 'PIRATE'], fr:['ZOO', 'CHAT', 'LOUP', 'TIGRE', 'POMME', 'PIRATE'] };
function zeichenVon(text){ return Array.from(String(text || '').toUpperCase().replace(/ß/g, 'SS')).filter(function(c){ return /[A-Z0-9ÄÖÜ]/.test(c); }); }

var VORLAGE = '<div class="sd">' +
  tx('<header class="sd-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Sudoku</h1>') +
    tx('<p>Mit Zahlen oder Emojis, von 4 × 4 bis zum normalen 9 × 9 – immer eindeutig lösbar. Die markierten Felder ergeben einen Code fürs Zahlenschloss.</p></header>') +
  tx('<div class="sd-layout"><section class="sd-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Grösse</h2></div></div>') +
      tx('<div class="sd-wahl drei" role="radiogroup" aria-label="Grösse">') +
        tx('<label><input type="radio" name="sdGroesse" value="4"><span><b>4 × 4</b><small>zum Einsteigen</small></span></label>') +
        tx('<label><input type="radio" name="sdGroesse" value="6"><span><b>6 × 6</b><small>für Geübte</small></span></label>') +
        tx('<label><input type="radio" name="sdGroesse" value="9"><span><b>9 × 9</b><small>das normale Sudoku – für die ganz Guten</small></span></label></div>') +
    '</div>' +
    tx('<div class="karte" id="sdSymbolKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Zahlen oder Emojis</h2></div></div>') +
      tx('<div class="sd-wahl" role="radiogroup" aria-label="Zahlen oder Emojis">') +
        '<label><input type="radio" name="sdSymbole" value="zahlen"><span><b>' + tx('Zahlen') + '</b><small id="sdZahlenText"></small></span></label>' +
        tx('<label><input type="radio" name="sdSymbole" value="emojis"><span><b>Emojis</b><small>Bilder statt Zahlen</small></span></label></div>') +
      tx('<div id="sdThemaZeile" hidden><p class="feld-label sd-abstand">Thema</p><div class="sd-themen" role="radiogroup" aria-label="Thema">') +
        THEMEN.map(function(t){ return '<label><input type="radio" name="sdThema" value="' + t[0] + '"><span><b>' + esc(t[1]) + '</b><i aria-hidden="true">' + t[2].slice(0, 4).join('') + '</i></span></label>'; }).join('') +
      '</div></div>' +
    '</div>' +
    tx('<div class="karte" id="sdCodeKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Code</h2><p>So viele Felder werden markiert, wie der Code Zeichen hat.</p></div></div>') +
      tx('<label class="feld-label" for="sdCode">Code</label>') +
      '<div class="sd-zeile"><input type="text" id="sdCode" maxlength="16" autocomplete="off" spellcheck="false">' +
        tx('<button type="button" class="btn klein" id="sdBeispiel" title="Einen Code vorschlagen">Beispiel</button></div>') +
      '<p class="hinweis" id="sdCodeHinweis"></p>' +
      '<div id="sdInfo" aria-live="polite"></div>' +
    '</div>' +
    tx('<div class="karte" id="sdStufeKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">4</span><div><h2>Schwierigkeit</h2></div></div>') +
      tx('<div class="sd-wahl drei" role="radiogroup" aria-label="Schwierigkeit">') +
        tx('<label><input type="radio" name="sdStufe" value="leicht"><span><b>Leicht</b><small>viele Zahlen vorgegeben</small></span></label>') +
        tx('<label><input type="radio" name="sdStufe" value="mittel"><span><b>Mittel</b><small>ohne Raten lösbar</small></span></label>') +
        tx('<label><input type="radio" name="sdStufe" value="schwer"><span><b>Schwer</b><small>wenige Zahlen vorgegeben</small></span></label></div>') +
    '</div>' +
    tx('<div class="karte" id="sdMarkeKarte" hidden><div class="karte-kopf"><span class="stufe" aria-hidden="true">5</span><div><h2>Markierung der Code-Felder</h2><p>Woran man die Reihenfolge erkennt.</p></div></div>') +
      tx('<div class="sd-wahl drei" role="radiogroup" aria-label="Markierung">') +
        tx('<label><input type="radio" name="sdMarke" value="nummern"><span><b>Kleine Nummern</b><small>❶ ❷ ❸ in der Ecke</small></span></label>') +
        tx('<label><input type="radio" name="sdMarke" value="farben"><span><b>Farben</b><small>mit Farbcode unten</small></span></label>') +
        tx('<label><input type="radio" name="sdMarke" value="beides"><span><b>Nummern und Farben</b><small>beides zusammen</small></span></label></div>') +
    '</div>' +
    tx('<div class="karte" id="sdEinstKarte" hidden><details class="optionen"><summary>Einstellungen</summary>') +
      tx('<label class="opt"><input type="checkbox" id="sdKaestchen"><span>Kästchen für den Code auf dem Blatt</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="sdLegendeImmer"><span>Legende auch dann, wenn die Zahlen schon der Code sind (Zahlen werden zu anderen Zeichen)</span></label>') +
    '</details></div>' +
  '</section>' +
  tx('<section class="sd-ausgabe" aria-label="Ergebnis">') +
    '<div id="sdMeldung" aria-live="polite"></div>' +
    '<div class="sd-werkzeug" id="sdWerkzeug" hidden>' +
      tx('<button type="button" class="btn klein" id="sdNeu" title="Ein anderes Sudoku mit demselben Code">Neues Sudoku</button>') +
      tx('<button type="button" class="btn klein" id="sdZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="sdMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="sdPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="sdHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="sd-rahmen" hidden><article class="sd-blatt" id="sdBlatt"></article></div>' +
    '<div class="sd-rahmen"><article class="sd-blatt sd-loesungsblatt" id="sdLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">' +
  '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M12 3v18M3 12h18" stroke-width="2.4"/><path d="M7.5 3v18M16.5 3v18M3 7.5h18M3 16.5h18" stroke-width="0.9" opacity=".6"/></svg>';

Labor.registriere({
  id:'sudoku',
  titel:'Sudoku',
  kurz:'Zahlen oder Emojis – die markierten Felder ergeben den Code',
  beschreibung:'Sudoku in 4 × 4, 6 × 6 oder 9 × 9 mit Zahlen oder Emojis, immer eindeutig lösbar (leicht und mittel ohne Raten). Eigener Code: Die markierten Felder – mit kleinen Nummern oder Farben – ergeben ihn der Reihe nach. Mit Lösungsblatt.',
  merkmale:['4 × 4, 6 × 6 und 9 × 9', 'Zahlen oder Emojis', 'Code mit Nummern oder Farben'],
  symbol:SYMBOL,
  css:'raetsel/sudoku/sudoku.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'sudoku-eingaben', OPT = 'sudoku-einstellungen';
  var STANDARD = { groesse:0, symbole:'', thema:'', stufe:'', marke:'', kaestchen:true, legendeImmer:false, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { code:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) }, zeigeLoesung = false;
  try { var o0 = JSON.parse(localStorage.getItem(OPT)); if (o0) Object.assign(st.opt, o0); } catch(x){}
  try { var e0 = JSON.parse(sessionStorage.getItem(TAB)); if (e0){ st.code = String(e0.code || ''); st.seed = +e0.seed || st.seed; } } catch(x){}
  if (!GROESSEN[st.opt.groesse]) st.opt.groesse = 0;
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#sdMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  $('#sdCode').value = st.code;
  $('#sdCode').addEventListener('input', function(){ st.code = this.value; speichern(); baldZeichnen(); });
  var bspZahl = true;
  $('#sdBeispiel').addEventListener('click', function(){
    var N = st.opt.groesse || 4, r = Kern.zufall(Date.now()), z = '', w = (WOERTER[Labor.sprache] || WOERTER.de).filter(function(x){ return new Set(x).size <= N && x.length <= GROESSEN[N].max && x !== st.code; });
    if (bspZahl || !w.length){ var direkt = st.opt.symbole === 'zahlen'; for (var i = 0; i < (N === 4 ? 3 : 4); i++) z += direkt ? 1 + Math.floor(r() * N) : Math.floor(r() * 10); }
    else z = w[Math.floor(r() * w.length)];
    bspZahl = !bspZahl; st.code = z; $('#sdCode').value = z; speichern(); zeichnen(); $('#sdCode').focus();
  });
  function radios(name, k, zahl){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = zahl ? +r.value : r.value; speichern(); zeichnen(); });
    });
  }
  radios('sdGroesse', 'groesse', true); radios('sdSymbole', 'symbole'); radios('sdThema', 'thema'); radios('sdStufe', 'stufe'); radios('sdMarke', 'marke');
  [['#sdKaestchen', 'kaestchen'], ['#sdLegendeImmer', 'legendeImmer'], ['#sdMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#sdNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#sdZeigeLoesung').addEventListener('click', function(){ zeigeLoesung = !zeigeLoesung; loesungZeigen(); if (zeigeLoesung) $('#sdLoesung').scrollIntoView({ behavior:'smooth', block:'start' }); });
  function loesungZeigen(){
    $('#sdZeigeLoesung').setAttribute('aria-pressed', zeigeLoesung ? 'true' : 'false');
    $('#sdZeigeLoesung').textContent = zeigeLoesung ? tx('Lösung verbergen') : tx('Lösung zeigen');
    $('#sdLoesung').classList.toggle('offen', zeigeLoesung);
  }

  /* ---------- Code prüfen und übersetzen ----------
     Direkt: Zahlen-Sudoku und der Code besteht nur aus Ziffern 1 bis N. Sonst eine Legende: Jedes Zeichen des Codes bekommt ein
     eigenes Symbol (Zahl oder Emoji), die übrigen Symbole bekommen Zeichen, die im Code nicht vorkommen. */
  function planCode(Z, N, rnd){
    var direkt = st.opt.symbole === 'zahlen' && !st.opt.legendeImmer && Z.every(function(c){ return /[1-9]/.test(c) && +c <= N; });
    if (direkt) return { direkt:true, code:Z.map(Number), legende:null };
    var verschieden = Z.filter(function(c, i){ return Z.indexOf(c) === i; });
    if (verschieden.length > N) return { fehler:tx('Der Code hat {v} verschiedene Zeichen – im {n} × {n} Sudoku gibt es nur {n} verschiedene. Höchstens {n} verschiedene Zeichen.', { v:verschieden.length, n:N }) };
    var syms = Kern.mischen(Array.from({ length:N }, function(_, i){ return i + 1; }), rnd), zu = {}, legende = [];
    verschieden.forEach(function(c, i){ zu[c] = syms[i]; });
    var buchstaben = Z.some(function(c){ return /[A-ZÄÖÜ]/.test(c); }), vorrat = Kern.mischen((buchstaben ? 'ABCDEFGHIJKLMNOPRSTUVWZ' : '0123456789').split('').filter(function(c){ return verschieden.indexOf(c) < 0; }), rnd), k = 0;
    for (var s = 1; s <= N; s++){
      var c = null;
      Object.keys(zu).forEach(function(x){ if (zu[x] === s) c = x; });
      legende.push({ sym:s, zeichen:c !== null ? c : vorrat[k++] });
    }
    return { direkt:false, code:Z.map(function(c){ return zu[c]; }), legende:legende };
  }

  /* ---------- Blatt ---------- */
  var E = null, Z = [], CP = null, N = 0, themaEmojis = null;
  function symbolHtml(v){ return themaEmojis ? '<span class="sd-emoji">' + themaEmojis[v - 1] + '</span>' : String(v); }
  function alleZu(){ $('#sdBlatt').parentNode.hidden = true; $('#sdWerkzeug').hidden = true; $('#sdLoesung').innerHTML = ''; }
  function zeichnen(){
    if (aus) return;
    var o = st.opt;
    N = o.groesse;
    $('#sdZahlenText').textContent = N ? tx('die Zahlen 1 bis {n}', { n:N }) : tx('die Zahlen 1 bis 4, 6 oder 9');
    $('#sdSymbolKarte').hidden = !N;
    $('#sdThemaZeile').hidden = o.symbole !== 'emojis';
    var symOk = o.symbole === 'zahlen' || (o.symbole === 'emojis' && o.thema);
    $('#sdCodeKarte').hidden = !N || !symOk;
    if (N) $('#sdCodeHinweis').textContent = o.symbole === 'zahlen' ? tx('Ziffern 1 bis {n} kommen direkt aus dem Sudoku. Andere Ziffern und Buchstaben gehen auch – dann steht eine Legende auf dem Blatt. Höchstens {m} Zeichen.', { n:N, m:GROESSEN[N].max })
      : tx('Ziffern oder Buchstaben – eine Legende auf dem Blatt übersetzt die Bilder in den Code. Höchstens {m} Zeichen, höchstens {n} verschiedene.', { n:N, m:GROESSEN[N].max });
    Z = zeichenVon(st.code);
    var info = '', fehler = '', max = N ? GROESSEN[N].max : 10;
    if (Z.length > max){ info += tx('<p class="sd-info warnung">Höchstens {m} Zeichen – es werden die ersten {m} verwendet.</p>', { m:max }); Z = Z.slice(0, max); }
    themaEmojis = null;
    if (o.symbole === 'emojis'){ var t = THEMEN.filter(function(x){ return x[0] === o.thema; })[0]; if (t) themaEmojis = Kern.mischen(t[2].slice(), Kern.zufall(st.seed + 3)).slice(0, N); }
    CP = null;
    if (N && Z.length){
      CP = planCode(Z, N, Kern.zufall(st.seed + 11));
      if (CP.fehler) fehler = CP.fehler;
      else {
        var zaehl = {}; CP.code.forEach(function(v){ zaehl[v] = (zaehl[v] || 0) + 1; });
        if (Object.keys(zaehl).some(function(v){ return zaehl[v] > N; })) fehler = tx('Ein Zeichen kommt öfter als {n}-mal im Code vor – im Sudoku gibt es jedes nur {n}-mal.', { n:N });
      }
      info = tx('<p class="sd-info ok">Code: <b>{c}</b> · {n} Felder werden markiert</p>', { c:esc(Z.join('')), n:Z.length }) + info;
      if (!fehler && !CP.direkt) info += '<p class="sd-info">' + (o.symbole === 'emojis' ? tx('Die Legende auf dem Blatt übersetzt die Bilder in die Zeichen des Codes.') : tx('Der Code enthält Zeichen, die im Sudoku nicht vorkommen – die Legende auf dem Blatt übersetzt die Zahlen.')) + '</p>';
      if (fehler) info += '<p class="sd-info warnung">' + esc(fehler) + '</p>';
    }
    $('#sdInfo').innerHTML = info;
    var codeOk = !!(N && symOk && Z.length && CP && !fehler);
    $('#sdStufeKarte').hidden = !codeOk;
    $('#sdMarkeKarte').hidden = !codeOk || !o.stufe;
    $('#sdEinstKarte').hidden = !codeOk || !o.stufe || !o.marke;
    if (!N){ alleZu(); E = null; meldung('info', tx('<p>Wähle links die Grösse des Sudokus.</p>')); return; }
    if (!symOk){ alleZu(); E = null; meldung('info', o.symbole === 'emojis' ? tx('<p>Wähle ein Thema für die Emojis.</p>') : tx('<p>Wähle, ob das Sudoku Zahlen oder Emojis hat.</p>')); return; }
    if (!Z.length){ alleZu(); E = null; meldung('info', tx('<p>Gib den Code ein – zum Beispiel die Zahlen fürs Zahlenschloss.</p>')); return; }
    if (fehler){ alleZu(); E = null; meldung('warnung', '<p>' + esc(fehler) + '</p>'); return; }
    if (!o.stufe){ alleZu(); E = null; meldung('info', tx('<p>Wähle die Schwierigkeit.</p>')); return; }
    if (!o.marke){ alleZu(); E = null; meldung('info', tx('<p>Wähle, wie die Code-Felder markiert werden.</p>')); return; }
    E = Kern.erzeugen({ N:N, code:CP.code, stufe:o.stufe, seed:st.seed });
    if (!E){ alleZu(); meldung('warnung', tx('<p>Mit diesem Code klappt es nicht. Versuche «Neues Sudoku» oder einen anderen Code.</p>')); return; }
    meldung('', '');
    $('#sdWerkzeug').hidden = false;
    $('#sdBlatt').parentNode.hidden = false;
    $('#sdBlatt').innerHTML = blattHtml(false);
    $('#sdLoesung').innerHTML = blattHtml(true);
    loesungZeigen();
  }
  function nummern(){ return st.opt.marke === 'nummern' || st.opt.marke === 'beides'; }
  function farben(){ return st.opt.marke === 'farben' || st.opt.marke === 'beides'; }
  function gitterHtml(loesung){
    var K = Kern.kasten(N), z = GROESSEN[N].zelle, h = '';
    for (var i = 0; i < N * N; i++){
      var r = Math.floor(i / N), c = i % N, q = E.markiert.indexOf(i), v = E.raetsel[i], kl = 'sd-feld';
      if ((c + 1) % K.b === 0 && c < N - 1) kl += ' rand-r';
      if ((r + 1) % K.h === 0 && r < N - 1) kl += ' rand-u';
      if (c === N - 1) kl += ' ende-r';
      if (r === N - 1) kl += ' ende-u';
      if (v) kl += ' vorgabe';
      var stil = '', inhalt = v ? symbolHtml(v) : loesung ? '<span class="sd-loes">' + symbolHtml(E.loesung[i]) + '</span>' : '';
      if (q >= 0 && farben()) stil = ' style="background:' + FARBEN[q % FARBEN.length][1] + '"';
      else if (q >= 0 && loesung) stil = ' style="background:#FFF3B0"';
      h += '<div class="' + kl + '"' + stil + '>' + (q >= 0 && farben() ? '<span class="sd-rahmen-farbe" style="border-color:' + FARBEN[q % FARBEN.length][0] + '"></span>' : '') +
        (q >= 0 && nummern() ? '<span class="sd-nr"' + (farben() ? ' style="background:' + FARBEN[q % FARBEN.length][0] + '"' : '') + '>' + (q + 1) + '</span>' : '') + inhalt + '</div>';
    }
    return '<div class="sd-gitter' + (themaEmojis ? ' emojis' : '') + '" style="--n:' + N + ';--zelle:' + z + 'px">' + h + '</div>';
  }
  function codeHtml(loesung){
    var h = '';
    CP.code.forEach(function(v, q){
      var f = FARBEN[q % FARBEN.length];
      h += '<span class="sd-codefeld"' + (farben() ? ' style="background:' + f[1] + ';border-color:' + f[0] + '"' : '') + '>' +
        (nummern() ? '<span class="sd-nr"' + (farben() ? ' style="background:' + f[0] + '"' : '') + '>' + (q + 1) + '</span>' : '') +
        (loesung ? '<b>' + esc(Z[q]) + '</b>' : '') + '</span>';
    });
    return '<div class="sd-code"><span>' + tx('Code:') + '</span><span class="sd-codefelder">' + h + '</span></div>';
  }
  function legendeHtml(){
    if (!CP.legende) return '';
    return '<div class="sd-legende"><span class="sd-legende-titel">' + (themaEmojis ? tx('Legende – so wird aus den Bildern der Code:') : tx('Legende – so wird aus den Zahlen der Code:')) + '</span><span class="sd-legende-paare">' +
      CP.legende.map(function(l){ return '<span>' + symbolHtml(l.sym) + ' = <b>' + esc(l.zeichen) + '</b></span>'; }).join('') + '</span></div>';
  }
  function blattHtml(loesung){
    var o = st.opt, h = '';
    if (o.titelAn) h += '<h2>' + (loesung ? tx('Sudoku – Lösung') : tx('Sudoku')) + '</h2>';
    else if (loesung) h += tx('<p class="sd-anleitung"><b>Lösung</b></p>');
    if (o.anleitungAn && !loesung){
      h += '<p class="sd-anleitung">' + (themaEmojis ? tx('Zeichne die Bilder in die leeren Felder – oder schreibe einfach das Zeichen aus der Legende hinein. In jeder Zeile, jeder Spalte und jedem dick umrandeten Kasten kommt jedes Bild genau einmal vor.')
        : tx('Schreibe die Zahlen 1 bis {n} in die leeren Felder: In jeder Zeile, jeder Spalte und jedem dick umrandeten Kasten kommt jede Zahl genau einmal vor.', { n:N })) + ' ' +
        (o.marke === 'nummern' ? tx('Die Felder mit den Nummern ergeben der Reihe nach den Code.') : o.marke === 'farben' ? tx('Die farbigen Felder ergeben den Code – in der Reihenfolge der Farben unten.') : tx('Die markierten Felder ergeben den Code – in der Reihenfolge der Nummern und Farben unten.')) +
        (CP.legende ? ' ' + tx('Die Legende übersetzt sie in die Zeichen des Codes.') : '') + '</p>';
    }
    h += legendeHtml() + gitterHtml(loesung);
    if (o.kaestchen || loesung || farben()) h += codeHtml(loesung);
    if (loesung) h += '<p class="sd-loesungscode">' + tx('Code:') + ' <b>' + esc(Z.join('')) + '</b></p>';
    return h;
  }

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehlerMeldung(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#sdPdf'), function(){ return E && { blaetter:[$('#sdBlatt'), st.opt.mitLoesung && $('#sdLoesung')], name:Labor.pdfName('Sudoku', Z.join('')) }; }, fehlerMeldung);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#sdPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#sdHerunterladen').hidden = false; });
  }
  $('#sdHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !E) return;
    var name = Labor.pdfName('Sudoku', Z.join('')).replace(/\.pdf$/, '.html');
    var inhalt = [$('#sdBlatt'), st.opt.mitLoesung && $('#sdLoesung')].filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Sudoku'), inhalt, '.sd-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
