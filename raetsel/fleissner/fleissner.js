/* Rätsellabor – Generator «Fleissner-Schablone»
   Ein Geheimtext im Quadrat: Die Buchstaben werden durch die Löcher einer Drehschablone geschrieben. Nach jedem Viertel
   wird die Schablone eine Vierteldrehung im Uhrzeigersinn gedreht. Lesen kann den Text nur, wer die passende Schablone hat.
   Lochmuster 4 × 4 und 6 × 6 und Feldgrösse wie im Excel-Generator von Jasmine Filippi (myEscapeBox) – passend zu den
   Holzschablonen. Die Schablone gibt es immer zum Ausschneiden dazu. Das Blatt wird in Originalgrösse gedruckt. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  var ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  function zufall(seed){
    var s = (Math.imul(seed >>> 0 || 1, 2654435761) ^ 0x5bd1e995) >>> 0 || 1;
    function n(){ s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return (s >>> 0) / 4294967296; }
    for (var i = 0; i < 8; i++) n();
    return n;
  }
  // Feld um 90° im Uhrzeigersinn drehen (Zeile, Spalte; Zählung ab 0 oben links)
  function drehen(p, n){ return [p[1], n - 1 - p[0]]; }
  function sortiert(l){ return l.slice().sort(function(a, b){ return a[0] - b[0] || a[1] - b[1]; }); }
  // Löcher der Schablone in Stellung 1
  var SCHABLONEN = {
    4:[[1, 1], [2, 3], [3, 0], [3, 2]],                                                   // wie Excel / Holzschablone 4 × 4
    6:[[0, 0], [0, 4], [1, 1], [2, 2], [2, 4], [3, 5], [4, 0], [4, 2], [5, 3]]             // wie Excel / Holzschablone 6 × 6
  };
  // Löcher in den Stellungen 1–4, jeweils Zeile für Zeile von links nach rechts (Lesereihenfolge)
  function stellungen(n){
    var l = SCHABLONEN[n], aus = [];
    for (var q = 0; q < 4; q++){ aus.push(sortiert(l)); l = l.map(function(p){ return drehen(p, n); }); }
    return aus;
  }
  // Jedes Feld genau einmal unter einem Loch?
  function gueltig(n){
    var gesehen = {}, ok = true;
    stellungen(n).forEach(function(l){ l.forEach(function(p){ var k = p.join(','); if (gesehen[k]) ok = false; gesehen[k] = true; }); });
    return ok && Object.keys(gesehen).length === n * n;
  }
  // Text → Zeichen fürs Raster: Grossbuchstaben (Ä, Ö, Ü bleiben ein Feld), ß → SS, Ziffern bleiben, alles andere fällt weg
  function zeichen(t){
    return Array.from(String(t || '').normalize('NFC').replace(/ẞ/g, 'ß').replace(/ß/g, 'SS').toUpperCase())
      .filter(function(c){ return /[A-ZÄÖÜ0-9]/.test(c); });
  }
  /* Verschlüsseln → { gitter[r][c]: { b, stellung (0–3), nr, fuell }, zeichen, zuLang, aufgefuellt }
     fuell: 'zufall' (Zufallsbuchstaben) oder 'x' */
  function verschluesseln(text, n, fuell, rnd){
    var z = zeichen(text), gitter = [], i = 0;
    for (var r = 0; r < n; r++){ gitter.push([]); for (var c = 0; c < n; c++) gitter[r].push(null); }
    stellungen(n).forEach(function(l, q){
      l.forEach(function(p){
        var f = i >= z.length;
        gitter[p[0]][p[1]] = { b:f ? (fuell === 'x' ? 'X' : ABC[Math.floor(rnd() * 26)]) : z[i], stellung:q, nr:i, fuell:f };
        i++;
      });
    });
    return { gitter:gitter, zeichen:z.slice(0, n * n), zuLang:Math.max(0, z.length - n * n), aufgefuellt:Math.max(0, n * n - z.length) };
  }
  // Mit der Schablone lesen (zur Kontrolle): Stellung 1 bis 4, je Zeile für Zeile
  function lesen(gitter, n){ return stellungen(n).map(function(l){ return l.map(function(p){ return gitter[p[0]][p[1]].b; }).join(''); }).join(''); }
  return { ABC:ABC, zufall:zufall, drehen:drehen, SCHABLONEN:SCHABLONEN, stellungen:stellungen, gueltig:gueltig, zeichen:zeichen,
    verschluesseln:verschluesseln, lesen:lesen };
})();
/* KERN-ENDE */

var GROESSEN = [[4, '4 × 4', 'Holzschablone 4 × 4'], [6, '6 × 6', 'Holzschablone 6 × 6']];
// Feldgrösse fest wie im Excel: Zeilen 37 pt hoch, Felder quadratisch (37 pt = 13,05 mm) – passend zu den Holzschablonen
var FELD = 37 / 72 * 25.4;
var FARBEN = ['#C2410C', '#1E63C4', '#2E7D32', '#7B3FB5'];   // Stellungen 1–4 im Lösungsblatt
var TINTE = '#1C1714';
function esc(t){ return Labor.esc(t); }

/* ---------- Zeichnen (SVG in Millimetern: 1 Einheit = 1 Feld) ---------- */
function gitterSvg(g, n, feld, loesung){
  var h = '<rect x="0" y="0" width="' + n + '" height="' + n + '" fill="#fff"/>';
  for (var k = 1; k < n; k++) h += '<path d="M' + k + ' 0V' + n + 'M0 ' + k + 'H' + n + '" stroke="#9A8F86" stroke-width="0.02"/>';
  h += '<rect x="0.015" y="0.015" width="' + (n - 0.03) + '" height="' + (n - 0.03) + '" fill="none" stroke="' + TINTE + '" stroke-width="0.03"/>';
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++){
    var z = g.gitter[r][c];
    h += '<text x="' + (c + 0.5) + '" y="' + (r + 0.53) + '" class="fl-b' + (z.fuell ? ' fl-fuell' : '') + '" fill="' + (loesung ? (z.fuell ? '#A0968E' : FARBEN[z.stellung]) : TINTE) + '"' +
      ' data-s="' + z.stellung + '">' + esc(z.b) + '</text>';
    if (loesung && !z.fuell) h += '<text x="' + (c + 0.08) + '" y="' + (r + 0.2) + '" class="fl-nr" fill="' + FARBEN[z.stellung] + '">' + (z.stellung + 1) + '</text>';
  }
  // Grösse als Attribute (nicht als style): Die PDF-Kopie ersetzt die style-Angaben von SVG-Grafiken
  return '<svg class="fl-gitter" viewBox="0 0 ' + n + ' ' + n + '" width="' + (n * feld) + 'mm" height="' + (n * feld) + 'mm" role="img" aria-label="Buchstabenfeld ' + n + ' × ' + n + '">' +
    '<g style="font-family:var(--blatt-buchstaben)" font-weight="700" font-size="0.56" text-anchor="middle" dominant-baseline="central">' + h + '</g></svg>';
}
// Schablone zum Ausschneiden: Löcher grau, Rand mit den Ziffern 1–4 (die Ziffer oben zeigt die Stellung)
function schabloneSvg(n, feld){
  var R = Math.max(0.55, 7 / feld), W = n + 2 * R, h = '', loecher = Kern.SCHABLONEN[n];
  h += '<rect x="0.01" y="0.01" width="' + (W - 0.02) + '" height="' + (W - 0.02) + '" fill="#fff" stroke="' + TINTE + '" stroke-width="0.035"/>';
  h += '<g transform="translate(' + R + ' ' + R + ')">';
  for (var k = 0; k <= n; k++) h += '<path d="M' + k + ' 0V' + n + 'M0 ' + k + 'H' + n + '" stroke="#C9BEB4" stroke-width="0.015" stroke-dasharray="0.06 0.06"/>';
  loecher.forEach(function(p){
    h += '<rect x="' + p[1] + '" y="' + p[0] + '" width="1" height="1" fill="#B9AEA4" stroke="' + TINTE + '" stroke-width="0.025"/>' +
      '<path d="M' + (p[1] + 0.3) + ' ' + (p[0] + 0.3) + 'L' + (p[1] + 0.7) + ' ' + (p[0] + 0.7) + 'M' + (p[1] + 0.7) + ' ' + (p[0] + 0.3) + 'L' + (p[1] + 0.3) + ' ' + (p[0] + 0.7) + '" stroke="#fff" stroke-width="0.04"/>';
  });
  h += '</g>';
  // Ziffern: 1 oben, 2 links, 3 unten, 4 rechts – jeweils aufrecht, wenn diese Seite nach dem Drehen (im Uhrzeigersinn) oben ist
  var m = W / 2, a = R / 2;
  [[1, m, a, 0], [2, a, m, -90], [3, m, W - a, 180], [4, W - a, m, 90]].forEach(function(z){
    h += '<text x="' + z[1] + '" y="' + z[2] + '" transform="rotate(' + z[3] + ' ' + z[1] + ' ' + z[2] + ')">' + z[0] + '</text>';
  });
  return '<svg class="fl-schablone-svg" viewBox="0 0 ' + W + ' ' + W + '" width="' + (W * feld).toFixed(2) + 'mm" height="' + (W * feld).toFixed(2) + 'mm" role="img" aria-label="Schablone ' + n + ' × ' + n + ' zum Ausschneiden">' +
    '<g style="font-family:var(--blatt-schrift)" font-weight="700" font-size="' + Math.min(0.42, R * 0.7).toFixed(2) + '" fill="' + TINTE + '" text-anchor="middle" dominant-baseline="central">' + h + '</g></svg>';
}
// Linie(n) für die Lösung: 4 × 4 eine Linie, 6 × 6 zwei; im Lösungsblatt stehen die Buchstaben darauf (Farbe = Stellung)
function linienHtml(g, n, loesung){
  var anzahl = n === 4 ? 1 : 2, je = Math.ceil(n * n / anzahl), folge = [];
  for (var r = 0; r < n; r++) for (var c = 0; c < n; c++) folge[g.gitter[r][c].nr] = g.gitter[r][c];
  var h = '';
  for (var i = 0; i < anzahl; i++){
    h += '<div class="fl-linie">' + (loesung ? folge.slice(i * je, (i + 1) * je).map(function(z){
      return '<b' + (z.fuell ? ' class="fl-fuell"' : '') + ' style="color:' + (z.fuell ? '#A0968E' : FARBEN[z.stellung]) + '">' + esc(z.b) + '</b>';
    }).join('') : '') + '</div>';
  }
  return '<div class="fl-linien">' + h + '</div>';
}

var VORLAGE = '<div class="fl">' +
  '<header class="fl-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Fleissner-Schablone</h1>' +
    '<p>Ein Geheimtext im Quadrat: Die Buchstaben stehen unter den Löchern einer Drehschablone. Lesen kann ihn nur, wer die passende Schablone hat – sie gibt es zum Ausschneiden dazu.</p></header>' +
  '<div class="fl-layout"><section class="fl-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Schablone</h2></div></div>' +
      '<div class="fl-chips" role="radiogroup" aria-label="Grösse der Schablone">' +
        GROESSEN.map(function(g){ return '<label><input type="radio" name="flGroesse" value="' + g[0] + '"><span><b>' + g[1] + '</b><small>' + (g[0] * g[0]) + ' Buchstaben</small></span></label>'; }).join('') + '</div>' +
      '<p class="hinweis" id="flGroesseInfo"></p>' +
      '<p class="hinweis">Feldgrösse fest wie im Excel-Generator (13 mm), passend zur Holzschablone. Beim Drucken «Tatsächliche Grösse» bzw. 100 % wählen.</p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Geheimer Text</h2><p>Leerzeichen und Satzzeichen fallen weg, ß wird zu SS.</p></div></div>' +
      '<label class="vh" for="flText">Geheimer Text</label><textarea id="flText" rows="4" maxlength="200" autocomplete="off" spellcheck="false"></textarea>' +
      '<div class="fl-zaehler" id="flZaehler" aria-live="polite"></div>' +
      '<p class="feld-label">Freie Felder auffüllen mit</p>' +
      '<div class="fl-chips fl-chips-klein" role="radiogroup" aria-label="Freie Felder auffüllen mit">' +
        [['zufall', 'Zufallsbuchstaben'], ['x', 'X']].map(function(f){ return '<label><input type="radio" name="flFuell" value="' + f[0] + '"><span>' + f[1] + '</span></label>'; }).join('') + '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Blatt</h2></div></div>' +
      '<div class="opt-raster"><label for="flTitel">Titel auf dem Blatt</label><input type="text" id="flTitel" maxlength="60" autocomplete="off"></div>' +
      '<label class="opt"><input type="checkbox" id="flLinie"><span>Linie zum Aufschreiben der Lösung</span></label>' +
    '</div>' +
  '</section>' +
  '<section class="fl-ausgabe" aria-label="Ergebnis">' +
    '<div id="flMeldung" aria-live="polite"></div>' +
    '<div class="fl-teil">' +
      '<h2 class="fl-teil-titel">Arbeitsblatt</h2>' +
      '<div class="fl-werkzeug">' +
        '<button type="button" class="btn klein" id="flZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
        '<button type="button" class="btn klein" id="flNeu" hidden>Neue Füllbuchstaben</button>' +
        '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
        '<label><input type="checkbox" id="flMitLoesung"> mit Lösungsblatt</label>' +
        '<label><input type="checkbox" id="flMitSchablone"> mit Schablone</label>' +
        '<button type="button" class="btn klein primary" id="flPdf">PDF herunterladen</button>' +
        '<button type="button" class="btn klein primary" id="flHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
      '</div>' +
      '<div class="fl-rahmen"><article class="fl-blatt" id="flBlatt"></article></div>' +
      '<div class="fl-rahmen"><article class="fl-blatt fl-loesungsblatt" id="flLoesung" aria-hidden="true"></article></div>' +
    '</div>' +
    '<div class="fl-teil">' +
      '<h2 class="fl-teil-titel">Schablone zum Ausschneiden</h2>' +
      '<div class="fl-werkzeug"><span class="fl-werkzeug-text">Auf Karton kleben, graue Felder ausschneiden. Gleiche Feldgrösse wie das Buchstabenfeld.</span><span class="abstand"></span>' +
        '<button type="button" class="btn klein primary" id="flSchablonePdf">PDF herunterladen</button>' +
        '<button type="button" class="btn klein primary" id="flSchabloneHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Schablone herunterladen</button>' +
      '</div>' +
      '<div class="fl-rahmen"><article class="fl-blatt fl-schablone" id="flSchablone"></article></div>' +
    '</div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<rect x="3" y="3" width="15" height="15" rx="1.5"/><rect x="6.5" y="6.5" width="3" height="3" fill="currentColor" stroke="none"/><rect x="11.5" y="11.5" width="3" height="3" fill="currentColor" stroke="none"/>' +
  '<path d="M21 12a9 9 0 0 1-9 9"/><path d="M21 17v-5h-5" transform="rotate(45 18.5 14.5)"/></svg>';

Labor.registriere({
  id:'fleissner',
  titel:'Fleissner-Schablone',
  kurz:'Geheimtext mit Drehschablone zum Ausschneiden',
  beschreibung:'Ein eigener Text wird durch die Löcher einer Drehschablone ins Quadrat geschrieben. Mit Schablone zum Ausschneiden (4 × 4 und 6 × 6 passend zu den Holzschablonen), in Originalgrösse gedruckt, mit Lösungsblatt.',
  merkmale:['4 × 4 und 6 × 6 wie die Holzschablonen', 'Schablone zum Ausschneiden', 'Druck in Originalgrösse'],
  symbol:SYMBOL,
  css:'raetsel/fleissner/fleissner.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'fleissner-eingaben', OPT = 'fleissner-einstellungen';
  var STANDARD = { n:4, fuell:'zufall', linie:true, mitLoesung:true, mitSchablone:true, titelAn:true, anleitungAn:true };
  var st = { text:'', titel:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.text = String(e.text || ''); st.titel = String(e.titel || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (!Kern.SCHABLONEN[st.opt.n]) st.opt.n = 4;   // z. B. früher gewähltes 8 × 8
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, titel:st.titel, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#flMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  function titel(){ return st.titel.trim() || 'Fleissner-Schablone'; }
  var g = null;

  /* ---------- Eingaben ---------- */
  $('#flText').value = st.text;
  $('#flText').addEventListener('input', function(){ st.text = this.value; speichern(); zeichnen(); });
  $('#flTitel').value = st.titel;
  $('#flTitel').addEventListener('input', function(){ st.titel = this.value; speichern(); zeichnen(); });
  [].forEach.call(bereich.querySelectorAll('input[name="flGroesse"]'), function(r){
    r.checked = +r.value === st.opt.n;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.n = +r.value; speichern(); zeichnen(); });
  });
  [].forEach.call(bereich.querySelectorAll('input[name="flFuell"]'), function(r){
    r.checked = r.value === st.opt.fuell;
    r.addEventListener('change', function(){ if (!r.checked) return; st.opt.fuell = r.value; speichern(); zeichnen(); });
  });
  [['#flLinie', 'linie', true], ['#flMitLoesung', 'mitLoesung'], ['#flMitSchablone', 'mitSchablone']].forEach(function(c){
    $(c[0]).checked = !!st.opt[c[1]];
    $(c[0]).addEventListener('change', function(){ st.opt[c[1]] = this.checked; speichern(); if (c[2]) zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#flNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });
  $('#flZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false'); zeichnen();
  });

  /* ---------- Zeichnen ---------- */
  function anleitung(){
    return 'Lege die Schablone in Stellung 1 (die 1 oben) genau auf das Buchstabenfeld. Schreibe die Buchstaben in den Löchern Zeile für Zeile von links nach rechts ab. ' +
      'Drehe die Schablone dann eine Vierteldrehung im Uhrzeigersinn, bis die 2 oben ist, und lies weiter – ebenso mit der 3 und der 4.';
  }
  function zeichnen(){
    var o = st.opt, n = o.n, f = FELD;
    var gi = GROESSEN.filter(function(x){ return x[0] === n; })[0];
    $('#flGroesseInfo').textContent = 'Lochmuster wie im Excel-Generator von Jasmine Filippi (myEscapeBox) – passend zur ' + gi[2] + '.';
    g = Kern.verschluesseln(st.text, n, o.fuell, Kern.zufall(st.seed));
    var anzahl = Kern.zeichen(st.text).length, felder = n * n;
    $('#flZaehler').innerHTML = !anzahl ? '' : '<p class="fl-zaehler-haupt ' + (g.zuLang ? 'fehlt' : 'ok') + '"><b>' + anzahl + '</b> von ' + felder + ' Feldern' +
      (g.zuLang ? ' – <b>' + g.zuLang + ' zu viel</b>' : g.aufgefuellt ? ' · ' + g.aufgefuellt + ' werden aufgefüllt' : ' ✓') + '</p>' +
      '<p class="fl-zeichen">' + esc(g.zeichen.join('')) + '</p>';
    $('#flNeu').hidden = !(g.aufgefuellt && o.fuell === 'zufall' && anzahl);
    var leer = !anzahl;
    ['#flZeigeLoesung', '#flPdf', '#flHerunterladen'].forEach(function(s){ $(s).disabled = leer; });
    if (g.zuLang){
      var groesser = GROESSEN.filter(function(x){ return x[0] * x[0] >= anzahl; })[0];
      meldung('warnung', '<p>Der Text hat ' + anzahl + ' Buchstaben, die Schablone ' + n + ' × ' + n + ' nur ' + felder + ' Felder. Die letzten ' + g.zuLang + ' fehlen im Rätsel. ' +
        (groesser ? 'Wähle ' + groesser[1] + ' oder kürze den Text.' : 'Kürze den Text.') + '</p>');
    } else meldung(leer ? 'info' : '', leer ? '<p>Schreibe links deinen geheimen Text – er erscheint hier im Buchstabenfeld. Die Schablone unten kannst du schon jetzt herunterladen.</p>' : '');
    var zeige = $('#flZeigeLoesung').getAttribute('aria-pressed') === 'true';
    $('#flBlatt').parentNode.hidden = leer;
    $('#flBlatt').innerHTML = leer ? '' : (o.titelAn ? '<h2>' + esc(titel()) + '</h2>' : '') +
      (o.anleitungAn ? '<p class="fl-anleitung">' + anleitung() + '</p>' : '') +
      '<div class="fl-mitte">' + gitterSvg(g, n, f, zeige) + '</div>' +
      (o.linie ? '<p class="fl-unter">Lösung</p>' + linienHtml(g, n, zeige) : '');
    $('#flLoesung').innerHTML = leer ? '' : (o.titelAn ? '<h2>' + esc(titel()) + ' – Lösung</h2>' : '<p class="fl-anleitung"><b>Lösung</b></p>') +
      '<p class="fl-anleitung">Die Farbe zeigt, in welcher Stellung der Schablone ein Buchstabe gelesen wird' + (g.aufgefuellt ? '; graue Buchstaben sind aufgefüllt' : '') + '.</p>' +
      '<div class="fl-mitte">' + gitterSvg(g, n, f, true) + '</div>' +
      '<p class="fl-unter">Lösung</p>' + linienHtml(g, n, true) +
      '<p class="fl-text"><b>Text:</b> ' + esc(st.text.trim()) + '</p>';
    $('#flSchablone').innerHTML = (o.titelAn ? '<h2>Schablone ' + n + ' × ' + n + '</h2>' : '') +
      '<p class="fl-anleitung">Auf festen Karton kleben, aussen entlang der Linie und die grauen Felder ausschneiden. Die Ziffer, die oben steht, zeigt die Stellung: Start mit der 1 oben, dann im Uhrzeigersinn drehen.</p>' +
      '<div class="fl-mitte">' + schabloneSvg(n, f) + '</div>' +
      '<p class="fl-kontrolle">Kontrolle: Das Buchstabenfeld ist ' + fmt(n * f) + ' mm breit, ein Feld ' + fmt(f) + ' mm (wie im Excel). Diese Linie muss genau ' + fmt(n * f) + ' mm lang sein: ' +
      '<span class="fl-mass" style="width:' + (n * f) + 'mm"></span></p>';
  }
  function fmt(x){ return String(Math.round(x * 10) / 10).replace('.', ','); }

  /* ---------- PDF, Herunterladen ---------- */
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function blaetter(){ return [$('#flBlatt'), st.opt.mitLoesung && $('#flLoesung'), st.opt.mitSchablone && $('#flSchablone')].filter(Boolean); }
  function hatText(){ return Kern.zeichen(st.text).length > 0; }
  // vor dem PDF «Lösung zeigen» ausschalten, damit das Arbeitsblatt ohne Lösung ins PDF kommt
  function ohneLoesung(){ var k = $('#flZeigeLoesung'); if (k.getAttribute('aria-pressed') === 'true'){ k.setAttribute('aria-pressed', 'false'); zeichnen(); } }
  Labor.pdfKnopf($('#flPdf'), function(){ ohneLoesung(); return hatText() && { blaetter:blaetter(), name:Labor.pdfName('Fleissner', st.titel) }; }, fehler);
  Labor.pdfKnopf($('#flSchablonePdf'), function(){ return { blaetter:[$('#flSchablone')], name:'Fleissner-Schablone-' + st.opt.n + 'x' + st.opt.n + '.pdf' }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    ['#flPdf', '#flSchablonePdf'].forEach(function(s){ $(s).hidden = true; });
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#flHerunterladen').hidden = $('#flSchabloneHerunterladen').hidden = false; });
  }
  function htmlSpeichern(liste, name){
    if (!speicherOrt) return;
    var inhalt = liste.map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeige-loesung'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(name.replace(/\.html$/, '').replace(/-/g, ' '), inhalt, '.fl-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  }
  $('#flHerunterladen').addEventListener('click', function(){ ohneLoesung(); if (hatText()) htmlSpeichern(blaetter(), Labor.pdfName('Fleissner', st.titel).replace(/\.pdf$/, '.html')); });
  $('#flSchabloneHerunterladen').addEventListener('click', function(){ htmlSpeichern([$('#flSchablone')], 'Fleissner-Schablone-' + st.opt.n + 'x' + st.opt.n + '.html'); });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
