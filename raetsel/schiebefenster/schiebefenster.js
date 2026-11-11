/* Rätsellabor – Generator «Schiebefenster»
   Ein Streifen mit schwarzen Bruchstücken (auf Papier) und eine Fensterfolie: ein schwarzer Balken mit einem Fenster,
   genau so gross wie ein Zeichen (3 × 5 Felder). Schiebt man die Folie über den Streifen, erscheint an bestimmten
   Stellen im Fenster ein weisses Zeichen (Blockschrift aus gemeinsam/pixelschrift.js) – der Reihe nach ergeben sie den
   Code. Auf dem Streifen steht jedes Zeichen als «Negativ»: schwarz sind die Felder, die nicht zum Zeichen gehören.
   Zwischen den Zeichen liegt je eine Spalte, auf Wunsch mit schwarzen Ablenk-Feldern. Geprüft: An keiner anderen
   Stelle zeigt das Fenster ein Zeichen. Streifen, Fensterfolie, Lösungsblatt, PDF. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var PS = window.Pixelschrift, B = PS.BREITE, H = PS.HOEHE;
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  var LUECKE = 1;   // Spalten zwischen zwei Zeichen (und am Anfang und Ende)
  // Was zeigt das Fenster bei Spalte x? → Maske (1 = weiss, gehört zum Zeichen)
  function fenster(spalten, x){ var m = []; for (var r = 0; r < H; r++) for (var c = 0; c < B; c++) m.push(spalten[x + c][r] ? 0 : 1); return m; }
  /* Ein Streifen für die Zeichen zs: Spalten [[5 × schwarz?]], ziele (Spalte, an der das Fenster das Zeichen zeigt).
     ablenkung: schwarze Felder in den Lücken (je 40 %). Danach wird repariert, bis das Fenster nur an den Zielen ein Zeichen
     zeigt: Bei einer falschen Stelle wird ein Feld einer Lücke in diesem Fenster umgeschaltet. */
  function streifen(zs, rnd, ablenkung){
    var spalten = [], ziele = [], luecken = [], i, r;
    function luecke(){ for (var k = 0; k < LUECKE; k++){ luecken.push(spalten.length); var s = []; for (r = 0; r < H; r++) s.push(ablenkung && rnd() < 0.4 ? 1 : 0); spalten.push(s); } }
    luecke();
    zs.forEach(function(c){
      var m = PS.maske(c);
      ziele.push(spalten.length);
      for (i = 0; i < B; i++){ var s = []; for (r = 0; r < H; r++) s.push(m[r * B + i] ? 0 : 1); spalten.push(s); }
      luecke();
    });
    for (var runde = 0; runde < 2000; runde++){
      var falsch = -1;
      for (var x = 0; x + B <= spalten.length; x++) if (ziele.indexOf(x) < 0 && PS.zeichenVon(fenster(spalten, x))){ falsch = x; break; }
      if (falsch < 0) return { spalten:spalten, ziele:ziele, zeichen:zs.slice() };
      var drin = luecken.filter(function(l){ return l >= falsch && l < falsch + B; });
      if (!drin.length) return null;
      var l = drin[Math.floor(rnd() * drin.length)], zr = Math.floor(rnd() * H);
      spalten[l][zr] = spalten[l][zr] ? 0 : 1;
    }
    return null;
  }
  /* Rätsel planen. o: { zeichen:[…], proStreifen (höchstens so viele Zeichen je Streifen), ablenkung, seed }
     → { streifen:[{ spalten, ziele, zeichen }] } oder null. Die Zeichen werden gleichmässig auf die Streifen verteilt. */
  function planen(o){
    var rnd = zufall(o.seed), n = o.zeichen.length;
    if (!n) return null;
    var anzahl = Math.ceil(n / o.proStreifen), je = Math.ceil(n / anzahl), l = [];
    for (var i = 0; i < n; i += je){ var s = streifen(o.zeichen.slice(i, i + je), rnd, o.ablenkung); if (!s) return null; l.push(s); }
    return { streifen:l };
  }
  // höchstens so viele Zeichen passen auf einen Streifen der Breite breite (in Feldern)
  function proStreifen(breite){ return Math.max(1, Math.floor((breite - LUECKE) / (B + LUECKE))); }
  return { zufall:zufall, LUECKE:LUECKE, fenster:fenster, streifen:streifen, planen:planen, proStreifen:proStreifen };
})();
/* KERN-ENDE */

var MM = 703 / 186;                 // Pixel je Millimeter (Blatt 703 Pixel = 186 mm im PDF)
var TINTE = '#1C1714', SCHWARZ = '#111111', B = 639;
var PS = window.Pixelschrift;
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
var WOERTER = ['SCHATZ', 'PIRAT', 'TIGER', 'HALLO', 'ROBOTER', 'ZAUBER', 'DRACHE', 'KATZE', 'APFEL', 'RAKETE', 'WOLKE', 'FUCHS'];

/* ---------- Zeichnen ---------- */
// die schwarzen Felder eines Streifens ab (x, y), Feldgrösse z; nebeneinanderliegende Felder einer Zeile als ein Rechteck
function felderSvg(s, x, y, z){
  var t = '', H = PS.HOEHE;
  for (var r = 0; r < H; r++){
    var anfang = -1;
    for (var c = 0; c <= s.spalten.length; c++){
      var da = c < s.spalten.length && s.spalten[c][r];
      if (da && anfang < 0) anfang = c;
      if (!da && anfang >= 0){ t += '<rect x="' + f1(x + anfang * z) + '" y="' + f1(y + r * z) + '" width="' + f1((c - anfang) * z + 0.3) + '" height="' + f1(z + 0.3) + '"/>'; anfang = -1; }
    }
  }
  return '<g fill="' + SCHWARZ + '">' + t + '</g>';
}
/* Masse bei Feldgrösse z (Pixel): Rand m des Balkens über und unter dem Fenster; Balkenhöhe */
function masse(z){ var m = Math.max(5 * MM, z * 0.8); return { z:z, m:m, balkenH:5 * z + 2 * m }; }
/* Ein Streifen fürs Blatt: Nummer, Führungslinien (dort liegen die Kanten der Folie), Startpfeil, Felder. → { svg, h } */
function streifenSvg(s, M, nr, mehrere, loesung){
  var w = s.spalten.length * M.z, x0 = (B - w) / 2, kopf = 18, y0 = kopf + M.m, h = kopf + M.balkenH + 4, t = '';
  t += '<text x="' + f1(x0) + '" y="12" font-size="12" font-weight="700" fill="' + TINTE + '">' + (mehrere ? 'Streifen ' + nr : 'Streifen') + '</text>';
  var lx0 = Math.max(0, x0 - 18), lx1 = Math.min(B, x0 + w + 18);
  [kopf, kopf + M.balkenH].forEach(function(y){ t += '<line x1="' + f1(lx0) + '" y1="' + f1(y) + '" x2="' + f1(lx1) + '" y2="' + f1(y) + '" stroke="#8A8079" stroke-width="0.8" stroke-dasharray="4 3"/>'; });
  t += '<polygon points="' + f1(x0 - 14) + ',' + f1(y0 + 2.5 * M.z - 6) + ' ' + f1(x0 - 4) + ',' + f1(y0 + 2.5 * M.z) + ' ' + f1(x0 - 14) + ',' + f1(y0 + 2.5 * M.z + 6) + '" fill="#E0741C"/>';
  t += felderSvg(s, x0, y0, M.z);
  if (loesung) s.ziele.forEach(function(x, i){
    t += '<rect x="' + f1(x0 + x * M.z - 1.5) + '" y="' + f1(y0 - 1.5) + '" width="' + f1(3 * M.z + 3) + '" height="' + f1(5 * M.z + 3) + '" fill="none" stroke="#E0741C" stroke-width="2.4"/>' +
      '<text x="' + f1(x0 + (x + 1.5) * M.z) + '" y="' + f1(kopf - 4) + '" font-size="13" font-weight="700" fill="#C25A0E" text-anchor="middle">' + esc(s.zeichen[i]) + '</text>';
  });
  return { svg:'<svg class="sf-streifen" width="' + B + '" height="' + f1(h) + '" viewBox="0 0 ' + B + ' ' + f1(h) + '">' + t + '</svg>', h:h };
}
/* Fensterfolie: schwarze Balken so breit wie das Blatt, Fenster (3 × 5 Felder) in der Mitte */
function balkenSvg(M, anzahl){
  var fw = 3 * M.z, fh = 5 * M.z, dy = M.balkenH + 7 * MM, h = anzahl * dy - 7 * MM + 2, t = '';
  for (var i = 0; i < anzahl; i++){
    var y = i * dy + 1, fx = (B - fw) / 2;
    t += '<path d="M0 ' + f1(y) + 'H' + B + 'V' + f1(y + M.balkenH) + 'H0Z M' + f1(fx) + ' ' + f1(y + M.m) + 'V' + f1(y + M.m + fh) + 'H' + f1(fx + fw) + 'V' + f1(y + M.m) + 'Z" fill="' + SCHWARZ + '" fill-rule="evenodd"/>';
    t += '<rect x="' + f1(fx) + '" y="' + f1(y + M.m) + '" width="' + f1(fw) + '" height="' + f1(fh) + '" fill="none" stroke="#9A9A9A" stroke-width="0.6" stroke-dasharray="2 2"/>';
  }
  return '<svg class="sf-balken" width="' + B + '" height="' + f1(h) + '" viewBox="0 0 ' + B + ' ' + f1(h) + '">' + t + '</svg>';
}

var VORLAGE = '<div class="sf">' +
  '<header class="sf-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Schiebefenster</h1>' +
    '<p>Ein Streifen mit schwarzen Bruchstücken und eine Folie mit einem Fenster: Schiebt man das Fenster über den Streifen, erscheinen an bestimmten Stellen Zeichen – zusammen ein Code.</p></header>' +
  '<div class="sf-layout"><section class="sf-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Code</h2><p>Diese Zeichen erscheinen der Reihe nach im Fenster.</p></div></div>' +
      '<label class="feld-label" for="sfCode">Code</label>' +
      '<div class="sf-zeile"><input type="text" id="sfCode" maxlength="24" autocomplete="off" spellcheck="false">' +
        '<button type="button" class="btn klein" id="sfZufall" title="Einen anderen Code vorschlagen">Andere</button></div>' +
      '<p class="hinweis">1 bis 12 Ziffern oder Buchstaben (A–Z). Passen nicht alle auf einen Streifen, gibt es mehrere.</p>' +
      '<div class="sf-zaehler" id="sfZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Streifen und Folie</h2></div></div>' +
      '<label class="opt"><input type="checkbox" id="sfAblenkung"><span>Ablenkung: schwarze Felder zwischen den Zeichen, damit man ohne Fenster nichts erkennt</span></label>' +
      '<p class="feld-label">Grösse eines Felds</p><div class="sf-chips" role="radiogroup" aria-label="Grösse eines Felds">' +
        [[6, '6 mm'], [7, '7 mm'], [8, '8 mm']].map(function(x){ return '<label><input type="radio" name="sfZelle" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join('') + '</div>' +
      '<label class="opt"><input type="checkbox" id="sfLinie"><span>Linie für den Code</span></label>' +
      '<p class="hinweis">Den Streifen auf Papier drucken, die Fensterfolie auf eine Overhead-Folie (Folie für den Drucker) und die Balken ausschneiden.</p>' +
    '</div>' +
  '</section>' +
  '<section class="sf-ausgabe" aria-label="Ergebnis">' +
    '<div id="sfMeldung" aria-live="polite"></div>' +
    '<div class="sf-werkzeug">' +
      '<button type="button" class="btn klein" id="sfNeu" title="Die Ablenkung neu verteilen">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="sfMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="sfPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="sfHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="karte sf-spiel nur-bildschirm"><div class="sf-spiel-kopf"><div><h2>Am Bildschirm ausprobieren</h2><p>Ziehe den schwarzen Balken nach links und rechts (oder Pfeiltasten).</p></div>' +
      '<button type="button" class="btn klein" id="sfZeige" aria-pressed="false">Lösung zeigen</button></div>' +
      '<div id="sfSpielfeld"></div>' +
      '<div class="sf-antwort-zeile"><label for="sfAntwort">Code:</label><input type="text" id="sfAntwort" autocomplete="off" spellcheck="false"><span id="sfAntwortInfo" aria-live="polite"></span></div></div>' +
    '<div class="sf-rahmen"><article class="sf-blatt" id="sfBlatt"></article></div>' +
    '<div class="sf-rahmen"><article class="sf-blatt sf-folie" id="sfFolie"></article></div>' +
    '<div class="sf-rahmen"><article class="sf-blatt sf-loesungsblatt" id="sfLoesung" aria-hidden="true"></article></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="2" y="7" width="20" height="10" rx="1.5"/><rect x="9.5" y="9" width="5" height="6" fill="currentColor" fill-opacity=".2"/><path d="M5 12h2M17 12h2"/></svg>';

Labor.registriere({
  id:'schiebefenster',
  titel:'Schiebefenster',
  kurz:'Ein Fenster über den Streifen schieben – Zeichen erscheinen',
  beschreibung:'Ein Streifen mit schwarzen Bruchstücken und eine Fensterfolie zum Ausschneiden: Schiebt man das Fenster über den Streifen, erscheinen an bestimmten Stellen Ziffern oder Buchstaben – der Reihe nach ein Code. Mit Lösungsblatt.',
  merkmale:['Eigener Code', 'Streifen und Folie', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/schiebefenster/schiebefenster.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'schiebefenster-eingaben', OPT = 'schiebefenster-einstellungen';
  var STANDARD = { ablenkung:true, zelle:7, linie:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { code:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.code = String(e.code || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if ([6, 7, 8].indexOf(+st.opt.zelle) < 0) st.opt.zelle = 7;
  if (!PS.lesen(st.code).zeichen.length) st.code = String(10000 + Math.floor(Math.random() * 90000));
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#sfMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 250); }

  /* ---------- Eingaben ---------- */
  $('#sfCode').value = st.code;
  $('#sfCode').addEventListener('input', function(){ st.code = this.value; speichern(); baldZeichnen(); });
  var zahlDran = /[A-Za-z]/.test(st.code);
  $('#sfZufall').addEventListener('click', function(){
    var r = Kern.zufall(Date.now()), z = '';
    if (zahlDran){ for (var i = 0; i < 5; i++) z += Math.floor(r() * 10); }
    else { var l = WOERTER.filter(function(w){ return w !== st.code.toUpperCase(); }); z = l[Math.floor(r() * l.length)]; }
    zahlDran = !zahlDran; st.code = z; $('#sfCode').value = z; speichern(); zeichnen();
  });
  [].forEach.call(bereich.querySelectorAll('input[name="sfZelle"]'), function(r){
    r.checked = r.value === String(st.opt.zelle);
    r.addEventListener('change', function(){ if (r.checked){ st.opt.zelle = +r.value; speichern(); zeichnen(); } });
  });
  [['#sfAblenkung', 'ablenkung'], ['#sfLinie', 'linie'], ['#sfMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#sfNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Blätter ---------- */
  var P = null, Z = [];
  function anleitung(mehrere){
    return 'Schneide einen schwarzen Balken aus der Fensterfolie aus. Lege ihn so auf ' + (mehrere ? 'den ersten Streifen' : 'den Streifen') + ', dass seine Kanten auf den gestrichelten Linien liegen, ganz links beim Pfeil. ' +
      'Schiebe ihn langsam nach rechts: An manchen Stellen erscheint im Fenster ein weisses Zeichen. Schreibe die Zeichen der Reihe nach auf' + (mehrere ? ' – dann weiter mit dem nächsten Streifen.' : '.');
  }
  function zeichnen(){
    if (aus) return;
    var L = PS.lesen(st.code, 12), h = '', o = st.opt;
    Z = L.zeichen;
    if (L.weg.length) h += '<p class="warnung">' + esc(L.weg.join(' ')) + ' gibt es nicht – nur Ziffern und Buchstaben A–Z (Ä, Ö, Ü werden zu AE, OE, UE).</p>';
    if (L.zuViele) h += '<p class="warnung">Höchstens 12 Zeichen – es werden die ersten 12 verwendet.</p>';
    var aehnlich = PS.AEHNLICH.filter(function(p){ return Z.indexOf(p[0]) >= 0 && Z.indexOf(p[1]) >= 0; });
    if (aehnlich.length) h += '<p class="warnung">Sehen sich ähnlich: ' + aehnlich.map(function(p){ return p[0] + ' und ' + p[1]; }).join(', ') + '.</p>';
    var leer = !Z.length;
    ['#sfNeu', '#sfPdf', '#sfHerunterladen', '#sfZeige'].forEach(function(s){ $(s).disabled = leer; });
    if (leer){ P = null; $('#sfZaehler').innerHTML = h; ['#sfBlatt', '#sfFolie', '#sfLoesung'].forEach(function(s){ $(s).parentNode.hidden = true; }); $('.sf-spiel').hidden = true; meldung('info', '<p>Gib links den Code ein.</p>'); return; }
    var M = masse(+o.zelle * MM), pro = Kern.proStreifen(Math.floor((B - 40) / M.z));
    P = Kern.planen({ zeichen:Z, proStreifen:pro, ablenkung:o.ablenkung, seed:st.seed });
    if (!P){ meldung('warnung', '<p>Das hat nicht geklappt – versuche «Neu mischen».</p>'); return; }
    var mehrere = P.streifen.length > 1;
    $('#sfZaehler').innerHTML = '<p class="sf-zaehler-haupt ok">Code: <b>' + esc(Z.join('')) + '</b> · ' + (mehrere ? P.streifen.length + ' Streifen' : '1 Streifen') + '</p>' + h;
    meldung('', ''); ['#sfBlatt', '#sfFolie', '#sfLoesung'].forEach(function(s){ $(s).parentNode.hidden = false; }); $('.sf-spiel').hidden = false;
    var strs = P.streifen.map(function(s, i){ return streifenSvg(s, M, i + 1, mehrere, false).svg; }).join('');
    $('#sfBlatt').innerHTML = (o.titelAn ? '<h2>Schiebefenster</h2>' : '') + (o.anleitungAn ? '<p class="sf-anleitung">' + esc(anleitung(mehrere)) + '</p>' : '') +
      '<div class="sf-streifen-liste">' + strs + '</div>' + (o.linie ? '<p class="sf-antwort">Code: <span class="sf-linie"></span></p>' : '');
    var kopfH = 110, anzahl = Math.max(1, Math.min(8, Math.floor((930 - kopfH) / (M.balkenH + 7 * MM))));
    $('#sfFolie').innerHTML = '<h2>Fensterfolie</h2><p class="sf-anleitung">Auf eine Folie drucken, in Originalgrösse (100 %). Die Balken ausschneiden – einer pro Kind oder Gruppe. Das Fenster bleibt durchsichtig.</p>' + balkenSvg(M, anzahl);
    $('#sfLoesung').innerHTML = (o.titelAn ? '<h2>Schiebefenster – Lösung</h2>' : '<p class="sf-anleitung"><b>Lösung</b></p>') +
      '<p class="sf-anleitung">Hier steht das Fenster richtig (orange Rahmen).</p>' +
      '<div class="sf-streifen-liste">' + P.streifen.map(function(s, i){ return streifenSvg(s, M, i + 1, mehrere, true).svg; }).join('') + '</div>' +
      '<p class="sf-code-loesung">Code: <b>' + esc(Z.join('')) + '</b></p>';
    spielAufbauen();
  }

  /* ---------- Am Bildschirm: Balken schieben ---------- */
  var schienen = [];
  function spielAufbauen(){
    var feld = $('#sfSpielfeld'), breite = Math.max(280, Math.min(feld.clientWidth || 640, 820)), h = '';
    var maxSp = Math.max.apply(null, P.streifen.map(function(s){ return s.spalten.length; })), z = Math.max(8, Math.min(22, Math.floor((breite - 24) / maxSp))), M = masse(z);
    M.m = Math.max(8, z * 0.6); M.balkenH = 5 * z + 2 * M.m;
    schienen = P.streifen.map(function(s, i){
      var w = s.spalten.length * z;
      h += '<div class="sf-schiene" data-i="' + i + '" style="width:' + (w + 24) + 'px;height:' + f1(M.balkenH) + 'px">' +
        '<svg class="sf-schiene-streifen" width="' + (w + 24) + '" height="' + f1(M.balkenH) + '">' + felderSvg(s, 12, M.m, z) +
          s.ziele.map(function(x, k){ return '<g class="sf-ziel"><rect x="' + f1(12 + x * z - 1) + '" y="' + f1(M.m - 1) + '" width="' + f1(3 * z + 2) + '" height="' + f1(5 * z + 2) + '" fill="none" stroke="#E0741C" stroke-width="2"/>' +
            '<text x="' + f1(12 + (x + 1.5) * z) + '" y="' + f1(M.m - 3) + '" font-size="11" font-weight="700" fill="#C25A0E" text-anchor="middle">' + esc(s.zeichen[k]) + '</text></g>'; }).join('') + '</svg>' +
        '<div class="sf-schieber" tabindex="0" role="slider" aria-label="Fenster verschieben' + (P.streifen.length > 1 ? ', Streifen ' + (i + 1) : '') + '" aria-valuemin="0" aria-valuemax="' + (s.spalten.length - 3) + '">' +
          '<svg width="' + (2 * w + 3 * z + 48) + '" height="' + f1(M.balkenH) + '"><path d="M0 0H' + (2 * w + 3 * z + 48) + 'V' + f1(M.balkenH) + 'H0Z M' + (w + 24) + ' ' + f1(M.m) + 'V' + f1(M.m + 5 * z) + 'H' + (w + 24 + 3 * z) + 'V' + f1(M.m) + 'Z" fill="' + SCHWARZ + '" fill-rule="evenodd"/></svg></div></div>';
      return { s:s, z:z, w:w, x:-1 };
    });
    feld.innerHTML = h;
    schienen.forEach(function(sc, i){ setzen(i, 0); });
  }
  function setzen(i, x){
    var sc = schienen[i]; sc.x = Math.max(-1, Math.min(sc.s.spalten.length - 2, x));
    var el = $('#sfSpielfeld .sf-schiene[data-i="' + i + '"] .sf-schieber');
    if (el){ el.style.left = f1(12 + sc.x * sc.z - (sc.w + 24)) + 'px'; el.setAttribute('aria-valuenow', String(Math.round(sc.x))); }
  }
  $('#sfSpielfeld').addEventListener('pointerdown', function(ev){
    var el = ev.target.closest('.sf-schieber'); if (!el) return;
    var i = +el.parentNode.getAttribute('data-i'), sc = schienen[i];
    ev.preventDefault(); el.setPointerCapture(ev.pointerId); el.classList.add('zieht');
    var sx = ev.clientX, x0 = sc.x;
    function zug(e2){ setzen(i, x0 + (e2.clientX - sx) / sc.z); }
    function los(){ el.classList.remove('zieht'); setzen(i, Math.round(sc.x)); el.removeEventListener('pointermove', zug); el.removeEventListener('pointerup', los); el.removeEventListener('pointercancel', los); }
    el.addEventListener('pointermove', zug); el.addEventListener('pointerup', los); el.addEventListener('pointercancel', los);
  });
  $('#sfSpielfeld').addEventListener('keydown', function(ev){
    var el = ev.target.closest('.sf-schieber'); if (!el) return;
    var i = +el.parentNode.getAttribute('data-i'), d = { ArrowLeft:-1, ArrowRight:1, Home:-99, End:99 }[ev.key];
    if (d === undefined) return;
    ev.preventDefault(); setzen(i, Math.round(schienen[i].x) + d);
  });
  $('#sfZeige').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#sfSpielfeld').classList.toggle('zeige', an);
  });
  $('#sfAntwort').addEventListener('input', function(){
    var t = this.value.toUpperCase().replace(/[^0-9A-Z]/g, ''), ziel = Z.join(''), info = $('#sfAntwortInfo');
    info.className = t === ziel ? 'ok' : '';
    info.textContent = !t ? '' : t === ziel ? 'Geschafft! 🎉' : ziel.indexOf(t) === 0 ? 'bis hier richtig …' : 'Da stimmt etwas noch nicht.';
  });

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#sfPdf'), function(){ return P && { blaetter:[$('#sfBlatt'), $('#sfFolie'), st.opt.mitLoesung && $('#sfLoesung')], name:Labor.pdfName('Schiebefenster', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#sfPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#sfHerunterladen').hidden = false; });
  }
  $('#sfHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P) return;
    var name = Labor.pdfName('Schiebefenster', '').replace(/\.pdf$/, '.html');
    var inhalt = [$('#sfBlatt'), $('#sfFolie'), st.opt.mitLoesung && $('#sfLoesung')].filter(Boolean).map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Schiebefenster', inhalt, '.sf-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
