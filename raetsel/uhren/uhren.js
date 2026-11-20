/* Rätsellabor – Generator «Uhrenrätsel»
   Jede Ziffer besteht aus 2 × 3 Uhren. Die gebrauchten Uhren bekommen eine Uhrzeit; die Kinder zeichnen die Zeiger ein
   und verbinden dann die Zeiger, die genau aufeinander zeigen – so entsteht die Ziffer. Jeder Strich verbindet zwei
   benachbarte Uhren (wie bei einer Sieben-Segment-Anzeige, dazu ein schräger Strich), je ein Zeiger zeigt zur anderen.
   Jede Uhr hat nur zwei Zeiger – darum gehen 0, 1, 2, 3, 4, 5 und 7, aber nie 6, 8, 9 (dort treffen sich drei Striche in
   einer Uhr). Alle 6 Uhren bleiben auf dem Blatt, nur die gebrauchten haben eine Zeit. Auf Wunsch gedrehte Zifferblätter
   (schwieriger). Zeit als 3:00, 15:00, in Worten, Englisch oder Französisch – unter der Uhr oder auf farbigen
   Digitalweckern zum Ausschneiden (Wecker und Uhr haben dieselbe Farbe, schwarz-weiss dieselbe Nummer). Alle Uhren auf
   einem Blatt (kleiner, je mehr Ziffern), Lösungsblatt, PDF. */
(function(){
'use strict';
var tx = Labor.uebersetzer('uhrenraetsel');

/* KERN-START */
var Kern = (function(){
  // Uhren einer Ziffer: [Spalte, Zeile]; 0 oben links, 1 oben rechts, 2 Mitte links, 3 Mitte rechts, 4 unten links, 5 unten rechts.
  // Die Uhren stehen in einem quadratischen Raster – so liegen schräge Striche genau auf 45°.
  var UHREN = [[0, 0], [1, 0], [0, 1], [1, 1], [0, 2], [1, 2]];
  /* Striche wie bei einer Sieben-Segment-Anzeige (a oben, b rechts oben, c rechts unten, d unten, e links unten,
     f links oben, g Mitte) und ein schräger: h von oben rechts zur Mitte links */
  var STRICHE = { a:[0, 1], b:[1, 3], c:[3, 5], d:[4, 5], e:[2, 4], f:[0, 2], g:[2, 3], h:[1, 2] };
  /* Ziffern: 3 mit flachem Kopf (oben, schräg zur Mitte, Bogen unten), 4 mit schrägem Strich (schräg, Querstrich,
     nach unten). 6, 8 und 9 gehen nicht: Dort treffen sich drei (bei 8 vier) Striche in einer Uhr. */
  var ZIFFERN = { '0':'abcdef', '1':'bc', '2':'abged', '3':'ahgcd', '4':'hgc', '5':'afgcd', '6':'afgedc', '7':'abc', '8':'abcdefg', '9':'abcdfg' };
  // Richtung von einer Uhr zur anderen: Winkel im Uhrzeigersinn ab oben (12)
  function richtung(von, nach){ var a = UHREN[von], b = UHREN[nach]; return ((Math.atan2(b[0] - a[0], a[1] - b[1]) * 180 / Math.PI) % 360 + 360) % 360; }
  // Für jede Uhr: in welche Richtungen (Winkel) müssen Zeiger zeigen?
  function richtungen(z){
    var r = UHREN.map(function(){ return []; });
    (ZIFFERN[z] || '').split('').forEach(function(s){ var p = STRICHE[s]; r[p[0]].push(richtung(p[0], p[1])); r[p[1]].push(richtung(p[1], p[0])); });
    return r;
  }
  // Geht die Ziffer mit zwei Zeigern je Uhr? → null oder die Uhren mit zu vielen Strichen
  function grund(z){
    var r = richtungen(z), zu = r.map(function(l, i){ return l.length > 2 ? i : -1; }).filter(function(i){ return i >= 0; });
    return zu.length ? zu : null;
  }
  function moeglich(z){ return !!ZIFFERN[z] && !grund(z); }
  // Winkel der Zeiger auf dem Zifferblatt (Grad ab 12, im Uhrzeigersinn)
  function stundenWinkel(h, m){ return (h % 12) * 30 + m * 0.5; }
  function minutenWinkel(m){ return m * 6; }
  function abstand(a, b){ var d = Math.abs(((a - b) % 360 + 360) % 360); return Math.min(d, 360 - d); }
  // Zeigt ein Zeiger «nirgendwohin»? Mindestens FREI Grad neben jeder Richtung zu einer Nachbaruhr (Vielfache von 45°)
  var FREI = 15, GENAU = 7.5;
  function frei(w){ var d = ((w % 45) + 45) % 45; return d >= FREI && 45 - d >= FREI; }
  /* Zeit (und Drehung des Zifferblatts) für eine Uhr mit den Richtungen dirs (Winkel auf dem Blatt):
     – zwei Richtungen: ein Zeiger genau auf der einen, der andere höchstens GENAU° neben der anderen
     – eine Richtung: der grosse Zeiger zeigt hin (nur wenn es nicht anders geht der kleine), der andere «frei»
     – keine: beide frei (oder null ohne Ablenkung)
     Aufrecht: am liebsten volle, halbe, Viertelstunden, die genauste Lösung. Gedreht (drehen): Zifferblatt um ein
     Vielfaches von 15° gedreht (nie 0°), 5-Minuten-Schritte; zufällig unter den guten Lösungen. → { h, m, dreh, fehler } */
  function zeit(dirs, rnd, o){
    o = o || {};
    if (!dirs.length) return null;
    var drehs = [0], l = [], h, m, i;
    if (o.drehen){ drehs = []; for (i = 15; i < 360; i += 15) drehs.push(i); }
    for (var di = 0; di < drehs.length; di++) for (h = 1; h <= 12; h++) for (m = 0; m < 60; m += 5){
      var dr = drehs[di], hw = stundenWinkel(h, m) + dr, mw = minutenWinkel(m) + dr, f = -1;
      if (dirs.length === 2){
        if (abstand(mw, dirs[0]) < 0.01) f = abstand(hw, dirs[1]);
        else if (abstand(mw, dirs[1]) < 0.01) f = abstand(hw, dirs[0]);
        if (f > GENAU) f = -1;
      } else if (dirs.length === 1){
        if (abstand(mw, dirs[0]) < 0.01 && frei(hw)) f = 0;
        else if (abstand(hw, dirs[0]) <= GENAU && frei(mw)) f = 100 + abstand(hw, dirs[0]);   // kleiner Zeiger zeigt hin: nur, wenn es nicht anders geht
      }
      if (f < 0) continue;
      // Punkte: Abweichung, dazu (aufrecht) Strafe für 5-Minuten-Zeiten bei Uhren mit Strichen
      var punkte = f + (m % 15 && dirs.length ? (o.drehen ? 1 : 6) : 0);
      l.push({ h:h, m:m, dreh:dr, fehler:f, punkte:punkte });
    }
    if (!l.length) return null;
    // Zeigt bei einer Uhr mit nur einem Strich der grosse Zeiger hin, kommt der kleine Zeiger als Zeiger zum Strich nicht in Frage
    if (l.some(function(x){ return x.fehler < 100; })) l = l.filter(function(x){ return x.fehler < 100; });
    var min = Math.min.apply(null, l.map(function(x){ return x.punkte; }));
    var gut = l.filter(function(x){ return x.punkte <= min + (o.drehen ? 6 : 0.01); });
    return nimm(gut, rnd);
  }
  function nimm(l, rnd){ return l[Math.floor(rnd() * l.length)]; }
  /* Alle Uhren einer Zahl (mehrere Ziffern) → [{ ziffer, uhren:[{ dirs, zeit, dreh }] }]. Alle 6 Uhren bleiben auf dem
     Blatt; nur die gebrauchten bekommen eine Zeit (zeit null: leere Uhr). dreh: Drehung des Zifferblatts. */
  function planen(code, rnd, o){
    o = o || {};
    return String(code).split('').map(function(z){
      return { ziffer:z, uhren:richtungen(z).map(function(d){
        var t = zeit(d, rnd, o);
        return { dirs:d, zeit:t, dreh:t ? t.dreh : o.drehen ? 15 * (1 + Math.floor(rnd() * 23)) : 0 };
      }) };
    });
  }
  /* Zeit als Text: '12' → 3:05, '24' → 15:05 (nachmittags je Uhr gewürfelt), 'worte' → «fünf nach drei»,
     'en' → «five past three», 'fr' → «trois heures cinq» */
  var EN = ['twelve', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  var EN_MIN = { 5:'five', 10:'ten', 15:'quarter', 20:'twenty', 25:'twenty-five' };
  function englisch(h, m){
    var jetzt = EN[h % 12], dann = EN[(h + 1) % 12];
    if (!m) return jetzt + " o'clock";
    if (m === 30) return 'half past ' + jetzt;
    return m < 30 ? EN_MIN[m] + ' past ' + jetzt : EN_MIN[60 - m] + ' to ' + dann;
  }
  var FR = ['midi', 'une heure', 'deux heures', 'trois heures', 'quatre heures', 'cinq heures', 'six heures', 'sept heures', 'huit heures', 'neuf heures', 'dix heures', 'onze heures'];
  var FR_MIN = { 5:'cinq', 10:'dix', 20:'vingt', 25:'vingt-cinq' };
  function franzoesisch(h, m){
    var jetzt = FR[h % 12], dann = FR[(h + 1) % 12];
    if (!m) return jetzt;
    if (m === 15) return jetzt + ' et quart';
    if (m === 30) return jetzt + (h % 12 ? ' et demie' : ' et demi');
    if (m === 45) return dann + ' moins le quart';
    return m < 30 ? jetzt + ' ' + FR_MIN[m] : dann + ' moins ' + FR_MIN[60 - m];
  }
  var ZAHL = ['zwölf', 'eins', 'zwei', 'drei', 'vier', 'fünf', 'sechs', 'sieben', 'acht', 'neun', 'zehn', 'elf', 'zwölf'];
  function stundeWort(h){ return ZAHL[((h - 1) % 12 + 12) % 12 + 1]; }
  function text(z, art, nachmittags){
    var h = z.h, m = z.m, mm = (m < 10 ? '0' : '') + m;
    if (art === '24'){ var hh = nachmittags ? (h % 12) + 12 : h; return hh + ':' + mm; }
    if (art === 'en') return englisch(h, m);
    if (art === 'fr') return franzoesisch(h, m);
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
  return { UHREN:UHREN, STRICHE:STRICHE, ZIFFERN:ZIFFERN, richtung:richtung, richtungen:richtungen, grund:grund, moeglich:moeglich, stundenWinkel:stundenWinkel,
    minutenWinkel:minutenWinkel, abstand:abstand, frei:frei, FREI:FREI, GENAU:GENAU, zeit:zeit, planen:planen, text:text, zufall:zufall };
})();
/* KERN-ENDE */

var TINTE = '#1C1714', B = 639, MM = 703 / 186, MAX = 4;
/* Farben der Uhren (Rand; das Zifferblatt bekommt einen hellen Hauch davon): 24 von Auge gut unterscheidbare Farben,
   nach Unterscheidbarkeit geordnet – zuerst die ganz verschiedenen, dann hellere und dunklere. Bis 12 Farben höchstens
   drei Blau-/Grüntöne (blau, grün, hellblau). Keine Farbe kommt zweimal vor. */
var FARBLISTE = [
  '#E53935', /* rot */ '#1E5BD6', /* blau */ '#F9C80E', /* gelb */ '#2E9E3E', /* grün */ '#F57C00', /* orange */ '#8E24AA', /* lila */
  '#F48FB1', /* rosa */ '#795548', /* braun */ '#222222', /* schwarz */ '#7E7E7E', /* grau */ '#4FC3F7', /* hellblau */ '#D2B48C', /* beige */
  '#8B1A1A', /* weinrot */ '#D81B8C', /* pink */ '#A5D63A', /* hellgrün */ '#1A2A7A', /* dunkelblau */ '#B39DDB', /* flieder */ '#FF9E80', /* lachs */
  '#00A99D', /* türkis */ '#808000', /* oliv */ '#C9971C', /* ocker */ '#1B5E20', /* dunkelgrün */ '#CFCFCF', /* hellgrau */ '#5B3FBF' /* violett */
];
function mischen(l, rnd){ l = l.slice(); for (var i = l.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), x = l[i]; l[i] = l[j]; l[j] = x; } return l; }
/* «In Worten» ist die Sprache der Seite; die beiden anderen Sprachen folgen */
var EIGEN = Labor.sprache === 'en' ? 'en' : Labor.sprache === 'fr' ? 'fr' : 'worte';
var ART_NAME = { worte:tx('Deutsch'), en:tx('Englisch'), fr:tx('Französisch') };
ART_NAME[EIGEN] = tx('in Worten');
var ARTEN = [['12', '3:00'], ['24', '15:00'], [EIGEN, ART_NAME[EIGEN]]].concat(['worte', 'en', 'fr'].filter(function(k){ return k !== EIGEN; }).map(function(k){ return [k, ART_NAME[k]]; }));
var LOESUNGSFARBE = '#0075BA';
function esc(t){ return Labor.esc(t); }
function f1(x){ return (Math.round(x * 10) / 10).toString(); }
function hell(hex, anteil){ var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
  function k(c){ return Math.round(c * anteil + 255 * (1 - anteil)); } return 'rgb(' + k(r) + ',' + k(g) + ',' + k(b) + ')'; }

var VORLAGE = '<div class="ur">' +
  tx('<header class="ur-kopf"><p class="augenbraue">Rätselgenerator</p><h1>Uhrenrätsel</h1>') +
    tx('<p>Zeiger einzeichnen, dann die Zeiger verbinden, die aufeinander zeigen – und eine Zahl erscheint.</p></header>') +
  tx('<div class="ur-layout"><section class="ur-eingabe" aria-label="Eingaben">') +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">1</span><div><h2>Zahl</h2><p>Ziffern antippen – 1 bis 4. Jede Ziffer besteht aus 6 Uhren.</p></div></div>') +
      '<div class="ur-ziffern" id="urZiffern"></div>' +
      tx('<p class="hinweis">Möglich sind 0, 1, 2, 3, 4, 5 und 7 (die 3 mit flachem Kopf und die 4 mit einem schrägen Strich). 6, 8 und 9 gehen nicht: Dort treffen sich drei Striche in einer Uhr – jede Uhr hat aber nur zwei Zeiger.</p>') +
      '<div class="ur-gewaehlt" id="urGewaehlt" aria-live="polite"></div>' +
      tx('<div class="ur-zeile"><button type="button" class="btn klein" id="urZurueck">⌫ Letzte weg</button><button type="button" class="btn klein" id="urLeeren">Leeren</button><button type="button" class="btn klein" id="urZufall">Zufällige Zahl</button></div>') +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">2</span><div><h2>Uhrzeit</h2><p>So steht die Zeit unter der Uhr oder auf dem Wecker.</p></div></div>') +
      tx('<div class="ur-chips" role="radiogroup" aria-label="Zeitangabe">') + ARTEN.map(function(a){ return '<label><input type="radio" name="urArt" value="' + a[0] + '"><span>' + a[1] + '</span></label>'; }).join('') + '</div>' +
      '<p class="hinweis" id="urArtInfo"></p>' +
    '</div>' +
    tx('<div class="karte"><div class="karte-kopf"><span class="stufe" aria-hidden="true">3</span><div><h2>Uhren und Blatt</h2></div></div>') +
      tx('<label class="opt"><input type="checkbox" id="urFarbig"><span>Farbige Uhren (jede Uhr eine eigene Farbe)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="urDrehen"><span>Uhren gedreht – die 12 ist nicht oben (schwieriger; ein Dreieck zeigt die 12)</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="urZahlen"><span>Zahlen 1–12 auf den Uhren</span></label>') +
      tx('<label class="opt"><input type="checkbox" id="urAusschneiden"><span>Zeiten zum Ausschneiden: auf farbigen Digitalweckern statt unter den Uhren – ausschneiden und verteilen</span></label>') +
      '<p class="hinweis" id="urAusschneidenInfo"></p>' +
      tx('<label class="opt"><input type="checkbox" id="urLinie"><span>Linie für die Lösung</span></label>') +
    '</div>' +
  '</section>' +
  tx('<section class="ur-ausgabe" aria-label="Ergebnis">') +
    '<div id="urMeldung" aria-live="polite"></div>' +
    '<div class="ur-werkzeug">' +
      tx('<button type="button" class="btn klein" id="urZeigeLoesung" aria-pressed="false">Lösung zeigen</button>') +
      tx('<button type="button" class="btn klein" id="urNeu" title="Andere Uhrzeiten für dieselbe Zahl">Neue Zeiten</button>') +
      '<span class="abstand"></span>' + Labor.blattSchalterHtml() +
      tx('<label><input type="checkbox" id="urMitLoesung"> mit Lösungsblatt</label>') +
      tx('<button type="button" class="btn klein primary" id="urPdf">PDF herunterladen</button>') +
      tx('<button type="button" class="btn klein primary" id="urHerunterladen" hidden title="Als HTML-Datei speichern, öffnen und drucken">Arbeitsblatt herunterladen</button>') +
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
  merkmale:['Uhrzeit lesen', 'Auch gedrehte Uhren', 'Mit Lösungsblatt'],
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
  var STANDARD = { art:'', farbig:false, drehen:false, zahlen:true, ausschneiden:false, linie:true, mitLoesung:true, titelAn:true, anleitungAn:true };
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
    return '<button type="button" class="ur-ziffer' + (ok ? '' : ' nie') + '" data-z="' + z + '"' + (ok ? ' title="' + esc(tx('{z} anhängen', { z:z })) + '"' : ' disabled title="' + esc(tx('{z} geht nicht – in einer Uhr träfen sich drei Striche', { z:z })) + '"') + '>' + z + '</button>';
  }).join('');
  function gewaehltZeigen(){
    $('#urGewaehlt').innerHTML = st.code ? tx('Zahl:') + ' <b>' + st.code.split('').join(' ') + '</b>' + (st.code.length >= MAX ? ' <span class="ur-voll">' + tx('(höchstens {n} Ziffern)', { n:MAX }) + '</span>' : '') : tx('Noch keine Ziffer gewählt.');
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
    var l = '0123457', n = 2 + Math.floor(Math.random() * 3), c = '';
    for (var i = 0; i < n; i++) c += l[Math.floor(Math.random() * l.length)];
    if (n > 1 && c[0] === '0') c = '1' + c.slice(1);
    st.code = c; st.seed = Math.floor(Math.random() * 1e9); speichern(); gewaehltZeigen(); zeichnen();
  });
  [].forEach.call(bereich.querySelectorAll('input[name="urArt"]'), function(r){
    r.checked = r.value === st.opt.art;
    r.addEventListener('change', function(){ if (r.checked){ st.opt.art = r.value; speichern(); zeichnen(); } });
  });
  [['#urFarbig', 'farbig'], ['#urDrehen', 'drehen'], ['#urZahlen', 'zahlen'], ['#urAusschneiden', 'ausschneiden'], ['#urLinie', 'linie'], ['#urMitLoesung', 'mitLoesung']].forEach(function(x){
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
  // Uhr mit Mitte (x, y) und Radius r; farbe: Randfarbe oder null; dreh: Zifferblatt um so viele Grad gedreht
  function uhr(x, y, r, farbe, dreh){
    var rand = farbe || '#2E2A27', blatt = farbe ? hell(farbe, 0.07) : '#FFFFFF', t = '';
    t += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.96) + '" fill="' + blatt + '" stroke="' + rand + '" stroke-width="' + f1(r * 0.08) + '"/>';
    t += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.87) + '" fill="none" stroke="' + rand + '" stroke-opacity="0.22" stroke-width="' + f1(Math.max(0.6, r * 0.012)) + '"/>';
    // Minutenstriche fein, Stundenstriche kräftig (12, 3, 6, 9 am kräftigsten)
    var d = '', dh = '', dq = '';
    for (var i = 0; i < 60; i++){
      var w = i * 6 * Math.PI / 180, s = Math.sin(w), c = -Math.cos(w), innen = i % 15 === 0 ? 0.68 : i % 5 === 0 ? 0.72 : 0.8, aussen = 0.85;
      var seg = 'M' + f1(x + s * r * innen) + ' ' + f1(y + c * r * innen) + 'L' + f1(x + s * r * aussen) + ' ' + f1(y + c * r * aussen);
      if (i === 0) continue;   // bei der 12 steht ein Dreieck
      if (i % 15 === 0) dq += seg; else if (i % 5 === 0) dh += seg; else d += seg;
    }
    var innen = '<path d="' + d + '" stroke="#A39A93" stroke-width="' + f1(Math.max(0.5, r * 0.014)) + '"/>';
    // Dreieck bei der 12 – so findet man oben auch auf gedrehten Uhren
    innen += '<path d="M' + f1(x) + ' ' + f1(y - r * 0.66) + 'L' + f1(x - r * 0.075) + ' ' + f1(y - r * 0.85) + 'L' + f1(x + r * 0.075) + ' ' + f1(y - r * 0.85) + 'Z" fill="' + (farbe || TINTE) + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.012) + '"/>';
    t += '<g' + (dreh ? ' transform="rotate(' + dreh + ' ' + f1(x) + ' ' + f1(y) + ')"' : '') + '>' + innen;
    t += '<path d="' + dh + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.03) + '" stroke-linecap="round"/>';
    t += '<path d="' + dq + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.045) + '" stroke-linecap="round"/>';
    var zahlenOben = st.opt.zahlen;
    if (zahlenOben){
      var g = r * 0.17;
      for (var h = 1; h <= 12; h++){
        var a = h * 30 * Math.PI / 180;
        t += '<text x="' + f1(x + Math.sin(a) * r * 0.53) + '" y="' + f1(y - Math.cos(a) * r * 0.53 + g * 0.36) + '" font-size="' + f1(g) + '" font-weight="700" text-anchor="middle" fill="' + TINTE + '">' + h + '</text>';
      }
    }
    t += '</g>';
    return t;
  }
  // Zeiger und Mittelpunkt (für die Lösung über den Verbindungen)
  function zeiger(x, y, r, farbe, zeit){
    var t = '';
    if (zeit){
      var hw = (Kern.stundenWinkel(zeit.h, zeit.m) + zeit.dreh) * Math.PI / 180, mw = (Kern.minutenWinkel(zeit.m) + zeit.dreh) * Math.PI / 180;
      t += '<path d="M' + f1(x) + ' ' + f1(y) + 'L' + f1(x + Math.sin(hw) * r * 0.48) + ' ' + f1(y - Math.cos(hw) * r * 0.48) + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.075) + '" stroke-linecap="round"/>';
      t += '<path d="M' + f1(x) + ' ' + f1(y) + 'L' + f1(x + Math.sin(mw) * r * 0.76) + ' ' + f1(y - Math.cos(mw) * r * 0.76) + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.045) + '" stroke-linecap="round"/>';
    }
    t += '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(r * 0.055) + '" fill="' + (farbe || TINTE) + '" stroke="' + TINTE + '" stroke-width="' + f1(r * 0.015) + '"/>';
    return t;
  }
  // Nummer im Kreis (schwarz-weiss zum Ausschneiden: Uhr und Wecker gehören über die Nummer zusammen)
  function nummer(x, y, rr, n){
    return '<circle cx="' + f1(x) + '" cy="' + f1(y) + '" r="' + f1(rr) + '" fill="#fff" stroke="' + TINTE + '" stroke-width="1.3"/>' +
      '<text x="' + f1(x) + '" y="' + f1(y + rr * 0.42) + '" font-size="' + f1(rr * 1.15) + '" font-weight="700" text-anchor="middle" fill="' + TINTE + '">' + n + '</text>';
  }
  // Zeit unter der Uhr (auf die Breite eingepasst)
  function etikett(x, y, breite, txt, gr){
    var g = Math.min(gr, breite / Math.max(1, txt.length * 0.56));
    return '<text x="' + f1(x) + '" y="' + f1(y + g * 0.36) + '" font-size="' + f1(g) + '" font-weight="700" text-anchor="middle" fill="' + TINTE + '">' + esc(txt) + '</text>';
  }
  /* Ziffern (Plan-Teile) als SVG: d = Durchmesser der Uhr, zeile = Abstand der Uhren (waagrecht und senkrecht gleich –
     quadratisches Raster, schräge Striche auf 45°), G = Lücke zwischen Ziffern; loesung: Zeiger und Verbindungen */
  function ziffernSvg(teile, d, zeile, G, loesung){
    var gx = zeile - d, r = d / 2, breite = teile.length * (2 * d + gx) + (teile.length - 1) * G, x0 = (B - breite) / 2, hoehe = 3 * zeile, t = '', unten = '', oben = '';
    teile.forEach(function(Zf, k){
      var xz = x0 + k * (2 * d + gx + G);
      function mitte(u){ var p = Kern.UHREN[u]; return [xz + r + p[0] * (d + gx), r + 4 + p[1] * zeile]; }
      if (loesung) (Kern.ZIFFERN[Zf.ziffer] || '').split('').forEach(function(s){
        var p = Kern.STRICHE[s], a = mitte(p[0]), b = mitte(p[1]);
        unten += '<path d="M' + f1(a[0]) + ' ' + f1(a[1]) + 'L' + f1(b[0]) + ' ' + f1(b[1]) + '" stroke="' + LOESUNGSFARBE + '" stroke-opacity="0.55" stroke-width="' + f1(d * 0.13) + '" stroke-linecap="round"/>';
      });
      Zf.uhren.forEach(function(U, u){
        var m = mitte(u), farbe = st.opt.farbig ? U.farbe : null;
        t += uhr(m[0], m[1], r, farbe, U.dreh);
        oben += zeiger(m[0], m[1], r, farbe, loesung ? U.zeit : null);
        var ty = m[1] + r + Math.max(10, d * 0.1);
        if (U.zeit && (loesung || !st.opt.ausschneiden)) oben += etikett(m[0], ty, d + gx - 4, Kern.text(U.zeit, st.opt.art, U.nachmittags), Math.max(11, d * 0.12));
        else if (st.opt.ausschneiden && !st.opt.farbig) oben += nummer(m[0], ty, Math.max(9, d * 0.09), U.nr);
      });
    });
    return '<svg class="ur-uhren" width="' + B + '" height="' + f1(hoehe) + '" viewBox="0 0 ' + B + ' ' + f1(hoehe) + '"><g fill="none">' + t + '</g>' + unten + oben + '</svg>';
  }
  /* ---------- Digitalwecker zum Ausschneiden ---------- */
  // Sieben-Segment-Ziffern (leicht schräg): Striche a–g wie bei der Uhr-Ziffer
  var SEG = { '0':'abcdef', '1':'bc', '2':'abged', '3':'abgcd', '4':'fgbc', '5':'afgcd', '6':'afgedc', '7':'abc', '8':'abcdefg', '9':'abcdfg' };
  function segZiffer(x, y, w, h, z, dicke, farbe, geist){
    var g = dicke * 0.75, P = { a:[[g, 0], [w - g, 0]], b:[[w, g], [w, h / 2 - g]], c:[[w, h / 2 + g], [w, h - g]], d:[[g, h], [w - g, h]],
      e:[[0, h / 2 + g], [0, h - g]], f:[[0, g], [0, h / 2 - g]], g:[[g, h / 2], [w - g, h / 2]] }, t = '';
    function weg(k){ var p = P[k]; return 'M' + f1(x + p[0][0]) + ' ' + f1(y + p[0][1]) + 'L' + f1(x + p[1][0]) + ' ' + f1(y + p[1][1]); }
    var an = SEG[z] || '', aus = 'abcdefg'.split('').filter(function(k){ return an.indexOf(k) < 0; });
    if (aus.length) t += '<path d="' + aus.map(weg).join('') + '" stroke="' + geist + '" stroke-width="' + f1(dicke) + '" stroke-linecap="round"/>';
    if (an) t += '<path d="' + an.split('').map(weg).join('') + '" stroke="' + farbe + '" stroke-width="' + f1(dicke) + '" stroke-linecap="round"/>';
    return t;
  }
  function dunkel(hex, anteil){ var n = parseInt(hex.slice(1), 16), r = n >> 16, g = n >> 8 & 255, b = n & 255;
    function k(c){ return Math.round(c * (1 - anteil)); } return 'rgb(' + k(r) + ',' + k(g) + ',' + k(b) + ')'; }
  // Ein Wecker auf einem Kärtchen (x, y, Breite W, Höhe H)
  function wecker(x, y, W, H, U){
    var farbe = st.opt.farbig ? U.farbe : '#E9E4DF', rand = st.opt.farbig ? dunkel(U.farbe, 0.28) : TINTE, t = '';
    t += '<rect x="' + f1(x) + '" y="' + f1(y) + '" width="' + f1(W) + '" height="' + f1(H) + '" fill="none" stroke="#A39A93" stroke-width="0.9" stroke-dasharray="5 4"/>';
    var bx = x + W * 0.08, by = y + H * 0.24, bw = W * 0.84, bh = H * 0.56;
    // Schlummertaste, Füsse, Gehäuse
    t += '<rect x="' + f1(x + W * 0.32) + '" y="' + f1(by - H * 0.075) + '" width="' + f1(W * 0.36) + '" height="' + f1(H * 0.11) + '" rx="' + f1(H * 0.04) + '" fill="' + rand + '"/>';
    t += '<rect x="' + f1(bx + bw * 0.1) + '" y="' + f1(by + bh - H * 0.02) + '" width="' + f1(bw * 0.14) + '" height="' + f1(H * 0.09) + '" rx="' + f1(H * 0.03) + '" fill="' + rand + '"/>';
    t += '<rect x="' + f1(bx + bw * 0.76) + '" y="' + f1(by + bh - H * 0.02) + '" width="' + f1(bw * 0.14) + '" height="' + f1(H * 0.09) + '" rx="' + f1(H * 0.03) + '" fill="' + rand + '"/>';
    t += '<rect x="' + f1(bx) + '" y="' + f1(by) + '" width="' + f1(bw) + '" height="' + f1(bh) + '" rx="' + f1(bh * 0.28) + '" fill="' + farbe + '" stroke="' + rand + '" stroke-width="2"/>';
    // Anzeige
    var dx = bx + bw * 0.09, dy = by + bh * 0.17, dw = bw * 0.82, dh = bh * 0.66;
    t += '<rect x="' + f1(dx) + '" y="' + f1(dy) + '" width="' + f1(dw) + '" height="' + f1(dh) + '" rx="' + f1(dh * 0.14) + '" fill="#EEF2E4" stroke="' + rand + '" stroke-width="1.5"/>';
    var txt = Kern.text(U.zeit, st.opt.art, U.nachmittags);
    if (st.opt.art === '12' || st.opt.art === '24'){
      var teile = txt.split(':'), std = teile[0], zif = (std.length < 2 ? ' ' + std : std) + teile[1];
      var zh = dh * 0.62, zw = zh * 0.5, abst = zw * 0.42, dicke = zh * 0.1, breite = 4 * zw + 3 * abst + zw * 0.5;
      var x0 = dx + (dw - breite) / 2, y0 = dy + (dh - zh) / 2, g = '';
      zif.split('').forEach(function(z, k){ var xx = x0 + k * (zw + abst) + (k >= 2 ? zw * 0.5 : 0); g += z === ' ' ? segZiffer(xx, y0, zw, zh, '', dicke, TINTE, '#DCE2D2') : segZiffer(xx, y0, zw, zh, z, dicke, '#1E2A22', '#DCE2D2'); });
      var kx = x0 + 2 * (zw + abst) - abst / 2 + zw * 0.25 - abst * 0.1;
      g += '<circle cx="' + f1(kx) + '" cy="' + f1(y0 + zh * 0.3) + '" r="' + f1(dicke * 0.6) + '" fill="#1E2A22"/><circle cx="' + f1(kx) + '" cy="' + f1(y0 + zh * 0.7) + '" r="' + f1(dicke * 0.6) + '" fill="#1E2A22"/>';
      t += '<g transform="translate(' + f1(dx + dw / 2) + ' ' + f1(dy + dh / 2) + ') skewX(-7) translate(' + f1(-dx - dw / 2) + ' ' + f1(-dy - dh / 2) + ')">' + g + '</g>';
    } else {
      // in Worten: auf eine oder zwei Zeilen verteilt
      var woerter = txt.split(' '), zeilen = [txt];
      if (txt.length > 13 && woerter.length > 1){ var best = null; for (var k = 1; k < woerter.length; k++){ var a = woerter.slice(0, k).join(' '), b = woerter.slice(k).join(' '), mx = Math.max(a.length, b.length); if (!best || mx < best.mx) best = { mx:mx, z:[a, b] }; } zeilen = best.z; }
      var lang = Math.max.apply(null, zeilen.map(function(z){ return z.length; })), gr = Math.min(dh * (zeilen.length > 1 ? 0.34 : 0.42), dw * 0.92 / (lang * 0.55));
      zeilen.forEach(function(z, k){ t += '<text x="' + f1(dx + dw / 2) + '" y="' + f1(dy + dh / 2 + (k - (zeilen.length - 1) / 2) * gr * 1.15 + gr * 0.36) + '" font-size="' + f1(gr) + '" font-weight="700" text-anchor="middle" fill="#1E2A22">' + esc(z) + '</text>'; });
    }
    if (!st.opt.farbig) t += nummer(x + W * 0.1, y + H * 0.13, H * 0.075, U.nr);
    return t;
  }
  /* Wecker-Blatt: alle Wecker auf einem Blatt, gemischt – bis 15 Kärtchen 56 × 44 mm (3 × 5), bis 18 56 × 40 mm (3 × 6),
     sonst 42 × 40 mm (4 × 6, höchstens 24 = 4 Ziffern × 6 Uhren) */
  function weckerSeiten(liste, rnd){
    var l = liste.slice();
    for (var i = l.length - 1; i > 0; i--){ var j = Math.floor(rnd() * (i + 1)), x = l[i]; l[i] = l[j]; l[j] = x; }
    var n = l.length, sp = n <= 18 ? 3 : 4, W = (sp === 3 ? 56 : 42) * MM, H = (n <= 15 ? 44 : 40) * MM, PRO = 24, html = '', seiten = Math.ceil(n / PRO);
    for (var s = 0; s < seiten; s++){
      var teil = l.slice(s * PRO, s * PRO + PRO), zeilen = Math.ceil(teil.length / sp), x0 = (B - sp * W) / 2, t = '';
      teil.forEach(function(U, k){ t += wecker(x0 + (k % sp) * W, 1 + Math.floor(k / sp) * H, W, H, U); });
      html += '<div class="ur-rahmen"><article class="ur-blatt ur-seite ur-weckerblatt">' +
        tx('<p class="ur-seitenkopf">✂ Wecker zum Ausschneiden') + (seiten > 1 ? ' – ' + tx('Seite {i} von {n}', { i:s + 1, n:seiten }) : '') + ' · ' + (st.opt.farbig ? tx('jeder gehört zur Uhr mit der gleichen Farbe') : tx('jeder gehört zur Uhr mit der gleichen Nummer')) + '</p>' +
        '<svg class="ur-wecker" width="' + B + '" height="' + f1(zeilen * H + 2) + '" viewBox="0 0 ' + B + ' ' + f1(zeilen * H + 2) + '">' + t + '</svg></article></div>';
    }
    return html;
  }
  function fehltNoch(){
    if (!st.code) return tx('eine Zahl (Ziffern antippen)');
    if (!st.opt.art) return tx('die Zeitangabe (3:00, 15:00, in Worten, Englisch oder Französisch)');
    return '';
  }
  var PLAN = null;
  function zeichnen(){
    if (aus) return;
    var o = st.opt, fehlt = fehltNoch();
    $('#urArtInfo').textContent = o.art === '24' ? tx('Vormittags und nachmittags gemischt (3:00 oder 15:00 – die Zeiger stehen gleich).') : o.art === 'worte' ? tx('Zum Beispiel «Viertel nach drei», «halb vier», «zehn vor vier».') :
      o.art === 'en' ? tx('Zum Beispiel «quarter past three», «half past three», «ten to four».') : o.art === 'fr' ? tx('Zum Beispiel «trois heures et quart», «trois heures et demie», «quatre heures moins dix».') : '';
    ['#urPdf', '#urHerunterladen', '#urZeigeLoesung', '#urNeu'].forEach(function(s){ $(s).disabled = !!fehlt; });
    if (fehlt){ PLAN = null; $('#urSeiten').innerHTML = ''; $('#urLoesung').parentNode.hidden = true; $('#urLoesung').classList.remove('zeigen'); meldung('info', '<p>' + tx('Wähle links {x}.', { x:fehlt }) + '</p>'); return; }
    meldung('', ''); $('#urLoesung').parentNode.hidden = false;
    var rnd = Kern.zufall(st.seed);
    PLAN = Kern.planen(st.code, rnd, { drehen:o.drehen });
    // Farben: jede Uhr eine eigene – keine Farbe zweimal; Nummern der Reihe nach (für schwarz-weiss zum Ausschneiden)
    var alle = [];
    PLAN.forEach(function(Zf){ Zf.uhren.forEach(function(U){ U.nachmittags = rnd() < 0.5; alle.push(U); }); });
    // Uhren mit Zeit (die zu einem Wecker passen müssen) bekommen die am besten unterscheidbaren Farben, die leeren den Rest
    var mitZeit = alle.filter(function(U){ return U.zeit; }), ohne = alle.filter(function(U){ return !U.zeit; });
    var f1l = mischen(FARBLISTE.slice(0, mitZeit.length), rnd), f2l = mischen(FARBLISTE.slice(mitZeit.length, alle.length), rnd);
    mitZeit.forEach(function(U, i){ U.farbe = f1l[i]; }); ohne.forEach(function(U, i){ U.farbe = f2l[i]; });
    alle.forEach(function(U, i){ U.nr = i + 1; });
    $('#urAusschneidenInfo').textContent = !o.ausschneiden ? '' : o.farbig ? tx('Jeder Wecker hat die Farbe seiner Uhr.') : tx('Ohne Farben gehören Uhr und Wecker über die Nummer zusammen.');
    var anleitung = (o.drehen ? tx('Achtung, die Uhren sind gedreht: Das Dreieck zeigt, wo die 12 ist. ') : '') +
      (o.ausschneiden ? tx('Jeder Wecker gehört zur Uhr mit ') + (o.farbig ? tx('der gleichen Farbe') : tx('der gleichen Nummer')) + tx('. Zeichne dort die Zeiger ein') : tx('Zeichne bei jeder Uhr mit einer Zeit die Zeiger ein')) +
      tx(': den kurzen Stundenzeiger und den langen Minutenzeiger. Verbinde dann mit dem Lineal die Zeiger von zwei Uhren, die genau aufeinander zeigen. ') +
      (PLAN.length > 1 ? tx('Welche Zahl entsteht?') : tx('Welche Ziffer entsteht?'));
    /* Ein Blatt für alle Uhren – je mehr Ziffern, desto kleiner: 1 Ziffer 50 mm (Abstand 65 mm), 2 Ziffern 32 mm
       (44 mm) in einer Reihe, 3 oder 4 Ziffern 25 mm (33 mm) in zwei Reihen */
    var html = '', d = (PLAN.length === 1 ? 50 : PLAN.length === 2 ? 32 : 25) * MM, zeile = (PLAN.length === 1 ? 65 : PLAN.length === 2 ? 44 : 33) * MM, reihen = '';
    for (var s = 0; s < PLAN.length; s += 2) reihen += ziffernSvg(PLAN.slice(s, s + 2), d, zeile, 13 * MM, false);
    var kopf = (o.titelAn ? tx('<h2>Uhrenrätsel</h2>') : '') + (o.anleitungAn ? '<p class="ur-anleitung">' + esc(anleitung) + '</p>' : '');
    var fuss = o.linie ? '<p class="ur-antwort">' + (PLAN.length > 1 ? tx('Zahl') : tx('Ziffer')) + ': ' + PLAN.map(function(){ return '<span class="ur-kaestchen"></span>'; }).join('') + '</p>' : '';
    html += '<div class="ur-rahmen"><article class="ur-blatt ur-seite">' + kopf + reihen + fuss + '</article></div>';
    if (o.ausschneiden) html += weckerSeiten(alle.filter(function(U){ return U.zeit; }), rnd);
    $('#urSeiten').innerHTML = html;
    // Lösung: alle Ziffern auf einer Seite (bis 2 je Zeile)
    var lh = '';
    for (var z = 0; z < PLAN.length; z += 2){
      var teile = PLAN.slice(z, z + 2), d2 = (PLAN.length === 1 ? 40 : PLAN.length === 2 ? 30 : 25) * MM;
      lh += ziffernSvg(teile, d2, d2 + 9 * MM, 13 * MM, true);
    }
    $('#urLoesung').innerHTML = (o.titelAn ? tx('<h2>Uhrenrätsel – Lösung</h2>') : tx('<p class="ur-anleitung"><b>Lösung</b></p>')) + lh +
      '<p class="ur-loesung-text">' + (PLAN.length > 1 ? tx('Zahl') : tx('Ziffer')) + ': <b>' + esc(st.code) + '</b></p>';
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
    speicherOrt.save({ filename:name, data:Labor.blattDatei(tx('Uhrenrätsel'), inhalt, '.ur-loesungsblatt{display:block}') }).catch(function(e){
      if (e && e.code === 'declined') return;
      meldung('warnung', tx('<p>Das Speichern hat nicht geklappt') + (e && e.message ? ' (' + esc(e.message) + ')' : '') + '.</p>');
    });
  });

  zeichnen();
  return function stopp(){ aus = true; if (timer) speichernJetzt(); window.removeEventListener('beforeprint', druckVorbereiten); document.body.classList.remove('mit-loesung'); };
}
})();
