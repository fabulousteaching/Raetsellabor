/* Rätsellabor – Generator «Skytale» (Geheimband)
   Ein Papierband wird schräg um einen runden Gegenstand gewickelt (Windung an Windung). Auf dem Band stehen die
   Buchstaben scheinbar durcheinander – aufgewickelt erscheint die Nachricht in einer Reihe längs des Gegenstands.
   Geometrie: Umfang U = π · d. Weil das Band schräg läuft, braucht eine Windung die Bandlänge L = U / cos α und rückt
   um p = b / cos α weiter (sin α = b / U, b = Bandbreite). Rundherum haben k Buchstaben Platz (Reihen), Abstand L / k;
   der Länge nach passen so viele Windungen, wie der Gegenstand lang ist (Länge : p). Buchstabe Nummer j auf dem Band
   steht in Windung j div k, Reihe j mod k.
   Kopiervorlage in echten Millimetern auf A4 quer (1 px = 0,2646 mm); lange Bänder in Streifen mit Klebeflächen. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  // Füllbuchstaben: Häufigkeit wie im Deutschen, damit sie nicht auffallen
  var HAEUFIG = { E:17, N:10, I:8, S:7, R:7, A:6.5, T:6, D:5, H:4.8, U:4.2, L:3.4, C:3, G:3, M:2.5, O:2.5, B:1.9, W:1.9, F:1.7, K:1.2, Z:1.1, P:0.8, V:0.7, J:0.3, Y:0.1, X:0.1, Q:0.05 };
  function fueller(rnd){
    var b = Object.keys(HAEUFIG), s = b.reduce(function(a, c){ return a + HAEUFIG[c]; }, 0);
    return function(){ var x = rnd() * s; for (var i = 0; i < b.length; i++){ x -= HAEUFIG[b[i]]; if (x <= 0) return b[i]; } return 'E'; };
  }
  /* Gegenstand und Band (alles in mm) → { U, L, p, k, a (Buchstabenabstand auf dem Band), Tmax (Windungen der Länge nach) } */
  function geometrie(d, laenge, b){
    var U = Math.PI * d;
    if (!(d > 0) || !(laenge > 0) || !(b > 0)) return { fehler:'masse' };
    if (b >= U * 0.6) return { fehler:'duenn', bMax:Math.floor(U * 0.6 * 10) / 10 - 0.1 };
    var cos = Math.sqrt(1 - Math.pow(b / U, 2)), L = U / cos, p = b / cos;
    var k = Math.max(1, Math.floor(L / (0.95 * b)));
    return { U:U, L:L, p:p, k:k, a:L / k, Tmax:Math.floor(laenge / p) };
  }
  /* Nachricht → Wörter aus Grossbuchstaben (Umlaute bleiben, ß wird SS), Ziffern und ?!.,; andere Zeichen fallen weg */
  function woerter(text){
    return String(text || '').normalize('NFC').toLocaleUpperCase('de-CH').split(/\s+/)
      .map(function(w){ return Array.from(w.replace(/[^A-ZÄÖÜ0-9?!.,]/g, '')); }).filter(function(w){ return w.length; });
  }
  /* Wörter in Reihen zu je T Feldern, ein freies Feld zwischen Wörtern. Ein Wort, das in eine Reihe passt, wird nicht
     geteilt; ein längeres beginnt in einer neuen Reihe und geht in der nächsten weiter. → Reihen */
  function umbrechen(W, T){
    var reihen = [[]];
    for (var i = 0; i < W.length; i++){
      var w = W[i], r = reihen[reihen.length - 1];
      if (r.length && r.length + 1 + w.length > T){ r = []; reihen.push(r); }
      if (r.length) r.push(null);
      for (var j = 0; j < w.length; j++){ if (r.length === T){ r = []; reihen.push(r); } r.push(w[j]); }
    }
    return reihen;
  }
  /* Nachricht anordnen: Reihen mit höchstens etwa 16 Zeichen (gut lesbar, Band nicht unnötig lang); reicht das nicht,
     längere Reihen. Dann so wenige Windungen wie für diese Anzahl Reihen nötig (kurzes Band). farbig: Wörter mit einem Feld Abstand, kein Wort geteilt (die Nachricht wird farbig gedruckt). Sonst: alle
     Zeichen ohne Abstand (klassisch), gleichmässig auf die Reihen verteilt. Übrige Felder: Füllbuchstaben.
     → { T, R, raster:[k][T] {z, n (Teil der Nachricht)}, fuell } oder { fehler } */
  var ZIEL = 16;   // so viele Zeichen je Reihe sind gut lesbar
  function anordnen(text, g, farbig, rnd){
    var W = woerter(text), n = W.reduce(function(a, w){ return a + w.length; }, 0), k = g.k, T, zeilen = null;
    if (!n) return { fehler:'leer' };
    if (farbig){
      var Tziel = Math.min(g.Tmax, ZIEL);
      while (Tziel < g.Tmax && umbrechen(W, Tziel).length > k) Tziel++;
      var Rziel = umbrechen(W, Tziel).length;
      if (Rziel > k) return { fehler:'lang', n:n, platz:k * g.Tmax };
      for (T = 1; T <= Tziel; T++){ zeilen = umbrechen(W, T); if (zeilen.length <= Rziel) break; }
    } else {
      var Rn = Math.ceil(n / Math.min(g.Tmax, Math.max(ZIEL, Math.ceil(n / k))));
      if (Rn > k) return { fehler:'lang', n:n, platz:k * g.Tmax };
      T = Math.ceil(n / Rn);
      var alle = [].concat.apply([], W); zeilen = [];
      for (var i = 0; i < alle.length; i += T) zeilen.push(alle.slice(i, i + T));
    }
    var f = fueller(rnd), raster = [], fuell = 0;
    for (var r = 0; r < k; r++){
      var z = [];
      for (var t = 0; t < T; t++){
        var c = zeilen[r] && zeilen[r][t];
        if (c){ z.push({ z:c, n:true }); } else { z.push({ z:f(), n:false }); fuell++; }
      }
      raster.push(z);
    }
    return { T:T, R:zeilen.length, raster:raster, fuell:fuell, n:n };
  }
  // Band: Buchstabe j steht in Windung j div k, Reihe j mod k
  function band(raster){
    var k = raster.length, T = raster[0].length, B = [];
    for (var j = 0; j < k * T; j++) B.push(raster[j % k][Math.floor(j / k)]);
    return B;
  }
  return { zufall:zufall, geometrie:geometrie, woerter:woerter, umbrechen:umbrechen, anordnen:anordnen, band:band };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', MM = 96 / 25.4;   // CSS-Pixel je Millimeter (beim Drucken und im PDF genau)
var FARBEN = [['#D7263D', 'Rot'], ['#1F5FBF', 'Blau'], ['#1E8A4C', 'Grün'], ['#8E44AD', 'Violett']];
var GEGENSTAENDE = [   // [id, Name, Durchmesser mm, Länge mm]
  ['bleistift', 'Bleistift', 7, 170], ['filzstift', 'Dicker Filzstift', 13, 135], ['leimstift', 'Leimstift', 24, 100],
  ['wcrolle', 'WC-Rollen-Kern', 44, 98], ['kuechenrolle', 'Küchenrollen-Kern', 42, 230], ['besenstiel', 'Besenstiel', 24, 1200], ['eigene', 'Eigene Masse']
];
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toLocaleString('de-CH'); }

var VORLAGE = '<div class="sk">' +
  '<header class="sk-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Skytale</h1>' +
    '<p>Ein Band voller Buchstaben – um einen runden Gegenstand gewickelt, erscheint die geheime Nachricht. So verschickten schon die alten Griechen Botschaften.</p></header>' +
  '<div class="sk-layout"><section class="sk-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Nachricht</h2><p>Buchstaben, Ziffern und ? ! . , – bis 160 Zeichen.</p></div></div>' +
      '<label class="feld-label" for="skText">Nachricht</label>' +
      '<textarea id="skText" class="sk-text" rows="3" maxlength="160" spellcheck="true"></textarea>' +
      '<p class="hinweis" id="skTextInfo"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Gegenstand zum Aufwickeln</h2></div></div>' +
      '<div class="sk-chips" role="radiogroup" aria-label="Gegenstand">' + GEGENSTAENDE.map(function(g){ return '<label><input type="radio" name="skDing" value="' + g[0] + '"><span>' + g[1] + '</span></label>'; }).join('') + '</div>' +
      '<div class="sk-masse" id="skMasse" hidden>' +
        '<label><span>Durchmesser</span><input type="number" id="skD" min="4" max="200" step="0.5" inputmode="decimal"> mm</label>' +
        '<label><span>Länge</span><input type="number" id="skL" min="20" max="3000" step="1" inputmode="numeric"> mm</label>' +
        '<p class="hinweis">Am besten nachmessen: Lege einen Papierstreifen einmal rundherum, markiere und miss den Umfang. Durchmesser = Umfang : 3,14.</p>' +
      '</div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Band</h2></div></div>' +
      '<label class="feld-label" for="skB">Bandbreite: <b id="skBWert"></b></label>' +
      '<input type="range" id="skB" min="6" max="20" step="1">' +
      '<p class="hinweis" id="skGeoInfo"></p>' +
      '<label class="opt"><input type="checkbox" id="skFarbig"><span>Nachricht farbig hervorheben – die übrigen Felder bekommen zufällige Buchstaben</span></label>' +
      '<div class="sk-farbwahl" id="skFarbwahl" role="radiogroup" aria-label="Farbe der Nachricht">' +
        FARBEN.map(function(f){ return '<label title="' + f[1] + '"><input type="radio" name="skFarbe" value="' + f[0] + '"><span style="background:' + f[0] + '"></span><b class="vh">' + f[1] + '</b></label>'; }).join('') + '</div>' +
    '</div>' +
  '</section>' +
  '<section class="sk-ausgabe" aria-label="Ergebnis">' +
    '<div id="skMeldung" aria-live="polite"></div>' +
    '<div class="sk-werkzeug">' +
      '<button type="button" class="btn klein" id="skZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="skNeu" title="Andere Füllbuchstaben">Neu mischen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="skMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="skPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="skHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="sk-blaetter"><div class="sk-seiten" id="skSeiten"></div>' +
    '<div class="sk-rahmen sk-loesung-rahmen"><article class="sk-blatt sk-loesungsblatt" id="skLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<rect x="3" y="8" width="18" height="8" rx="4"/><path d="M7 8.3l-2.2 7.4M11 8l-2.2 8M15 8l-2.2 8M19 8.3l-2.2 7.4"/></svg>';

Labor.registriere({
  id:'skytale',
  titel:'Skytale',
  kurz:'Geheimband zum Aufwickeln – die Nachricht erscheint auf dem Stab',
  beschreibung:'Eine Nachricht auf einem Papierband: Um einen Gegenstand mit dem richtigen Durchmesser gewickelt, erscheint sie längs des Stabs. Mit Prüfung, ob die Nachricht passt, farbiger Hervorhebung und Kopiervorlage in echten Millimetern – lange Bänder in Streifen mit Klebeflächen.',
  merkmale:['Durchmesser wählbar', 'Kopiervorlage in mm', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/skytale/skytale.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'skytale-eingaben', OPT = 'skytale-einstellungen';
  // Keine Vorauswahl beim Gegenstand; Band 12 mm, Farbe aus
  var STANDARD = { ding:'', d:0, l:0, b:12, farbig:false, farbe:FARBEN[0][0], mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { text:'', seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.text = String(e.text || ''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (!GEGENSTAENDE.some(function(g){ return g[0] === st.opt.ding; })) st.opt.ding = '';
  if (!FARBEN.some(function(f){ return f[0] === st.opt.farbe; })) st.opt.farbe = FARBEN[0][0];
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ text:st.text, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#skMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  var warte = 0;
  $('#skText').value = st.text;
  $('#skText').addEventListener('input', function(){ st.text = this.value; speichern(); clearTimeout(warte); warte = setTimeout(zeichnen, 200); });
  [].forEach.call(bereich.querySelectorAll('input[name="skDing"]'), function(r){
    r.checked = r.value === st.opt.ding;
    r.addEventListener('change', function(){
      if (!r.checked) return;
      var g = GEGENSTAENDE.filter(function(x){ return x[0] === r.value; })[0];
      st.opt.ding = r.value; if (g[2]){ st.opt.d = g[2]; st.opt.l = g[3]; }
      if (!st.opt.d){ st.opt.d = 40; st.opt.l = 100; }
      $('#skD').value = st.opt.d; $('#skL').value = st.opt.l; speichern(); zeichnen();
    });
  });
  $('#skD').value = st.opt.d || ''; $('#skL').value = st.opt.l || '';
  [['#skD', 'd'], ['#skL', 'l']].forEach(function(x){
    $(x[0]).addEventListener('input', function(){
      var v = parseFloat(String(this.value).replace(',', '.'));
      if (!(v > 0)) return;
      st.opt[x[1]] = v;
      // eigene Masse: der Vorschlag passt nicht mehr
      var g = GEGENSTAENDE.filter(function(y){ return y[0] === st.opt.ding; })[0];
      if (g && g[2] && (g[2] !== st.opt.d || g[3] !== st.opt.l)){ st.opt.ding = 'eigene'; [].forEach.call(bereich.querySelectorAll('input[name="skDing"]'), function(r){ r.checked = r.value === 'eigene'; }); }
      speichern(); clearTimeout(warte); warte = setTimeout(zeichnen, 250);
    });
  });
  $('#skB').value = st.opt.b;
  $('#skB').addEventListener('input', function(){ st.opt.b = +this.value; speichern(); zeichnen(); });
  [].forEach.call(bereich.querySelectorAll('input[name="skFarbe"]'), function(r){
    r.checked = r.value === st.opt.farbe;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.farbe = r.value; speichern(); zeichnen(); } });
  });
  [['#skFarbig', 'farbig'], ['#skMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#skZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#skLoesung').classList.toggle('zeigen', an); $('#skLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  $('#skNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Prüfen, anordnen, zeichnen ---------- */
  var R = null;
  function dingName(){ var g = GEGENSTAENDE.filter(function(x){ return x[0] === st.opt.ding; })[0]; return g && g[2] ? g[1] : ''; }
  // Was würde helfen, wenn die Nachricht nicht passt?
  function tipps(n, g, farbig){
    var o = st.opt, t = [], W = Kern.woerter(st.text);
    function passt(gg){ if (gg.fehler) return false; var a = Kern.anordnen(st.text, gg, farbig, Math.random); return !a.fehler; }
    // schmaleres Band
    for (var b = o.b - 1; b >= 6; b--){ var gb = Kern.geometrie(o.d, o.l, b); if (passt(gb)){ t.push('ein schmaleres Band: ' + b + ' mm'); break; } }
    // längerer Gegenstand
    for (var l = Math.ceil(o.l / 10) * 10 + 10; l <= 3000; l += 10){ if (passt(Kern.geometrie(o.d, l, o.b))){ t.push('ein längerer Gegenstand: mindestens ' + l + ' mm lang' + (l > 400 ? ' (z. B. ein Besenstiel)' : '')); break; } }
    // dickerer Gegenstand
    for (var d = Math.ceil(o.d) + 1; d <= 200; d++){ if (passt(Kern.geometrie(d, o.l, o.b))){ t.push('ein dickerer Gegenstand: mindestens ' + d + ' mm Durchmesser'); break; } }
    t.push(farbig ? 'eine kürzere Nachricht' : 'eine kürzere Nachricht: höchstens ' + g.k * g.Tmax + ' Zeichen (ohne Abstände)');
    return t;
  }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, W = Kern.woerter(st.text), n = W.reduce(function(a, w){ return a + w.length; }, 0);
    $('#skTextInfo').textContent = n ? n + ' Zeichen in ' + W.length + (W.length === 1 ? ' Wort' : ' Wörtern') + (o.farbig ? '' : ' – ohne Farbe stehen sie ohne Abstand hintereinander') : '';
    $('#skMasse').hidden = !o.ding;
    $('#skBWert').textContent = o.b + ' mm';
    $('#skFarbwahl').hidden = !o.farbig;
    var g = o.ding ? Kern.geometrie(o.d, o.l, o.b) : null;
    $('#skGeoInfo').textContent = g && !g.fehler ? 'Rundherum ' + g.k + (g.k === 1 ? ' Reihe' : ' Reihen') + ' · der Länge nach ' + g.Tmax + ' Windungen · eine Windung braucht ' + f1(g.L / 10) + ' cm Band.' : '';
    var fehlt = !n ? 'Schreib links eine Nachricht.' : !o.ding ? 'Wähle links, um welchen Gegenstand das Band gewickelt wird.' : '';
    ['#skPdf', '#skHerunterladen', '#skZeigeLoesung', '#skNeu'].forEach(function(s){ $(s).disabled = true; });
    function leer(art, html){ R = null; $('#skSeiten').innerHTML = ''; $('#skLoesung').parentNode.hidden = true; meldung(art, html); }
    if (fehlt) return leer('info', '<p>' + fehlt + '</p>');
    if (g.fehler === 'masse') return leer('fehler', '<p>Gib den Durchmesser und die Länge des Gegenstands in Millimetern ein.</p>');
    if (g.fehler === 'duenn') return leer('fehler', '<h3>Der Gegenstand ist zu dünn für dieses Band</h3><p>Bei ' + f1(o.d) + ' mm Durchmesser darf das Band höchstens ' + f1(g.bMax) + ' mm breit sein. Nimm ein schmaleres Band oder einen dickeren Gegenstand.</p>');
    var A = Kern.anordnen(st.text, g, o.farbig, Kern.zufall(st.seed));
    if (A.fehler){
      var warum = 'Die Nachricht hat ' + A.n + ' Zeichen. Auf den Gegenstand passen ' + g.k + (g.k === 1 ? ' Reihe' : ' Reihen') + ' rundherum mit je ' + g.Tmax + ' Windungen (' + f1(o.l) + ' mm lang, je Windung ' + f1(g.p) + ' mm)' +
        (o.farbig ? ' – mit den Abständen zwischen den Wörtern reicht das nicht.' : ' – höchstens ' + g.k * g.Tmax + ' Zeichen.');
      return leer('fehler', '<h3>Die Nachricht passt so nicht</h3><p>' + warum + '</p><p>Was hilft:</p><ul>' + tipps(A.n, g, o.farbig).map(function(t){ return '<li>' + t + '</li>'; }).join('') + '</ul>' +
        '');
    }
    ['#skPdf', '#skHerunterladen', '#skZeigeLoesung', '#skNeu'].forEach(function(s){ $(s).disabled = false; });
    $('#skLoesung').parentNode.hidden = false;
    R = { g:g, A:A, band:Kern.band(A.raster) };
    var laenge = A.T * g.L, html = blaetterHtml();
    $('#skSeiten').innerHTML = html.seiten;
    $('#skLoesung').innerHTML = html.loesung;
    meldung('erfolg', '<p><b>Passt!</b> ' + A.T + (A.T === 1 ? ' Windung' : ' Windungen') + ' (' + f1(A.T * g.p) + ' von ' + f1(o.l) + ' mm), ' + A.R + ' von ' + g.k + (g.k === 1 ? ' Reihe' : ' Reihen') + ' rundherum mit Nachricht. ' +
      'Das Band ist ' + f1(laenge / 10) + ' cm lang: ' + html.streifen + (html.streifen === 1 ? ' Streifen' : ' Streifen') + ' auf ' + html.blaetter + (html.blaetter === 1 ? ' Blatt' : ' Blättern') + ' (A4 quer).' +
      (A.fuell ? ' Die übrigen ' + A.fuell + ' Felder haben zufällige Buchstaben' + (o.farbig ? '' : ' – ohne Farbe muss man die Reihen mit der Nachricht finden') + '.' : '') + '</p>' +
      '<p class="sk-druckhinweis">Wichtig: In Originalgrösse drucken (100 %, nicht «an Seite anpassen») – sonst passen die Buchstaben nicht aufeinander. Die Kontrolllinie auf dem Blatt muss 10 cm lang sein.</p>');
  }

  /* ---------- Kopiervorlage: Streifen in echten Millimetern auf A4 quer ---------- */
  function blaetterHtml(){
    var o = st.opt, g = R.g, A = R.A, B = R.band;
    var a = g.a * MM, w = o.b * MM, LAB = 34, TAB = 12 * MM, VOR = 14 * MM, BREIT = 968;   // Nummer links, Klebefläche rechts, Anfangsstück vor Streifen 1
    var streifen = [], i0 = 0;
    while (i0 < B.length){ var platz = Math.max(1, Math.floor((BREIT - LAB - TAB - (streifen.length ? 0 : VOR) - 4) / a)); streifen.push(B.slice(i0, i0 + platz)); i0 += platz; }
    // Schrift: Buchstabe (gedreht) passt in die Bandbreite und in den Abstand
    var fs = Math.min(a * 0.82, w * 0.8), farbe = o.farbig ? o.farbe : TINTE;
    function streifenSvg(nr, zellen, letzter){
      var lang = zellen.length * a, h = w, x0 = LAB, s = '';
      s += '<g>';
      s += '<text x="' + (LAB / 2 - 4) + '" y="' + (h / 2 + 6) + '" font-size="17" font-weight="700" fill="' + TINTE + '">' + nr + '</text>';
      // Streifen 1: Anfangsstück (schraffiert, mit ▶) – gehört zum Band, dort wird es am Gegenstand festgeklebt
      if (nr === 1){
        s += '<rect x="' + x0 + '" y="0" width="' + VOR.toFixed(2) + '" height="' + h.toFixed(2) + '" fill="url(#skSchraffur)" stroke="' + TINTE + '" stroke-width="0.8"/>' +
          '<path d="M' + (x0 + VOR / 2 - 4).toFixed(2) + ' ' + (h / 2 - 6).toFixed(2) + 'l9 6-9 6z" fill="' + TINTE + '"/>';
        x0 += VOR;
      }
      s += '<rect x="' + x0.toFixed(2) + '" y="0" width="' + lang.toFixed(2) + '" height="' + h.toFixed(2) + '" fill="#fff" stroke="' + TINTE + '" stroke-width="0.8"/>';
      if (!letzter) s += '<rect x="' + (x0 + lang).toFixed(2) + '" y="0" width="' + TAB.toFixed(2) + '" height="' + h.toFixed(2) + '" fill="url(#skSchraffur)" stroke="' + TINTE + '" stroke-width="0.8" stroke-dasharray="3 2"/>' +
        '<text x="' + (x0 + lang + TAB / 2).toFixed(2) + '" y="' + (h / 2 + 4) + '" font-size="11" font-weight="700" fill="#8A8079">' + (nr + 1) + '</text>';
      zellen.forEach(function(c, i){
        var cx = x0 + (i + 0.5) * a, cy = h / 2;
        // gedreht: Kopf zeigt in Bandrichtung (aufgewickelt steht der Buchstabe aufrecht)
        s += '<text transform="translate(' + cx.toFixed(2) + ' ' + cy.toFixed(2) + ') rotate(90)" y="' + (fs * 0.36).toFixed(2) + '"' + (c.n && o.farbig ? ' fill="' + farbe + '"' : '') + '>' + esc(c.z) + '</text>';
      });
      return s + '</g>';
    }
    // Seiten: erste Seite mit Titel, Anleitung und Kontrolllinie
    var ABST = 14, hoch = w + ABST, seiten = [[]], platz = (o.titelAn ? 0 : 40) + (o.anleitungAn ? 470 : 600), frei = platz;
    streifen.forEach(function(z, i){ if (hoch > frei && seiten[seiten.length - 1].length){ seiten.push([]); frei = 640; } seiten[seiten.length - 1].push(i); frei -= hoch; });
    var ding = dingName();
    var anleitung = '<ol class="sk-anleitung">' +
      '<li>Schneide die Streifen aus' + (streifen.length > 1 ? ' und klebe sie der Reihe nach zusammen: Streifen 2 genau auf die graue Fläche am Ende von Streifen 1, Streifen 3 auf die von Streifen 2 und so weiter' : '') + '.</li>' +
      '<li>Wickle das Band um einen Gegenstand mit <b>' + f1(o.d) + ' mm Durchmesser</b>' + (ding ? ' (' + esc(ding) + ')' : '') + '. Halte den Gegenstand waagrecht und das Band so, dass die Buchstaben aufrecht stehen – das Anfangsstück mit ▶ ist unten. ' +
        'Klebe es links vorne am Gegenstand fest und wickle das Band nach oben und hinten herum. Jede Windung kommt knapp rechts neben die vorherige: Rand an Rand, ohne Lücke und ohne Überlappung. Klebe auch das Ende fest.</li>' +
      '<li>Drehe den Gegenstand langsam, bis du die Nachricht lesen kannst' + (o.farbig ? ' – sie ist farbig' : '') + '.</li></ol>';
    var kontrolle = '<div class="sk-kontrolle"><svg width="' + (100 * MM + 2).toFixed(1) + '" height="14" aria-hidden="true"><path d="M1 2V12M' + (100 * MM + 1).toFixed(2) + ' 2V12M1 7H' + (100 * MM + 1).toFixed(2) + '" stroke="' + TINTE + '" stroke-width="1.2" fill="none"/></svg>' +
      '<span>Diese Linie muss genau 10 cm lang sein. Drucke in Originalgrösse (100 %).</span></div>';
    var defs = '<defs><pattern id="skSchraffur" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#EFE8E1"/><path d="M0 0V6" stroke="#C9BFB6" stroke-width="2"/></pattern></defs>';
    var html = '';
    seiten.forEach(function(liste, si){
      var hS = liste.length * hoch;
      var svg = '<svg class="sk-svg" width="' + BREIT + '" height="' + hS.toFixed(1) + '" viewBox="0 0 ' + BREIT + ' ' + hS.toFixed(1) + '" role="img" aria-label="Streifen ' + (liste[0] + 1) + ' bis ' + (liste[liste.length - 1] + 1) + '">' + defs +
        '<g style="font-family:var(--blatt-buchstaben)" font-weight="700" font-size="' + fs.toFixed(1) + '" fill="' + TINTE + '" text-anchor="middle">' +
        liste.map(function(i, zi){ return '<g transform="translate(0 ' + (zi * hoch + 2).toFixed(2) + ')">' + streifenSvg(i + 1, streifen[i], i === streifen.length - 1) + '</g>'; }).join('') + '</g></svg>';
      var kopf = si === 0 ? (o.titelAn ? '<h2>Skytale – Geheimband</h2>' : '') + (o.anleitungAn ? anleitung + kontrolle : '')
        : '<p class="sk-seitenkopf">Skytale – Streifen ' + (liste[0] + 1) + ' bis ' + (liste[liste.length - 1] + 1) + '</p>';
      html += '<div class="sk-rahmen"><article class="sk-blatt sk-seite blatt-quer">' + kopf + svg + '</article></div>';
    });
    // Lösung: so steht es auf dem Gegenstand – Reihen rundherum, Windungen der Länge nach
    var T = A.T, k = g.k, zw = Math.min(30, 600 / T), zh = Math.min(30, zw * 1.15), lfs = zh * 0.7;
    var gitter = '<svg class="sk-gitter" width="' + (T * zw + 70).toFixed(0) + '" height="' + (k * zh + 6).toFixed(0) + '" role="img" aria-label="So steht es auf dem Gegenstand">' +
      '<g style="font-family:var(--blatt-buchstaben)" font-weight="700" font-size="' + lfs.toFixed(1) + '" text-anchor="middle">' +
      A.raster.map(function(z, r){
        return '<text x="30" y="' + (r * zh + zh * 0.72 + 3).toFixed(1) + '" font-size="' + (lfs * 0.6).toFixed(1) + '" fill="#8A8079" font-weight="600">' + (r + 1) + '</text>' +
          z.map(function(c, t){ return '<text x="' + (66 + (t + 0.5) * zw).toFixed(1) + '" y="' + (r * zh + zh * 0.72 + 3).toFixed(1) + '" fill="' + (c.n ? (o.farbig ? o.farbe : '#C2410C') : '#B5AAA0') + '">' + esc(c.z) + '</text>'; }).join('');
      }).join('') + '</g></svg>';
    var loesung = (o.titelAn ? '<h2>Skytale – Lösung</h2>' : '<p class="sk-anleitung"><b>Lösung</b></p>') +
      '<p class="sk-loesung-text">' + esc(Kern.woerter(st.text).map(function(w){ return w.join(''); }).join(' ')) + '</p>' +
      '<p class="sk-erklaerung">So steht es auf dem Gegenstand (' + f1(o.d) + ' mm Durchmesser): ' + k + (k === 1 ? ' Reihe' : ' Reihen') + ' rundherum, ' + T + (T === 1 ? ' Windung' : ' Windungen') + ' der Länge nach. ' +
      (o.farbig ? 'Die Nachricht steht in den farbigen Reihen, alles andere sind Füllbuchstaben.' : 'Die Nachricht beginnt in Reihe 1 und geht in den nächsten Reihen weiter.') + '</p>' + gitter;
    return { seiten:html, loesung:loesung, streifen:streifen.length, blaetter:seiten.length };
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [].slice.call(bereich.querySelectorAll('#skSeiten .sk-blatt')).concat(st.opt.mitLoesung ? [$('#skLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function dateiname(){ return Labor.pdfName('Skytale', st.text.trim().split(/\s+/).slice(0, 3).join(' ')); }
  Labor.pdfKnopf($('#skPdf'), function(){ return R && { blaetter:blaetter(), name:dateiname() }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#skPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#skHerunterladen').hidden = false; });
  }
  $('#skHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !R) return;
    var name = dateiname().replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Skytale', inhalt, '.sk-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
