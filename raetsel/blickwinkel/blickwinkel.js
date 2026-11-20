/* Rätsellabor – Generator «Blickwinkel»
   Wörter und Sätze, extrem in die Länge gezogen (mindestens 16-fach), füllen eine Form (Kreis,
   Quadrat, Achteck …) mit Strichen. Von oben sieht man nur Streifen. Hält man das Blatt auf Augenhöhe und schaut flach
   darüber («aus der Schnauzenperspektive»), staucht sich die Nachricht, die in diese Richtung zeigt, wieder zu normalen
   Buchstaben – die anderen bleiben ein Gewirr. Bis zu 8 Nachrichten, je nach Form 5, 6 oder 8 Blickrichtungen (1 = von unten, dann im
   Gegenuhrzeigersinn). Buchstaben aus Strichen (window.KettenKern.ZEICHEN, Raster 4 × 6). Farben je Nachricht, je Wort
   oder schwarz-weiss. Am Bildschirm lässt sich der flache Blick nachahmen. Blatt, Lösungsblatt, PDF. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  /* Zeichen: aus dem Kettenrätsel (A–Z, 0–9) und ein paar Satzzeichen; Raster 4 breit × 6 hoch, y nach unten */
  var EXTRA = {
    '.':[[[1.7, 5.6], [2.3, 5.6], [2.3, 6], [1.7, 6], [1.7, 5.6]]], '!':[[[2, 0], [2, 4.3]], [[1.7, 5.6], [2.3, 5.6], [2.3, 6], [1.7, 6], [1.7, 5.6]]],
    '?':[[[0.3, 1.2], [1, 0.1], [3, 0.1], [3.8, 1.2], [3.5, 2.4], [2, 3.3], [2, 4.3]], [[1.7, 5.6], [2.3, 5.6], [2.3, 6], [1.7, 6], [1.7, 5.6]]],
    ',':[[[2.3, 5.2], [1.7, 6.4]]], '-':[[[0.6, 3], [3.4, 3]]], ':':[[[2, 1.6], [2, 2.2]], [[2, 5.4], [2, 6]]]
  };
  function zeichenSatz(basis){ var z = {}; Object.keys(basis || {}).forEach(function(k){ z[k] = basis[k]; }); Object.keys(EXTRA).forEach(function(k){ z[k] = EXTRA[k]; }); return z; }
  // Text → Wörter aus Zeichen, die es gibt (Grossbuchstaben; Ä → AE, Ö → OE, Ü → UE, ß → SS)
  function lesen(text, Z){
    var t = String(text || '').normalize('NFC').toLocaleUpperCase('de-CH').replace(/Ä/g, 'AE').replace(/Ö/g, 'OE').replace(/Ü/g, 'UE').replace(/ẞ|ß/g, 'SS');
    var weg = [];
    var woerter = t.split(/\s+/).map(function(w){ return Array.from(w).filter(function(c){ if (Z[c]) return true; if (weg.indexOf(c) < 0) weg.push(c); return false; }).join(''); }).filter(Boolean);
    return { woerter:woerter, weg:weg };
  }
  var BUCHSTABE = 4, ABSTAND = 0.8, LEER = 4.2;   // in Rastereinheiten: Breite eines Zeichens, Abstand dazwischen, Wortabstand
  function zeilenBreite(z){ return z.reduce(function(s, w, i){ return s + w.length * BUCHSTABE + (w.length - 1) * ABSTAND + (i ? LEER : 0); }, 0); }
  // Wörter auf k Zeilen verteilen, so dass die längste Zeile möglichst kurz ist (alle Aufteilungen der Reihe nach)
  function aufteilen(woerter, k){
    var best = null;
    (function weiter(i, zeilen){
      if (zeilen.length === k - 1){ var l = zeilen.concat([woerter.slice(i)]); if (!l[l.length - 1].length) return; var m = Math.max.apply(null, l.map(zeilenBreite)); if (!best || m < best.m) best = { m:m, z:l }; return; }
      for (var j = i + 1; j <= woerter.length - (k - 1 - zeilen.length); j++) weiter(j, zeilen.concat([woerter.slice(i, j)]));
    })(0, []);
    return best;
  }
  /* Satz in die Form setzen (Einheit: Radius der Form = 1, Rahmen der Nachricht). Die Buchstaben füllen die Form von
     oben bis unten: Jeder Punkt eines Zeichens liegt in der senkrechten Sehne der Form bei seinem x – so folgen die Zeilen
     dem Rand der Form (in der Mitte höher, am Rand niedriger). Waagrecht reicht der Satz höchstens so weit, wie die Sehne
     noch KANTE · die längste ist. Die Streckung (Zeilenhöhe : Breite einer Rastereinheit) ist überall mindestens S – so
     werden die Buchstaben zu langen, fast parallelen Strichen, die man von oben nicht lesen kann. Kurze Wörter werden
     dafür schmaler. Mehr Zeilen (bis 3) nur, wenn die Buchstaben damit grösser werden.
     sf: Sehne bei x → [oben, unten] oder null. → { striche:[{ wort, p:[[x, y] …] }], ux, streckung (in der Mitte), k, zeilen } */
  var RAND = 0.035, ZWISCHEN = 0.05, KANTE = 0.6;
  function bereich(sf){
    var N = 400, lang = [], cmax = 0;
    for (var i = 0; i <= N; i++){ var c = sf(-1 + 2 * i / N), l = c ? c[1] - c[0] : 0; lang.push(l); if (l > cmax) cmax = l; }
    var ia = 0, ib = N; while (lang[ia] < KANTE * cmax) ia++; while (lang[ib] < KANTE * cmax) ib--;
    return { xa:-1 + 2 * ia / N, xb:-1 + 2 * ib / N, cmax:cmax };
  }
  function band(l, k){ return (l - 2 * RAND - (k - 1) * ZWISCHEN) / k; }
  function setzen(woerter, Z, sf, S){
    if (!woerter.length) return null;
    var B = bereich(sf), mitte = (B.xa + B.xb) / 2, best = null;
    function kuerzeste(x0, x1){ var m = Infinity; for (var j = 0; j <= 40; j++){ var c = sf(x0 + (x1 - x0) * j / 40); m = Math.min(m, c ? c[1] - c[0] : 0); } return m; }
    for (var k = 1; k <= Math.min(3, woerter.length); k++){
      // grösstes ux, bei dem die Streckung überall mindestens S ist (je schmaler, desto stärker gestreckt: Halbierung)
      var a = aufteilen(woerter, k), hi = (B.xb - B.xa) / a.m, lo = 0;
      var passt = function(ux){ var b = band(kuerzeste(mitte - a.m * ux / 2, mitte + a.m * ux / 2), k); return b > 0 && b / (6 * ux) >= S; };
      if (passt(hi)) lo = hi; else for (var t = 0; t < 40; t++){ var m = (lo + hi) / 2; if (passt(m)) lo = m; else hi = m; }
      var ux = lo;
      if (ux > 0 && (!best || ux > best.ux * 1.03)) best = { k:k, z:a.z, ux:ux };
    }
    if (!best) return null;
    var striche = [], n = 0, ux = best.ux;
    best.z.forEach(function(zeile, j){
      function punkt(x, gy){ var c = sf(x) || sf(mitte), b = band(c[1] - c[0], best.k); return [x, c[0] + RAND + j * (b + ZWISCHEN) + gy / 6 * b]; }
      var x = mitte - zeilenBreite(zeile) * ux / 2;
      zeile.forEach(function(wort, wi){
        if (wi) x += LEER * ux;
        Array.from(wort).forEach(function(c, ci){
          if (ci) x += ABSTAND * ux;
          var x0 = x;
          (Z[c] || []).forEach(function(st){
            var p = [];
            st.forEach(function(q, qi){
              if (qi){ var v = st[qi - 1], teile = Math.max(1, Math.ceil(Math.abs(q[0] - v[0]) * ux / 0.01));
                for (var m = 1; m < teile; m++) p.push(punkt(x0 + (v[0] + (q[0] - v[0]) * m / teile) * ux, v[1] + (q[1] - v[1]) * m / teile)); }
              p.push(punkt(x0 + q[0] * ux, q[1]));
            });
            striche.push({ wort:n, p:p });
          });
          x += BUCHSTABE * ux;
        });
        n++;
      });
    });
    var cm = sf(mitte);
    return { zeilen:best.z.map(function(z){ return z.join(' '); }), striche:striche, ux:ux, streckung:band(cm[1] - cm[0], best.k) / (6 * ux), k:best.k, woerter:n,
      fuellung:Math.max.apply(null, best.z.map(zeilenBreite)) * ux / (B.xb - B.xa) };
  }
  // So viele Tarnzeichen, dass sie die Form etwa füllen
  function tarnAnzahl(sf, S){
    var B = bereich(sf), ux = band(B.cmax * 0.85, 1) / (6 * S * 1.05);
    return Math.max(3, Math.min(40, Math.round((B.xb - B.xa) / (ux * (BUCHSTABE + ABSTAND)))));
  }
  /* Blickrichtungen je nach Form: Fünfeck 5, Sechseck 6 (je eine Seite), sonst 8 (Seiten und Ecken).
     Richtung 1 = von unten, dann im Gegenuhrzeigersinn. Winkel, um den die Nachricht gedreht wird (im Uhrzeigersinn,
     Bildschirm-Koordinaten): −(r − 1) · 360° / n */
  var RICHTUNGEN = { kreis:8, quadrat:8, raute:8, fuenfeck:5, sechseck:6, achteck:8 };
  function anzahl(form){ return RICHTUNGEN[form] || 8; }
  function winkel(r, n){ return -(r - 1) * 360 / (n || 8); }
  var NAMEN = ['unten', 'unten rechts', 'rechts', 'oben rechts', 'oben', 'oben links', 'links', 'unten links'];
  function richtungsName(r, n){ return NAMEN[Math.round((r - 1) * 360 / (n || 8) / 45) % 8]; }
  // Richtung genau gegenüber (nur bei gerader Anzahl), sonst 0
  function gegenueber(r, n){ n = n || 8; return n % 2 ? 0 : (r - 1 + n / 2) % n + 1; }
  /* Tarnlinien: Winkel, die möglichst weit weg von allen Leserichtungen liegen (auch von der Gegenrichtung, darum
     modulo 180°): jeweils die Mitte der grössten Lücke. Eine Schicht, wenn alle Nachrichten auf einer Achse liegen
     (eine Nachricht oder zwei gegenüber) – dann quer dazu –, sonst zwei. */
  function tarnWinkel(liste){
    var achsen = [];
    liste.forEach(function(g){ var a = ((g % 180) + 180) % 180; if (!achsen.some(function(b){ return Math.abs(a - b) < 1e-6; })) achsen.push(a); });
    if (!achsen.length) return [];
    var aus = [], wie = achsen.length > 1 ? 2 : 1;
    for (var k = 0; k < wie; k++){
      var l = achsen.concat(aus).sort(function(a, b){ return a - b; }), best = null;
      l.forEach(function(a, i){ var b = i + 1 < l.length ? l[i + 1] : l[0] + 180, luecke = b - a; if (!best || luecke > best.l + 1e-6) best = { l:luecke, m:(a + luecke / 2) % 180 }; });
      aus.push(best.m);
    }
    return aus;
  }
  function drehen(p, grad){ var w = grad * Math.PI / 180, c = Math.cos(w), s = Math.sin(w); return [p[0] * c - p[1] * s, p[0] * s + p[1] * c]; }
  /* Ränder der Form im Rahmen der Nachricht (Form um −grad gedreht; y zeigt zum Betrachter): Kanten n · p ≤ d, n nach
     aussen; der Kreis als 360-Eck */
  function kanten(name, grad){
    var e = form(name), k = [];
    if (e){
      var q = e.map(function(p){ return drehen(p, -grad); });
      q.forEach(function(p, i){ var n = q[(i + 1) % q.length], nx = n[1] - p[1], ny = p[0] - n[0], l = Math.hypot(nx, ny); nx /= l; ny /= l;
        var d = nx * p[0] + ny * p[1]; if (d < 0){ nx = -nx; ny = -ny; d = -d; } k.push([nx, ny, d]); });
    } else for (var i = 0; i < 360; i++){ var w = i * Math.PI / 180; k.push([Math.cos(w), Math.sin(w), 1]); }
    return k;
  }
  /* Senkrechte Sehne der Form bei x → [oben, unten] oder null. halb: nur die Hälfte beim Betrachter (y ≥ LUECKE) – dann,
     wenn die gegenüberliegende Richtung auch belegt ist; sonst stünden die beiden Nachrichten verkehrt übereinander. */
  var LUECKE = 0.04;
  function sehne(k, halb){
    return function(x){
      var lo = halb ? LUECKE : -Infinity, hi = Infinity;
      for (var i = 0; i < k.length; i++){ var nx = k[i][0], ny = k[i][1], r = k[i][2] - nx * x;
        if (Math.abs(ny) < 1e-12){ if (r < 0) return null; }
        else if (ny > 0) hi = Math.min(hi, r / ny); else lo = Math.max(lo, r / ny); }
      return hi - lo > 1e-6 ? [lo, hi] : null;
    };
  }
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function streuwert(t){ var h = 2166136261; for (var i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  /* Tarnlinien: «Wörter» aus Buchstaben-Bruchstücken (ein Teil eines Buchstabens und ein Strich eines anderen), gleich
     lang wie die Vorlage. Quer zu einer Nachricht gelegt, sehen sie von oben aus wie eine weitere Nachricht; beim flachen
     Blick auf die Nachricht werden sie zu feinen Strichen. → { woerter, Z } (Z mit den Tarnzeichen ergänzt) */
  var TARN_AUS = 'ABCDEFGHKMNPRSTUVWXYZ';
  function tarnung(vorlage, Z, rnd){
    var aus = TARN_AUS.split('').filter(function(c){ return Z[c]; }), Z2 = {}, n = 0;
    Object.keys(Z).forEach(function(k){ Z2[k] = Z[k]; });
    function eins(){ return Z[aus[Math.floor(rnd() * aus.length)]]; }
    var woerter = vorlage.map(function(w){ return Array.from(w).map(function(){
      var a = eins(), b = eins(), k = String.fromCharCode(0xE000 + n++);
      Z2[k] = a.slice(0, Math.max(1, Math.ceil(a.length / 2))).concat([b[Math.floor(rnd() * b.length)]]);
      return k;
    }).join(''); });
    return { woerter:woerter, Z:Z2 };
  }
  // Dicke des Stifts senkrecht zur Zeile: so bleiben waagrechte Striche beim flachen Blick sichtbar
  function stift(s){ return Math.pow(s, 0.65); }
  var STRECKUNG = 16;
  // Wie weit reicht die Form in Richtung u (Länge 1)? Für die Nummern am Rand
  function reichweite(name, u){ var e = form(name); return e ? Math.max.apply(null, e.map(function(p){ return p[0] * u[0] + p[1] * u[1]; })) : 1; }   // mindestens so stark gestreckt: Blickwinkel etwa 3.5°, ganz flach über das Blatt
  /* Formen: Ecken, so verschoben und vergrössert, dass sie das Quadrat von −1 bis 1 ausfüllen (gleich gross wie der Kreis
     mit Radius 1, so breit oder hoch wie möglich); Kreis = null */
  function form(name){
    function eck(n, start){
      var l = []; for (var i = 0; i < n; i++){ var w = (start + i * 360 / n) * Math.PI / 180; l.push([Math.sin(w), -Math.cos(w)]); }
      var xs = l.map(function(p){ return p[0]; }), ys = l.map(function(p){ return p[1]; });
      var mx = (Math.min.apply(null, xs) + Math.max.apply(null, xs)) / 2, my = (Math.min.apply(null, ys) + Math.max.apply(null, ys)) / 2;
      var m = Math.max.apply(null, l.map(function(p){ return Math.max(Math.abs(p[0] - mx), Math.abs(p[1] - my)); }));
      return l.map(function(p){ return [(p[0] - mx) / m, (p[1] - my) / m]; });
    }
    if (name === 'quadrat') return eck(4, 45);
    if (name === 'raute') return eck(4, 0);
    if (name === 'fuenfeck') return eck(5, 0);
    if (name === 'sechseck') return eck(6, 30);
    if (name === 'achteck') return eck(8, 22.5);
    return null;
  }
  return { EXTRA:EXTRA, zeichenSatz:zeichenSatz, lesen:lesen, zeilenBreite:zeilenBreite, aufteilen:aufteilen, setzen:setzen, winkel:winkel, anzahl:anzahl, richtungsName:richtungsName, tarnWinkel:tarnWinkel, drehen:drehen, form:form, kanten:kanten, sehne:sehne, bereich:bereich, tarnAnzahl:tarnAnzahl, gegenueber:gegenueber, zufall:zufall, streuwert:streuwert, tarnung:tarnung, stift:stift, reichweite:reichweite, STRECKUNG:STRECKUNG };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', B = 639;
var D = 150 * 703 / 186;   // Durchmesser der Form: 15 cm
var FORMEN = [['kreis', 'Kreis'], ['quadrat', 'Quadrat'], ['raute', 'Raute'], ['fuenfeck', 'Fünfeck'], ['sechseck', 'Sechseck'], ['achteck', 'Achteck']];
var FARBMODI = [['sw', 'schwarz-weiss'], ['nachricht', 'jede Nachricht eine Farbe'], ['wort', 'jedes Wort eine Farbe']];
var DICKEN = [['fein', 'fein'], ['mittel', 'mittel'], ['dick', 'dick']], DICKE = { fein:2.4, mittel:3.6, dick:5.2 };
var FARBEN = ['#E53935', '#1E88E5', '#43A047', '#FB8C00', '#8E24AA', '#00897B', '#D81B60', '#6D4C41'];
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
function chips(name, l){ return l.map(function(x){ return '<label><input type="radio" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>'; }).join(''); }

var VORLAGE = '<div class="bw">' +
  '<header class="bw-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Blickwinkel</h1>' +
    '<p>Extrem gestreckte Wörter füllen eine Form mit Streifen: Von oben unlesbar – schaut man ganz flach über das Blatt, wird eine Nachricht lesbar.</p></header>' +
  '<div class="bw-layout"><section class="bw-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Form</h2><p>Die Form bestimmt, aus wie vielen Richtungen man schauen kann.</p></div></div>' +
      '<div class="bw-chips" role="radiogroup" aria-label="Form">' + chips('bwForm', FORMEN) + '</div>' +
      '<p class="hinweis" id="bwFormInfo"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Nachrichten</h2><p id="bwNachrichtenText">Wörter oder kurze Sätze – jede aus einer anderen Richtung lesbar.</p></div></div>' +
      '<p class="hinweis" id="bwFormZuerst">Wähle zuerst oben eine Form.</p>' +
      '<div id="bwNachrichtenTeil" hidden><div class="bw-nachrichten" id="bwNachrichten"></div>' +
      '<button type="button" class="btn klein" id="bwMehr">+ weitere Nachricht</button></div>' +
      '<div class="bw-zaehler" id="bwZaehler" aria-live="polite"></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Farben</h2></div></div>' +
      '<div class="bw-chips" role="radiogroup" aria-label="Farben">' + chips('bwFarbmodus', FARBMODI) + '</div>' +
      '<p class="hinweis" id="bwFarbInfo"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">4</span><div><h2>Blatt</h2></div></div>' +
      '<p class="feld-label">Strichdicke</p><div class="bw-chips" role="radiogroup" aria-label="Strichdicke">' + chips('bwDicke', DICKEN) + '</div>' +
      '<p class="hinweis" id="bwDickeInfo"></p>' +
      '<label class="opt"><input type="checkbox" id="bwTarnung"><span>Tarnlinien schräg zu den Nachrichten (füllen die Form, von oben schwerer zu lesen)</span></label>' +
      '<p class="hinweis" id="bwTarnInfo"></p>' +
      '<label class="opt"><input type="checkbox" id="bwMarken"><span>Blickrichtungen am Rand markieren (Nummern)</span></label>' +
      '<label class="opt"><input type="checkbox" id="bwLinien"><span>Linien für die Antworten</span></label>' +
    '</div>' +
  '</section>' +
  '<section class="bw-ausgabe" aria-label="Ergebnis">' +
    '<div id="bwMeldung" aria-live="polite"></div>' +
    '<div class="bw-werkzeug">' +
      '<button type="button" class="btn klein" id="bwZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="bwMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="bwPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="bwHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="karte bw-blick nur-bildschirm" id="bwBlick"><div><h2>Flach darüber schauen</h2><p>So sieht man die Form, wenn man flach von einer Seite darüber schaut:</p></div>' +
      '<div class="bw-chips" id="bwBlickWahl" role="radiogroup" aria-label="Blickrichtung"></div><div class="bw-blickbild" id="bwBlickBild"></div></div>' +
    '<div class="bw-blaetter"><div class="bw-rahmen"><article class="bw-blatt" id="bwBlatt"></article></div>' +
    '<div class="bw-rahmen bw-loesung-rahmen"><article class="bw-blatt bw-loesungsblatt" id="bwLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<circle cx="12" cy="12" r="9"/><path d="M8 5v14M12 3.5v17M16 5v14" stroke-width="1.6"/><path d="M5 9h14" stroke-width="1.6"/></svg>';

Labor.registriere({
  id:'blickwinkel',
  titel:'Blickwinkel',
  kurz:'Gestreckte Wörter – nur flach über das Blatt geschaut lesbar',
  beschreibung:'Wörter und Sätze, extrem in die Länge gezogen, füllen eine Form mit Streifen – in bis zu acht Richtungen (je nach Form). Von oben unlesbar; schaut man ganz flach über das Blatt, wird eine Nachricht lesbar. Formen und Farben wählbar, mit Lösungsblatt.',
  merkmale:['Eigene Wörter und Sätze', 'Bis 8 Blickrichtungen', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/blickwinkel/blickwinkel.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false, Z = Kern.zeichenSatz(window.KettenKern && window.KettenKern.ZEICHEN);
  var TAB = 'blickwinkel-eingaben', OPT = 'blickwinkel-einstellungen';
  // Keine Vorauswahl: Form, Farben und Strichdicke wählt man selbst; Nachrichten brauchen Text und Richtung
  var STANDARD = { form:'', farbmodus:'', dicke:'', tarnung:true, marken:true, linien:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { nachrichten:[{ text:'', richtung:0, farbe:'' }], opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e && Array.isArray(e.nachrichten) && e.nachrichten.length) st.nachrichten = e.nachrichten.slice(0, 8).map(function(n){ return { text:String(n.text || ''), richtung:+n.richtung || 0, farbe:/^#[0-9a-f]{6}$/i.test(n.farbe) ? n.farbe : '' }; }); } catch(x){}
  function gueltig(k, l){ if (!l.some(function(x){ return x[0] === st.opt[k]; })) st.opt[k] = ''; }
  gueltig('form', FORMEN); gueltig('farbmodus', FARBMODI); gueltig('dicke', DICKEN);
  function nR(){ return Kern.anzahl(st.opt.form); }
  // Richtungen, die es bei dieser Form nicht gibt oder doppelt sind, zurücksetzen
  (function(){ var n = nR(), da = []; st.nachrichten.forEach(function(m){ if (m.richtung > n || da.indexOf(m.richtung) >= 0) m.richtung = 0; if (m.richtung) da.push(m.richtung); }); })();
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ nachrichten:st.nachrichten })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#bwMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }
  var warte = 0;
  function baldZeichnen(){ clearTimeout(warte); warte = setTimeout(zeichnen, 300); }

  /* ---------- Nachrichten: Text, «Von wo schaut man?» (Kompass), Farbe ---------- */
  function farbeVon(i){ return st.nachrichten[i].farbe || FARBEN[i % FARBEN.length]; }
  function nachrichtenZeigen(){
    var belegt = st.nachrichten.map(function(n){ return n.richtung; }), N = nR(), MAX = N;
    $('#bwFormZuerst').hidden = !!st.opt.form; $('#bwNachrichtenTeil').hidden = !st.opt.form;
    $('#bwNachrichtenText').textContent = st.opt.form ? 'Bis zu ' + N + ' Wörter oder kurze Sätze – jede aus einer anderen Richtung lesbar.' : 'Wörter oder kurze Sätze – jede aus einer anderen Richtung lesbar.';
    // kleine Form in der Mitte des Kompasses
    var e = Kern.form(st.opt.form), mini = e ? '<path d="' + e.map(function(p, k){ return (k ? 'L' : 'M') + f1(75 + p[0] * 34) + ' ' + f1(75 + p[1] * 34); }).join('') + 'Z"/>' : '<circle cx="75" cy="75" r="34"/>';
    $('#bwNachrichten').innerHTML = st.nachrichten.map(function(n, i){
      return '<div class="bw-nachricht" data-i="' + i + '">' +
        '<div class="bw-nachricht-kopf"><label class="feld-label" for="bwText' + i + '">Nachricht ' + (i + 1) + '</label>' +
          (st.nachrichten.length > 1 ? '<button type="button" class="bw-weg" data-weg="' + i + '" aria-label="Nachricht ' + (i + 1) + ' entfernen">×</button>' : '') + '</div>' +
        '<input type="text" class="bw-text" id="bwText' + i + '" data-i="' + i + '" maxlength="40" autocomplete="off" spellcheck="false" value="' + esc(n.text) + '">' +
        '<div class="bw-stufe"' + (n.text.trim() ? '' : ' hidden') + '><p class="feld-label">Von wo schaut man?</p>' +
          '<div class="bw-kompass" role="radiogroup" aria-label="Blickrichtung für Nachricht ' + (i + 1) + '"><svg viewBox="0 0 150 150" aria-hidden="true">' + mini + '</svg>' +
            Array.apply(null, Array(N)).map(function(_, k){
              var r = k + 1, u = Kern.drehen([0, 1], Kern.winkel(r, N)), weg = belegt.indexOf(r) >= 0 && n.richtung !== r;
              return '<button type="button" class="bw-ri" style="left:' + f1(60 + u[0] * 57) + 'px;top:' + f1(60 + u[1] * 57) + 'px" data-i="' + i + '" data-r="' + r + '" aria-pressed="' + (n.richtung === r) + '"' + (weg ? ' disabled' : '') +
                ' title="von ' + Kern.richtungsName(r, N) + (weg ? ' – schon belegt' : '') + '">' + r + '</button>';
            }).join('') + '</div>' +
          (st.opt.farbmodus === 'nachricht' ? '<label class="bw-farbe"><input type="color" data-farbe="' + i + '" value="' + farbeVon(i) + '"><span>Farbe</span></label>' : '') +
        '</div></div>';
    }).join('');
    $('#bwMehr').hidden = st.nachrichten.length >= MAX;
  }
  $('#bwNachrichten').addEventListener('input', function(ev){
    var t = ev.target;
    if (t.classList.contains('bw-text')){
      var i = +t.getAttribute('data-i'), vorher = !!st.nachrichten[i].text.trim();
      st.nachrichten[i].text = t.value; speichern();
      if (vorher !== !!t.value.trim()){ var stufe = t.parentNode.querySelector('.bw-stufe'); if (stufe) stufe.hidden = !t.value.trim(); }
      baldZeichnen();
    }
    if (t.hasAttribute('data-farbe')){ st.nachrichten[+t.getAttribute('data-farbe')].farbe = t.value; speichern(); baldZeichnen(); }
  });
  $('#bwNachrichten').addEventListener('click', function(ev){
    var r = ev.target.closest('.bw-ri'), w = ev.target.closest('[data-weg]');
    if (r && !r.disabled){ var i = +r.getAttribute('data-i'); st.nachrichten[i].richtung = +r.getAttribute('data-r'); speichern(); nachrichtenZeigen(); zeichnen(); var b = $('.bw-ri[data-i="' + i + '"][data-r="' + r.getAttribute('data-r') + '"]'); if (b) b.focus(); }
    if (w){ st.nachrichten.splice(+w.getAttribute('data-weg'), 1); speichern(); nachrichtenZeigen(); zeichnen(); }
  });
  $('#bwMehr').addEventListener('click', function(){
    if (st.nachrichten.length >= nR()) return;
    st.nachrichten.push({ text:'', richtung:0, farbe:'' }); speichern(); nachrichtenZeigen();
    var f = $('#bwText' + (st.nachrichten.length - 1)); if (f) f.focus();
  });
  function radios(name, k, nachher){
    [].forEach.call(bereich.querySelectorAll('input[name="' + name + '"]'), function(r){
      r.checked = r.value === st.opt[k];
      r.addEventListener('change', function(){ if (r.checked){ st.opt[k] = r.value; speichern(); if (nachher) nachher(); zeichnen(); } });
    });
  }
  var nVorher = nR();
  radios('bwForm', 'form', function(){
    // gleiche Richtung behalten, so gut es geht (nach dem Winkel); doppelte zurücksetzen
    var n = nR(), da = [];
    st.nachrichten.forEach(function(m){
      if (m.richtung){ m.richtung = Math.round((m.richtung - 1) * n / nVorher) % n + 1; if (da.indexOf(m.richtung) >= 0) m.richtung = 0; else da.push(m.richtung); }
    });
    nVorher = n; speichern(); nachrichtenZeigen();
  });
  radios('bwFarbmodus', 'farbmodus', nachrichtenZeigen); radios('bwDicke', 'dicke');
  [['#bwTarnung', 'tarnung'], ['#bwMarken', 'marken'], ['#bwLinien', 'linien'], ['#bwMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#bwZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#bwLoesung').classList.toggle('zeigen', an); $('#bwLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  nachrichtenZeigen();

  /* ---------- Zeichnen ---------- */
  var P = null, T = [], blick = 0;
  // Pfad der Form (Mitte cx, cy, Radius r)
  function formPfad(cx, cy, r){
    var e = Kern.form(st.opt.form);
    if (!e) return 'M' + f1(cx - r) + ' ' + f1(cy) + 'A' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(cx + r) + ' ' + f1(cy) + 'A' + f1(r) + ' ' + f1(r) + ' 0 1 0 ' + f1(cx - r) + ' ' + f1(cy) + 'Z';
    return e.map(function(p, i){ return (i ? 'L' : 'M') + f1(cx + p[0] * r) + ' ' + f1(cy + p[1] * r); }).join('') + 'Z';
  }
  /* Die Nachrichten als Striche, gedreht in ihre Richtung, in der Form. Jede Nachricht liegt in ihrer eigenen Gruppe:
     drehen, dann senkrecht zur Zeile um den Stift-Faktor strecken – so ist der Stift dort dicker (die Punkte werden
     vorher entsprechend gestaucht). ansicht: Richtung, aus der flach geschaut wird (0 = von oben); dann wird alles
     zurückgedreht und in Blickrichtung um die Streckung dieser Nachricht gestaucht. */
  function formSvg(r, ansicht, id){
    // Punkte in Tausendsteln des Radius; die Gruppe skaliert auf r Pixel. Strichdicke gilt für die Form in Originalgrösse (D).
    var cx = r + 30, cy = r + 30, W = 2 * r + 60, dicke = (DICKE[st.opt.dicke] || DICKE.mittel) * 1000 / (D / 2), faktor = r / 1000, t = '';
    P.concat(T).forEach(function(n, i){
      // Tarnlinien: dünner Stift, nicht dicker quer zur Zeile (sie muss niemand lesen)
      var f = n.tarnung ? 1 : Kern.stift(n.satz.streckung), g = '';
      n.satz.striche.forEach(function(s){
        // Tarnlinien nehmen die Farben ihrer Nachricht (sonst verriete die Farbe, was Tarnung ist)
        // basis −1: Tarnung für alle – Wort für Wort abwechselnd in den Farben der Nachrichten
        var b = i, w = s.wort, m = n;
        if (n.tarnung && n.basis < 0){ b = s.wort % P.length; m = P[b]; w = Math.floor(s.wort / P.length) % m.satz.woerter; }
        else if (n.tarnung){ b = n.basis; m = P[b]; w = s.wort % m.satz.woerter; }
        var farbe = st.opt.farbmodus === 'sw' ? TINTE : st.opt.farbmodus === 'wort' ? FARBEN[(b * 3 + w) % FARBEN.length] : farbeVon(m.i);
        g += '<path d="' + s.p.map(function(q, k){ return (k ? 'L' : 'M') + f1(q[0] * 1000) + ' ' + f1(q[1] * 1000 / f); }).join('') + '" stroke="' + farbe + '"/>';
      });
      t += '<g transform="translate(' + f1(cx) + ' ' + f1(cy) + ') rotate(' + f1(n.grad) + ') scale(' + faktor.toFixed(4) + ' ' + (faktor * f).toFixed(4) + ')"' + (n.tarnung ? ' stroke-width="' + f1(dicke * 0.7) + '"' : '') + '>' + g + '</g>';
    });
    var clip = 'bwc' + id, umriss = '<path d="' + formPfad(cx, cy, r) + '" fill="none" stroke="#B9AFA8" stroke-width="1.2"/>';
    var inhalt = '<clipPath id="' + clip + '"><path d="' + formPfad(cx, cy, r) + '"/></clipPath>' +
      '<g clip-path="url(#' + clip + ')" fill="none" stroke-width="' + f1(dicke) + '" stroke-linecap="round" stroke-linejoin="round">' + t + '</g>' + umriss;
    if (ansicht){
      var n = P.filter(function(x){ return x.richtung === ansicht; })[0], s = n ? n.satz.streckung : 5;
      inhalt = '<g transform="translate(' + f1(cx) + ' ' + f1(cy) + ') scale(1 ' + (1 / s).toFixed(4) + ') rotate(' + f1(n ? -n.grad : 0) + ') translate(' + f1(-cx) + ' ' + f1(-cy) + ')">' + inhalt + '</g>';
      var h = 2 * r / s + 24;
      return '<svg class="bw-form" width="' + f1(W) + '" height="' + f1(h) + '" viewBox="0 ' + f1(cy - h / 2) + ' ' + f1(W) + ' ' + f1(h) + '">' + inhalt + '</svg>';
    }
    var marken = '';
    if (st.opt.marken) P.forEach(function(n){
      var u = Kern.drehen([0, 1], n.grad), a = Kern.reichweite(st.opt.form, u) * r + 17, p = [u[0] * a, u[1] * a];
      marken += '<circle cx="' + f1(cx + p[0]) + '" cy="' + f1(cy + p[1]) + '" r="11" fill="#fff" stroke="' + TINTE + '" stroke-width="1.4"/>' +
        '<text x="' + f1(cx + p[0]) + '" y="' + f1(cy + p[1] + 4.5) + '" font-size="13" font-weight="700" text-anchor="middle" fill="' + TINTE + '">' + n.richtung + '</text>';
    });
    return '<svg class="bw-form" width="' + f1(W) + '" height="' + f1(W) + '" viewBox="0 0 ' + f1(W) + ' ' + f1(W) + '">' + inhalt + marken + '</svg>';
  }
  function fehltNoch(){
    if (!st.opt.form) return 'eine Form';
    var mitText = st.nachrichten.filter(function(n){ return n.text.trim(); });
    if (mitText.length > nR()) return 'höchstens ' + nR() + ' Nachrichten – diese Form hat nur ' + nR() + ' Richtungen';
    if (!mitText.length) return 'eine Nachricht (ein Wort oder einen kurzen Satz)';
    if (mitText.some(function(n){ return !n.richtung; })) return 'bei jeder Nachricht, von wo man schaut';
    if (!st.opt.farbmodus) return 'die Farben';
    return '';
  }
  function zeichnen(){
    if (aus) return;
    var o = st.opt, fehlt = fehltNoch(), h = '';
    $('#bwFarbInfo').textContent = o.farbmodus === 'sw' ? 'Alles schwarz – am schwierigsten.' : o.farbmodus === 'wort' ? 'Jedes Wort in einer anderen Farbe – so sieht man, wo Wörter beginnen.' : o.farbmodus === 'nachricht' ? 'Jede Nachricht hat ihre eigene Farbe (bei der Nachricht änderbar).' : '';
    $('#bwDickeInfo').textContent = o.dicke ? '' : 'Noch nichts gewählt: mittel.';
    var weg = [];
    P = [];
    st.nachrichten.forEach(function(n, i){
      if (!n.text.trim() || !n.richtung) return;
      var L = Kern.lesen(n.text, Z); L.weg.forEach(function(c){ if (weg.indexOf(c) < 0) weg.push(c); });
      var gg = Kern.gegenueber(n.richtung, nR()), grad = Kern.winkel(n.richtung, nR());
      var halb = !!gg && st.nachrichten.some(function(m){ return m.text.trim() && m.richtung === gg; });
      var satz = Kern.setzen(L.woerter, Z, Kern.sehne(Kern.kanten(o.form, grad), halb), Kern.STRECKUNG);
      if (satz) P.push({ i:i, richtung:n.richtung, grad:grad, text:L.woerter.join(' '), woerter:L.woerter, satz:satz });
    });
    /* Tarnlinien füllen die ganze Form, schräg zu allen Leserichtungen (Kern.tarnWinkel) – in den Farben aller Nachrichten.
       Beim flachen Blick auf eine Nachricht werden sie zu feinen Strichen. */
    T = [];
    if (o.tarnung && o.form && P.length){
      var rnd = Kern.zufall(Kern.streuwert(P.map(function(n){ return n.richtung + n.text; }).join('|') + o.form));
      Kern.tarnWinkel(P.map(function(n){ return n.grad; })).forEach(function(g){
        var sf = Kern.sehne(Kern.kanten(o.form, g), false), anzahl = Kern.tarnAnzahl(sf, Kern.STRECKUNG), vorlage = [];
        while (anzahl > 0){ var l = Math.min(anzahl, 3 + Math.floor(rnd() * 4)); vorlage.push(new Array(l + 1).join('X')); anzahl -= l; }
        var tz = Kern.tarnung(vorlage, Z, rnd), satz = Kern.setzen(tz.woerter, tz.Z, sf, Kern.STRECKUNG);
        if (satz) T.push({ i:P[0].i, basis:-1, grad:g, satz:satz, tarnung:true });
      });
    }
    $('#bwTarnInfo').textContent = !o.tarnung || !T.length ? '' : (T.length > 1 ? 'Zwei Schichten Tarnlinien' : 'Eine Schicht Tarnlinien') + ', schräg zu den Nachrichten – beim flachen Blick werden sie zu feinen Strichen.';
    if (weg.length) h += '<p class="warnung">' + esc(weg.join(' ')) + ' gibt es nicht – nur Buchstaben, Ziffern und . , ! ? - :</p>';
    // Höhe der Buchstaben beim flachen Blick (Mitte): 6 Rastereinheiten; Radius = 75 mm
    P.forEach(function(n){ var mm = 6 * n.satz.ux * 75; if (mm < 3) h += '<p class="warnung">Nachricht ' + (n.i + 1) + ' ist lang – beim flachen Blick sind die Buchstaben nur etwa ' + mm.toFixed(1) + ' mm hoch. Kürzer ist besser.</p>';
      else if (n.satz.fuellung < 0.5) h += '<p class="bw-info">Tipp: Nachricht ' + (n.i + 1) + ' ist kurz und füllt nur einen schmalen Streifen. Längere Sätze füllen die Form besser.</p>'; });
    $('#bwZaehler').innerHTML = h;
    var leer = !!fehlt || !P.length;
    ['#bwPdf', '#bwHerunterladen', '#bwZeigeLoesung'].forEach(function(s){ $(s).disabled = leer; });
    $('#bwBlick').hidden = leer;
    if (leer){ $('#bwBlatt').parentNode.hidden = true; $('#bwLoesung').classList.remove('zeigen'); meldung('info', '<p>Wähle links ' + (fehlt || 'eine Nachricht') + '.</p>'); return; }
    meldung('', ''); $('#bwBlatt').parentNode.hidden = false;
    var anleitung = 'Halte das Blatt waagrecht auf Augenhöhe, schliesse ein Auge und schau ganz flach darüber' + (o.marken ? ' – von den Zahlen am Rand aus' : '') + '. Dann werden die gestreckten Wörter lesbar. ' +
      (P.length > 1 ? 'Aus jeder Richtung steht etwas anderes. ' : '') + 'Schreibe auf, was du liest.';
    var linien = o.linien ? '<div class="bw-antworten">' + P.slice().sort(function(a, b){ return a.richtung - b.richtung; }).map(function(n){ return '<p class="bw-antwort">' + (o.marken ? '<b>' + n.richtung + '</b>' : '') + '<span class="bw-linie"></span></p>'; }).join('') + '</div>' : '';
    $('#bwBlatt').innerHTML = (o.titelAn ? '<h2>Blickwinkel</h2>' : '') + (o.anleitungAn ? '<p class="bw-anleitung">' + esc(anleitung) + '</p>' : '') +
      '<div class="bw-mitte">' + formSvg(D / 2, 0, 'b') + '</div>' + linien;
    // Lösung: je Nachricht der flache Blick
    $('#bwLoesung').innerHTML = (o.titelAn ? '<h2>Blickwinkel – Lösung</h2>' : '<p class="bw-anleitung"><b>Lösung</b></p>') +
      '<div class="bw-loesungen">' + P.slice().sort(function(a, b){ return a.richtung - b.richtung; }).map(function(n){
        return '<div class="bw-loesung"><p><b>' + n.richtung + '</b> von ' + Kern.richtungsName(n.richtung, nR()) + ': <b>' + esc(n.text) + '</b></p>' + formSvg(280, n.richtung, 'l' + n.richtung) + '</div>';
      }).join('') + '</div>';
    // Am Bildschirm: Blickrichtung wählen
    if (!P.some(function(n){ return n.richtung === blick; })) blick = 0;
    $('#bwBlickWahl').innerHTML = '<label><input type="radio" name="bwBlick" value="0"' + (blick ? '' : ' checked') + '><span>von oben</span></label>' +
      P.slice().sort(function(a, b){ return a.richtung - b.richtung; }).map(function(n){ return '<label><input type="radio" name="bwBlick" value="' + n.richtung + '"' + (blick === n.richtung ? ' checked' : '') + '><span>' + n.richtung + ' · von ' + Kern.richtungsName(n.richtung, nR()) + '</span></label>'; }).join('');
    blickZeigen();
  }
  function blickZeigen(){ $('#bwBlickBild').innerHTML = P && P.length ? formSvg(blick ? 380 : 200, blick, 'v') : ''; }
  $('#bwBlickWahl').addEventListener('change', function(ev){ var r = ev.target.closest('input'); if (!r) return; blick = +r.value; blickZeigen(); });

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [$('#bwBlatt')].concat(st.opt.mitLoesung ? [$('#bwLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#bwPdf'), function(){ return P && P.length && { blaetter:blaetter(), name:Labor.pdfName('Blickwinkel', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#bwPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#bwHerunterladen').hidden = false; });
  }
  $('#bwHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !P || !P.length) return;
    var name = Labor.pdfName('Blickwinkel', '').replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Blickwinkel', inhalt, '.bw-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); clearTimeout(warte); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
