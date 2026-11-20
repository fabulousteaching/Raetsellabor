/* Rätsellabor – Generator «Uhrenrätsel»
   Jede Ziffer besteht aus 2 × 3 Uhren. Unter jeder Uhr steht eine Uhrzeit; die Kinder zeichnen die Zeiger ein und
   verbinden dann die Zeiger, die genau aufeinander zeigen – so entsteht die Ziffer. Die Ziffer wird wie eine
   Sieben-Segment-Ziffer auf den 6 Uhren gebaut: Jeder Strich verbindet zwei benachbarte Uhren, je ein Zeiger zeigt zur
   anderen Uhr. Jede Uhr hat nur zwei Zeiger – darum gehen nur 0, 1, 2, 5 und 7 (bei 3, 4, 6, 8, 9 bräuchte eine Uhr in
   der Mitte drei). Uhren, die nichts zeigen, bekommen eine «schräge» Zeit (beide Zeiger schräg) – sonst verrieten leere
   Uhren die Form. Zeitangabe 3:00, 15:00 oder in Worten. Uhren schwarz-weiss oder farbig. Blatt(e), Lösungsblatt, PDF. */
(function(){
'use strict';

/* KERN-START */
var Kern = (function(){
  // Uhren einer Ziffer: [Spalte, Zeile]; 0 oben links, 1 oben rechts, 2 Mitte links, 3 Mitte rechts, 4 unten links, 5 unten rechts
  var UHREN = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]];
  // Striche (wie bei einer Sieben-Segment-Anzeige): a oben, b rechts oben, c rechts unten, d unten, e links unten, f links oben, g Mitte
  var STRICHE = { a:[0, 1], b:[1, 3], c:[3, 5], d:[4, 5], e:[2, 4], f:[0, 2], g:[2, 3] };
  var ZIFFERN = { '0':'abcdef', '1':'bc', '2':'abged', '3':'abgcd', '4':'fgbc', '5':'afgcd', '6':'afgedc', '7':'abc', '8':'abcdefg', '9':'abcdfg' };
  // Richtungen: o (oben, 12), r (rechts, 3), u (unten, 6), l (links, 9) – als Winkel im Uhrzeigersinn ab 12
  var GRAD = { o:0, r:90, u:180, l:270 };
  function richtung(von, nach){ var a = UHREN[von], b = UHREN[nach]; return b[0] > a[0] ? 'r' : b[0] < a[0] ? 'l' : b[1] > a[1] ? 'u' : 'o'; }
  // Für jede Uhr: in welche Richtungen müssen Zeiger zeigen?
  function richtungen(z){
    var r = UHREN.map(function(){ return []; });
    (ZIFFERN[z] || '').split('').forEach(function(s){ var p = STRICHE[s]; r[p[0]].push(richtung(p[0], p[1])); r[p[1]].push(richtung(p[1], p[0])); });
    return r;
  }
  // Geht die Ziffer mit zwei Zeigern je Uhr? → null oder Grund
  function grund(z){
    var r = richtungen(z), zu = r.map(function(l, i){ return l.length > 2 ? i : -1; }).filter(function(i){ return i >= 0; });
    return zu.length ? zu : null;
  }
  function moeglich(z){ return !!ZIFFERN[z] && !grund(z); }
  // Winkel der Zeiger (Grad ab 12, im Uhrzeigersinn)
  function stundenWinkel(h, m){ return (h % 12) * 30 + m * 0.5; }
  function minutenWinkel(m){ return m * 6; }
  function abstand(a, b){ var d = Math.abs(((a - b) % 360 + 360) % 360); return Math.min(d, 360 - d); }
  // Wie schräg ist ein Winkel? (Abstand zur nächsten Achse 12/3/6/9, 0 … 45)
  function schraeg(a){ var d = ((a % 90) + 90) % 90; return Math.min(d, 90 - d); }
  function nimm(l, rnd){ return l[Math.floor(rnd() * l.length)]; }
  /* Zeit für eine Uhr mit den Richtungen dirs:
     – zwei Richtungen: volle, halbe oder Viertelstunde, der grosse Zeiger auf der einen, der kleine (fast) auf der anderen
       Richtung; die mit der kleinsten Abweichung des kleinen Zeigers (bei :00 genau, :15 7.5°, :30 15°, :45 22.5°)
     – eine Richtung: der grosse Zeiger zeigt hin (:00, :15, :30, :45), der kleine schräg (mindestens 25° neben jeder Achse)
     – keine: beide Zeiger schräg (5-Minuten-Schritte, nie auf 12/3/6/9) – oder null, wenn ohne Ablenkung
     → { h (1–12), m, art } */
  function zeit(dirs, rnd, ablenkung){
    var l = [], h, m;
    if (dirs.length === 2){
      var best = Infinity;
      for (h = 1; h <= 12; h++) [0, 15, 30, 45].forEach(function(m){
        var mw = minutenWinkel(m), hw = stundenWinkel(h, m);
        [[0, 1], [1, 0]].forEach(function(p){
          if (abstand(mw, GRAD[dirs[p[0]]]) > 0.01) return;
          var ab = abstand(hw, GRAD[dirs[p[1]]]);
          if (ab > 23) return;
          if (ab < best - 0.01){ best = ab; l = []; }
          if (ab <= best + 0.01) l.push({ h:h, m:m, art:'zwei' });
        });
      });
      return l.length ? nimm(l, rnd) : null;
    }
    if (dirs.length === 1){
      m = { o:0, r:15, u:30, l:45 }[dirs[0]];
      for (h = 1; h <= 12; h++) if (schraeg(stundenWinkel(h, m)) >= 25) l.push({ h:h, m:m, art:'eins' });
      return nimm(l, rnd);
    }
    if (!ablenkung) return null;
    for (h = 1; h <= 12; h++) [5, 10, 20, 25, 35, 40, 50, 55].forEach(function(m){ if (schraeg(stundenWinkel(h, m)) >= 25) l.push({ h:h, m:m, art:'leer' }); });
    return nimm(l, rnd);
  }
  // Alle Uhren einer Zahl (mehrere Ziffern) → [{ ziffer, uhren:[{ dirs, zeit }] }]
  function planen(code, rnd, ablenkung){
    return String(code).split('').map(function(z){
      return { ziffer:z, uhren:richtungen(z).map(function(d){ return { dirs:d, zeit:zeit(d, rnd, ablenkung) }; }) };
    });
  }
  /* Zeit als Text: '12' → 3:05, '24' → 15:05 (Nachmittag zufällig, aber fest je Uhr: nachmittags), 'worte' → «fünf nach drei» */
  var ZAHL = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
  function stundeWort(h){ return ZAHL[((h - 1) % 12 + 12) % 12 + 1]; }
  function text(z, art, nachmittags){
    var h = z.h, m = z.m, mm = (m < 10 ? '0' : '') + m;
    if (art === '24'){ var hh = nachmittags ? (h % 12) + 12 : h; return hh + ':' + mm; }
    if (art !== 'worte') return h + ':' + mm;
    var n = stundeWort(h + 1);
    switch (m){
      case 0: return (h % 12 === 1 ? 'ein' : stundeWort(h)) + ' Uhr';
      case 5: return 'fünf nach ' + stundeWort(h);
      case 10: return 'zehn nach ' + stundeWort(h);
      case 15: return 'Viertel nach ' + stundeWort(h);
      case 20: return 'zwanzig nach ' + stundeWort(h);
      case 25: return 'fünf vor halb ' + n;
      case 30: return 'halb ' + n;
      case 35: return 'fünf nach halb ' + n;
      case 40: return 'zwanzig vor ' + n;
      case 45: return 'Viertel vor ' + n;
      case 50: return 'zehn vor ' + n;
      case 55: return 'fünf vor ' + n;
    }
    return h + ':' + mm;
  }
  function zufall(seed){ var a = seed >>> 0; return function(){ a = (a + 0x6D2B79F5) >>> 0; var t = a; t = Math.imul(t ^ t >>> 15, t | 1); t ^= t + Math.imul(t ^ t >>> 7, t | 61); return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  return { UHREN:UHREN, STRICHE:STRICHE, ZIFFERN:ZIFFERN, GRAD:GRAD, richtungen:richtungen, grund:grund, moeglich:moeglich, stundenWinkel:stundenWinkel,
    minutenWinkel:minutenWinkel, abstand:abstand, schraeg:schraeg, zeit:zeit, planen:planen, text:text, zufall:zufall };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', B = 639, MM = 703 / 186, MAX = 4;
// Farben der Uhren (Rand) – das Zifferblatt bekommt einen hellen Hauch davon
var UHRFARBEN = ['#E53935', '#FB8C00', '#F2B705', '#43A047', '#00897B', '#1E88E5', '#3949AB', '#8E24AA', '#D81B60'];
var ARTEN = [['12', '3:00'], ['24', '15:00'], ['worte', 'in Worten']];
var LOESUNGSFARBE = '#F28C38';
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
function hell(hex, anteil){ var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
  function k(c){ return Math.round(c * anteil + 255 * (1 - anteil)); } return 'rgb(' + k(r) + ',' + k(g) + ',' + k(b) + ')'; }

var VORLAGE = '<div class="ur">' +
  '<header class="ur-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Uhrenrätsel</h1>' +
    '<p>Zeiger einzeichnen, dann die Zeiger verbinden, die aufeinander zeigen – und eine Zahl erscheint.</p></header>' +
  '<div class="ur-layout"><section class="ur-eingabe" aria-label="Eingaben">' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Zahl</h2><p>Ziffern antippen – 1 bis 4. Jede Ziffer besteht aus 6 Uhren.</p></div></div>' +
      '<div class="ur-ziffern" id="urZiffern"></div>' +
      '<p class="hinweis">Möglich sind 0, 1, 2, 5 und 7: Jede Uhr hat nur zwei Zeiger – bei 3, 4, 6, 8 und 9 bräuchte eine Uhr in der Mitte drei.</p>' +
      '<div class="ur-gewaehlt" id="urGewaehlt" aria-live="polite"></div>' +
      '<div class="ur-zeile"><button type="button" class="btn klein" id="urZurueck">⌫ Letzte weg</button><button type="button" class="btn klein" id="urLeeren">Leeren</button><button type="button" class="btn klein" id="urZufall">Zufällige Zahl</button></div>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Uhrzeit</h2><p>So steht die Zeit unter jeder Uhr.</p></div></div>' +
      '<div class="ur-chips" role="radiogroup" aria-label="Zeitangabe">' + ARTEN.map(function(a){ return '<label><input type="radio" name="urArt" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
      '<p class="hinweis" id="urArtInfo"></p>' +
    '</div>' +
    '<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Uhren und Blatt</h2></div></div>' +
      '<label class="opt"><input type="checkbox" id="urFarbig"><span>Farbige Uhren</span></label>' +
      '<label class="opt"><input type="checkbox" id="urZahlen"><span>Zahlen 1–12 auf den Uhren</span></label>' +
      '<label class="opt"><input type="checkbox" id="urAblenkung"><span>Auch Uhren, die nichts zeigen, bekommen eine Zeit (beide Zeiger schräg) – sonst verraten leere Uhren die Zahl</span></label>' +
      '<label class="opt"><input type="checkbox" id="urLinie"><span>Linie für die Lösung</span></label>' +
    '</div>' +
  '</section>' +
  '<section class="ur-ausgabe" aria-label="Ergebnis">' +
    '<div id="urMeldung" aria-live="polite"></div>' +
    '<div class="ur-werkzeug">' +
      '<button type="button" class="btn klein" id="urZeigeLoesung" aria-pressed="false">Lösung zeigen</button>' +
      '<button type="button" class="btn klein" id="urNeu" title="Andere Uhrzeiten für dieselbe Zahl">Neue Zeiten</button>' +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      '<label><input type="checkbox" id="urMitLoesung"> mit Lösungsblatt</label>' +
      '<button type="button" class="btn klein primary" id="urPdf">PDF herunterladen</button>' +
      '<button type="button" class="btn klein primary" id="urHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>' +
    '</div>' +
    '<div class="ur-blaetter"><div class="ur-seiten" id="urSeiten"></div>' +
    '<div class="ur-rahmen ur-loesung-rahmen"><article class="ur-blatt ur-loesungsblatt" id="urLoesung" aria-hidden="true"></article></div></div>' +
  '</section></div></div>';

var SYMBOL = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">' +
  '<circle cx="7" cy="7" r="4.5"/><circle cx="17" cy="7" r="4.5"/><circle cx="7" cy="17" r="4.5"/><circle cx="17" cy="17" r="4.5"/>' +
  '<path d="M7 7h10M17 7v10" stroke-width="1.6"/></svg>';

Labor.registriere({
  id:'uhrenraetsel',
  titel:'Uhrenrätsel',
  kurz:'Zeiger einzeichnen und verbinden – eine Zahl erscheint',
  beschreibung:'Je 6 Uhren bilden eine Ziffer: Zeiten lesen, Zeiger einzeichnen, die Zeiger verbinden, die aufeinander zeigen – und die Zahl erscheint. Zeit als 3:00, 15:00 oder in Worten, Uhren farbig oder schwarz-weiss, mit Lösungsblatt.',
  merkmale:['Uhrzeit lesen', 'Ziffern 0, 1, 2, 5, 7', 'Mit Lösungsblatt'],
  symbol:SYMBOL,
  css:'raetsel/uhren/uhren.css',
  html:VORLAGE,
  start:starte
});

/* ===== Bedienung ===== */
function starte(bereich){
  var $ = function(s){ return bereich.querySelector(s); }, aus = false;
  var TAB = 'uhrenraetsel-eingaben', OPT = 'uhrenraetsel-einstellungen';
  // Keine Vorauswahl: Zahl und Zeitangabe wählt man selbst
  var STANDARD = { art:'', farbig:false, zahlen:true, ablenkung:true, linie:true, mitLoesung:true, titelAn:true, anleitungAn:true };
  var st = { code:'', seed:Math.floor(Math.random() * 1e9), opt:Object.assign({}, STANDARD) };
  try { var o = JSON.parse(localStorage.getItem(OPT)); if (o) Object.assign(st.opt, o); } catch(x){}
  try { var e = JSON.parse(sessionStorage.getItem(TAB)); if (e){ st.code = String(e.code || '').split('').filter(Kern.moeglich).slice(0, MAX).join(''); st.seed = +e.seed || st.seed; } } catch(x){}
  if (!ARTEN.some(function(a){ return a[0] === st.opt.art; })) st.opt.art = '';
  var timer = 0;
  function speichernJetzt(){ clearTimeout(timer); timer = 0;
    try { sessionStorage.setItem(TAB, JSON.stringify({ code:st.code, seed:st.seed })); } catch(x){}
    try { localStorage.setItem(OPT, JSON.stringify(st.opt)); } catch(x){} }
  function speichern(){ clearTimeout(timer); timer = setTimeout(speichernJetzt, 200); }
  function meldung(art, html){ $('#urMeldung').innerHTML = html ? '<div class="meldung ' + art + '">' + html + '</div>' : ''; }

  /* ---------- Ziffern antippen ---------- */
  $('#urZiffern').innerHTML = '0123456789'.split('').map(function(z){
    var ok = Kern.moeglich(z);
    return '<button type="button" class="ur-ziffer' + (ok ? '' : ' nie') + '" data-z="' + z + '"' + (ok ? ' title="' + z + ' anhängen"' : ' disabled title="' + z + ' geht nicht – eine Uhr bräuchte drei Zeiger"') + '>' + z + '</button>';
  }).join('');
  function gewaehltZeigen(){
    $('#urGewaehlt').innerHTML = st.code ? 'Zahl: <b>' + st.code.split('').join(' ') + '</b>' + (st.code.length >= MAX ? ' <span class="ur-voll">(höchstens ' + MAX + ' Ziffern)</span>' : '') : 'Noch keine Ziffer gewählt.';
    $('#urZurueck').disabled = $('#urLeeren').disabled = !st.code;
    [].forEach.call(bereich.querySelectorAll('.ur-ziffer'), function(b){ if (Kern.moeglich(b.getAttribute('data-z'))) b.disabled = st.code.length >= MAX; });
  }
  $('#urZiffern').addEventListener('click', function(ev){
    var b = ev.target.closest('.ur-ziffer'); if (!b || b.disabled || st.code.length >= MAX) return;
    st.code += b.getAttribute('data-z'); speichern(); gewaehltZeigen(); zeichnen();
  });
  $('#urZurueck').addEventListener('click', function(){ st.code = st.code.slice(0, -1); speichern(); gewaehltZeigen(); zeichnen(); });
  $('#urLeeren').addEventListener('click', function(){ st.code = ''; speichern(); gewaehltZeigen(); zeichnen(); });
  $('#urZufall').addEventListener('click', function(){
    var l = '01257', n = 2 + Math.floor(Math.random() * 3), c = '';
    for (var i = 0; i < n; i++) c += l[Math.floor(Math.random() * l.length)];
    if (n > 1 && c[0] === '0') c = '1' + c.slice(1);
    st.code = c; st.seed = Math.floor(Math.random() * 1e9); speichern(); gewaehltZeigen(); zeichnen();
  });
  [].forEach.call(bereich.querySelectorAll('input[name="urArt"]'), function(r){
    r.checked = r.value === st.opt.art;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.art = r.value; speichern(); zeichnen(); } });
  });
  [['#urFarbig', 'farbig'], ['#urZahlen', 'zahlen'], ['#urAblenkung', 'ablenkung'], ['#urLinie', 'linie'], ['#urMitLoesung', 'mitLoesung']].forEach(function(x){
    $(x[0]).checked = !!st.opt[x[1]];
    $(x[0]).addEventListener('change', function(){ st.opt[x[1]] = this.checked; speichern(); if (x[1] !== 'mitLoesung') zeichnen(); });
  });
  Labor.blattSchalter(bereich, st.opt, function(){ speichern(); zeichnen(); });
  $('#urNeu').addEventListener('click', function(){ st.seed = Math.floor(Math.random() * 1e9); speichern(); zeichnen(); });
  $('#urZeigeLoesung').addEventListener('click', function(){
    var an = this.getAttribute('aria-pressed') !== 'true'; this.setAttribute('aria-pressed', an ? 'true' : 'false');
    $('#urLoesung').classList.toggle('zeigen', an); $('#urLoesung').setAttribute('aria-hidden', an ? 'false' : 'true');
  });
  gewaehltZeigen();

  /* ---------- Uhr zeichnen ---------- */
  // Uhr mit Mitte (x, y) und Radius r; farbe: Randfarbe oder null
  function uhr(x, y, r, farbe){
    var rand = farbe || '#2E2A27', blatt = farbe ? hell(farbe, 0.07) : '#FFFFFF', t = '';
    t += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.96) + '" fill="' + blatt + '" stroke="' + rand + '" stroke-width="' + f1(r * 0.08) + '"/>';
    t += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.87) + '" fill="none" stroke="' + rand + '" stroke-opacity="0.22" stroke-width="' + f1(Math.max(0.6, r * 0.012)) + '"/>';
    // Minutenstriche fein, Stundenstriche kräftig (12, 3, 6, 9 am kräftigsten)
    var d = '', dh = '', dq = '';
    for (var i = 0; i < 60; i++){
      var w = i * 6 * Math.PI / 180, s = Math.sin(w), c = -Math.cos(w), innen = i % 15 === 0 ? 0.68 : i % 5 === 0 ? 0.72 : 0.8, aussen = 0.85;
      var seg = 'M' + f1(x + s * r * innen) + ' ' + f1(y + c * r * innen) + 'L' + f1(x + s * r * aussen) + ' ' + f1(y + c * r * aussen);
      if (i % 15 === 0) dq += seg; else if (i % 5 === 0) dh += seg; else d += seg;
    }
    t += '<path d="' + d + '" stroke="#A39A93" stroke-width="' + f1(Math.max(0.5, r * 0.014)) + '"/>';
    t += '<path d="' + dh + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.03) + '" stroke-linecap="round"/>';
    t += '<path d="' + dq + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.045) + '" stroke-linecap="round"/>';
    if (st.opt.zahlen){
      var g = r * 0.17;
      for (var h = 1; h <= 12; h++){
        var a = h * 30 * Math.PI / 180;
        t += '<text x="' + f1(x + Math.sin(a) * r * 0.53) + '" y="' + f1(y - Math.cos(a) * r * 0.53 + g * 0.36) + '" font-size="' + f1(g) + '" font-weight="700" text-anchor="middle" fill="' + TINTE + '">' + h + '</text>';
      }
    }
    return t;
  }
  // Zeiger und Mittelpunkt (für die Lösung über den Verbindungen)
  function zeiger(x, y, r, farbe, zeit){
    var t = '';
    if (zeit){
      var hw = Kern.stundenWinkel(zeit.h, zeit.m) * Math.PI / 180, mw = Kern.minutenWinkel(zeit.m) * Math.PI / 180;
      t += '<path d="M' + f1(x) + ' ' + f1(y) + 'L' + f1(x + Math.sin(hw) * r * 0.48) + ' ' + f1(y - Math.cos(hw) * r * 0.48) + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.075) + '" stroke-linecap="round"/>';
      t += '<path d="M' + f1(x) + ' ' + f1(y) + 'L' + f1(x + Math.sin(mw) * r * 0.76) + ' ' + f1(y - Math.cos(mw) * r * 0.76) + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.045) + '" stroke-linecap="round"/>';
    }
    t += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.055) + '" fill="' + (farbe || TINTE) + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.015) + '"/>';
    return t;
  }
  // Zeit unter der Uhr (auf die Breite eingepasst)
  function etikett(x, y, breite, txt, gr){
    var g = Math.min(gr, breite / Math.max(1, txt.length * 0.56));
    return '<text x="' + f1(x) + '" y="' + f1(y + g * 0.36) + '" font-size="' + f1(g) + '" font-weight="700" text-anchor="middle" fill="' + TINTE + '">' + esc(txt) + '</text>';
  }
  /* Ziffern (Plan-Teile) als SVG: d = Durchmesser der Uhr, gx = Lücke zwischen den Spalten einer Ziffer, G = Lücke zwischen
     Ziffern, zeile = Abstand der Zeilen; loesung: Zeiger und Verbindungen */
  function ziffernSvg(teile, start, d, gx, G, zeile, loesung, farben){
    var r = d / 2, breite = teile.length * (2 * d + gx) + (teile.length - 1) * G, x0 = (B - breite) / 2, hoehe = 3 * zeile, t = '', unten = '', oben = '';
    teile.forEach(function(Zf, k){
      var xz = x0 + k * (2 * d + gx + G);
      function mitte(u){ var p = Kern.UHREN[u]; return [xz + r + p[0] * (d + gx), r + 4 + p[1] * zeile]; }
      if (loesung) (Kern.ZIFFERN[Zf.ziffer] || '').split('').forEach(function(s){
        var p = Kern.STRICHE[s], a = mitte(p[0]), b = mitte(p[1]);
        unten += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1]) + '" stroke="' + LOESUNGSFARBE + '" stroke-opacity="0.55" stroke-width="' + f1(d * 0.13) + '" stroke-linecap="round"/>';
      });
      Zf.uhren.forEach(function(U, u){
        var m = mitte(u), farbe = st.opt.farbig ? farben[(start + k) * 6 + u] : null;
        t += uhr(m[0], m[1], r, farbe);
        oben += zeiger(m[0], m[1], r, farbe, loesung ? U.zeit : null);
        oben += etikett(m[0], m[1] + r + Math.max(10, d * 0.1), d + gx - 4, U.zeit ? Kern.text(U.zeit, st.opt.art, U.nachmittags) : '–', Math.max(11, d * 0.12));
      });
    });
    return '<svg class="ur-uhren" width="' + B + '" height="' + f1(hoehe) + '" viewBox="0 0 ' + B + ' ' + f1(hoehe) + '"><g fill="none">' + t + '</g>' + unten + oben + '</svg>';
  }
  function fehltNoch(){
    if (!st.code) return 'eine Zahl (Ziffern antippen)';
    if (!st.opt.art) return 'die Zeitangabe (3:00, 15:00 oder in Worten)';
    return '';
  }
  var PLAN = null;
  function zeichnen(){
    if (aus) return;
    var o = st.opt, fehlt = fehltNoch();
    $('#urArtInfo').textContent = o.art === '24' ? 'Vormittags und nachmittags gemischt (3:00 oder 15:00 – die Zeiger stehen gleich).' : o.art === 'worte' ? 'Zum Beispiel «Viertel nach drei», «halb vier», «zehn vor vier».' : '';
    ['#urPdf', '#urHerunterladen', '#urZeigeLoesung', '#urNeu'].forEach(function(s){ $(s).disabled = !!fehlt; });
    if (fehlt){ PLAN = null; $('#urSeiten').innerHTML = ''; $('#urLoesung').parentNode.hidden = true; $('#urLoesung').classList.remove('zeigen'); meldung('info', '<p>Wähle links ' + fehlt + '.</p>'); return; }
    meldung('', ''); $('#urLoesung').parentNode.hidden = false;
    var rnd = Kern.zufall(st.seed);
    PLAN = Kern.planen(st.code, rnd, o.ablenkung);
    PLAN.forEach(function(Zf){ Zf.uhren.forEach(function(U){ U.nachmittags = rnd() < 0.5; }); });
    // Farben: gemischt, nebeneinander nie gleich
    var farben = [], vor = '';
    for (var i = 0; i < PLAN.length * 6; i++){ var f; do { f = UHRFARBEN[Math.floor(rnd() * UHRFARBEN.length)]; } while (f === vor || (i >= 2 && f === farben[i - 2])); farben.push(f); vor = f; }
    var anleitung = 'Zeichne bei jeder Uhr die Zeiger ein: den kurzen Stundenzeiger und den langen Minutenzeiger. Verbinde dann mit dem Lineal die Zeiger von zwei Uhren, die genau aufeinander zeigen. ' +
      (PLAN.length > 1 ? 'Welche Zahl entsteht?' : 'Welche Ziffer entsteht?');
    // Blätter: höchstens zwei Ziffern je Seite (1 Ziffer: Uhren 52 mm, 2 Ziffern: 34 mm)
    var html = '', seiten = [];
    for (var s = 0; s < PLAN.length; s += 2) seiten.push(PLAN.slice(s, s + 2));
    seiten.forEach(function(teile, si){
      var eins = teile.length === 1 && PLAN.length === 1, d = (eins ? 52 : 34) * MM, gx = (eins ? 16 : 6) * MM, G = 13 * MM, zeile = d + (eins ? 15 : 12) * MM;
      var kopf = si === 0 ? (o.titelAn ? '<h2>Uhrenrätsel</h2>' : '') + (o.anleitungAn ? '<p class="ur-anleitung">' + esc(anleitung) + '</p>' : '')
        : '<p class="ur-seitenkopf">Uhrenrätsel – Seite ' + (si + 1) + ' von ' + seiten.length + '</p>';
      var fuss = si === seiten.length - 1 && o.linie ? '<p class="ur-antwort">' + (PLAN.length > 1 ? 'Zahl' : 'Ziffer') + ': ' + PLAN.map(function(){ return '<span class="ur-kaestchen"></span>'; }).join('') + '</p>' : '';
      html += '<div class="ur-rahmen"><article class="ur-blatt ur-seite">' + kopf + ziffernSvg(teile, si * 2, d, gx, G, zeile, false, farben) + fuss + '</article></div>';
    });
    $('#urSeiten').innerHTML = html;
    // Lösung: alle Ziffern auf einer Seite (bis 2 je Zeile)
    var lh = '';
    for (var z = 0; z < PLAN.length; z += 2){
      var teile = PLAN.slice(z, z + 2), d2 = (PLAN.length === 1 ? 40 : PLAN.length === 2 ? 30 : 25) * MM;
      lh += ziffernSvg(teile, z, d2, 5 * MM, 13 * MM, d2 + 9 * MM, true, farben);
    }
    $('#urLoesung').innerHTML = (o.titelAn ? '<h2>Uhrenrätsel – Lösung</h2>' : '<p class="ur-anleitung"><b>Lösung</b></p>') + lh +
      '<p class="ur-loesung-text">' + (PLAN.length > 1 ? 'Zahl' : 'Ziffer') + ': <b>' + esc(st.code) + '</b></p>';
  }

  /* ---------- PDF, Herunterladen ---------- */
  function blaetter(){ return [].slice.call(bereich.querySelectorAll('#urSeiten .ur-blatt')).concat(st.opt.mitLoesung ? [$('#urLoesung')] : []); }
  function druckVorbereiten(){ document.body.classList.toggle('mit-loesung', !!st.opt.mitLoesung); }
  window.addEventListener('beforeprint', druckVorbereiten);
  function fehler(t){ meldung('fehler', '<p>' + esc(t) + '</p>'); }
  Labor.pdfKnopf($('#urPdf'), function(){ return PLAN && { blaetter:blaetter(), name:Labor.pdfName('Uhrenraetsel', '') }; }, fehler);
  var speicherOrt = null;
  if (Labor.imArtefakt()){
    $('#urPdf').hidden = true;
    Labor.claude('downloads').then(function(d){ if (!d || aus) return; speicherOrt = d; $('#urHerunterladen').hidden = false; });
  }
  $('#urHerunterladen').addEventListener('click', function(){
    if (!speicherOrt || !PLAN) return;
    var name = Labor.pdfName('Uhrenraetsel', '').replace(/\.pdf$/, '.html');
    var inhalt = blaetter().map(function(b, i){ var k = b.cloneNode(true); k.removeAttribute('id'); k.removeAttribute('aria-hidden'); k.classList.remove('zeigen'); if (i) k.classList.add('neue-seite'); return k.outerHTML; }).join('');
    speicherOrt.save({ filename:name, data:Labor.blattDatei('Uhrenrätsel', inhalt, '.ur-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', '<p>Das Speichern hat nicht geklappt' + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
