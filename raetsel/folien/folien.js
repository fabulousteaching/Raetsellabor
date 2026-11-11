/* Rätsellabor – Generator «Überlappende Folien»
   Jedes Zeichen des Codes (Blockschrift 3 × 5 Felder, gemeinsam/pixelschrift.js) wird auf zwei Karten verteilt: eine
   obere und eine untere. Auf Folie gedruckt und ausgeschnitten, legt man eine obere Karte genau auf eine untere – passen
   sie zusammen, ergänzen sich die blauen Felder zum Zeichen. Wahlweise liegen die passenden Karten untereinander, oder die
   unteren sind gemischt (mit zusätzlichen Karten, die nirgends passen). Geprüft: Jede obere Karte ergibt nur mit ihrer
   eigenen unteren Karte ein Zeichen, und keine Karte allein sieht wie ein Zeichen aus. Folie, Lösungsblatt, PDF. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var PS = window.Pixelschrift, N = PS.BREITE * PS.HOEHE;
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  function mischen(a, rnd){ for (var i = a.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function vereinigt(a, b){ return a.map(function(v, i){ return v || b[i] ? 1 : 0; }); }
  function anzahl(m){ return m.reduce(function(s, v){ return s + v; }, 0); }
  /* Ein Zeichen in zwei Hälften teilen: jedes blaue Feld kommt auf die obere, die untere oder (mit Wahrscheinlichkeit
     doppelt) auf beide Karten. Jede Hälfte hat 30–70 % der Felder (mindestens 2) und ist selbst kein Zeichen. */
  function teilen(c, rnd, doppelt){
    var m = PS.maske(c), felder = [], i;
    for (i = 0; i < N; i++) if (m[i]) felder.push(i);
    var n = felder.length, min = Math.max(2, Math.ceil(n * 0.3)), max = Math.min(n - 2, Math.floor(n * 0.7));
    for (var versuch = 0; versuch < 400; versuch++){
      var a = new Array(N).fill(0), b = new Array(N).fill(0);
      felder.forEach(function(f){ var r = rnd(); if (r < doppelt){ a[f] = 1; b[f] = 1; } else if (r < doppelt + (1 - doppelt) / 2) a[f] = 1; else b[f] = 1; });
      var na = anzahl(a), nb = anzahl(b);
      if (na < min || nb < min || na > max || nb > max) continue;
      if (PS.zeichenVon(a) || PS.zeichenVon(b)) continue;
      return { oben:a, unten:b };
    }
    return null;
  }
  /* Zusätzliche untere Karte: die Hälfte eines zufälligen anderen Zeichens */
  function falscheKarte(rnd, doppelt){
    var alle = Object.keys(PS.ZEICHEN), c = alle[Math.floor(rnd() * alle.length)], t = teilen(c, rnd, doppelt);
    return t ? (rnd() < 0.5 ? t.oben : t.unten) : null;
  }
  /* Rätsel planen. o: { zeichen:[…], gemischt, extra (zusätzliche untere Karten), doppelt (Anteil Felder auf beiden), seed }
     → { oben:[{ c, felder }], unten:[{ felder, zu (Index der oberen Karte oder -1) }], paar:[Index der unteren Karte je oberer] }
     oder null. Geprüft: Jede obere Karte ergibt nur mit ihrer eigenen unteren Karte ein Zeichen (bei gleichen Zeichen im Code
     auch über Kreuz, siehe unten). */
  function planen(o){
    var rnd = zufall(o.seed), z = o.zeichen, n = z.length, doppelt = o.doppelt === undefined ? 0.15 : o.doppelt, extra = o.gemischt ? (o.extra || 0) : 0;
    if (!n) return null;
    var teile = z.map(function(c){ return teilen(c, rnd, doppelt); }), falsche = [], k;
    if (teile.some(function(t){ return !t; })) return null;
    for (k = 0; k < extra; k++){ var f0 = falscheKarte(rnd, doppelt); if (!f0) return null; falsche.push(f0); }
    function ergibt(a, b){ return PS.zeichenVon(vereinigt(a, b)); }
    /* Konflikt suchen: Eine obere Karte ergibt mit einer fremden unteren Karte ein Zeichen. Erlaubt nur bei gleichen Zeichen
       im Code (z. B. zwei 8), wenn die Karten in beide Richtungen über Kreuz passen – der Code bleibt dann gleich.
       Dazu: keine zwei gleichen Karten. → { i } (Zeichen neu teilen), { k } (falsche Karte neu) oder null */
    function konflikt(){
      for (var i = 0; i < n; i++){
        for (var j = 0; j < n; j++){
          if (j === i) continue;
          var e = ergibt(teile[i].oben, teile[j].unten);
          if (!e) continue;
          if (e === z[i] && z[j] === z[i] && ergibt(teile[j].oben, teile[i].unten) === z[i]) continue;
          return { i:rnd() < 0.5 ? i : j };
        }
        for (var m = 0; m < falsche.length; m++) if (ergibt(teile[i].oben, falsche[m])) return { k:m };
      }
      var schl = [];
      teile.forEach(function(t){ schl.push(PS.schluessel(t.oben), PS.schluessel(t.unten)); });
      falsche.forEach(function(f){ schl.push(PS.schluessel(f)); });
      for (var q = 0; q < schl.length; q++) if (schl.indexOf(schl[q]) !== q) return q >= 2 * n ? { k:q - 2 * n } : { i:Math.floor(q / 2) };
      return null;
    }
    // gezielt reparieren: nur das betroffene Zeichen (oder die falsche Karte) neu
    for (var runde = 0; runde < 4000; runde++){
      var kf = konflikt();
      if (!kf){
        var unten = teile.map(function(t, i){ return { felder:t.unten, zu:i }; }).concat(falsche.map(function(f){ return { felder:f, zu:-1 }; }));
        if (o.gemischt) for (k = 0; k < 50; k++){ mischen(unten, rnd); if (n < 2 || unten.every(function(u, j){ return u.zu !== j; })) break; }
        var paar = teile.map(function(t, i){ for (var j = 0; j < unten.length; j++) if (unten[j].zu === i) return j; return -1; });
        return { oben:teile.map(function(t, i){ return { c:z[i], felder:t.oben }; }), unten:unten, paar:paar };
      }
      if (kf.k !== undefined){ var f1 = falscheKarte(rnd, doppelt); if (f1) falsche[kf.k] = f1; }
      else { var t1 = teilen(z[kf.i], rnd, doppelt); if (t1) teile[kf.i] = t1; }
    }
    return null;
  }
  return { zufall:zufall, mischen:mischen, vereinigt:vereinigt, anzahl:anzahl, teilen:teilen, planen:planen };
})();
/* KERN-ENDE */

var MM = 703 / 186;                 // Pixel je Millimeter (Blatt 703 Pixel = 186 mm im PDF)
var BLAU = '#1565C0', RAND = '#8A8079', GITTER = '#C9D6E8', TINTE = '#1C1714';
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
var PS = window.Pixelschrift;
var WOERTER = ['MAUS', 'HALLO', 'ZEBRA', 'PIRAT', 'ROBOTER', 'SONNE', 'KATZE', 'TIGER', 'FUCHS', 'APFEL', 'WOLKE', 'DRACHE', 'SCHATZ', 'ZAUBER'];

/* ---------- Zeichnen ---------- */
// Zeichen unten auf den Karten: obere Karten tragen eine Nummer (links), untere ein Symbol (rechts)
var SYMBOLE = ['kreis', 'dreieck', 'quadrat', 'raute', 'stern', 'herz', 'kreuz', 'sechseck', 'ring', 'pfeil'];
function symbolSvg(art, x, y, r, farbe){
  var a = ' fill="' + farbe + '"', p = [], i;
  function eck(k, rr, dreh){ var l = []; for (var j = 0; j < k; j++){ var w = (dreh + j * 360 / k) * Math.PI / 180; l.push(f1(x + rr * Math.sin(w)) + ',' + f1(y - rr * Math.cos(w))); } return l.join(' '); }
  switch (art){
    case 'kreis': return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.85) + '"' + a + '/>';
    case 'ring': return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.7) + '" fill="none" stroke="' + farbe + '" stroke-width="' + f1(r * 0.35) + '"/>';
    case 'dreieck': return '<polygon points="' + eck(3, r * 1.05, 0) + '"' + a + '/>';
    case 'quadrat': return '<rect x="' + f1(x - r * 0.75) + '" y="' + f1(y - r * 0.75) + '" width="' + f1(r * 1.5) + '" height="' + f1(r * 1.5) + '"' + a + '/>';
    case 'raute': return '<polygon points="' + eck(4, r, 0) + '"' + a + '/>';
    case 'sechseck': return '<polygon points="' + eck(6, r * 0.9, 30) + '"' + a + '/>';
    case 'stern': for (i = 0; i < 10; i++){ var rr = i % 2 ? r * 0.45 : r * 1.05, w = i * 36 * Math.PI / 180; p.push(f1(x + rr * Math.sin(w)) + ',' + f1(y + r * 0.08 - rr * Math.cos(w))); } return '<polygon points="' + p.join(' ') + '"' + a + '/>';
    case 'herz': var s = r / 10; return '<path d="M' + f1(x) + ' ' + f1(y + 9 * s) + 'C' + f1(x - 4 * s) + ' ' + f1(y + 5 * s) + ' ' + f1(x - 11 * s) + ' ' + f1(y + s) + ' ' + f1(x - 11 * s) + ' ' + f1(y - 4 * s) +
      'C' + f1(x - 11 * s) + ' ' + f1(y - 9 * s) + ' ' + f1(x - 4 * s) + ' ' + f1(y - 11 * s) + ' ' + f1(x) + ' ' + f1(y - 5.5 * s) + 'C' + f1(x + 4 * s) + ' ' + f1(y - 11 * s) + ' ' + f1(x + 11 * s) + ' ' + f1(y - 9 * s) + ' ' + f1(x + 11 * s) + ' ' + f1(y - 4 * s) +
      'C' + f1(x + 11 * s) + ' ' + f1(y + s) + ' ' + f1(x + 4 * s) + ' ' + f1(y + 5 * s) + ' ' + f1(x) + ' ' + f1(y + 9 * s) + 'Z"' + a + '/>';
    case 'kreuz': var d = r * 0.32; return '<path d="M' + f1(x - d) + ' ' + f1(y - r) + 'h' + f1(2 * d) + 'v' + f1(r - d) + 'h' + f1(r - d) + 'v' + f1(2 * d) + 'h' + f1(d - r) + 'v' + f1(r - d) + 'h' + f1(-2 * d) + 'v' + f1(d - r) + 'h' + f1(d - r) + 'v' + f1(-2 * d) + 'h' + f1(r - d) + 'z"' + a + '/>';
    case 'pfeil': return '<polygon points="' + f1(x - r) + ',' + f1(y - r * 0.35) + ' ' + f1(x) + ',' + f1(y - r * 0.35) + ' ' + f1(x) + ',' + f1(y - r) + ' ' + f1(x + r) + ',' + f1(y) + ' ' + f1(x) + ',' + f1(y + r) + ' ' + f1(x) + ',' + f1(y + r * 0.35) + ' ' + f1(x - r) + ',' + f1(y + r * 0.35) + '"' + a + '/>';
  }
  return '';
}
/* Masse einer Karte (Pixel) bei Feldgrösse z (Pixel): Rand rundum, unten ein Streifen für Nummer oder Symbol */
function masse(z){ var rand = Math.max(6, z * 0.32), fuss = Math.max(14, z * 0.62); return { z:z, rand:rand, fuss:fuss, b:3 * z + 2 * rand, h:5 * z + rand + fuss }; }
/* Inhalt einer Karte bei (x, y): Umriss, feines Gitter, blaue Felder; marke: { art:'nummer', text } oder { art:'symbol', name } */
function karteInhalt(M, x, y, felder, marke, o){
  o = o || {};
  var t = o.ohneUmriss ? '' : '<rect x="' + f1(x + 0.4) + '" y="' + f1(y + 0.4) + '" width="' + f1(M.b - 0.8) + '" height="' + f1(M.h - 0.8) + '" rx="' + f1(M.rand * 0.35) + '" fill="' + (o.grund || 'none') + '" stroke="' + RAND + '" stroke-width="0.9"/>';
  var x0 = x + M.rand, y0 = y + M.rand, i, r, c;
  for (i = 0; i < 15; i++) if (felder[i]){ r = Math.floor(i / 3); c = i % 3; t += '<rect x="' + f1(x0 + c * M.z) + '" y="' + f1(y0 + r * M.z) + '" width="' + f1(M.z + 0.3) + '" height="' + f1(M.z + 0.3) + '" fill="' + (o.farbe ? o.farbe(i) : BLAU) + '"/>'; }
  var g = '';
  for (c = 0; c <= 3; c++) g += 'M' + f1(x0 + c * M.z) + ' ' + f1(y0) + 'V' + f1(y0 + 5 * M.z);
  for (r = 0; r <= 5; r++) g += 'M' + f1(x0) + ' ' + f1(y0 + r * M.z) + 'H' + f1(x0 + 3 * M.z);
  t += '<path d="' + g + '" fill="none" stroke="' + GITTER + '" stroke-width="0.6"/>';
  var fy = y + M.h - M.fuss / 2;
  if (marke && marke.art === 'nummer') t += '<text x="' + f1(x + M.rand + 1) + '" y="' + f1(fy) + '" font-size="' + f1(M.fuss * 0.62) + '" font-weight="700" fill="' + TINTE + '" dominant-baseline="central">' + esc(marke.text) + '</text>';
  if (marke && marke.art === 'symbol') t += symbolSvg(marke.name, x + M.b - M.rand - M.fuss * 0.3, fy, M.fuss * 0.3, TINTE);
  return t;
}
/* Karten in Reihen: n Karten, höchstens proReihe nebeneinander, gleichmässig verteilt und mittig → [{ x, y }], Höhe */
function reihen(n, M, breite, y0){
  var abstand = Math.max(8 * MM, M.b * 0.28), pro = Math.max(1, Math.floor((breite + abstand) / (M.b + abstand))), zeilen = Math.ceil(n / pro), proZ = Math.ceil(n / zeilen), l = [], dy = M.h + 6 * MM;
  for (var i = 0; i < n; i++){ var z = Math.floor(i / proZ), inZ = Math.min(proZ, n - z * proZ), s = i - z * proZ, w = inZ * M.b + (inZ - 1) * abstand;
    l.push({ x:(breite - w) / 2 + s * (M.b + abstand), y:y0 + z * dy }); }
  return { orte:l, hoehe:zeilen * dy - 6 * MM };
}

var VORLAGE = '<div class="uf">' +
  '<header class="uf-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Überlappende Folien</h1>' +
    '<p>Karten mit blauen Feldern, auf Folie gedruckt: Wer die richtigen zwei Karten genau aufeinanderlegt, sieht ein Zeichen. Zusammen ergeben sie einen Code.</p></header>' +
  '<div class="uf-layout"><section class="uf-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Code</h2><p>Diese Zeichen erscheinen, wenn die Karten richtig liegen.</p></div></div>' +
      '<label class="feld-label" for="ufCode">Code</label>' +
      '<div class="uf-zeile"><input type="text" id="ufCode" maxlength="20" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn klein" id="ufZufall" title="Einen anderen Code vorschlagen">Andere</button></div>' +
      '<p class="hinweis">1 bis 8 Ziffern oder Buchstaben (A–Z). Jedes Zeichen bekommt eine obere und eine untere Karte.</p>' +
      '<div class="uf-zaehler" id="ufZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Karten</h2></div></div>' +
      '<p class="feld-label">Untere Karten</p><div class="uf-chips" role="radiogroup" aria-label="Lage der unteren Karten">' +
        '<label><input type="radio" name="ufLage" value="gemischt"><span>gemischt · schwerer</span></label>' +
        '<label><input type="radio" name="ufLage" value="unter"><span>genau darunter · leicht</span></label></div>' +
      '<p class="hinweis" id="ufLageInfo"></p>' +
      '<label class="opt" id="ufExtraZeile"><input type="checkbox" id="ufExtra"><span>2 zusätzliche untere Karten, die zu keiner oberen passen</span></label>' +
      '<label class="opt"><input type="checkbox" id="ufDoppelt"><span>Einige Felder auf beiden Karten (die Karten überlappen sich auch im Blau)</span></label>' +
      '<p class="hinweis">Zum Lösen: die Seite mit den Karten auf eine Overhead-Folie drucken (Folie für den Drucker) und die Karten ausschneiden.</p>' +
    '</div>' +
  '</section>' +
  '<section class="uf-ausgabe" aria-label="Ergebnis">' +
    '<div id="ufMeldung" aria-live="polite"></div>' +
    '<div class="uf-werkzeug">' +
      '<button type="button" class="btn klein" id="ufNeu" title="Die Karten neu aufteilen">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="ufMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="ufPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="ufHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="karte uf-spiel nur-bildschirm"><div class="uf-spiel-kopf"><div><h2>Am Bildschirm ausprobieren</h2><p id="ufSpielText">Ziehe die oberen Karten auf die unteren.</p></div>' +
      '<div class="uf-spiel-knoepfe"><button type="button" class="btn klein" id="ufZurueck">Karten zurücklegen</button><button type="button" class="btn klein" id="ufZeige">Lösung zeigen</button></div></div>' +
      '<div class="uf-spielfeld" id="ufSpielfeld"></div></div>' +
    '<div class="uf-rahmen"><article class="uf-blatt" id="ufBlatt"></article></div>' +
    '<div class="uf-rahmen" hidden><article class="uf-blatt uf-blatt2" id="ufBlatt2"></article></div>' +
    '<div class="uf-rahmen"><article class="uf-blatt uf-loesungsblatt" id="ufLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="3" width="11" height="15" rx="1.5"/><rect x="10" y="6" width="11" height="15" rx="1.5" fill="currentColor" fill-opacity=".18"/></svg>';

Labor.registriere({
  id:'folien',
  titel:'Überlappende Folien',
  kurz:'Zwei Karten aufeinanderlegen – ein Zeichen erscheint',
  beschreibung:'Karten mit blauen Feldern zum Drucken auf Folie: Legt man die richtige obere Karte genau auf die richtige untere, ergänzen sich die Felder zu einer Ziffer oder einem Buchstaben. Zusammen ergeben sie einen Code. Mit Lösungsblatt.',
  merkmale:['Eigener Code', 'Gemischt oder untereinander', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/folien/folien.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'folien-eingaben', OPT = 'folien-einstellungen';
  var STANDARD = { lage:'gemischt', extra:true, doppelt:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var ZELLE = 8;   // Feldgrösse in mm: Karte 29 × 47 mm – bis 4 Zeichen auf einem Blatt, sonst die unteren Karten auf einem zweiten
  var st = { code:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.code = String(e.code || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (['gemischt', 'unter'].indexOf(st.opt.lage) < 0) st.opt.lage = 'gemischt';
  delete st.opt.zelle;   // früher wählbar
  if (!PS.lesen(st.code).zeichen.length) st.code = String(1000 + Math.floor(Math.random() * 9000));
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#ufMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  $('#ufCode').value = st.code;
  $('#ufCode').addEventListener('input', function(){ st.code = this.value; speichern(); baldZeichnen(); });
  var zahlDran = /[A-Za-z]/.test(st.code);
  $('#ufZufall').addEventListener('click', function(){
    var r = Kern.zufall(Date.now()), z = '';
    if (zahlDran){ for (var i = 0; i < 4; i++) z += Math.floor(r() * 10); }
    else { var l = WOERTER.filter(function(w){ return w !== st.code.toUpperCase(); }); z = l[Math.floor(r() * l.length)]; }
    zahlDran = !zahlDran; st.code = z; $('#ufCode').value = z; speichern(); zeichnen();
  });
  function radios(name, k){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === String(st.opt[k]);
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[k] = typeof STANDARD[k] === 'number' ? +r.value : r.value; speichern(); zeichnen(); });
    });
  }
  radios('ufLage', 'lage');
  [['#ufExtra', 'extra'], ['#ufDoppelt', 'doppelt'], ['#ufMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#ufNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Blatt ---------- */
  var P = null, Z = [], B = 639;
  function gemischt(){ return st.opt.lage === 'gemischt'; }
  function anleitung(){
    var zahl = Z.every(function(c){ return /[0-9]/.test(c); });
    return 'Drucke diese Seite auf eine Folie und schneide die Karten aus. ' +
      (gemischt() ? 'Lege jede obere Karte genau auf eine der unteren Karten. Nur bei der richtigen ergänzen sich die blauen Felder zu einem Zeichen' + (st.opt.extra ? ' – manche untere Karten passen nirgends.' : '.')
        : 'Lege jede obere Karte genau auf die Karte mit derselben Nummer darunter – die blauen Felder ergänzen sich zu einem Zeichen.') +
      ' Lies die Zeichen in der Reihenfolge der Nummern: Wie heisst ' + (zahl ? 'die Zahl' : 'der Code') + '?';
  }
  /* Kartenblatt: obere Karten (Nummern) und/oder untere Karten (Symbole oder dieselben Nummern); teile: 'beide', 'oben', 'unten' */
  function kartenSvg(M, teile){
    var t = '', y = 0;
    function abschnitt(titel, karten, marke){
      var r = reihen(karten.length, M, B, y + 22);
      t += '<text x="0" y="' + f1(y + 12) + '" font-size="13" font-weight="700" fill="' + TINTE + '">' + titel + '</text>';
      karten.forEach(function(k, i){ t += karteInhalt(M, r.orte[i].x, r.orte[i].y, k.felder, marke(k, i)); });
      y += 22 + r.hoehe + 22;
    }
    if (teile !== 'unten') abschnitt('Obere Karten', P.oben, function(k, i){ return { art:'nummer', text:String(i + 1) }; });
    if (teile !== 'oben') abschnitt('Untere Karten', P.unten, function(k, j){ return gemischt() ? { art:'symbol', name:SYMBOLE[j % SYMBOLE.length] } : { art:'nummer', text:String(k.zu + 1) }; });
    var h = y - 18;
    return { svg:'<svg class="uf-karten" width="' + B + '" height="' + f1(h) + '" viewBox="0 0 ' + B + ' ' + f1(h) + '">' + t + '</svg>', hoehe:h };
  }
  function loesungSvg(M){
    var o = reihen(P.oben.length, M, B, 4), t = '';
    P.oben.forEach(function(k, i){
      var u = P.unten[P.paar[i]], ganz = Kern.vereinigt(k.felder, u.felder), x = o.orte[i].x, y = o.orte[i].y;
      t += karteInhalt(M, x, y, ganz, { art:'nummer', text:String(i + 1) }, { farbe:function(f){ return k.felder[f] && u.felder[f] ? '#0D47A1' : k.felder[f] ? BLAU : '#4F8FDB'; } });
      if (gemischt()) t += symbolSvg(SYMBOLE[P.paar[i] % SYMBOLE.length], x + M.b - M.rand - M.fuss * 0.3, y + M.h - M.fuss / 2, M.fuss * 0.3, TINTE);
    });
    var h = o.hoehe + 8;
    return '<svg class="uf-karten" width="' + B + '" height="' + f1(h) + '" viewBox="0 0 ' + B + ' ' + f1(h) + '">' + t + '</svg>';
  }
  function zeichnen(){
    if (aus) return;
    var L = PS.lesen(st.code, 8), h = '';
    Z = L.zeichen;
    if (L.weg.length) h += '<p class="warnung">' + esc(L.weg.join(' ')) + ' gibt es nicht – nur Ziffern und Buchstaben A–Z (Ä, Ö, Ü werden zu AE, OE, UE).</p>';
    if (L.zuViele) h += '<p class="warnung">Höchstens 8 Zeichen – es werden die ersten 8 verwendet.</p>';
    var aehnlich = PS.AEHNLICH.filter(function(p){ return Z.indexOf(p[0]) >= 0 && Z.indexOf(p[1]) >= 0; });
    if (aehnlich.length) h += '<p class="warnung">Sehen sich ähnlich: ' + aehnlich.map(function(p){ return p[0] + ' und ' + p[1]; }).join(', ') + '.</p>';
    $('#ufZaehler').innerHTML = Z.length ? '<p class="uf-zaehler-haupt ok">Code: <b>' + esc(Z.join('')) + '</b> · ' + Z.length + (Z.length === 1 ? ' Zeichen' : ' Zeichen') + '</p>' + h : h;
    $('#ufExtraZeile').hidden = !gemischt();
    $('#ufLageInfo').textContent = gemischt() ? 'Die unteren Karten liegen in anderer Reihenfolge und tragen Symbole statt Nummern – man muss die passende suchen.' : 'Jede untere Karte trägt dieselbe Nummer wie ihre obere.';
    var leer = !Z.length;
    ['#ufNeu', '#ufPdf', '#ufHerunterladen', '#ufZurueck', '#ufZeige'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ P = null; $('#ufBlatt').parentNode.hidden = true; $('#ufBlatt2').parentNode.hidden = true; $('#ufLoesung').parentNode.hidden = true; $('.uf-spiel').hidden = true; meldung('info', '<p>Gib links den Code ein.</p>'); return; }
    P = Kern.planen({ zeichen:Z, gemischt:gemischt(), extra:st.opt.extra ? 2 : 0, doppelt:st.opt.doppelt ? 0.15 : 0, seed:st.seed });
    if (!P){ $('#ufBlatt').parentNode.hidden = true; $('#ufBlatt2').parentNode.hidden = true; $('.uf-spiel').hidden = true; meldung('warnung', '<p>Für diesen Code finde ich keine eindeutige Aufteilung. Versuche «Neu mischen» oder andere Zeichen.</p>'); return; }
    meldung('', ''); $('#ufBlatt').parentNode.hidden = false; $('#ufLoesung').parentNode.hidden = false; $('.uf-spiel').hidden = false;
    // feste Feldgrösse; passen nicht alle Karten auf ein Blatt, kommen die unteren auf ein zweites
    var o = st.opt, M = masse(ZELLE * MM), kopfH = (o.titelAn ? 46 : 0) + (o.anleitungAn ? 80 : 0), K = kartenSvg(M, 'beide'), zwei = K.hoehe + kopfH > 950;
    var kopf = (o.titelAn ? '<h2>Überlappende Folien</h2>' : '') + (o.anleitungAn ? '<p class="uf-anleitung">' + esc(anleitung()) + '</p>' : ''), notiz = '<p class="uf-notiz">In Originalgrösse (100 %) auf Folie drucken.</p>';
    $('#ufBlatt').innerHTML = kopf + (zwei ? kartenSvg(M, 'oben').svg + '<p class="uf-notiz">Die unteren Karten sind auf dem nächsten Blatt.</p>' : K.svg) + notiz;
    $('#ufBlatt2').innerHTML = zwei ? (o.titelAn ? '<h2>Überlappende Folien – untere Karten</h2>' : '') + kartenSvg(M, 'unten').svg + notiz : '';
    $('#ufBlatt2').parentNode.hidden = !zwei;
    if (zwei) $('#ufZaehler').innerHTML += '<p class="uf-zaehler-info">Die Karten brauchen zwei Blätter: oben und unten je eines.</p>';
    $('#ufLoesung').innerHTML = (o.titelAn ? '<h2>Überlappende Folien – Lösung</h2>' : '<p class="uf-anleitung"><b>Lösung</b></p>') +
      '<p class="uf-anleitung">So liegen die Karten richtig aufeinander' + (gemischt() ? ' (Nummer der oberen Karte, Symbol der unteren)' : '') + '. Dunkelblau: Felder auf beiden Karten.</p>' + loesungSvg(M) +
      '<p class="uf-code-loesung">Code: <b>' + esc(Z.join('')) + '</b></p>';
    spielAufbauen();
  }

  /* ---------- Am Bildschirm: Karten ziehen ---------- */
  var SM = null, karten = [];
  function spielAufbauen(){
    var feld = $('#ufSpielfeld'), breite = Math.max(300, Math.min(feld.clientWidth || 620, 760));
    SM = masse(Math.max(12, Math.min(22, breite / ((Math.max(P.oben.length, P.unten.length) + 1) * 4.6))));
    var o = reihen(P.oben.length, SM, breite, 4), u = reihen(P.unten.length, SM, breite, 4 + o.hoehe + 30);
    feld.style.height = (4 + o.hoehe + 30 + u.hoehe + 8) + 'px';
    karten = [];
    var h = '';
    P.oben.forEach(function(k, i){ karten.push({ art:'oben', i:i, felder:k.felder, start:o.orte[i], x:o.orte[i].x, y:o.orte[i].y, marke:{ art:'nummer', text:String(i + 1) } }); });
    P.unten.forEach(function(k, j){ karten.push({ art:'unten', i:j, felder:k.felder, start:u.orte[j], x:u.orte[j].x, y:u.orte[j].y, marke:gemischt() ? { art:'symbol', name:SYMBOLE[j % SYMBOLE.length] } : { art:'nummer', text:String(k.zu + 1) } }); });
    karten.forEach(function(k, n){
      h += '<div class="uf-spielkarte' + (k.art === 'oben' ? ' oben' : '') + '" data-n="' + n + '" tabindex="0" role="button" aria-label="' + (k.art === 'oben' ? 'Obere Karte ' + (k.i + 1) : 'Untere Karte') + ' – ziehen" style="width:' + f1(SM.b) + 'px;height:' + f1(SM.h) + 'px">' +
        '<svg width="' + f1(SM.b) + '" height="' + f1(SM.h) + '" viewBox="0 0 ' + f1(SM.b) + ' ' + f1(SM.h) + '">' + karteInhalt(SM, 0, 0, k.felder, k.marke, { grund:k.art === 'oben' ? 'rgba(255,255,255,.08)' : '#fff' }) + '</svg></div>';
    });
    feld.innerHTML = h;
    karten.forEach(setzen);
    pruefen();
  }
  function element(k){ return $('#ufSpielfeld .uf-spielkarte[data-n="' + karten.indexOf(k) + '"]'); }
  function setzen(k){ var el = element(k); if (el){ el.style.left = f1(k.x) + 'px'; el.style.top = f1(k.y) + 'px'; } }
  var oben = 10;
  function anschmiegen(k){
    // liegt die Karte fast auf einer Karte der anderen Reihe, rutscht sie genau darauf
    var best = null, bd = SM.b * 0.4;
    karten.forEach(function(q){ if (q === k || q.art === k.art) return; var d = Math.hypot(q.x - k.x, q.y - k.y); if (d < bd){ bd = d; best = q; } });
    if (best){ k.x = best.x; k.y = best.y; }
    setzen(k);
  }
  function pruefen(){
    var gefunden = [], fertig = true;
    karten.filter(function(k){ return k.art === 'oben'; }).forEach(function(k){
      var u = karten.filter(function(q){ return q.art === 'unten' && Math.abs(q.x - k.x) < 0.5 && Math.abs(q.y - k.y) < 0.5; })[0];
      var c = u ? PS.zeichenVon(Kern.vereinigt(k.felder, u.felder)) : null;
      var el = element(k); if (el) el.classList.toggle('passt', !!c);
      if (c) gefunden.push((k.i + 1) + ' → ' + c);
      if (c !== Z[k.i]) fertig = false;
    });
    var t = $('#ufSpielText');
    if (fertig){ t.innerHTML = '<b>Geschafft! 🎉 Der Code heisst ' + esc(Z.join('')) + '.</b>'; return; }
    t.textContent = gefunden.length ? 'Gefunden: ' + gefunden.join(', ') + '. Weiter so!' : 'Ziehe die oberen Karten (mit Nummer) auf die unteren. Passen zwei zusammen, erscheint ein Zeichen.';
  }
  $('#ufSpielfeld').addEventListener('pointerdown', function(ev){
    var el = ev.target.closest('.uf-spielkarte'); if (!el) return;
    var k = karten[+el.getAttribute('data-n')]; if (!k) return;
    ev.preventDefault(); el.setPointerCapture(ev.pointerId); el.style.zIndex = ++oben; el.classList.add('zieht');
    var sx = ev.clientX, sy = ev.clientY, x0 = k.x, y0 = k.y;
    function zug(e2){ k.x = x0 + e2.clientX - sx; k.y = y0 + e2.clientY - sy; setzen(k); }
    function los(){ el.classList.remove('zieht'); el.removeEventListener('pointermove', zug); el.removeEventListener('pointerup', los); el.removeEventListener('pointercancel', los); anschmiegen(k); pruefen(); }
    el.addEventListener('pointermove', zug); el.addEventListener('pointerup', los); el.addEventListener('pointercancel', los);
  });
  // Tastatur: Pfeiltasten verschieben, Enter legt die Karte auf die nächste passende Stelle
  $('#ufSpielfeld').addEventListener('keydown', function(ev){
    var el = ev.target.closest('.uf-spielkarte'); if (!el) return;
    var k = karten[+el.getAttribute('data-n')], d = { ArrowLeft:[-10, 0], ArrowRight:[10, 0], ArrowUp:[0, -10], ArrowDown:[0, 10] }[ev.key];
    if (!d) return;
    ev.preventDefault(); el.style.zIndex = ++oben; k.x += d[0]; k.y += d[1]; anschmiegen(k); pruefen();
  });
  $('#ufZurueck').addEventListener('click', function(){ karten.forEach(function(k){ k.x = k.start.x; k.y = k.start.y; setzen(k); }); pruefen(); });
  $('#ufZeige').addEventListener('click', function(){
    karten.filter(function(k){ return k.art === 'oben'; }).forEach(function(k){
      var u = karten.filter(function(q){ return q.art === 'unten' && q.i === P.paar[k.i]; })[0];
      if (u){ k.x = u.x; k.y = u.y; var el = element(k); if (el) el.style.zIndex = ++oben; setzen(k); }
    });
    pruefen();
  });

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#ufPdf'), function(){ return P && { blaetter:[$('#ufBlatt'), !$('#ufBlatt2').parentNode.hidden && $('#ufBlatt2'), st.opt.mitLoesung && $('#ufLoesung')], name:Labor.pdfName('Ueberlappende-Folien', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#ufPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#ufHerunterladen').hidden = false; });
  }
  $('#ufHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P) return;
    var name = Labor.pdfName('Ueberlappende-Folien', '').replace(/\.pdf$/, '.html');
    var inhalt = [$('#ufBlatt'), !$('#ufBlatt2').parentNode.hidden && $('#ufBlatt2'), st.opt.mitLoesung && $('#ufLoesung')].filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Überlappende Folien', inhalt, '.uf-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
