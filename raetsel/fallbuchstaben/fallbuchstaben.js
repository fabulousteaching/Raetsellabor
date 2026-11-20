/* Rätsellabor – Generator «Fallende Buchstaben»
   Ein Satz steht in einem Raster (schwarze Felder trennen die Wörter). Ein Teil der Buchstaben – so viele, wie man
   wählt – ist aus seinem Feld nach unten gefallen: Unter jeder Spalte stehen ihre fehlenden Buchstaben, alphabetisch
   geordnet. In welche Zeile ein Buchstabe gehört, muss man selbst herausfinden. Raster als SVG, Lösungsblatt, PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('fallbuchstaben');

/* KERN-START */
var Kern = (function(){
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  /* Text → Wörter, jedes eine Liste von Zellen { z:Zeichen, b:(ist ein Buchstabe – nur Buchstaben fallen) }.
     o.gross: alles in Grossbuchstaben (ß wird SS) · o.satzzeichen: Satzzeichen bekommen ein eigenes Feld, sonst weg */
  function woerter(text, o){
    var t = String(text || '').normalize('NFC');
    if (o.gross) t = t.toLocaleUpperCase('de-CH');
    return t.split(/\s+/).map(function(w){
      return Array.from(w).filter(function(c){ return o.satzzeichen || /[\p{L}\p{N}]/u.test(c); })
        .map(function(c){ return { z:c, b:/\p{L}/u.test(c) }; });
    }).filter(function(w){ return w.length; });
  }
  /* Wörter in Zeilen zu je «breite» Feldern; null = schwarzes Feld. Zwischen zwei Wörtern ein schwarzes Feld, am
     Zeilenende wird schwarz aufgefüllt. trennen=false: ein Wort kommt ganz in die nächste Zeile (nur wenn es länger
     als eine Zeile ist, wird es geteilt). trennen=true: der Satz läuft einfach weiter (am Zeilenanfang kein Abstand). */
  function zeilen(W, breite, trennen){
    var R = [], z = [];
    function neu(){ while (z.length < breite) z.push(null); R.push(z); z = []; }
    W.forEach(function(w, i){
      if (trennen){
        if (i && z.length){ z.push(null); if (z.length === breite) neu(); }
      } else {
        if (z.length && z.length + 1 + w.length > breite) neu();
        if (z.length) z.push(null);
      }
      w.forEach(function(c){ if (z.length === breite) neu(); z.push(c); });
      if (trennen && z.length === breite) neu();
    });
    if (z.length) neu();
    return R;
  }
  function buchstaben(R){ return R.reduce(function(a, z){ return a + z.filter(function(c){ return c && c.b; }).length; }, 0); }
  /* «anzahl» zufällige Buchstaben fallen herunter. → { raster:[[{z,b,f}|null]], spalten:[[fehlende Buchstaben, sortiert]], hoch } */
  function fallen(R, anzahl, rnd){
    var orte = [];
    R.forEach(function(z, r){ z.forEach(function(c, s){ if (c && c.b) orte.push([r, s]); }); });
    for (var i = orte.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), x = orte[i]; orte[i] = orte[j]; orte[j] = x; }
    var raster = R.map(function(z){ return z.map(function(c){ return c && { z:c.z, b:c.b, f:false }; }); });
    orte.slice(0, Math.max(0, Math.min(anzahl, orte.length))).forEach(function(o){ raster[o[0]][o[1]].f = true; });
    var breite = R.length ? R[0].length : 0, spalten = [], hoch = 0;
    for (var s = 0; s < breite; s++){
      var L = raster.map(function(z){ return z[s]; }).filter(function(c){ return c && c.f; }).map(function(c){ return c.z; });
      L.sort(function(a, b){ return a.localeCompare(b, 'de') || (a < b ? -1 : a > b ? 1 : 0); });
      spalten.push(L); hoch = Math.max(hoch, L.length);
    }
    return { raster:raster, spalten:spalten, hoch:hoch };
  }
  /* Vorschlag für die Zeilenbreite: etwa doppelt so breit wie hoch (10 bis 24 Felder), mindestens das längste Wort.
     Ohne Trennen wird in der Nähe (± 3) die Breite gesucht, bei der am wenigsten Felder am Zeilenende schwarz bleiben. */
  function autoBreite(W, trennen){
    var n = W.reduce(function(a, w){ return a + w.length + 1; }, -1), lang = W.reduce(function(a, w){ return Math.max(a, w.length); }, 0);
    var ziel = Math.min(30, Math.max(lang, Math.min(24, Math.max(10, Math.round(Math.sqrt(Math.max(n, 1) * 4))))));
    if (trennen || !W.length) return ziel;
    var best = ziel, bestP = Infinity;
    for (var b = Math.max(lang, ziel - 3); b <= Math.min(30, ziel + 3); b++){
      var R = zeilen(W, b, false), rest = 0;
      R.slice(0, -1).forEach(function(z){ for (var k = z.length - 1; k >= 0 && z[k] === null; k--) rest++; });
      var p = rest + Math.abs(b - ziel) * 1.2;
      if (p < bestP){ bestP = p; best = b; }
    }
    return best;
  }
  return { zufall:zufall, woerter:woerter, zeilen:zeilen, buchstaben:buchstaben, fallen:fallen, autoBreite:autoBreite };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', AKZENT = '#D2601A', BMIN = 6, BMAX = 30;
var SCHREIB = [['gross', 'GROSSBUCHSTABEN'], ['wie', tx('wie geschrieben')]];
// Farben für die Trennfelder (bisher immer schwarz); dazu eine eigene Farbe
var FELDFARBEN = [['#1C1714', tx('Schwarz')], ['#6B6460', tx('Dunkelgrau')], ['#BDB7B2', tx('Hellgrau')], ['#2F5D9E', tx('Blau')], ['#A9CDEB', tx('Hellblau')], ['#2E7D4F', tx('Grün')],
  ['#B5DDA9', tx('Hellgrün')], ['#F3D36B', tx('Gelb')], ['#EE9A3A', tx('Orange')], ['#D64545', tx('Rot')], ['#F4B6C2', tx('Rosa')], ['#8E6BBF', tx('Violett')]];
function farbName(f){ var x = FELDFARBEN.filter(function(a){ return a[0].toLowerCase() === String(f).toLowerCase(); })[0]; return x ? x[1] : tx('eigene Farbe'); }
var MENGE = [['viertel', tx('ein Viertel'), 0.25], ['haelfte', tx('die Hälfte'), 0.5], ['dreiviertel', tx('drei Viertel'), 0.75], ['alle', 'alle', 1], ['zahl', tx('Anzahl wählen'), 0]];
var SAETZE = [tx('Ich habe heute keine Hausaufgaben.'), tx('Der Hund schläft unter dem Tisch.'), tx('Im Sommer schwimmen wir im See.'), tx('Meine Katze trinkt gerne warme Milch.'),
  tx('Wir bauen im Wald eine Hütte.'), tx('Am Morgen scheint die Sonne ins Zimmer.'), tx('Der Zug fährt pünktlich um acht Uhr ab.'), tx('Lesen macht klug und Spass.'),
  tx('Im Winter fahren wir Schlitten.'), tx('Die Kinder spielen auf dem Pausenplatz.'), tx('Ein Igel sucht im Laub nach Futter.'), tx('Morgen gehen wir zusammen ins Museum.'),
  tx('Der Schatz liegt hinter dem Schulhaus.'), tx('Heute dürfen alle früher in die Pause.'), tx('Der Mond leuchtet hell in der Nacht.'), tx('Das Eichhörnchen sammelt Nüsse für den Winter.'),
  tx('Auf dem Berg liegt noch Schnee.'), tx('Der Bäcker backt frisches Brot.'), tx('Mit Geduld schaffst du alles.'), tx('Unsere Klasse macht einen Ausflug an den Rhein.'),
  tx('Im Garten wachsen Tomaten und Bohnen.'), tx('Der Elefant hat einen langen Rüssel.'), tx('Nach dem Regen kommt ein Regenbogen.'), tx('Wer zuerst kommt, mahlt zuerst.')];
function esc(t){ return Labor.esc(t); }
function chips(name, liste, label){ return '<div class="fb-chips" role="radiogroup" aria-label="' + label + '">' + liste.map(function(a){ return '<label><input type="radio" name="' + name + '" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>'; }

var VORLAGE = '<div class="fb">' +
  tx('<header class="fb-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Fallende Buchstaben</h1>') +
    tx('<p>Aus einem Satz sind Buchstaben nach unten gefallen. Sie stehen unter ihrer Spalte – aber in welche Zeile gehören sie?</p></header>') +
  tx('<div class="fb-layout"><section class="fb-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Satz</h2><p>Ein Satz oder mehrere – bis 240 Zeichen.</p></div></div>') +
      tx('<label class="feld-label" for="fbSatz">Satz</label>') +
      '<textarea id="fbSatz" class="fb-text" rows="3" maxlength="240" spellcheck="true"></textarea>' +
      tx('<div class="fb-zeile"><button type="button" class="btn klein" id="fbVorschlag">Satz vorschlagen</button><span class="fb-info" id="fbInfo" aria-live="polite"></span></div>') +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Raster</h2></div></div>') +
      tx('<p class="feld-label">Buchstaben im Raster</p>') + chips('fbSchreib', SCHREIB, tx('Schreibweise')) +
      tx('<label class="feld-label" for="fbBreite">Felder pro Zeile: <b id="fbBreiteWert"></b></label>') +
      '<div class="fb-zeile"><input type="range" id="fbBreite" min="' + BMIN + '" max="' + BMAX + '" step="1"><button type="button" class="btn klein" id="fbAuto" hidden>automatisch</button></div>' +
      tx('<p class="feld-label">Farbe der Felder zwischen den Wörtern</p><div class="fb-farbwahl" role="radiogroup" aria-label="Farbe der Felder zwischen den Wörtern">') +
        FELDFARBEN.map(function(f){ return '<label title="' + f[1] + '"><input type="radio" name="fbFarbe" value="' + f[0] + '"><span style="background:' + f[0] + '"></span><b class="vh">' + f[1] + '</b></label>'; }).join('') +
        tx('<label class="fb-eigene" title="Eigene Farbe"><input type="color" id="fbFarbeEigen" value="#5B8DB8"><span>eigene</span></label></div>') +
      '<p class="hinweis" id="fbFarbeInfo"></p>' +
      tx('<label class="opt"><input type="checkbox" id="fbSatzzeichen"><span>Satzzeichen im Raster (stehen schon da)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="fbTrennen"><span>Wörter laufen über das Zeilenende weiter (schwieriger)</span></label>') +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Herunterfallen</h2></div></div>') +
      tx('<p class="feld-label">Wie viele Buchstaben fallen herunter?</p>') + chips('fbMenge', MENGE, tx('Anzahl der fallenden Buchstaben')) +
      tx('<div class="fb-zahl" id="fbZahlFeld" hidden><label class="feld-label" for="fbZahl">Anzahl Buchstaben</label><input type="number" id="fbZahl" min="1" step="1" inputmode="numeric"></div>') +
      '<p class="hinweis" id="fbMengeInfo"></p>' +
    '</div>' +
  '</section>' +
  tx('<section class="fb-ausgabe" aria-label="Ergebnis">') +
    '<div id="fbMeldung" aria-live="polite"></div>' +
    '<div class="fb-werkzeug">' +
      tx('<button type="button" class="btn klein" id="fbZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      tx('<button type="button" class="btn klein" id="fbNeu" title="Andere Buchstaben fallen herunter">Neu mischen</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="fbMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="fbPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="fbHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
    '</div>' +
    '<div class="fb-blaetter"><div class="fb-rahmen"><article class="fb-blatt" id="fbBlatt" hidden></article></div>' +
    '<div class="fb-rahmen fb-loesung-rahmen"><article class="fb-blatt fb-loesungsblatt" id="fbLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true">' +
  '<rect x="2.5" y="3" width="19" height="10" rx="1"/><path d="M8.8 3v10M15.2 3v10M2.5 8h19"/><rect x="15.2" y="3" width="6.3" height="5" fill="currentColor" stroke="none"/>' +
  '<path d="M5.6 15.5v4M12 15.5v4M18.4 15.5v4" stroke-dasharray="1.6 1.4"/><path d="M4.4 18.6l1.2 1.4 1.2-1.4M10.8 18.6l1.2 1.4 1.2-1.4M17.2 18.6l1.2 1.4 1.2-1.4"/></svg>';

Labor.registriere({
  id:'fallbuchstaben',
  titel:'Fallende Buchstaben',
  kurz:'Buchstaben sind aus dem Satz gefallen – zurück an ihren Platz!',
  beschreibung:'Ein eigener Satz steht im Raster, ein Teil der Buchstaben ist nach unten gefallen. Unter jeder Spalte stehen die fehlenden Buchstaben – in welche Zeile sie gehören, findet man selbst heraus. Wie viele fallen, wählst du. Mit Lösungsblatt.',
  merkmale:['Eigener Satz', 'Anzahl wählbar', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/fallbuchstaben/fallbuchstaben.css',
  html:VORLAGE,
  start:starte
});

/* Raster als SVG: c = Feldgrösse in px. loesung: alle Buchstaben im Raster (die gefallenen farbig), nichts darunter.
   farbe: Farbe der Felder zwischen den Wörtern (ohne Angabe schwarz) */
function rasterSvg(F, c, loesung, farbe){
  var Z = F.raster.length, B = F.raster[0].length, m = loesung ? 0 : F.hoch, lz = c * 0.8, abst = c * 0.5;
  var W = B * c, H = Z * c + (m ? abst + m * lz : 0), fs = +(c * 0.56).toFixed(1), r = function(v){ return +v.toFixed(1); };
  var s = '<svg class="fb-svg" xmlns="http://www.w3.org/2000/svg" width="' + r(W + 4) + '" height="' + r(H + 4) + '" viewBox="-2 -2 ' + r(W + 4) + ' ' + r(H + 4) + '" role="img" aria-label="' + (loesung ? tx('Lösung') : tx('Raster mit Lücken und gefallenen Buchstaben')) + '">';
  var schwarz = '', linien = '', text = '';
  F.raster.forEach(function(z, zr){ z.forEach(function(zelle, sp){
    var x = sp * c, y = zr * c;
    if (!zelle){ schwarz += 'M' + r(x) + ' ' + r(y) + 'h' + r(c) + 'v' + r(c) + 'h' + r(-c) + 'z'; return; }
    if (zelle.f && !loesung) return;
    text += '<text x="' + r(x + c / 2) + '" y="' + r(y + c / 2 + fs * 0.36) + '"' + (zelle.f ? ' fill="' + AKZENT + '" font-weight="700"' : '') + '>' + esc(zelle.z) + '</text>';
  }); });
  for (var i = 1; i < Z; i++) linien += 'M0 ' + r(i * c) + 'H' + r(W);
  for (var k = 1; k < B; k++) linien += 'M' + r(k * c) + ' 0V' + r(Z * c);
  s += '<path d="' + schwarz + '" fill="' + (farbe || TINTE) + '"/>';
  s += '<path d="' + linien + '" stroke="' + TINTE + '" stroke-width="1.2" fill="none"/>';
  s += '<rect x="0" y="0" width="' + r(W) + '" height="' + r(Z * c) + '" stroke="' + TINTE + '" stroke-width="2" fill="none"/>';
  s += '<g text-anchor="middle" font-size="' + fs + '" fill="' + TINTE + '">' + text;
  // Gefallene Buchstaben: unten ausgerichtet unter ihrer Spalte (wie heruntergefallen)
  if (m) F.spalten.forEach(function(L, sp){ L.forEach(function(b, k){
    s += '<text x="' + r(sp * c + c / 2) + '" y="' + r(Z * c + abst + (m - L.length + k) * lz + lz / 2 + fs * 0.36) + '" font-weight="600">' + esc(b) + '</text>';
  }); });
  return s + '</g></svg>';
}

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'fallbuchstaben-eingaben', OPT = 'fallbuchstaben-einstellungen';
  // Keine Vorauswahl bei Schreibweise und Anzahl; Satzzeichen angekreuzt
  var STANDARD = { schreib:'', menge:'', farbe:'#1C1714', satzzeichen:true, trennen:false, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { satz:'', breite:0, zahl:0, seed:Math.floor(Math.random() * 1e9) + 1, opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.satz = String(e.satz || ''); st.breite = +e.breite || 0; st.zahl = +e.zahl || 0; st.seed = +e.seed || st.seed; } } catch(x){}
  if (!SCHREIB.some(function(a){ return a[0] === st.opt.schreib; })) st.opt.schreib = '';
  if (!MENGE.some(function(a){ return a[0] === st.opt.menge; })) st.opt.menge = '';
  if (!/^#[0-9a-f]{6}$/i.test(st.opt.farbe || '')) st.opt.farbe = STANDARD.farbe;
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ satz:st.satz, breite:st.breite, zahl:st.zahl, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#fbMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  var warte = 0;
  $('#fbSatz').value = st.satz;
  $('#fbSatz').addEventListener('input', function(){ st.satz = this.value; speichern(); clearTimeout(warte); warte = setTimeout(zeichnen, 200); });
  $('#fbVorschlag').addEventListener('click', function(){
    var jetzt = st.satz.trim(), l = SAETZE.filter(function(t){ return t !== jetzt; });
    st.satz = l[Math.floor(Math.random() * l.length)]; $('#fbSatz').value = st.satz; st.breite = 0; speichern(); zeichnen();
  });
  [['fbSchreib', 'schreib'], ['fbMenge', 'menge']].forEach(function(x){
    [].forEach.call(bereich.querySelectorAll('input[name="' + x[0] + '"]'), function(r){
      r.checked = r.value === st.opt[x[1]];
      r.addEventListener('change', function(){ if (!r.checked) return; st.opt[x[1]] = r.value; speichern(); zeichnen(); if (r.value === 'zahl') $('#fbZahl').focus(); });
    });
  });
  /* Farbe der Felder zwischen den Wörtern: eine der Farben oder eine eigene */
  function farbeZeigen(){
    var f = st.opt.farbe.toLowerCase(), eigen = !FELDFARBEN.some(function(x){ return x[0].toLowerCase() === f; });
    [].forEach.call(bereich.querySelectorAll('input[name="fbFarbe"]'), function(r){ r.checked = r.value.toLowerCase() === f; });
    $('.fb-eigene').classList.toggle('gewaehlt', eigen);
    if (eigen) $('#fbFarbeEigen').value = st.opt.farbe;
    // dunkle Farbe (wie Schwarz)? Dann der Tipp, dass helle Farben Tinte sparen
    var hell = (0.299 * parseInt(f.slice(1, 3), 16) + 0.587 * parseInt(f.slice(3, 5), 16) + 0.114 * parseInt(f.slice(5, 7), 16)) / 255;
    $('#fbFarbeInfo').textContent = tx('Felder zwischen den Wörtern: ') + farbName(f) + '.' + (hell < 0.45 ? tx(' Tipp: Helle Farben sparen Druckertinte.') : '');
  }
  [].forEach.call(bereich.querySelectorAll('input[name="fbFarbe"]'), function(r){
    r.addEventListener('change', function(){ if (r.checked){ st.opt.farbe = r.value; speichern(); farbeZeigen(); zeichnen(); } });
  });
  $('#fbFarbeEigen').addEventListener('input', function(){ st.opt.farbe = this.value; speichern(); farbeZeigen(); zeichnen(); });
  farbeZeigen();
  $('#fbBreite').addEventListener('input', function(){ st.breite = +this.value; speichern(); zeichnen(); });
  $('#fbAuto').addEventListener('click', function(){ st.breite = 0; speichern(); zeichnen(); $('#fbBreite').focus(); });
  $('#fbZahl').addEventListener('input', function(){ var v = parseInt(this.value, 10); if (v > 0){ st.zahl = v; speichern(); zeichnen(); } });
  $('#fbZahl').addEventListener('change', function(){ zeichnen(); });
  [['#fbSatzzeichen', 'satzzeichen'], ['#fbTrennen', 'trennen'], ['#fbMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#fbZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#fbLoesung').classList.toggle('zeigen', an); $('#fbLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  $('#fbNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9) + 1; speichern(); zeichnen(); });

  /* ---------- Rätsel bauen und zeichnen ---------- */
  var F = null;
  function zeichnen(){
    if (aus) return;
    var o = st.opt, satz = st.satz.replace(/\s+/g, ' ').trim();
    var W = Kern.woerter(satz, { gross:o.schreib === 'gross', satzzeichen:o.satzzeichen });
    var n = W.reduce(function(a, w){ return a + w.filter(function(c){ return c.b; }).length; }, 0);
    $('#fbInfo').textContent = n ? n + (n === 1 ? tx(' Buchstabe') : tx(' Buchstaben')) + ' in ' + W.length + (W.length === 1 ? tx(' Wort') : tx(' Wörtern')) : '';
    // Zeilenbreite: automatisch, bis man den Schieber bewegt
    var auto = Kern.autoBreite(W, o.trennen), breite = st.breite ? Math.max(BMIN, Math.min(BMAX, st.breite)) : auto;
    $('#fbBreite').value = breite; $('#fbBreiteWert').textContent = breite + (st.breite ? '' : tx(' (automatisch)')); $('#fbAuto').hidden = !st.breite;
    // Anzahl fallender Buchstaben
    var m = MENGE.filter(function(a){ return a[0] === o.menge; })[0];
    $('#fbZahlFeld').hidden = o.menge !== 'zahl';
    if (o.menge === 'zahl'){
      $('#fbZahl').max = Math.max(1, n);
      if (!st.zahl) st.zahl = Math.max(1, Math.round(n / 2));
      if (document.activeElement !== $('#fbZahl')) $('#fbZahl').value = n ? Math.min(st.zahl, n) : st.zahl;
    }
    var anzahl = !m || !n ? 0 : o.menge === 'zahl' ? Math.max(1, Math.min(st.zahl, n)) : Math.max(1, Math.round(n * m[2]));
    $('#fbMengeInfo').textContent = m && n ? anzahl + tx(' von ') + n + tx(' Buchstaben fallen herunter.') + (o.menge === 'zahl' && st.zahl > n ? tx(' (Mehr hat der Satz nicht.)') : '') : '';
    var fehlt = !n ? tx('Schreib links einen Satz oder lass dir einen vorschlagen.') : !o.schreib ? tx('Wähle links, ob die Buchstaben im Raster GROSS oder wie geschrieben stehen.') : !m ? tx('Wähle links, wie viele Buchstaben herunterfallen.') : '';
    ['#fbPdf', '#fbHerunterladen', '#fbZeigeLoesung', '#fbNeu'].forEach(function(s){ $(s).disabled = !!fehlt; });
    if (fehlt){ F = null; $('#fbBlatt').hidden = true; $('#fbBlatt').innerHTML = ''; $('#fbLoesung').parentNode.hidden = true; meldung('info', '<p>' + fehlt + '</p>'); return; }
    meldung(''); $('#fbBlatt').hidden = false; $('#fbLoesung').parentNode.hidden = false;
    var R = Kern.zeilen(W, breite, o.trennen);
    F = Kern.fallen(R, anzahl, Kern.zufall(st.seed));
    // Feldgrösse: so gross, wie es aufs Blatt passt (Breite 639 px, Höhe je nach Kopf), höchstens 46 px
    var hMax = 980 - 56 - (o.titelAn ? 50 : 0) - (o.anleitungAn ? 86 : 0) - 10;
    var c = Math.min(46, 639 / breite, hMax / (R.length + (F.hoch ? 0.5 + 0.8 * F.hoch : 0)));
    var anleitung = tx('Die Buchstaben unter dem Raster sind aus ihrer Spalte heruntergefallen. Setze jeden zurück in ein leeres Feld derselben Spalte – in welche Zeile, musst du selbst herausfinden. ') +
      (o.farbe.toLowerCase() === '#1c1714' ? tx('Schwarze') : tx('Farbige')) + tx(' Felder trennen die Wörter') + (o.trennen ? tx('; ein Wort kann am Zeilenende in der nächsten Zeile weitergehen.') : '.');
    var kopf = (o.titelAn ? tx('<h2>Fallende Buchstaben</h2>') : '') + (o.anleitungAn ? '<p class="fb-anleitung">' + esc(anleitung) + '</p>' : '');
    $('#fbBlatt').innerHTML = kopf + '<div class="fb-bild">' + rasterSvg(F, c, false, o.farbe) + '</div>';
    $('#fbLoesung').innerHTML = (o.titelAn ? tx('<h2>Fallende Buchstaben – Lösung</h2>') : tx('<p class="fb-anleitung"><b>Lösung</b></p>')) +
      '<div class="fb-bild">' + rasterSvg(F, Math.min(c, 46), true, o.farbe) + '</div><p class="fb-loesung-text">' + esc(o.schreib === 'gross' ? satz.toLocaleUpperCase('de-CH') : satz) + '</p>';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [$('#fbBlatt')].concat(st.opt.mitLoesung ? [$('#fbLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  function dateiname(){ var w = st.satz.trim().split(/\s+/).slice(0, 3).join(' '); return Labor.pdfName('Fallende-Buchstaben', w); }
  Labor.pdfKnopf($('#fbPdf'), function(){ return F && { blaetter:blaetter(), name:dateiname() }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#fbPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#fbHerunterladen').hidden = false; });
  }
  $('#fbHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !F) return;
    var name = dateiname().replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.removeAttribute('hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Fallende Buchstaben'), inhalt, '.fb-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
